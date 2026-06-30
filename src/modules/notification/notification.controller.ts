import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { NotificationFilterDto } from './dtos/notification.req.dto';
import { NotificationResDto } from './dtos/notification.res.dto';
import { PageDto } from '@shared/dtos/page.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==================== GET NOTIFICATIONS ====================
  @Get()
  @ApiOperation({ summary: 'Get list of notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: NotificationResDto,
    description: 'List of notifications returned successfully',
  })
  async getNotifications(
    @AuthUser() user: JwtPayloadDto,
    @Query() filter: NotificationFilterDto,
  ): Promise<PageDto<NotificationResDto>> {
    return this.notificationService.getUserNotifications(user.id, filter);
  }

  // ==================== MARK ALL AS READ ====================
  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@AuthUser() user: JwtPayloadDto): Promise<void> {
    return this.notificationService.markAllAsRead(user.id);
  }

  // ==================== MARK AS READ ====================
  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @AuthUser() user: JwtPayloadDto,
  ): Promise<void> {
    return this.notificationService.markAsRead(id, user.id);
  }
}
