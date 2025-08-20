import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from 'src/users/dto/register-user.dto';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<UserDocument | null> {
        const user = await this.userService.findByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user.toObject(); // Convert to plain object
            return result as UserDocument;
        }
        return null;
    }

    async login(credentials: { email: string; password: string }): Promise<{ access_token: string; user: UserDocument }> {
        const user = await this.validateUser(credentials.email, credentials.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { email: user.email, sub: user._id, roles: user.roles };
        return {
            access_token: this.jwtService.sign(payload),
            user, // Return user data
        };
    }

    async register(registerUserDto: RegisterUserDto): Promise<{ access_token: string; user: UserDocument }> {
        const user = await this.userService.createUser({
            ...registerUserDto,
            roles: [RoleEnum.User], // Explicitly set to ['user'] role for registration
        });
        return this.login({ email: user.email, password: registerUserDto.password });  // Return JWT after registration
    }

    async getVerifiedUser(userId: string): Promise<UserDocument> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, address, phone, profilePhotos, connections, createdAt, updatedAt, __v, ...result } = user.toObject(); // Exclude password
        return result as UserDocument;
    }

    async refreshToken(user: any): Promise<{ access_token: string }> {
        const payload = { email: user.email, sub: user._id, roles: user.roles };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '7d' }), // Longer expiry for refresh
        };
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<UserDocument> {
        const user = await this.userService.findById(userId);
        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            throw new UnauthorizedException('Invalid current password');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return this.userService.updateUserProfile(userId, { password: hashedPassword });
    }

    async forgotPassword(email: string): Promise<{ message: string }> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        // TODO: Generate reset token, send email (use nodemailer or similar)
        const resetToken = this.jwtService.sign({ email, type: 'reset' }, { expiresIn: '1h' });
        // TODO: Implement email sending logic here (e.g., using nodemailer)
        return { message: 'Reset link sent' };
    }

    async logout(userId: string): Promise<{ message: string }> {
        // Invalidate token (optional: implement blacklist or short-lived tokens)
        // For now, just return success (client handles token removal)
        return { message: 'Logged out successfully' };
    }
}
