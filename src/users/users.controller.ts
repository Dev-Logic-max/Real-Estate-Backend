import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Request, UnauthorizedException, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UploadService } from 'src/uploads/upload.service';
import { UsersService } from './users.service';

// DTO Files
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

// Guards and Decorators
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

import * as bcrypt from 'bcrypt';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private userService: UsersService,
        private uploadService: UploadService, // Inject UploadService
    ) { }

    // POST /users/create - Create a new user (admin only)
    @Post('create')
    @ApiOperation({
        summary: 'Create a new user by admin',
        description: 'Allows admin to create a new user with specified roles and details.'
    })
    @ApiBearerAuth('access-token')
    @ApiCreatedResponse({ description: 'User created successfully', type: CreateUserDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.Admin)
    async createAdminUser(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.createUser(createUserDto);
        return { id: user?._id?.toString(), user };
    }

    // PATCH /users/profile - Update user profile (authenticated users)
    @Patch('update/profile')
    @ApiOperation({
        summary: 'Update user profile',
        description: 'Allows authenticated users to update their profile details.'
    })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Profile updated successfully', type: UpdateProfileDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.userService.updateUserProfile(req.user.userId, updateProfileDto);
    }

    // GET /users - List users with filters and pagination (admin only)
    @Get()
    @ApiOperation({
        summary: 'List all users',
        description: 'Retrieves a paginated list of users with optional filters (admin only).'
    })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({
        description: 'List of users retrieved',
        schema: { properties: { users: { type: 'array', items: { $ref: '#/components/schemas/User' } }, total: { type: 'number' } } }
    })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.Admin)
    async findAll(@Query() query: QueryUserDto) {
        return this.userService.findAllUsers(query);
    }

    // GET /users/active-agents - List active agents
    @Get('active-agents')
    @ApiOperation({
        summary: 'List active agents',
        description: 'Retrieves a list of users with role Agent (5) and status active.'
    })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({
        description: 'List of active agents retrieved',
        schema: { properties: { users: { type: 'array', items: { $ref: '#/components/schemas/User' } }, total: { type: 'number' } } }
    })
    @UseGuards(JwtAuthGuard)
    async getActiveAgents() {
        return this.userService.findActiveAgents();
    }

    // DELETE /users/:id - Delete user (admin only)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete user by ID', description: 'Allows admins to delete a user by ID.' })
    @ApiBearerAuth('access-token')
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiOkResponse({ description: 'User deleted successfully' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.Admin)
    async deleteUser(@Param('id') id: string) {
        await this.userService.deleteUser(id);
        return { message: 'User deleted successfully' };
    }

    // POST /users/profile-upload - Upload user profile picture
    @Post('profile-image-upload')
    @ApiOperation({
        summary: 'Upload user profile picture',
        description: 'Allows authenticated users to upload a profile picture.'
    })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({
        description: 'Full filename of the uploaded file',
        type: String // e.g., "/profile/42fb86d0.png"
    })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(FileInterceptor('file')) // Single file
    async uploadProfilePhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const path = await this.uploadService.uploadFile(file, 'profile'); // Returns "/profile/a1b2c3d4.jpg"
        return path;
    }

    // PATCH /users/email - Update user email (authenticated user or admin)
    @Patch('email')
    @ApiOperation({
        summary: 'Update user email',
        description: 'Allows authenticated users or admins to update the user email with current password validation.'
    })
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ description: 'Email updated successfully' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.User, RoleEnum.Admin)
    async updateEmail(@Request() req, @Body() updateEmailDto: UpdateEmailDto) {
        const userId = req.user.userId;
        const user = await this.userService.findById(userId);
        if (!user || (updateEmailDto.currentPassword && !(await bcrypt.compare(updateEmailDto.currentPassword, user.password)))) {
            throw new UnauthorizedException('Invalid current password');
        }
        return this.userService.updateUserProfile(userId, { email: updateEmailDto.email });
    }

    // PATCH /users/:id - Update user role (admin only)
    @Patch(':id')
    @ApiOperation({
        summary: 'Update user details by ID',
        description: 'Allows admin to update user details, including roles, by user ID.'
    })
    @ApiBearerAuth('access-token')
    @ApiParam({ name: 'id', description: 'The ID of the user to update', type: String })
    @ApiOkResponse({ description: 'User updated successfully', type: UpdateProfileDto })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.Admin)
    async updateUser(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
        return this.userService.updateUserProfile(id, updateProfileDto);
    }

    // POST /users/role-request - Request role upgrade
    @Post('role-request')
    @ApiOperation({ summary: 'Request role upgrade', description: 'Users request roles like seller.' })
    @ApiBearerAuth('access-token')
    @ApiBody({ type: Object, schema: { properties: { role: { type: 'string' } } } })
    @ApiOkResponse({ description: 'Request sent' })
    @UseGuards(JwtAuthGuard)
    async requestRole(@Request() req, @Body() body: { role: string }) {
        // Logic: Set pending flag in User or create request doc
        return { message: 'Request sent' }; // Expand in service
    }

    // PATCH /users/:id/upgrade-role - Upgrade role (admin)
    @Patch(':id/upgrade-role')
    @ApiOperation({ summary: 'Upgrade user role', description: 'Admins approve role requests.' })
    @ApiBearerAuth('access-token')
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @ApiBody({ type: Object, schema: { properties: { role: { type: 'string' }, approve: { type: 'boolean' } } } })
    @ApiOkResponse({ description: 'Role updated' })
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleEnum.Admin)
    async upgradeRole(@Param('id') id: string, @Body() body: { role: string; approve: boolean }) {
        const user = await this.userService.upgradeRole(id, body.role, body.approve); // Use service method directly
        return user;
    }
}
