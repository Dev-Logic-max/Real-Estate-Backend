import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';

export class SearchPropertyDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minArea?: number;

  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @IsOptional()
  @IsEnum(['sale', 'rent'])
  type?: string;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}