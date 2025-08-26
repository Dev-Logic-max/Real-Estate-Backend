import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RoleEnum } from 'src/common/enums/role.enum';
import { StatusEnum } from 'src/common/enums/status.enum';
import { NotificationService } from 'src/notification/notification.service';
import { HistoryService } from 'src/history/history.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationPurposeEnum } from 'src/common/enums/notification.enum';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
// import { AgentService } from 'src/agent/agent.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private notificationService: NotificationService,
        private historyService: HistoryService,
        // private agentService: AgentService,
        private notificationService: NotificationService,
    ) { }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }




   async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
  // Hash password
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  // Create new user object
  const newUser = new this.userModel({
    ...createUserDto,
    password: hashedPassword,
    roles: createUserDto.roles || [RoleEnum.User], // Default role: User
    status: createUserDto.status || StatusEnum.Active, // Default status: Active
  });

  // Save user first so we can use the generated _id
  const savedUser: UserDocument = await newUser.save();

  // Send notification (Admins get notified when a new user registers)
  const notificationDto: CreateNotificationDto = {
    userId: savedUser._id ? savedUser._id.toString() : '', // New user also gets notified
    message: `A new user "${savedUser.firstName} ${savedUser.lastName || ''}" has registered.`,
    type: 'in-app',
    allowedRoles: [RoleEnum.Admin], // Notify only admins about new registrations
    purpose: NotificationPurposeEnum.USER_REGISTERED,
    relatedId: savedUser._id?.toString(),
    relatedModel: 'User',
  };

  await this.notificationService.send(notificationDto);

  return savedUser;
}






    async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserDocument> {
        const user = await this.userModel.findByIdAndUpdate(userId, updateProfileDto, { new: true }).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findAllUsers(query: QueryUserDto): Promise<{ users: UserDocument[]; total: number }> {
        const { role, name, email, createdAfter, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = query;

        const filter: any = {};
        if (role) filter.roles = { $in: [role] };
        if (email) filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
        if (name) {
            filter.$or = [
                { firstName: { $regex: name, $options: 'i' } },
                { lastName: { $regex: name, $options: 'i' } },
            ];
        }
        if (createdAfter) filter.createdAt = { $gte: new Date(createdAfter) };

        const users = await this.userModel
            .find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .exec();

        const total = await this.userModel.countDocuments(filter).exec();

        return { users, total };
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.findById(id);
        if (!user) throw new NotFoundException('User not found');
        if (user.roles.includes(RoleEnum.Admin)) {
            throw new UnauthorizedException('Cannot delete an admin user');
        }
        await this.userModel.deleteOne({ _id: id }).exec();
        await this.notificationService.send(id, 'Your account has been deleted by an admin.');
        await this.historyService.log('user_deleted', id, undefined, { deletedBy: 'admin' });
    }

    async requestRole(userId: string, role: string): Promise<{ message: string }> {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        if (user.roles.some(r => [RoleEnum.Seller, RoleEnum.Agent].includes(r))) {
            throw new BadRequestException('User already has a role upgrade request or role');
        }
        // Add pending flag or request doc (simplified here with roles array)
        user.roles.push(RoleEnum[`Pending${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof RoleEnum] || RoleEnum.User);
        // Custom pending role
        await user.save();
        await this.notificationService.send(userId, `Role upgrade request for ${role} sent to admin.`);
        await this.historyService.log('role_request', userId, undefined, { role });
        return { message: 'Request sent' };
    }

    // async upgradeRole(id: string, role: string, approve: boolean): Promise<UserDocument> {
    //     const user = await this.findById(id);
    //     if (!user) throw new NotFoundException('User not found');
    //     const pendingRole = user.roles.find(r => r.toString().startsWith('Pending'));
    //     if (!pendingRole) throw new BadRequestException('No pending role request');
    //     if (approve) {
    //         user.roles = user.roles.filter(r => r !== pendingRole);
    //         user.roles.push(RoleEnum[role.charAt(0).toUpperCase() + role.slice(1)]);
    //         await this.notificationService.send(id, `Your request to become a ${role} has been approved.`);
    //     } else {
    //         user.roles = user.roles.filter(r => r !== pendingRole);
    //         await this.notificationService.send(id, `Your request to become a ${role} has been rejected.`);
    //     }
    //     await user.save();
    //     await this.historyService.log('role_upgrade', id, undefined, { role, approved: approve });
    //     return user;
    // }

    async upgradeRole(userId: string, role: string, approve: boolean): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');
        if (approve && !Object.values(RoleEnum).includes(RoleEnum[role.charAt(0).toUpperCase() + role.slice(1) as keyof typeof RoleEnum])) {
            throw new BadRequestException('Invalid role');
        }
        if (approve) {
            if (!user.roles.includes(RoleEnum[role.charAt(0).toUpperCase() + role.slice(1) as keyof typeof RoleEnum])) {
                user.roles.push(RoleEnum[role.charAt(0).toUpperCase() + role.slice(1) as keyof typeof RoleEnum]);
            }
        } else {
            user.roles = user.roles.filter(r => r !== RoleEnum[role.charAt(0).toUpperCase() + role.slice(1) as keyof typeof RoleEnum]);
        }
        return user.save();
    }
}
