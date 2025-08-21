import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StatusEnum } from 'src/common/enums/status.enum';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: { type: String, enum: ['Point'], default: undefined }, coordinates: [Number] })
  location?: { type: string; coordinates: number[] }; // GeoJSON for MongoDB

  @Prop({ required: true })
  price: number;

  @Prop()
  area?: number;

  @Prop({ enum: ['sale', 'rent'], required: true })
  type: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [String] })
  videos?: string[]; // For video uploads

  @Prop({ enum: Object.values(StatusEnum), default: StatusEnum.Pending })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({
    type: [{
      agentId: { type: Types.ObjectId, ref: 'User' },
      commissionRate: Number, 
      terms: String,
      status: { type: String, enum: Object.values(StatusEnum), default: StatusEnum.Pending }
    }],
    default: []
  })
  agents: { agentId: Types.ObjectId; commissionRate: number; terms?: string; status: string; phone?: string; firstName?: string; lastName?: string; profilePhotos?: string[] }[];

  // @Prop({ type: Types.ObjectId, ref: 'User' })
  // agentId?: Types.ObjectId; // Assigned agent

  @Prop([String])
  amenities?: string[];

  @Prop()
  contactName?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactNumber?: string;

  @Prop()
  availableFrom?: Date;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop()  // e.g., 'monthly' for rent
  rentPeriod?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  heatingSystem?: string;

  @Prop()
  coolingSystem?: string;

  @Prop()
  parkingSpaces?: number;

  @Prop()
  floorNumber?: number;

  @Prop()
  bathrooms?: number;

  @Prop()
  bedrooms?: number;

  @Prop()  // e.g., 'apartment', 'house'
  propertyType?: string;

  @Prop()  // e.g., 'residential', 'commercial'
  purpose?: string;

  @Prop({ default: false })
  isFurnished?: boolean;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ location: '2dsphere' }); // Enable geospatial queries
PropertySchema.index({ title: 'text', description: 'text' }); // Text search