import { Test, TestingModule } from '@nestjs/testing';
import { GrammarService } from './grammar.service';
import { GrammarRepository } from '@database/repository/grammar.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';

describe('GrammarService', () => {
  let service: GrammarService;
  let grammarRepo: jest.Mocked<GrammarRepository>;
  let lessonRepo: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const mockGrammarRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getGrammarsWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };
    const mockLessonRepo = {
      getEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrammarService,
        {
          provide: GrammarRepository,
          useValue: mockGrammarRepo,
        },
        {
          provide: LessonRepository,
          useValue: mockLessonRepo,
        },
      ],
    }).compile();

    service = module.get(GrammarService);
    grammarRepo = module.get(GrammarRepository);
    lessonRepo = module.get(LessonRepository);
  });

  describe('createGrammar', () => {
    it('should create grammar successfully', async () => {
      /*
       * Flow: Create Grammar (Success)
       * 1. Mock lesson validation to succeed.
       * 2. Mock grammarRepo.createEntity to return saved data.
       * 3. Call service.createGrammar.
       * 4. Verify createEntity is called.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      grammarRepo.createEntity.mockResolvedValue({ id: 1 } as any);

      const result = await service.createGrammar({
        lessonId: 1,
        structure: 'a',
        meaning: 'b',
      });
      expect(lessonRepo.getEntityById).toHaveBeenCalledWith(1);
      expect(grammarRepo.createEntity).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Create Grammar (Lesson Not Found)
       * 1. Mock lesson validation to return null.
       * 2. Expect service.createGrammar to throw.
       */
      lessonRepo.getEntityById.mockResolvedValue(null);
      await expect(
        service.createGrammar({ lessonId: 1 } as any),
      ).rejects.toThrow(httpNotFound);
    });
  });

  describe('getGrammarsByLesson', () => {
    it('should return paginated grammars', async () => {
      /*
       * Flow: Get Grammars
       * 1. Mock lesson validation.
       * 2. Mock getGrammarsWithFilters.
       * 3. Call service.getGrammarsByLesson.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      grammarRepo.getGrammarsWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      });

      const result = await service.getGrammarsByLesson(1, {} as any);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getGrammarById', () => {
    it('should return grammar', async () => {
      /*
       * Flow: Get Grammar
       * 1. Mock grammar validation.
       * 2. Call service.getGrammarById.
       */
      grammarRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      const result = await service.getGrammarById(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateGrammar', () => {
    it('should update grammar', async () => {
      /*
       * Flow: Update Grammar
       * 1. Mock grammar validation.
       * 2. Mock updateEntity.
       * 3. Call service.updateGrammar.
       */
      grammarRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      grammarRepo.updateEntity.mockResolvedValue({
        id: 1,
        structure: 'b',
      } as any);

      const result = await service.updateGrammar(1, { structure: 'b' });
      expect(grammarRepo.updateEntity).toHaveBeenCalled();
      expect(result.structure).toBe('b');
    });
  });

  describe('deleteGrammar', () => {
    it('should delete grammar', async () => {
      /*
       * Flow: Delete Grammar
       * 1. Mock grammar validation.
       * 2. Mock deleteEntityById.
       * 3. Call service.deleteGrammar.
       */
      grammarRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      grammarRepo.deleteEntityById.mockResolvedValue(true);

      await service.deleteGrammar(1);
      expect(grammarRepo.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
