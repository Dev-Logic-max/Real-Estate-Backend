import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';

export class NotificationQueryDto {
    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsBoolean()
    includeUserData?: boolean;

    @IsOptional()
    @IsString()
    roles?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}