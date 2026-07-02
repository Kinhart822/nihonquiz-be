import { Test, TestingModule } from '@nestjs/testing';
import { MiniQuizService } from './mini-quiz.service';
import { MiniQuizRepository } from '@database/repository/mini-quiz.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { httpNotFound } from '@shared/exceptions/http-exception';

describe('MiniQuizService', () => {
  let service: MiniQuizService;
  let miniQuizRepo: jest.Mocked<MiniQuizRepository>;
  let lessonRepo: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const mockMiniQuizRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getMiniQuizzesByLessonWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const mockLessonRepo = {
      getEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiniQuizService,
        { provide: MiniQuizRepository, useValue: mockMiniQuizRepo },
        { provide: LessonRepository, useValue: mockLessonRepo },
      ],
    }).compile();

    service = module.get<MiniQuizService>(MiniQuizService);
    miniQuizRepo = module.get(MiniQuizRepository);
    lessonRepo = module.get(LessonRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createMiniQuiz', () => {
    it('should throw if lesson does not exist', async () => {
      /*
       * Flow: Create Mini Quiz (Validation Error)
       * 1. Mock lesson repository to return null
       * 2. Expect NotFound exception
       */
      lessonRepo.getEntityById.mockResolvedValueOnce(null);

      await expect(
        service.createMiniQuiz({ lessonId: 1, title: 'Quiz 1' }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should create mini quiz successfully', async () => {
      /*
       * Flow: Create Mini Quiz (Success)
       * 1. Mock lesson repository to return lesson
       * 2. Mock mini quiz repository to return created quiz
       * 3. Verify created quiz id
       */
      lessonRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      miniQuizRepo.createEntity.mockResolvedValueOnce({
        id: 10,
        lessonId: 1,
        title: 'Quiz 1',
      } as any);

      const result = await service.createMiniQuiz({
        lessonId: 1,
        title: 'Quiz 1',
      });
      expect(result.id).toBe(10);
    });
  });

  describe('getMiniQuizzesByLesson', () => {
    it('should throw if lesson does not exist', async () => {
      /*
       * Flow: Get Mini Quizzes By Lesson (Validation Error)
       * 1. Mock lesson repository to return null
       * 2. Expect NotFound exception
       */
      lessonRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(
        service.getMiniQuizzesByLesson(1, { skip: 0, limit: 10 } as any),
      ).rejects.toThrow(httpNotFound);
    });

    it('should return paginated mini quizzes', async () => {
      /*
       * Flow: Get Mini Quizzes By Lesson (Success)
       * 1. Mock lesson repository to return lesson
       * 2. Mock mini quiz repository to return paginated quizzes
       * 3. Verify data length and meta total
       */
      lessonRepo.getEntityById.mockResolvedValueOnce({ id: 1 } as any);
      miniQuizRepo.getMiniQuizzesByLessonWithFilters.mockResolvedValueOnce({
        entities: [{ id: 10 } as any],
        total: 1,
      });

      const result = await service.getMiniQuizzesByLesson(1, {
        skip: 0,
        limit: 10,
      } as any);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getMiniQuizById', () => {
    it('should throw if quiz does not exist', async () => {
      /*
       * Flow: Get Mini Quiz By ID (Validation Error)
       * 1. Mock mini quiz repository to return null
       * 2. Expect NotFound exception
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(service.getMiniQuizById(10)).rejects.toThrow(httpNotFound);
    });

    it('should return quiz successfully', async () => {
      /*
       * Flow: Get Mini Quiz By ID (Success)
       * 1. Mock mini quiz repository to return quiz
       * 2. Verify returned quiz id
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce({ id: 10 } as any);
      const result = await service.getMiniQuizById(10);
      expect(result.id).toBe(10);
    });
  });

  describe('updateMiniQuiz', () => {
    it('should throw if quiz does not exist', async () => {
      /*
       * Flow: Update Mini Quiz (Validation Error)
       * 1. Mock mini quiz repository to return null
       * 2. Expect NotFound exception
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(
        service.updateMiniQuiz(10, { title: 'Updated' }),
      ).rejects.toThrow(httpNotFound);
    });

    it('should update quiz successfully', async () => {
      /*
       * Flow: Update Mini Quiz (Success)
       * 1. Mock mini quiz repository to return quiz
       * 2. Mock update operation to return updated quiz
       * 3. Verify updated title
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce({ id: 10 } as any);
      miniQuizRepo.updateEntity.mockResolvedValueOnce({
        id: 10,
        title: 'Updated',
      } as any);

      const result = await service.updateMiniQuiz(10, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('deleteMiniQuiz', () => {
    it('should throw if quiz does not exist', async () => {
      /*
       * Flow: Delete Mini Quiz (Validation Error)
       * 1. Mock mini quiz repository to return null
       * 2. Expect NotFound exception
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce(null);
      await expect(service.deleteMiniQuiz(10)).rejects.toThrow(httpNotFound);
    });

    it('should delete quiz successfully', async () => {
      /*
       * Flow: Delete Mini Quiz (Success)
       * 1. Mock mini quiz repository to return quiz
       * 2. Mock delete operation
       * 3. Verify delete method is called with correct id
       */
      miniQuizRepo.getEntityById.mockResolvedValueOnce({ id: 10 } as any);
      miniQuizRepo.deleteEntityById.mockResolvedValueOnce(true);

      await service.deleteMiniQuiz(10);
      expect(miniQuizRepo.deleteEntityById).toHaveBeenCalledWith(10);
    });
  });
});
