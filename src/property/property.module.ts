import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './schemas/property.schema';
import { UploadModule } from 'src/uploads/upload.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Property.name, schema: PropertySchema }]), UploadModule],
  controllers: [PropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
