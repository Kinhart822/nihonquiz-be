import { Test, TestingModule } from '@nestjs/testing';
import { PracticeTestService } from './practice-test.service';
import { PracticeTestRepository } from '@database/repository/practice-test.repository';
import { TestAttemptRepository } from '@database/repository/test-attempt.repository';
import { QuestionRepository } from '@database/repository/question.repository';
import {
  httpBadRequest,
  httpNotFound,
} from '@shared/exceptions/http-exception';

describe('PracticeTestService', () => {
  let service: PracticeTestService;
  let practiceTestRepo: jest.Mocked<PracticeTestRepository>;
  let testAttemptRepo: jest.Mocked<TestAttemptRepository>;
  let questionRepo: jest.Mocked<QuestionRepository>;

  beforeEach(async () => {
    const mockPracticeTestRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      createQueryBuilder: jest.fn(),
      getPracticeTestsWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const mockTestAttemptRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockQuestionRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PracticeTestService,
        { provide: PracticeTestRepository, useValue: mockPracticeTestRepo },
        { provide: TestAttemptRepository, useValue: mockTestAttemptRepo },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
      ],
    }).compile();

    service = module.get<PracticeTestService>(PracticeTestService);
    practiceTestRepo = module.get(PracticeTestRepository);
    testAttemptRepo = module.get(TestAttemptRepository);
    questionRepo = module.get(QuestionRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPracticeTest', () => {
    it('should create practice test successfully', async () => {
      /*
       * Flow: Create Practice Test (Success)
       * 1. Mock repository to return created test entity
       * 2. Call service method and verify correct id is returned
       */
      practiceTestRepo.createEntity.mockResolvedValueOnce({
        id: 1,
        title: 'Test N5',
      } as any);

      const result = await service.createPracticeTest({
        title: 'Test N5',
        timeLimit: 60,
      });
      expect(result.id).toEqual(1);
    });
  });

  describe('getPracticeTests', () => {
    it('should return paginated tests', async () => {
      /*
       * Flow: Get Practice Tests (Success)
       * 1. Mock query builder/repository to return paginated result
       * 2. Call service method and verify returned data and metadata
       */
      const mockResult = {
        entities: [{ id: 1 }],
        total: 1,
      };
      practiceTestRepo.getPracticeTestsWithFilters.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.getPracticeTests({
        skip: 0,
        limit: 10,
      } as any);
      expect(result.data.length).toEqual(1);
      expect(result.meta.total).toEqual(1);
    });
  });

  describe('updatePracticeTest', () => {
    it('should throw if test does not exist', async () => {
      /*
       * Flow: Update Practice Test (Validation Error)
       * 1. Mock repository to return null for test ID
       * 2. Call service method and expect NotFound exception
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(
        service.updatePracticeTest(1, { title: 'Updated' }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should update practice test successfully', async () => {
      /*
       * Flow: Update Practice Test (Success)
       * 1. Mock repository to return test entity
       * 2. Mock update operation
       * 3. Call service method and verify updated result
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      practiceTestRepo.updateEntity.mockResolvedValueOnce({
        id: 1,
        title: 'Updated',
      } as any);

      const result = await service.updatePracticeTest(1, { title: 'Updated' });
      expect(result.title).toEqual('Updated');
    });
  });

  describe('startTest', () => {
    it('should create and return a test attempt', async () => {
      /*
       * Flow: Start Test (Success)
       * 1. Mock repository to ensure test exists
       * 2. Mock test attempt creation and save
       * 3. Call service method and verify attempt id
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      testAttemptRepo.create.mockReturnValue({
        id: 10,
        userId: 2,
        practiceTestId: 1,
      } as any);
      testAttemptRepo.save.mockResolvedValueOnce({
        id: 10,
        userId: 2,
        practiceTestId: 1,
      } as any);

      const result = await service.startTest(2, 1);
      expect(result.id).toBe(10);
      expect(testAttemptRepo.save).toHaveBeenCalled();
    });
  });

  describe('submitTest', () => {
    it('should throw if attempt not found', async () => {
      /*
       * Flow: Submit Test (Validation Error - Not Found)
       * 1. Mock attempt repository to return null
       * 2. Expect NotFound exception when submitting
       */
      testAttemptRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.submitTest(2, 1, 10, { answers: {} }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should throw if attempt already submitted', async () => {
      /*
       * Flow: Submit Test (Validation Error - Already Submitted)
       * 1. Mock attempt repository to return attempt with completedAt date
       * 2. Expect BadRequest exception
       */
      testAttemptRepo.findOne.mockResolvedValueOnce({
        id: 10,
        completedAt: new Date(),
      } as any);

      await expect(
        service.submitTest(2, 1, 10, { answers: {} }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should calculate score and submit successfully', async () => {
      /*
       * Flow: Submit Test (Success)
       * 1. Mock attempt repository to return uncompleted attempt
       * 2. Mock question repository to return questions with correct answers
       * 3. Verify calculated score against user submitted answers
       */
      testAttemptRepo.findOne.mockResolvedValueOnce({
        id: 10,
        userId: 2,
        practiceTestId: 1,
        completedAt: null,
      } as any);

      // Question 1: Score 5, correct answer is 100
      // Question 2: Score 10, correct answer is 200
      questionRepo.find.mockResolvedValueOnce([
        {
          id: 1,
          score: 5,
          answers: [
            { id: 100, isCorrect: true },
            { id: 101, isCorrect: false },
          ],
        },
        {
          id: 2,
          score: 10,
          answers: [
            { id: 200, isCorrect: true },
            { id: 201, isCorrect: false },
          ],
        },
      ] as any);

      testAttemptRepo.save.mockImplementation(
        async (attempt) => attempt as any,
      );

      const result = await service.submitTest(2, 1, 10, {
        answers: {
          '1': 100, // Correct
          '2': 201, // Incorrect
        },
      });

      expect(result.score).toBe(5);
      expect(result.totalScore).toBe(15);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('deletePracticeTest', () => {
    it('should throw if test does not exist', async () => {
      /*
       * Flow: Delete Practice Test (Validation Error)
       * 1. Mock repository to return null
       * 2. Expect NotFound exception
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(service.deletePracticeTest(1)).rejects.toThrow(httpNotFound);
    });

    it('should delete test successfully', async () => {
      /*
       * Flow: Delete Practice Test (Success)
       * 1. Mock repository to return test entity
       * 2. Mock delete operation
       * 3. Verify repository delete method is called with correct id
       */
      practiceTestRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      practiceTestRepo.deleteEntityById.mockResolvedValueOnce(undefined);

      await service.deletePracticeTest(1);
      expect(practiceTestRepo.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
