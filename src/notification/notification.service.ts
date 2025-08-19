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
    return this.notificationModel.find({ userId }).exec();
  }
}