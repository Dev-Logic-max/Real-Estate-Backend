import { Controller, Post, Body, Get, Param, UseGuards, Patch, Query, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationService } from './notification.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RoleEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { NotificationQueryDto } from './dto/search-notification.dto';
import { Notification } from './schemas/notification.schema';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Post()
  @ApiOperation({ summary: 'Send notification', description: 'Sends a notification to users with specified roles.' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Notification sent', type: CreateNotificationDto })
  @UseGuards(JwtAuthGuard)
  send(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.send(createNotificationDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all notifications', description: 'Retrieves notifications with optional filters and user data.' })
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID', type: String })
  @ApiQuery({ name: 'includeUserData', required: false, description: 'Include full user data', type: Boolean })
  @ApiQuery({ name: 'roles', required: false, description: 'Filter by allowed roles (comma-separated)', type: String })
  @ApiOkResponse({ description: 'Notifications retrieved', schema: { oneOf: [{ type: 'array', items: { $ref: '#/components/schemas/Notification' } }, { type: 'array', items: { type: 'object', properties: { notification: { $ref: '#/components/schemas/Notification' }, user: { $ref: '#/components/schemas/User' } } } }] } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  async getAllNotifications(@Query() query: NotificationQueryDto) {
    const { userId, includeUserData, roles, page = 1, limit = 10 } = query;
    const userRoles = roles ? roles.split(',').map(role => parseInt(role)) : undefined;
    return this.notificationService.getAllNotifications(userId, includeUserData, userRoles, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID', description: 'Retrieves a specific notification by its ID.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiOkResponse({ description: 'Notification retrieved', type: Notification })
  @UseGuards(JwtAuthGuard)
  async getNotificationById(@Param('id') id: string) {
    return this.notificationService.getNotificationById(id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get notifications for user', description: 'Retrieves notifications for a specific user.' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiOkResponse({ description: 'Notifications retrieved' })
  @UseGuards(JwtAuthGuard)
  getForUser(@Param('userId') userId: string) {
    return this.notificationService.getForUser(userId);
  }

  @Get(':userId/by-roles')
  @ApiOperation({ summary: 'Get notifications for user by roles', description: 'Retrieves notifications matching the user\'s roles.' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiOkResponse({ description: 'Notifications retrieved' })
  @UseGuards(JwtAuthGuard)
  async getForUserRoles(@Param('userId') userId: string, @Query('roles') roles: string) {
    const userRoles = roles ? roles.split(',').map(role => parseInt(role)) : [];
    return this.notificationService.getForUserRoles(userId, userRoles);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification allowed roles', description: 'Updates the allowed roles for a notification.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiOkResponse({ description: 'Notification updated', type: UpdateNotificationDto })
  @UseGuards(JwtAuthGuard)
  updateAllowedRoles(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.updateAllowedRoles(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification', description: 'Deletes a specific notification by ID.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiOkResponse({ description: 'Notification deleted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin)
  async deleteNotification(@Param('id') id: string) {
    await this.notificationService.deleteNotification(id);
    return { message: 'Notification deleted successfully' };
  }
}