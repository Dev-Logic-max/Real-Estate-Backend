import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) {}

  async send(userId: string, message: string, type: 'email' | 'in-app' = 'in-app'): Promise<NotificationDocument> {
    const notification = new this.notificationModel({ userId, message, type });
    return notification.save();
  }

  async getForUser(userId: string): Promise<NotificationDocument[]> {
    // return this.notificationModel.find({ userId }).exec();
    return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }
 
async getForUserRolesAndModel(
  userId: string,
  userRoles: number[],
  model: string,
): Promise<NotificationDocument[]> {
  const userObjId = new Types.ObjectId(userId);

  const query: any = {
    userId: userObjId,
    relatedModel: model,
  };

  if (userRoles.length > 0) {
    query.allowedRoles = { $in: userRoles };
  }

  return this.notificationModel
    .find(query)
    .sort({ createdAt: -1 })
    .exec();
}


  async getAllNotifications(): Promise<NotificationDocument[]> {
    return this.notificationModel.find().sort({ createdAt: -1 }).exec();
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