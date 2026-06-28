import { RoleUser } from '@constants/user.constant';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser, RoleGuard } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';
import { PageDto } from '@shared/dtos/page.dto';
import { ClassStudentStatus } from '../../constants/class.constant';
import {
  AssignTeacherDto,
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  CreateClassDto,
  EnrollStudentDto,
  GetMyClassesQueryDto,
  JoinClassDto,
  UpdateClassDto,
} from './dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
  ClassScheduleResDto,
} from './dtos/class.res.dto';
import { ClassService } from './class.service';

@ApiTags('Classes')
@Controller('api/classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  // ==================== LIST CLASSES ====================
  @Get()
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get list of all classes' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<ClassResDto>,
    description: 'Get list of classes successfully',
  })
  getAllClasses(
    @Query() filterDto: ClassFilterDto,
  ): Promise<PageDto<ClassResDto>> {
    return this.classService.getAllClasses(filterDto);
  }

  @Get('teaching')
  @RoleGuard(RoleUser.TEACHER)
  @ApiOperation({ summary: '[TEACHER] Get list of teaching classes' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<ClassResDto>,
    description: 'Get list of classes successfully',
  })
  getTeachingClasses(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: ClassFilterDto,
  ): Promise<PageDto<ClassResDto>> {
    return this.classService.getTeachingClasses(user.id, filterDto);
  }

  @Get('enrolled')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: '[STUDENT] Get all enrolled classes' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<ClassResDto>,
    description: 'Get all classes of the student successfully',
  })
  getEnrolledClasses(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: GetMyClassesQueryDto,
  ): Promise<PageDto<ClassResDto>> {
    return this.classService.getEnrolledClasses(user.id, filterDto);
  }

  // ==================== JOIN/ENROLL ====================
  @Post('join')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: '[STUDENT] Join a class using class code' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: { properties: { message: { type: 'string' } } },
  })
  joinClassByCode(@AuthUser() user: JwtPayloadDto, @Body() dto: JoinClassDto) {
    return this.classService.joinClassByCode(user.id, dto);
  }

  @Post(':id/enroll-student')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Enroll a student into the class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: { properties: { message: { type: 'string' } } },
  })
  enrollStudent(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.classService.enrollStudent(+id, dto);
  }

  // ==================== CREATE/UPDATE/DELETE CLASS ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Create a new class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ClassResDto,
  })
  createClass(@Body() dto: CreateClassDto) {
    return this.classService.createClass(dto);
  }

  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: '[ADMIN/TEACHER] Update class details' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassResDto,
  })
  updateClass(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.updateClass(user, +id, dto);
  }

  @Patch(':id/status')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] Update class status (activate/deactivate)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  updateClassStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.classService.updateClassStatus(+id, isActive);
  }

  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Delete a class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  deleteClass(@Param('id') id: string) {
    return this.classService.deleteClass(+id);
  }

  // ==================== CLASS MANAGEMENT ====================
  @Post(':id/assign-teacher')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Assign a teacher to the class' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ClassResDto })
  assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    return this.classService.assignTeacher(+id, dto);
  }

  @Post(':id/generate-code')
  @RoleGuard(RoleUser.TEACHER)
  @ApiOperation({ summary: '[TEACHER] Generate a new class code' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { code: { type: 'string' } } },
  })
  generateClassCode(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.classService.generateClassCode(user.id, +id);
  }

  // ==================== MEMBERS MANAGEMENT ====================
  @Get(':id/members')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: '[SHARED] Get list of members in the class' })
  @ApiResponse({ status: HttpStatus.OK, type: ClassMembersListResDto })
  getClassMembers(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Query() filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    return this.classService.getClassMembers(user, +id, filterDto);
  }

  @Delete(':id/leave')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: '[STUDENT] Leave a class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  leaveClass(@Param('id') id: string, @AuthUser() user: JwtPayloadDto) {
    return this.classService.leaveClass(user.id, +id);
  }

  @Delete(':id/remove-student/:studentId')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Remove a student from the class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classService.removeStudent(+id, +studentId);
  }

  @Patch(':id/students/:studentId/status')
  @RoleGuard(RoleUser.TEACHER)
  @ApiOperation({ summary: '[TEACHER] Update student status' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  updateStudentStatus(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body('status') status: ClassStudentStatus,
  ) {
    return this.classService.updateStudentStatus(
      user.id,
      +id,
      +studentId,
      status,
    );
  }

  // ==================== ANNOUNCEMENTS ====================
  @Post(':id/announcements')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: '[ADMIN/TEACHER] Create class announcement' })
  @ApiResponse({ status: HttpStatus.CREATED, type: ClassAnnouncementResDto })
  createAnnouncement(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() dto: CreateClassAnnouncementDto,
  ) {
    return this.classService.createAnnouncement(user, +id, dto);
  }

  @Get(':id/announcements')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: '[SHARED] Get class announcements' })
  @ApiResponse({ status: HttpStatus.OK, type: [ClassAnnouncementResDto] })
  getAnnouncements(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.classService.getAnnouncements(user, +id);
  }

  // ==================== SCHEDULES ====================
  @Get(':id/schedules')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: '[SHARED] Get class schedules' })
  @ApiResponse({ status: HttpStatus.OK, type: [ClassScheduleResDto] })
  getSchedules(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.classService.getSchedules(user, +id);
  }

  // ==================== GET DETAILS ====================
  // Placed at the bottom to avoid matching 'teaching' or 'enrolled'
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: '[SHARED] Get class details' })
  @ApiResponse({ status: HttpStatus.OK, type: ClassResDto })
  getClassDetails(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
  ): Promise<ClassResDto> {
    return this.classService.getClassDetails(user, +id);
  }
}
