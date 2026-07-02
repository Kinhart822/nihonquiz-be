import { Test, TestingModule } from '@nestjs/testing';
import { QuestionService } from './question.service';
import { QuestionRepository } from '@database/repository/question.repository';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { QUESTION_BANK_QUEUE } from '@constants/queue.constant';
import {
  httpNotFound,
  httpBadRequest,
} from '@shared/exceptions/http-exception';
import { QuestionType } from '@constants/question.constant';

describe('QuestionService', () => {
  let service: QuestionService;
  let questionRepo: jest.Mocked<QuestionRepository>;
  let practiceTestRepo: jest.Mocked<PracticeTestRepository>;
  let miniQuizRepo: jest.Mocked<MiniQuizRepository>;
  let questionBankQueue: any;

  beforeEach(async () => {
    const mockQuestionRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const mockPracticeTestRepo = {
      getEntityById: jest.fn(),
    };

    const mockMiniQuizRepo = {
      getEntityById: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionService,
        { provide: QuestionRepository, useValue: mockQuestionRepo },
        { provide: PracticeTestRepository, useValue: mockPracticeTestRepo },
        { provide: MiniQuizRepository, useValue: mockMiniQuizRepo },
        { provide: getQueueToken(QUESTION_BANK_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<QuestionService>(QuestionService);
    questionRepo = module.get(QuestionRepository);
    practiceTestRepo = module.get(PracticeTestRepository);
    miniQuizRepo = module.get(MiniQuizRepository);
    questionBankQueue = module.get(getQueueToken(QUESTION_BANK_QUEUE));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createQuestion', () => {
    it('should throw if practice test does not exist', async () => {
      /*
       * Flow: Create Question (Validation Error - Practice Test)
       * 1. Mock practice test repository to return null
       * 2. Expect NotFound exception
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce(null);

      await expect(
        service.createQuestion({
          practiceTestId: 1,
          content: 'Q1',
          answers: [],
        }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should throw if mini quiz does not exist', async () => {
      /*
       * Flow: Create Question (Validation Error - Mini Quiz)
       * 1. Mock mini quiz repository to return null
       * 2. Expect NotFound exception
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce(null);

      await expect(
        service.createQuestion({
          miniQuizId: 1,
          content: 'Q1',
          answers: [],
        }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should create question successfully', async () => {
      /*
       * Flow: Create Question (Success)
       * 1. Mock parent repository (e.g. practice test) to return entity
       * 2. Mock question creation and save operations
       * 3. Verify created question id
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      questionRepo.create.mockReturnValue({
        id: 10,
        content: 'Q1',
      } as any);
      questionRepo.createEntity.mockResolvedValueOnce({
        id: 10,
        content: 'Q1',
      } as any);

      const result = await service.createQuestion({
        practiceTestId: 1,
        content: 'Q1',
        answers: [{ content: 'A', isCorrect: true }],
      });

      expect(result.id).toBe(10);
    });
  });

  describe('queueExportQuestions', () => {
    it('should queue export job', async () => {
      /*
       * Flow: Queue Export Questions (Success)
       * 1. Mock BullMQ queue add method
       * 2. Verify queue method is called and returns success
       */
      questionBankQueue.add.mockResolvedValueOnce({ id: 'job-1' });

      const result = await service.queueExportQuestions('test@test.com', 1);

      expect(questionBankQueue.add).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('queueImportQuestions', () => {
    it('should throw if file is missing', async () => {
      /*
       * Flow: Queue Import Questions (Validation Error)
       * 1. Call method with null file buffer
       * 2. Expect BadRequest exception
       */
      await expect(
        service.queueImportQuestions('test@test.com', null as any, 1),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should queue import job', async () => {
      /*
       * Flow: Queue Import Questions (Success)
       * 1. Mock BullMQ queue add method
       * 2. Verify queue method is called and returns success
       */
      questionBankQueue.add.mockResolvedValueOnce({ id: 'job-2' });

      const result = await service.queueImportQuestions(
        'test@test.com',
        { buffer: Buffer.from('') } as any,
        1,
      );

      expect(questionBankQueue.add).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
