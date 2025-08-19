import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsArray, IsOptional, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { StatusEnum } from 'src/common/enums/status.enum';

export class CreateUserDto {
    @ApiProperty({
        description: 'The email address of the user (must be unique)',
        example: 'email@example.com',
        type: String,
        required: true,
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({
        description: 'The password for the user (minimum 4 characters)',
        example: 'password123',
        type: String,
        required: true,
    })
    @IsString({ message: 'Password must be a string' })
    @MinLength(4, { message: 'Password must be at least 4 characters long' })
    password: string;

    @ApiPropertyOptional({
        description: 'Array of role IDs assigned to the user (optional)',
        example: [1, 2], // Example using RoleEnum values (e.g., Admin=1, User=2)
        type: [Number],
        isArray: true,
    })
    @IsArray({ message: 'Roles must be an array' })
    @IsOptional()
    roles?: number[];

    @ApiPropertyOptional({
        description: 'The status of the user (optional, defaults to "active")',
        example: 'active',
        enum: Object.values(StatusEnum),
        type: String,
    })
    @IsOptional()
    @IsEnum(StatusEnum, { message: 'Invalid status value' })
    status?: string;

    @ApiProperty({
        description: 'The first name of the user',
        example: 'John',
        type: String,
        required: true,
    })
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    firstName: string;

    @ApiPropertyOptional({
        description: 'The last name of the user (optional)',
        example: 'Doe',
        type: String,
    })
    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    lastName?: string;

    @ApiPropertyOptional({
        description: 'The phone number of the user (optional)',
        example: '+1234567890',
        type: String,
    })
    @IsOptional()
    @IsString({ message: 'Phone must be a string' })
    phone?: string;

    @ApiPropertyOptional({
        description: 'The address details of the user (optional)',
        type: 'object',
        properties: {
            street: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            state: { type: 'string', example: 'NY' },
            country: { type: 'string', example: 'USA' },
            zipCode: { type: 'string', example: '10001' },
        },
    })
    @IsOptional()
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };

    @ApiPropertyOptional({
        description: 'Array of user connections (optional, e.g., agents or other users)',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                role: { type: 'string', example: 'agent' },
            },
        },
    })
    @IsOptional()
    @IsArray({ message: 'Connections must be an array' })
    connections?: { userId: string; role: string }[];
}