import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { RoleEnum } from 'src/common/enums/role.enum';

export class UpdateNotificationDto {
  @ApiPropertyOptional({ example: [RoleEnum.Admin, RoleEnum.Seller], type: [Number], enum: Object.values(RoleEnum) })
  @IsOptional()
  @IsArray({ message: 'Allowed roles must be an array' })
  @IsEnum(Object.values(RoleEnum), { each: true, message: 'Invalid role' })
  allowedRoles?: number[];
}