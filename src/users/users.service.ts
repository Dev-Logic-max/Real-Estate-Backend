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
// import { NotificationService } from 'src/notification/notification.service';
import { HistoryService } from 'src/history/history.service';
// import { AgentService } from 'src/agent/agent.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        // private notificationService: NotificationService,
        private historyService: HistoryService,
        // private agentService: AgentService,
    ) { }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }

    async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const newUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            roles: createUserDto.roles || [RoleEnum.User], // Default to user [2] if not provided
            status: createUserDto.status || StatusEnum.Active, // Default to "active" if not provided
        });
        return newUser.save();
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

    async findUserById(userId: string): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findActiveAgents(): Promise<{ users: UserDocument[]; total: number }> {
        const filter: any = {
            roles: { $in: [RoleEnum.Agent] }, // Role 5 for Agent
            status: StatusEnum.Active,
        };

        const users = await this.userModel.find(filter).exec();
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
        // await this.notificationService.send(id, 'Your account has been deleted by an admin.');
        await this.historyService.log('user_deleted', id, undefined, { deletedBy: 'admin' });
    }

    async requestRole(userId: string, role: string): Promise<{ message: string }> {
        const user = await this.findById(userId);
        if (!user) throw new NotFoundException('User not found');
        if (user.roles.some(r => [RoleEnum.Agent].includes(r))) {
            throw new BadRequestException('User already has a role upgrade request or role');
        }
        // Add pending flag or request doc (simplified here with roles array)
        user.roles.push(RoleEnum[`Pending${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof RoleEnum] || RoleEnum.User);
        // Custom pending role
        await user.save();
        // await this.notificationService.send(userId, `Role upgrade request for ${role} sent to admin.`);
        await this.historyService.log('role_request', userId, undefined, { role });
        return { message: 'Request sent' };
    }

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
