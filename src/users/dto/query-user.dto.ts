import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsString()
  role?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  createdAfter?: string; // ISO date string, e.g., '2023-01-01'

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt'; // Field to sort by

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}