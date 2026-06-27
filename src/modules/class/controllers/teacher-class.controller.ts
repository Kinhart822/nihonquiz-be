import { RoleUser } from '@constants/user.constant';
import {
  Body,
  Controller,
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

import { ClassStudentStatus } from '../../../constants/class.constant';
import { PageDto } from '../../../shared/dtos/page.dto';
import {
  ClassFilterDto,
  ClassStudentFilterDto,
  CreateClassAnnouncementDto,
  UpdateClassDto,
} from '../dtos/class.req.dto';
import {
  ClassAnnouncementResDto,
  ClassMembersListResDto,
  ClassResDto,
} from '../dtos/class.res.dto';
import { TeacherClassService } from '../services/teacher-class.service';

@ApiTags('Teacher Classes')
@RoleGuard(RoleUser.TEACHER)
@Controller('api/teacher/classes')
export class TeacherClassController {
  constructor(private readonly classService: TeacherClassService) {}

  // ==================== GET LIST ====================
  @Get()
  @ApiOperation({ summary: 'Get list of teaching classes' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto<ClassResDto>,
    description: 'Get list of classes successfully',
  })
  getMyTeachingClasses(
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: ClassFilterDto,
  ): Promise<PageDto<ClassResDto>> {
    return this.classService.getMyTeachingClasses(user.id, filterDto);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @ApiOperation({ summary: 'Update class details' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ClassResDto,
    description: 'Update class details successfully',
  })
  updateClass(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classService.updateClass(user.id, +id, dto);
  }

  // ==================== GENERATE CODE ====================
  @Post(':id/generate-code')
  @ApiOperation({ summary: 'Generate a new class code' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
      },
    },
    description: 'Generate class code successfully',
  })
  generateClassCode(@AuthUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.classService.generateClassCode(user.id, +id);
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
    @AuthUser() user: JwtPayloadDto,
    @Query() filterDto: ClassStudentFilterDto,
  ): Promise<ClassMembersListResDto> {
    return this.classService.getClassMembers(user.id, +id, filterDto);
  }

  // ==================== UPDATE STUDENT STATUS ====================
  @Patch(':id/students/:studentId/status')
  @ApiOperation({ summary: 'Update student status (e.g., ACTIVE, PENDING)' })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    description: 'Update student status successfully',
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

  // ==================== CREATE ANNOUNCEMENT ====================
  @Post(':id/announcements')
  @ApiOperation({ summary: 'Create class announcement' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ClassAnnouncementResDto,
    description: 'Create announcement successfully',
  })
  createAnnouncement(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Body() dto: CreateClassAnnouncementDto,
  ) {
    return this.classService.createAnnouncement(user.id, +id, dto);
  }
}
