import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
// import { UsersService } from 'src/users/users.service';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    // private usersService: UsersService,
    private notificationGateway: NotificationGateway,
  ) { }

  async send(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const { userId, message, type, allowedRoles, purpose, relatedId, relatedModel } = createNotificationDto;

    // Validate relatedId if provided
    const validRelatedId = relatedId ? new Types.ObjectId(relatedId) : undefined;

    // Create notification for the specific userId first
    const baseNotification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      message,
      type,
      allowedRoles,
      purpose,
      relatedId: validRelatedId,
      relatedModel,
    });
    await baseNotification.save();

    // Emit notification via WebSocket (no need to fetch users here unless real-time role check is required)
    this.notificationGateway.sendNotification(createNotificationDto);

    return baseNotification; 
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
}