import { RoleUser } from '@constants/user.constant';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, RoleGuard } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  ClassStudentFilterDto,
  GetMyClassesQueryDto,
  JoinClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassScheduleResDto,
} from '../dtos/class.res.dto';
import { StudentClassService } from '../services/student-class.service';

@ApiTags('Student Classes')
@RoleGuard(RoleUser.STUDENT)
@Controller('api/student/classes')
export class StudentClassController {
  constructor(private readonly classService: StudentClassService) {}

  // ==================== GET MY CLASSES ====================
  @Get('my-classes')
  @ApiOperation({ summary: 'Get all classes of the student' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<ClassResDto>,
    description: 'Get all classes of the student successfully',
  })
  getMyClasses(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: GetMyClassesQueryDto,
  ): Promise<PageDto<ClassResDto>> {
    return this.classService.getMyClasses(user.id, filterDto);
  }

  // ==================== GET DETAILS ====================
  @Get(':id')
  @ApiOperation({ summary: 'Get class details' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassResDto,
    description: 'Get class details successfully',
  })
  getClassDetails(
    @Param('id') id: string,
    @AuthUser() user: JwtPayloadDto,
  ): Promise<ClassResDto> {
    return this.classService.getClassDetails(user.id, +id);
  }

  // ==================== JOIN BY CODE ====================
  @Post('join')
  @ApiOperation({ summary: 'Join a class using class code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Join a class using class code successfully',
  })
  joinClassByCode(@AuthUser() user: JwtPayloadDto, @Body() dto: JoinClassDto) {
    return this.classService.joinClassByCode(user.id, dto);
  }

  // ==================== LEAVE ====================
  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Leave a class successfully',
  })
  leaveClass(@Param('id') id: string, @AuthUser() user: JwtPayloadDto) {
    return this.classService.leaveClass(user.id, +id);
  }

  // ==================== GET MEMBERS ====================
  @Get(':id/members')
  @ApiOperation({ summary: 'Get list of class members' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassMembersListResDto,
    description: 'Get list of class members successfully',
  })
  getClassMembers(
    @Param('id') id: string,
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    return this.classService.getClassMembers(user.id, +id, filterDto);
  }

  // ==================== GET ANNOUNCEMENTS ====================
  @Get(':id/announcements')
  @ApiOperation({ summary: 'Get class announcements' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ClassAnnouncementResDto],
    description: 'Get class announcements successfully',
  })
  getAnnouncements(
    @Param('id') id: string,
    @AuthUser() user: JwtPayloadDto,
  ): Promise<ClassAnnouncementResDto[]> {
    return this.classService.getAnnouncements(user.id, +id);
  }

  // ==================== GET SCHEDULES ====================
  @Get(':id/schedules')
  @ApiOperation({ summary: 'Get class schedules' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ClassScheduleResDto],
    description: 'Get class schedules successfully',
  })
  getSchedules(
    @Param('id') id: string,
    @AuthUser() user: JwtPayloadDto,
  ): Promise<ClassScheduleResDto[]> {
    return this.classService.getSchedules(user.id, +id);
  }
}
