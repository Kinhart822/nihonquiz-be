import { Injectable } from '@nestjs/common';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { TestAttemptRepository } from '@database/repository/test-attempt.repository';
import { QuestionRepository } from '@database/repository/question.repository';
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
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpBadRequest,
  httpErrors,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PracticeTestService {
  constructor(
    private readonly practiceTestRepo: PracticeTestRepository,
    private readonly testAttemptRepo: TestAttemptRepository,
    private readonly questionRepo: QuestionRepository,
  ) {}

  // ==================== VALIDATION ====================
  private async validatePracticeTest(id: number) {
    const test = await this.practiceTestRepo.getEntityById(id);
    if (!test) {
      throw new httpNotFound(
        httpErrors.PRACTICE_TEST_NOT_FOUND.message,
        httpErrors.PRACTICE_TEST_NOT_FOUND.code,
      );
    }
    return test;
  }

  // ==================== CREATE ====================
  async createPracticeTest(
    dto: CreatePracticeTestDto,
  ): Promise<PracticeTestResDto> {
    const test = await this.practiceTestRepo.createEntity(dto);
    return plainToInstance(PracticeTestResDto, test, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getPracticeTests(
    filterDto: PracticeTestFilterDto,
  ): Promise<PageDto<PracticeTestResDto>> {
    const { entities, total } =
      await this.practiceTestRepo.getPracticeTestsWithFilters(filterDto);
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(PracticeTestResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as PracticeTestResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getPracticeTestById(id: number): Promise<PracticeTestResDto> {
    const test = await this.validatePracticeTest(id);
    return plainToInstance(PracticeTestResDto, test, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updatePracticeTest(
    id: number,
    dto: UpdatePracticeTestDto,
  ): Promise<PracticeTestResDto> {
    const test = await this.validatePracticeTest(id);
    const updated = await this.practiceTestRepo.updateEntity(test, dto);
    return plainToInstance(PracticeTestResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deletePracticeTest(id: number): Promise<void> {
    await this.validatePracticeTest(id);
    await this.practiceTestRepo.deleteEntityById(id);
  }

  // ==================== TEST ATTEMPTS ====================
  async startTest(userId: number, testId: number): Promise<TestAttemptResDto> {
    await this.validatePracticeTest(testId);

    const attempt = await this.testAttemptRepo.createEntity({
      userId,
      practiceTestId: testId,
      score: 0,
      totalScore: 0,
      details: {},
    });
    return plainToInstance(TestAttemptResDto, attempt, {
      excludeExtraneousValues: true,
    });
  }

  async submitTest(
    userId: number,
    testId: number,
    attemptId: number,
    dto: SubmitPracticeTestDto,
  ): Promise<TestAttemptResDto> {
    const attempt = await this.testAttemptRepo.findOne({
      where: { id: attemptId, userId, practiceTestId: testId },
    });

    if (!attempt) {
      throw new httpNotFound(
        httpErrors.ATTEMPT_NOT_FOUND.message,
        httpErrors.ATTEMPT_NOT_FOUND.code,
      );
    }

    if (attempt.completedAt) {
      throw new httpBadRequest(
        httpErrors.ATTEMPT_ALREADY_SUBMITTED.message,
        httpErrors.ATTEMPT_ALREADY_SUBMITTED.code,
      );
    }

    const questions = await this.questionRepo.find({
      where: { practiceTestId: testId },
      relations: { answers: true },
    });

    let score = 0;
    let totalScore = 0;
    const details: Record<string, any> = {};

    for (const question of questions) {
      totalScore += question.score;
      const submittedAnswer = dto.answers[question.id];
      const correctAnswers = question.answers.filter((a) => a.isCorrect);

      let isCorrect = false;

      if (submittedAnswer !== undefined) {
        isCorrect = correctAnswers.some((a) => a.id === submittedAnswer);

        if (isCorrect) {
          score += question.score;
        }
      }

      details[question.id] = {
        submittedAnswer,
        isCorrect,
        correctAnswers: correctAnswers.map((a) => a.id),
      };
    }

    attempt.score = score;
    attempt.totalScore = totalScore;
    attempt.completedAt = new Date();
    attempt.details = details;

    await this.testAttemptRepo.updateEntity(attempt, {});

    return plainToInstance(TestAttemptResDto, attempt, {
      excludeExtraneousValues: true,
    });
  }

  async getAttemptHistory(
    userId: number,
    testId: number,
  ): Promise<TestAttemptResDto[]> {
    const attempts = await this.testAttemptRepo.find({
      where: { userId, practiceTestId: testId },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(TestAttemptResDto, attempts, {
      excludeExtraneousValues: true,
    });
  }

  async getAttemptDetails(
    userId: number,
    testId: number,
    attemptId: number,
  ): Promise<TestAttemptResDto> {
    const attempt = await this.testAttemptRepo.findOne({
      where: { id: attemptId, userId, practiceTestId: testId },
    });

    if (!attempt) {
      throw new httpNotFound(
        httpErrors.ATTEMPT_NOT_FOUND.message,
        httpErrors.ATTEMPT_NOT_FOUND.code,
      );
    }

    return plainToInstance(TestAttemptResDto, attempt, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== TEACHER / ADMIN ====================
  async getStudentResults(testId: number): Promise<StudentResultResDto[]> {
    await this.validatePracticeTest(testId);

    const attempts = await this.testAttemptRepo.find({
      where: { practiceTestId: testId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(StudentResultResDto, attempts, {
      excludeExtraneousValues: true,
    });
  }

  async getAnalytics(testId: number): Promise<PracticeTestAnalyticsResDto> {
    await this.validatePracticeTest(testId);

    const attempts = await this.testAttemptRepo.find({
      where: { practiceTestId: testId },
    });

    const totalAttempts = attempts.length;
    if (totalAttempts === 0) {
      return {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalAttempts: 0,
      };
    }

    const scores = attempts.map((a) => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalAttempts;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    return plainToInstance(
      PracticeTestAnalyticsResDto,
      {
        averageScore,
        highestScore,
        lowestScore,
        totalAttempts,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getOverallReports(): Promise<any> {
    const totalTests = await this.practiceTestRepo.count();
    const totalAttempts = await this.testAttemptRepo.count();

    const result = await this.testAttemptRepo
      .createQueryBuilder('attempt')
      .select('AVG(attempt.score)', 'averageScore')
      .getRawOne();

    const avgScore = result?.averageScore ? parseFloat(result.averageScore) : 0;

    return {
      totalPracticeTests: totalTests,
      totalAttempts: totalAttempts,
      averageScoreAcrossAllTests: avgScore,
    };
  }
}
