import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  license: string;

  @IsNumber()
  commissionRate: number;

  @IsOptional()
  @IsNumber()
  balance?: number = 0;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}