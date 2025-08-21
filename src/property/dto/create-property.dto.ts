import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Luxury Apartment', type: String })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Spacious apartment in city center', type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { type: 'Point', coordinates: [ -73.935242, 40.730610 ] }, type: Object })
  @IsOptional()
  location?: { type: 'Point'; coordinates: [number, number] };

  @ApiProperty({ example: 250000, type: Number })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 1200, type: Number })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiProperty({ example: 'sale', enum: ['sale', 'rent'] })
  @IsEnum(['sale', 'rent'])
  type: string;

  @ApiPropertyOptional({ example: ['image1.jpg', 'image2.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional({ example: ['video1.mp4'], type: [String] })
  @IsOptional()
  @IsArray()
  videos?: string[];

  @ApiPropertyOptional({ example: 'pending', enum: ['pending', 'approved', 'rejected', 'active', 'inactive', 'sold', 'rented'] })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'active', 'inactive', 'sold', 'rented'])
  status?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', type: String })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: [{ agentId: '507f1f77bcf86cd799439011', commissionRate: 5, terms: 'Standard terms', status: 'pending' }], type: [Object] })
  @IsOptional()
  @IsArray()
  agents?: { agentId: string; commissionRate: number; terms: string; status: string; phone: string; avatar: string[] }[];

  @ApiPropertyOptional({ example: ['pool', 'gym'], type: [String] })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional({ example: 'John Doe', type: String })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'contact@example.com', type: String })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+1234567890', type: String })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: '2023-01-01', type: String })
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiPropertyOptional({ example: 'USD', type: String })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'monthly', type: String })
  @IsOptional()
  @IsString()
  rentPeriod?: string;

  @ApiPropertyOptional({ example: '123 Main St', type: String })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York', type: String })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY', type: String })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'USA', type: String })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Gas', type: String })
  @IsOptional()
  @IsString()
  heatingSystem?: string;

  @ApiPropertyOptional({ example: 'Central AC', type: String })
  @IsOptional()
  @IsString()
  coolingSystem?: string;

  @ApiPropertyOptional({ example: 2, type: Number })
  @IsOptional()
  @IsNumber()
  parkingSpaces?: number;

  @ApiPropertyOptional({ example: 3, type: Number })
  @IsOptional()
  @IsNumber()
  floorNumber?: number;

  @ApiPropertyOptional({ example: 2, type: Number })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ example: 3, type: Number })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ example: 'apartment', type: String })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({ example: 'residential', type: String })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ example: true, type: Boolean })
  @IsOptional()
  isFurnished?: boolean;
}