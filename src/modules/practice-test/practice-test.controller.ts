import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleGuard } from '@shared/decorators/guard.decorator';
import { RoleUser } from '@constants/user.constant';
import { PageDto } from '@shared/dtos/page.dto';
import { PracticeTestService } from './practice-test.service';
import {
  CreatePracticeTestDto,
  UpdatePracticeTestDto,
  PracticeTestFilterDto,
  SubmitPracticeTestDto,
} from './dtos/practice-test.req.dto';
import {
  PracticeTestResDto,
  TestAttemptResDto,
  StudentResultResDto,
  PracticeTestAnalyticsResDto,
} from './dtos/practice-test.res.dto';
import { AuthUser } from '@shared/decorators/guard.decorator';
import { JwtPayloadDto } from '@shared/dtos/jwt-payload.dto';

@ApiTags('Practice Test')
@ApiBearerAuth()
@Controller('practice-test')
export class PracticeTestController {
  constructor(private readonly practiceTestService: PracticeTestService) {}

  // ==================== CREATE ====================
  @Post()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Create practice test' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PracticeTestResDto,
    description: 'Practice test created successfully',
  })
  async createPracticeTest(
    @Body() dto: CreatePracticeTestDto,
  ): Promise<PracticeTestResDto> {
    return this.practiceTestService.createPracticeTest(dto);
  }

  // ==================== GET LIST ====================
  @Get()
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get practice tests' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PracticeTestResDto,
    description: 'List of practice tests returned successfully',
  })
  async getPracticeTests(
    @Query() filterDto: PracticeTestFilterDto,
  ): Promise<PageDto<PracticeTestResDto>> {
    return this.practiceTestService.getPracticeTests(filterDto);
  }

  // ==================== GET INFO ====================
  @Get(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER, RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get practice test by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PracticeTestResDto,
    description: 'Practice test information returned successfully',
  })
  async getPracticeTestById(
    @Param('id') id: string,
  ): Promise<PracticeTestResDto> {
    return this.practiceTestService.getPracticeTestById(+id);
  }

  // ==================== UPDATE ====================
  @Put(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Update practice test' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PracticeTestResDto,
    description: 'Practice test updated successfully',
  })
  async updatePracticeTest(
    @Param('id') id: string,
    @Body() dto: UpdatePracticeTestDto,
  ): Promise<PracticeTestResDto> {
    return this.practiceTestService.updatePracticeTest(+id, dto);
  }

  // ==================== DELETE ====================
  @Delete(':id')
  @RoleGuard(RoleUser.ADMIN, RoleUser.TEACHER)
  @ApiOperation({ summary: 'Delete practice test' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Practice test deleted successfully',
  })
  async deletePracticeTest(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.practiceTestService.deletePracticeTest(+id);
    return { success: true };
  }

  // ==================== TEST ATTEMPTS ====================
  @Post(':id/start')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Start a practice test attempt' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TestAttemptResDto,
    description: 'Test attempt started successfully',
  })
  async startTest(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
  ): Promise<TestAttemptResDto> {
    return this.practiceTestService.startTest(user.id, +id);
  }

  @Post(':id/attempts/:attemptId/submit')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Submit a practice test attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TestAttemptResDto,
    description: 'Test attempt submitted successfully',
  })
  async submitTest(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitPracticeTestDto,
  ): Promise<TestAttemptResDto> {
    return this.practiceTestService.submitTest(user.id, +id, +attemptId, dto);
  }

  @Get(':id/attempts')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get test attempt history for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [TestAttemptResDto],
    description: 'Test attempt history returned successfully',
  })
  async getAttemptHistory(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
  ): Promise<TestAttemptResDto[]> {
    return this.practiceTestService.getAttemptHistory(user.id, +id);
  }

  @Get(':id/attempts/:attemptId')
  @RoleGuard(RoleUser.STUDENT)
  @ApiOperation({ summary: 'Get details of a specific test attempt' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TestAttemptResDto,
    description: 'Test attempt details returned successfully',
  })
  async getAttemptDetails(
    @AuthUser() user: JwtPayloadDto,
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
  ): Promise<TestAttemptResDto> {
    return this.practiceTestService.getAttemptDetails(user.id, +id, +attemptId);
  }

  // ==================== TEACHER / ADMIN ====================
  @Get('admin/reports')
  @RoleGuard(RoleUser.ADMIN)
  @ApiOperation({ summary: 'Get overall test reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overall test reports returned successfully',
  })
  async getOverallReports(): Promise<any> {
    return this.practiceTestService.getOverallReports();
  }

  @Get(':id/results')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  @ApiOperation({ summary: 'Get all student results for a practice test' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [StudentResultResDto],
    description: 'Student results returned successfully',
  })
  async getStudentResults(
    @Param('id') id: string,
  ): Promise<StudentResultResDto[]> {
    return this.practiceTestService.getStudentResults(+id);
  }

  @Get(':id/analytics')
  @RoleGuard(RoleUser.TEACHER, RoleUser.ADMIN)
  @ApiOperation({ summary: 'Get analytics for a practice test' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PracticeTestAnalyticsResDto,
    description: 'Practice test analytics returned successfully',
  })
  async getAnalytics(
    @Param('id') id: string,
  ): Promise<PracticeTestAnalyticsResDto> {
    return this.practiceTestService.getAnalytics(+id);
  }
}
