import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StatusEnum } from 'src/common/enums/status.enum';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  bedrooms?: number;

  @Prop()
  bathrooms?: number;

  @Prop()
  parkingSpaces?: number;

  @Prop()
  area?: number;

  @Prop()
  floorNumber?: number;

  @Prop()
  heatingSystem?: string;

  @Prop()
  coolingSystem?: string;

  @Prop({ default: false })
  isFurnished?: boolean;

  @Prop({ enum: ['sale', 'rent', 'sold'], required: true })
  type: string;

  @Prop()  // e.g., 'apartment', 'house'
  propertyType?: string;

  @Prop()  // e.g., 'residential', 'commercial'
  purpose?: string;

  @Prop({
    type: [{
      agentId: { type: Types.ObjectId, ref: 'User' },
      commissionRate: Number,
      terms: String,
      firstName: String,
      lastName: String,
      phone: String,
      profilePhotos: [String],
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }],
    default: []
  })
  agents: { agentId: Types.ObjectId; commissionRate: number; terms?: string; status: string; phone?: string; firstName?: string; lastName?: string; profilePhotos?: string[] }[];

  @Prop({ type: { type: String, enum: ['Point'], default: undefined }, coordinates: { type: [Number] } })
  location?: { type: string; coordinates: number[] }; // GeoJSON for MongoDB

  @Prop()
  availableFrom?: Date;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop()  // e.g., 'monthly' for rent
  rentPeriod?: string;

  @Prop()
  contactName?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactNumber?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop([String])
  amenities?: string[];

  @Prop({ enum: Object.values(StatusEnum), default: StatusEnum.Pending })
  status: string;

  @Prop({ type: [String] })
  videos?: string[]; // For video uploads

  @Prop({ type: Number, default: 0 })
  views?: number;

  @Prop()
  listingDate?: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ location: '2dsphere' }); // Enable geospatial queries
PropertySchema.index({ title: 'text', description: 'text' }); // Text search