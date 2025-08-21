import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationPurposeEnum } from 'src/common/enums/notification.enum';
import { RoleEnum } from 'src/common/enums/role.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ enum: ['email', 'in-app', 'sms'] })
  type: string;

  @Prop({ type: [Number], default: [RoleEnum.Admin] })
  allowedRoles: number[];

  @Prop({ enum: Object.values(NotificationPurposeEnum), required: true })
  purpose: string;

  @Prop({ type: Types.ObjectId, refPath: 'relatedModel' })
  relatedId?: Types.ObjectId;

  @Prop({ type: String, enum: ['User', 'Property', 'Agent', 'Transaction'], required: true })
  relatedModel: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);