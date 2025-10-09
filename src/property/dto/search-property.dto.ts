import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';

export class SearchPropertyDto {
  @IsOptional()
  @IsEnum(['sale', 'rent'])
  type?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  beds?: number;

  @IsOptional()
  @IsNumber()
  baths?: number;
  
  @IsOptional()
  @IsString()
  @IsEnum(['all', 'apartment', 'house', 'villa', 'office', 'commercial'])
  homeType?: string;
  
  @IsOptional()
  @IsNumber()
  rooms?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  minArea?: number;

  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}