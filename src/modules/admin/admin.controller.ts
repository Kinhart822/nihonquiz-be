import { RoleUser } from '@constants/user.constant';
import { UserResDto } from '@modules/user/dtos/user.res.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, RoleGuard } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogFilterDto } from '../audit-log/dtos/audit-log.req.dto';
import { AuditLogResDto } from '../audit-log/dtos/audit-log.res.dto';
import { AdminService } from './admin.service';
import {
  AccountHistoryFilterDto,
  ActionDto,
  AdminFilterDto,
  CreateAdminDto,
  EditAdminDto,
  SystemNotificationDto,
} from './dtos/admin.req.dto';
import { AccountHistoryResDto } from './dtos/admin.res.dto';

@ApiTags('Admin')
@Controller('admin')
@RoleGuard(RoleUser.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ==================== ACCOUNT HISTORY ====================

  @Get('account-history')
  @ApiOperation({ summary: 'Get list of account history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of account history returned successfully',
  })
  async getAccountHistoryList(
    @Query() filter: AccountHistoryFilterDto,
  ): Promise<PageDto<AccountHistoryResDto>> {
    return this.adminService.getAccountHistoryList(filter);
  }

  @Get('account-history/:id')
  @ApiOperation({ summary: 'Get account history info' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AccountHistoryResDto,
    description: 'Account history info returned successfully',
  })
  async getAccountHistoryInfo(
    @Param('id') id: number,
  ): Promise<AccountHistoryResDto> {
    return this.adminService.getAccountHistoryInfo(+id);
  }

  // ==================== AUDIT LOGS ====================

  @Get('audit-log')
  @ApiOperation({ summary: 'Get list of audit logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of audit logs returned successfully',
  })
  async getAuditLogs(
    @Query() filter: AuditLogFilterDto,
  ): Promise<PageDto<AuditLogResDto>> {
    return this.auditLogService.getAuditLogs(filter);
  }

  @Get('audit-log/:id')
  @ApiOperation({ summary: 'Get audit log info' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AuditLogResDto,
    description: 'Audit log info returned successfully',
  })
  async getAuditLogInfo(@Param('id') id: number): Promise<AuditLogResDto> {
    return this.auditLogService.getAuditLogInfo(+id);
  }

  // ==================== USER MANAGEMENT ====================

  @Post('user/:userId/block')
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User blocked successfully',
  })
  async blockUser(
    @AuthUser() admin: JwtPayloadDto,
    @Param('userId') userId: number,
    @Body() dto: ActionDto,
  ) {
    return this.adminService.blockUser(admin.id, +userId, dto);
  }

  @Post('user/:userId/unblock')
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User unblocked successfully',
  })
  async unblockUser(
    @AuthUser() admin: JwtPayloadDto,
    @Param('userId') userId: number,
    @Body() dto: ActionDto,
  ) {
    return this.adminService.unblockUser(admin.id, +userId, dto);
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  async deleteUser(
    @AuthUser() admin: JwtPayloadDto,
    @Param('userId') userId: number,
    @Body() dto: ActionDto,
  ) {
    return this.adminService.deleteUser(admin.id, +userId, dto);
  }

  // ==================== ADMIN MANAGEMENT ====================

  @Get('account')
  @ApiOperation({ summary: 'Get list of admin accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of admin accounts returned successfully',
  })
  async getAdminList(@Query() filter: AdminFilterDto) {
    return this.adminService.getAdminList(filter);
  }

  @Get('account/:id')
  @ApiOperation({ summary: 'Get admin account info' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResDto,
    description: 'Admin account info returned successfully',
  })
  async getAdminInfo(@Param('id') id: number) {
    return this.adminService.getAdminInfo(+id);
  }

  @Post('account')
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserResDto,
    description: 'Admin account created successfully',
  })
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Patch('account/:id')
  @ApiOperation({ summary: 'Update an admin account' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserResDto,
    description: 'Admin account updated successfully',
  })
  async updateAdmin(@Param('id') id: number, @Body() dto: EditAdminDto) {
    return this.adminService.updateAdmin(+id, dto);
  }

  @Delete('account/:id')
  @ApiOperation({ summary: 'Delete an admin account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin account deleted successfully',
  })
  async deleteAdmin(@Param('id') id: number) {
    return this.adminService.deleteAdmin(+id);
  }

  // ==================== NOTIFICATIONS ====================
  @Post('notification')
  @ApiOperation({ summary: 'Send system notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System notification sent successfully',
  })
  async sendSystemNotification(
    @AuthUser() admin: JwtPayloadDto,
    @Body() dto: SystemNotificationDto,
  ) {
    return this.adminService.sendSystemNotification(admin.id, dto);
  }
}
