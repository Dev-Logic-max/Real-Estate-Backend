import { IsEmail, IsString, IsOptional } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  currentPassword?: string; // For validation
}