import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private usersService: UsersService,
    private notificationGateway: NotificationGateway,
  ) { }

  async send(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const { userId, message, type, allowedRoles, purpose, relatedId, relatedModel } = createNotificationDto;

    // Validate relatedId if provided
    const validRelatedId = relatedId ? new Types.ObjectId(relatedId) : undefined;

    // Fetch user data
    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    // Create notification with user data for the specific userId first
    const baseNotification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      message,
      type,
      allowedRoles,
      purpose,
      relatedId: validRelatedId,
      relatedModel,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      profilePhotos: user.profilePhotos || [],
    });
    await baseNotification.save();

    // Emit notification via WebSocket (no need to fetch users here unless real-time role check is required)
    this.notificationGateway.sendNotification(createNotificationDto);

    return baseNotification;
  }

  async getAllNotifications(userId?: string, includeUserData: boolean = false, roles?: number[], page: number = 1, limit: number = 10): Promise<any[]> {
    const query: any = {};
    if (userId) query.userId = new Types.ObjectId(userId);

    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    if (includeUserData) {
      return Promise.all(
        notifications.map(async (notification) => {
          const user = await this.usersService.findById(notification.userId.toString());
          return { notification, user };
        }),
      );
    }

    if (roles && roles.length > 0) {
      return notifications.filter(notification =>
        notification.allowedRoles.some(role => roles.includes(role))
      );
    }

    return notifications;
  }

  async getNotificationById(notificationId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) throw new BadRequestException('Notification not found');
    return notification;
  }

  async getForUser(userId: string): Promise<NotificationDocument[]> {
    // return this.notificationModel.find({ userId }).exec();
    return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async getForUserRoles(userId: string, userRoles: number[]): Promise<NotificationDocument[]> {
    const userObjId = new Types.ObjectId(userId);
    return this.notificationModel
      .find({
        $and: [
          { userId: userObjId }, // Match the user's notifications
          { allowedRoles: { $in: userRoles } }, // Match notifications where allowedRoles include user's roles
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateAllowedRoles(notificationId: string, updateNotificationDto: UpdateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) throw new BadRequestException('Notification not found');
    if (updateNotificationDto.allowedRoles) {
      notification.allowedRoles = updateNotificationDto.allowedRoles;
      return notification.save();
    }
    return notification;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationModel.findById(notificationId).exec();
    if (!notification) throw new BadRequestException('Notification not found');
    await this.notificationModel.deleteOne({ _id: notificationId }).exec();
  }
}