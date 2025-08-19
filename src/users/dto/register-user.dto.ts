import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
    @ApiProperty({ example: 'user@example.com', type: String })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;

    @ApiProperty({ example: 'password123', type: String })
    @IsString({ message: 'Password must be a string' })
    password: string;

    @ApiProperty({ example: 'John', type: String })
    @IsString({ message: 'First name must be a string' })
    @IsNotEmpty({ message: 'First name is required' })
    firstName: string;

    @ApiPropertyOptional({ example: 'Doe', type: String })
    @IsOptional()
    @IsString({ message: 'Last name must be a string' })
    lastName?: string;

    @ApiPropertyOptional({ example: '+1234567890', type: String })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        example: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
    })
    @IsOptional()
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };

    @ApiPropertyOptional({ example: ['photo1.jpg', 'photo2.jpg'], type: [String] })
    @IsOptional()
    @IsArray({ message: 'Profile photos must be an array' })
    profilePhotos?: string[];
}