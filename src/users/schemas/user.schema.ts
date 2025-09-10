import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleEnum } from 'src/common/enums/role.enum';
import { StatusEnum } from 'src/common/enums/status.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: [String], default: [] })
  profilePhotos?: string[];

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;  // Hashed

  @Prop()
  phone?: string;

  @Prop({
    type: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String },
    },
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };

  @Prop({
    type: {
      type: { type: [String], enum: ['house', 'apartment', 'land'], default: [] },
      minPrice: { type: Number, default: 0 },
      maxPrice: { type: Number, default: Infinity },
      location: { type: String, default: '' },
    },
    default: {},
  })
  propertyPreferences?: {
    type?: string[];
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  };

  @Prop({ enum: Object.values(StatusEnum), default: StatusEnum.Active })
  status: string;  // e.g., 'active', 'inactive'

  @Prop({ type: [Number], default: [RoleEnum.User] })
  roles: number[];  // e.g., ['1' for admin, '2' for user]

  @Prop({ type: [{ userId: String, role: Number }], default: [] })
  connections?: { userId: string; role: number }[]; // e.g., [{ userId: '123', role: '2' }]
}

export const UserSchema = SchemaFactory.createForClass(User);