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
import { PageDto } from '../../../shared/dtos/page.dto';
import {
  AssignTeacherDto,
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  CreateClassDto,
  EnrollStudentDto,
  UpdateClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
} from '../dtos/class.res.dto';
import { AdminClassService } from '../services/admin-class.service';

@ApiTags('Admin Classes')
@RoleGuard(RoleUser.ADMIN)
@Controller('api/admin/classes')
export class AdminClassController {
  constructor(private readonly classService: AdminClassService) {}

  // ==================== GET LIST ====================
  @Get()
  @ApiOperation({ summary: 'Get list of classes' })
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

  // ==================== CREATE ====================
  @Post()
  @ApiOperation({ summary: 'Create a new class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ClassResDto,
    description: 'Class created successfully',
  })
  createClass(@Body() dto: CreateClassDto) {
    return this.classService.createClass(dto);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @ApiOperation({ summary: 'Update a class details' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassResDto,
    description: 'Update a class details successfully',
  })
  updateClass(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classService.updateClass(+id, dto);
  }

  // ==================== ASSIGN TEACHER ====================
  @Post(':id/assign-teacher')
  @ApiOperation({ summary: 'Assign a teacher to the class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ClassResDto,
    description: 'Assign a teacher to the class successfully',
  })
  assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    return this.classService.assignTeacher(+id, dto);
  }

  // ==================== ENROLL STUDENT ====================
  @Post(':id/enroll-student')
  @ApiOperation({ summary: 'Enroll a student into the class' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Enroll a student into the class successfully',
  })
  enrollStudent(@Param('id') id: string, @Body() dto: EnrollStudentDto) {
    return this.classService.enrollStudent(+id, dto);
  }

  // ==================== REMOVE STUDENT ====================
  @Delete(':id/remove-student/:studentId')
  @ApiOperation({ summary: 'Remove a student from the class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Remove a student from the class successfully',
  })
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classService.removeStudent(+id, +studentId);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a class' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Delete a class successfully',
  })
  deleteClass(@Param('id') id: string) {
    return this.classService.deleteClass(+id);
  }

  // ==================== UPDATE STATUS ====================
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update class status (activate/deactivate)' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Update class status successfully',
  })
  updateClassStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.classService.updateClassStatus(+id, isActive);
  }

  // ==================== GET MEMBERS ====================
  @Get(':id/members')
  @ApiOperation({ summary: 'Get list of members in the class' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassMembersListResDto,
    description: 'Get list of members successfully',
  })
  getClassMembers(
    @Param('id') id: string,
    @Query() filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    return this.classService.getClassMembers(+id, filterDto);
  }

  // ==================== CREATE ANNOUNCEMENT ====================
  @Post(':id/announcements')
  @ApiOperation({ summary: 'Create class announcement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ClassAnnouncementResDto,
    description: 'Create announcement successfully',
  })
  createAnnouncement(
    @Param('id') id: string,
    @AuthUser() user: JwtPayloadDto,
    @Body() dto: CreateClassAnnouncementDto,
  ) {
    return this.classService.createAnnouncement(user.id, +id, dto);
  }
}
