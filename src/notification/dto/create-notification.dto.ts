import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { NotificationPurposeEnum } from 'src/common/enums/notification.enum';
import { RoleEnum } from 'src/common/enums/role.enum';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to associate with the notification', type: String })
  @IsMongoId({ message: 'Invalid user ID' })
  userId: string;

  @ApiProperty({ example: 'New property created', type: String })
  @IsString({ message: 'Message is required' })
  message: string;

  @ApiProperty({ example: 'in-app', enum: ['email', 'in-app', 'sms'] })
  @IsEnum(['email', 'in-app', 'sms'], { message: 'Invalid notification type' })
  type: string;

  @ApiProperty({ example: [RoleEnum.Admin, RoleEnum.Seller], type: [Number], enum: Object.values(RoleEnum) })
  @IsArray({ message: 'Allowed roles must be an array' })
  @IsEnum(Object.values(RoleEnum), { each: true, message: 'Invalid role' })
  allowedRoles: number[];

  @ApiProperty({ example: 'property_created', enum: Object.values(NotificationPurposeEnum) })
  @IsEnum(Object.values(NotificationPurposeEnum), { message: 'Invalid purpose' })
  purpose: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', type: String })
  @IsOptional()
  @IsMongoId({ message: 'Invalid related ID' })
  relatedId?: string;

  @ApiProperty({ example: 'Property', enum: ['User', 'Property', 'Agent', 'Transaction'] })
  @IsEnum(['User', 'Property', 'Agent', 'Transaction'], { message: 'Invalid related model' })
  relatedModel: string;
}