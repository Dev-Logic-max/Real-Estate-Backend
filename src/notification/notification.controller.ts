import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  send(@Body() body: { userId: string; message: string; type: string }) {
    return this.notificationService.send(body.userId, body.message, body.type as 'email' | 'in-app');
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  getForUser(@Param('userId') userId: string) {
    return this.notificationService.getForUser(userId);
  }
}