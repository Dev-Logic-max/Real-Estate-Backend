import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };

  @IsOptional()
  @IsArray()
  profilePhotos?: string[];

  @IsOptional()
  @IsString()
  password?: string; // Allow password updates (validate in service)

  @IsOptional()
  @IsString()
  email?: string; // Added for email updates
}