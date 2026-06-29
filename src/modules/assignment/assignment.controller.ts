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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeAssignmentDto,
  AssignmentFilterDto,
} from './dtos/assignment.req.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  AssignmentResDto,
  AssignmentSubmissionResDto,
} from './dtos/assignment.res.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { RoleUser } from '@constants/user.constant';

@ApiTags('Assignments')
@Controller('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
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
  async getAssignmentsByClass(
    @Param('classId') classId: number,
    @Query() filterDto: AssignmentFilterDto,
  ): Promise<PageDto<AssignmentResDto>> {
    return this.assignmentService.getAssignmentsByClass(classId, filterDto);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
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
  async deleteAssignment(@Param('id') id: number): Promise<void> {
    return this.assignmentService.deleteAssignment(id);
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
