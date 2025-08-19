import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  log(@Body() body: { action: string; userId: string; propertyId?: string; details?: any }) {
    return this.historyService.log(body.action, body.userId, body.propertyId, body.details);
  }

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  getForUser(@Param('userId') userId: string) {
    return this.historyService.getForUser(userId);
  }
}