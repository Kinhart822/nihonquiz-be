import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { QuestionRepository } from '@database/repository/question.repository';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilterDto,
} from './dtos/question.req.dto';
import { QuestionResDto } from './dtos/question.res.dto';
import { PageMetaDto } from '@shared/dtos/page-meta.dto';
import { PageDto } from '@shared/dtos/page.dto';
import {
  httpErrors,
  httpNotFound,
  httpBadRequest,
} from '@shared/exceptions/http-exception';
import { plainToInstance } from 'class-transformer';
import { QuestionType } from '@constants/question.constant';

import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  QUESTION_BANK_QUEUE,
  QUESTION_BANK_JOB,
} from '@constants/queue.constant';

@Injectable()
export class QuestionService {
  constructor(
    private readonly questionRepo: QuestionRepository,
    private readonly practiceTestRepo: PracticeTestRepository,
    private readonly miniQuizRepo: MiniQuizRepository,
    @InjectQueue(QUESTION_BANK_QUEUE) private readonly questionBankQueue: Queue,
  ) {}

  // ==================== VALIDATION ====================
  private async validateQuestion(id: number) {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: { answers: true },
    });
    if (!question) {
      throw new httpNotFound(
        httpErrors.QUESTION_NOT_FOUND.message,
        httpErrors.QUESTION_NOT_FOUND.code,
      );
    }
    return question;
  }

  // ==================== CREATE ====================
  async createQuestion(dto: CreateQuestionDto): Promise<QuestionResDto> {
    if (!dto.practiceTestId && !dto.miniQuizId) {
      throw new httpBadRequest(
        httpErrors.MISSING_TEST_OR_QUIZ_ID.message,
        httpErrors.MISSING_TEST_OR_QUIZ_ID.code,
      );
    }

    if (dto.practiceTestId) {
      const test = await this.practiceTestRepo.getEntityById(
        dto.practiceTestId,
      );
      if (!test)
        throw new httpNotFound(
          httpErrors.PRACTICE_TEST_NOT_FOUND.message,
          httpErrors.PRACTICE_TEST_NOT_FOUND.code,
        );
    }

    if (dto.miniQuizId) {
      const quiz = await this.miniQuizRepo.getEntityById(dto.miniQuizId);
      if (!quiz)
        throw new httpNotFound(
          httpErrors.MINI_QUIZ_NOT_FOUND.message,
          httpErrors.MINI_QUIZ_NOT_FOUND.code,
        );
    }

    const question = this.questionRepo.create(dto);
    const saved = await this.questionRepo.save(question);

    return plainToInstance(QuestionResDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== GET LIST ====================
  async getQuestions(
    filterDto: QuestionFilterDto,
  ): Promise<PageDto<QuestionResDto>> {
    const { entities, total } =
      await this.questionRepo.getQuestionsWithFilters(filterDto);
    const meta = new PageMetaDto(filterDto, total);
    const data = plainToInstance(QuestionResDto, entities, {
      excludeExtraneousValues: true,
    });
    return new PageDto(data as unknown as QuestionResDto[], meta);
  }

  // ==================== GET INFO ====================
  async getQuestionById(id: number): Promise<QuestionResDto> {
    const question = await this.validateQuestion(id);
    return plainToInstance(QuestionResDto, question, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== UPDATE ====================
  async updateQuestion(
    id: number,
    dto: UpdateQuestionDto,
  ): Promise<QuestionResDto> {
    const question = await this.validateQuestion(id);

    // For answers update, we will replace existing answers entirely to keep it simple
    // In a production scenario, we'd want to carefully merge.
    if (dto.answers) {
      question.answers = dto.answers as any;
    }
    if (dto.content) question.content = dto.content;
    if (dto.explanation) question.explanation = dto.explanation;
    if (dto.score) question.score = dto.score;
    if (dto.type) question.type = dto.type;

    const updated = await this.questionRepo.save(question);
    return plainToInstance(QuestionResDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  // ==================== DELETE ====================
  async deleteQuestion(id: number): Promise<void> {
    await this.validateQuestion(id);
    await this.questionRepo.deleteEntityById(id);
  }

  // ==================== IMPORT / EXPORT ====================
  async exportQuestions(
    practiceTestId?: number,
    miniQuizId?: number,
  ): Promise<Buffer> {
    const queryBuilder = this.questionRepo
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.answers', 'answers');

    if (practiceTestId) {
      queryBuilder.andWhere('question.practiceTestId = :practiceTestId', {
        practiceTestId,
      });
    }

    if (miniQuizId) {
      queryBuilder.andWhere('question.miniQuizId = :miniQuizId', {
        miniQuizId,
      });
    }

    const questions = await queryBuilder.getMany();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Questions');

    worksheet.columns = [
      { header: 'Content', key: 'content', width: 40 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Explanation', key: 'explanation', width: 30 },
      { header: 'Correct Answer', key: 'correctAnswer', width: 20 },
      { header: 'Option 1', key: 'option1', width: 20 },
      { header: 'Option 2', key: 'option2', width: 20 },
      { header: 'Option 3', key: 'option3', width: 20 },
      { header: 'Option 4', key: 'option4', width: 20 },
    ];

    for (const q of questions) {
      const correctIndex = q.answers.findIndex((a) => a.isCorrect);
      const correctAnswerName =
        correctIndex >= 0 ? `Option ${correctIndex + 1}` : '';

      worksheet.addRow({
        content: q.content,
        type: q.type,
        score: q.score,
        explanation: q.explanation || '',
        correctAnswer: correctAnswerName,
        option1: q.answers[0]?.content || '',
        option2: q.answers[1]?.content || '',
        option3: q.answers[2]?.content || '',
        option4: q.answers[3]?.content || '',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any as Buffer;
  }

  async importQuestions(
    fileBuffer: Buffer,
    practiceTestId?: number,
    miniQuizId?: number,
  ): Promise<{ importedCount: number }> {
    if (!practiceTestId && !miniQuizId) {
      throw new httpBadRequest(
        httpErrors.MISSING_TEST_OR_QUIZ_ID.message,
        httpErrors.MISSING_TEST_OR_QUIZ_ID.code,
      );
    }

    if (practiceTestId) {
      const test = await this.practiceTestRepo.getEntityById(practiceTestId);
      if (!test)
        throw new httpNotFound(
          httpErrors.PRACTICE_TEST_NOT_FOUND.message,
          httpErrors.PRACTICE_TEST_NOT_FOUND.code,
        );
    } else if (miniQuizId) {
      const quiz = await this.miniQuizRepo.getEntityById(miniQuizId);
      if (!quiz)
        throw new httpNotFound(
          httpErrors.MINI_QUIZ_NOT_FOUND.message,
          httpErrors.MINI_QUIZ_NOT_FOUND.code,
        );
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new httpBadRequest(
        httpErrors.INVALID_FILE.message,
        httpErrors.INVALID_FILE.code,
      );
    }

    const questionsToCreate: CreateQuestionDto[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const content = row.getCell(1).text;
      if (!content) return;

      const type =
        (row.getCell(2).text as QuestionType) || QuestionType.MULTIPLE_CHOICE;
      const score = Number(row.getCell(3).value) || 1;
      const explanation = row.getCell(4).text;
      const correctAnswerStr = row.getCell(5).text; // e.g. 'Option 1'

      const options = [
        row.getCell(6).text,
        row.getCell(7).text,
        row.getCell(8).text,
        row.getCell(9).text,
      ].filter(Boolean);

      const answers = options.map((opt, index) => {
        return {
          content: opt,
          isCorrect: correctAnswerStr.includes(String(index + 1)),
        };
      });

      questionsToCreate.push({
        practiceTestId,
        miniQuizId,
        content,
        type,
        score,
        explanation,
        answers,
      });
    });

    for (const q of questionsToCreate) {
      await this.createQuestion(q);
    }

    return { importedCount: questionsToCreate.length };
  }

  // ==================== BACKGROUND TASKS ====================
  async queueExportQuestions(
    email: string,
    practiceTestId?: number,
    miniQuizId?: number,
  ) {
    await this.questionBankQueue.add(QUESTION_BANK_JOB.EXPORT_QUESTIONS, {
      practiceTestId,
      miniQuizId,
      email,
    });
    return {
      success: true,
      message: 'Export job queued. You will be notified when completed.',
    };
  }

  async queueImportQuestions(
    email: string,
    file: Express.Multer.File,
    practiceTestId?: number,
    miniQuizId?: number,
  ) {
    if (!file) {
      throw new httpBadRequest(
        httpErrors.FILE_REQUIRED.message,
        httpErrors.FILE_REQUIRED.code,
      );
    }

    await this.questionBankQueue.add(QUESTION_BANK_JOB.IMPORT_QUESTIONS, {
      file,
      practiceTestId,
      miniQuizId,
      email,
    });

    return {
      success: true,
      message: 'Import job queued. You will be notified when completed.',
    };
  }
}
