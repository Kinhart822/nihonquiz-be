import { RoleUser } from '@constants/user.constant';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { PageDto } from '@shared/dtos/page.dto';
import { AssignmentService } from './assignment.service';
import {
  AssignmentFilterDto,
  CreateAssignmentDto,
  ExtendDeadlineDto,
  GradeAssignmentDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dtos/assignment.req.dto';
import {
  AssignmentResDto,
  AssignmentStatsResDto,
  AssignmentSubmissionResDto,
} from './dtos/assignment.res.dto';

@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  @ApiOperation({ summary: 'Create assignment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: AssignmentResDto,
    description: 'Assignment created successfully',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<AssignmentResDto> {
    return this.assignmentService.createAssignment(dto, files);
  }

  // ==================== GET LIST ====================
  @Get('class/:classId')
  @RoleGuard()
  @ApiOperation({ summary: 'Get assignments by class' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PageDto,
    description: 'List of assignments returned successfully',
  })
  async getAssignmentsByClass(
    @Param('classId') classId: number,
    @Query() filterDto: AssignmentFilterDto,
  ): Promise<PageDto<AssignmentResDto>> {
    return this.assignmentService.getAssignmentsByClass(classId, filterDto);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AssignmentResDto,
    description: 'Assignment updated successfully',
  })
  async updateAssignment(
    @Param('id') id: number,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<AssignmentResDto> {
    return this.assignmentService.updateAssignment(id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Assignment deleted successfully',
  })
  async deleteAssignment(@Param('id') id: number): Promise<void> {
    return this.assignmentService.deleteAssignment(id);
  }

  // ==================== CLOSE ASSIGNMENT ====================
  @Put(':id/close')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  async closeAssignment(@Param('id') id: number): Promise<AssignmentResDto> {
    return this.assignmentService.closeAssignment(id);
  }

  // ==================== EXTEND DEADLINE ====================
  @Put(':id/extend-deadline')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  async extendDeadline(
    @Param('id') id: number,
    @Body() dto: ExtendDeadlineDto,
  ): Promise<AssignmentResDto> {
    return this.assignmentService.extendDeadline(id, dto);
  }

  // ==================== GET STATISTICS ====================
  @Get(':id/statistics')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  async getAssignmentStatistics(
    @Param('id') id: number,
  ): Promise<AssignmentStatsResDto> {
    return this.assignmentService.getAssignmentStatistics(id);
  }

  // ==================== SUBMIT ====================
  @Post(':id/submit')
  @RoleGuard(RoleUser.STUDENT)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async submitAssignment(
    @Param('id') id: number,
    @Body() dto: SubmitAssignmentDto,
    @Req() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<AssignmentSubmissionResDto> {
    const studentId = req.user.id;
    return this.assignmentService.submitAssignment(id, studentId, dto, files);
  }

  // ==================== DELETE SUBMISSION ATTACHMENT ====================
  @Delete(':id/submissions/attachments/:attachmentId')
  @RoleGuard(RoleUser.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubmissionAttachment(
    @Param('id') id: number,
    @Param('attachmentId') attachmentId: number,
    @Req() req: any,
  ): Promise<void> {
    const studentId = req.user.id;
    return this.assignmentService.deleteSubmissionAttachment(
      id,
      attachmentId,
      studentId,
    );
  }

  // ==================== GRADE ====================
  @Put('submissions/:submissionId/grade')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  async gradeSubmission(
    @Param('submissionId') submissionId: number,
    @Body() dto: GradeAssignmentDto,
  ): Promise<AssignmentSubmissionResDto> {
    return this.assignmentService.gradeSubmission(submissionId, dto);
  }

  // ==================== GET SUBMISSIONS ====================
  @Get(':id/submissions')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  async getSubmissionsByAssignment(
    @Param('id') id: number,
  ): Promise<AssignmentSubmissionResDto[]> {
    return this.assignmentService.getSubmissionsByAssignment(id);
  }
}
