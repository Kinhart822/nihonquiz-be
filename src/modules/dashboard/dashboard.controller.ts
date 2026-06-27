import { RoleUser } from '@constants/user.constant';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, RoleGuard } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { DashboardService } from './dashboard.service';
import {
  AdminDashboardResDto,
  StudentDashboardResDto,
  TeacherDashboardResDto,
} from './dtos/dashboard.res.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ==================== ADMIN ====================
  @Get('admin')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics (Mocked)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AdminDashboardResDto,
  })
  getAdminDashboardStats(@AuthUser() user: JwtPayloadDto) {
    return this.dashboardService.getAdminDashboardStats(user.id);
  }

  // ==================== STUDENT ====================
  @Get('student')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get student dashboard statistics (Mocked)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: StudentDashboardResDto,
  })
  getStudentDashboardStats(@AuthUser() user: JwtPayloadDto) {
    return this.dashboardService.getStudentDashboardStats(user.id);
  }

  // ==================== TEACHER ====================
  @Get('teacher')
  @RoleGuard(RoleUser.TEACHER)
  @ApiOperation({ summary: 'Get teacher dashboard statistics (Mocked)' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TeacherDashboardResDto,
  })
  getTeacherDashboardStats(@AuthUser() user: JwtPayloadDto) {
    return this.dashboardService.getTeacherDashboardStats(user.id);
  }
}
