import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History, HistoryDocument } from './schemas/history.schema';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(History.name) private historyModel: Model<HistoryDocument>) {}

  async log(action: string, userId: string, propertyId?: string, details?: any): Promise<HistoryDocument> {
    const history = new this.historyModel({ action, userId, propertyId, details });
    return history.save();
  }

  async getForUser(userId: string): Promise<HistoryDocument[]> {
    return this.historyModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}