import { Test, TestingModule } from '@nestjs/testing';
import { VocabularyService } from './vocabulary.service';
import { VocabularyRepository } from '@database/repository/vocabulary.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';

describe('VocabularyService', () => {
  let service: VocabularyService;
  let vocabularyRepo: jest.Mocked<VocabularyRepository>;
  let lessonRepo: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const mockVocabRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getVocabulariesWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };
    const mockLessonRepo = {
      getEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        {
          provide: VocabularyRepository,
          useValue: mockVocabRepo,
        },
        {
          provide: LessonRepository,
          useValue: mockLessonRepo,
        },
      ],
    }).compile();

    service = module.get(VocabularyService);
    vocabularyRepo = module.get(VocabularyRepository);
    lessonRepo = module.get(LessonRepository);
  });

  describe('createVocabulary', () => {
    it('should create vocabulary successfully', async () => {
      /*
       * Flow: Create Vocabulary (Success)
       * 1. Mock lesson validation to succeed.
       * 2. Mock vocabularyRepo.createEntity to return saved data.
       * 3. Call service.createVocabulary.
       * 4. Verify createEntity is called.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      vocabularyRepo.createEntity.mockResolvedValue({ id: 1 } as any);

      const result = await service.createVocabulary({
        lessonId: 1,
        word: 'a',
        meaning: 'b',
      });
      expect(lessonRepo.getEntityById).toHaveBeenCalledWith(1);
      expect(vocabularyRepo.createEntity).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Create Vocabulary (Lesson Not Found)
       * 1. Mock lesson validation to return null.
       * 2. Expect service.createVocabulary to throw.
       */
      lessonRepo.getEntityById.mockResolvedValue(null);
      await expect(
        service.createVocabulary({ lessonId: 1 } as any),
      ).rejects.toThrow(httpNotFound);
    });
  });

  describe('getVocabulariesByLesson', () => {
    it('should return paginated vocabularies', async () => {
      /*
       * Flow: Get Vocabularies
       * 1. Mock lesson validation.
       * 2. Mock getVocabulariesWithFilters.
       * 3. Call service.getVocabulariesByLesson.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      vocabularyRepo.getVocabulariesWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      });

      const result = await service.getVocabulariesByLesson(1, {} as any);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getVocabularyById', () => {
    it('should return vocabulary', async () => {
      /*
       * Flow: Get Vocabulary
       * 1. Mock vocabulary validation.
       * 2. Call service.getVocabularyById.
       */
      vocabularyRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      const result = await service.getVocabularyById(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateVocabulary', () => {
    it('should update vocabulary', async () => {
      /*
       * Flow: Update Vocabulary
       * 1. Mock vocabulary validation.
       * 2. Mock updateEntity.
       * 3. Call service.updateVocabulary.
       */
      vocabularyRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      vocabularyRepo.updateEntity.mockResolvedValue({
        id: 1,
        word: 'b',
      } as any);

      const result = await service.updateVocabulary(1, { word: 'b' });
      expect(vocabularyRepo.updateEntity).toHaveBeenCalled();
      expect(result.word).toBe('b');
    });
  });

  describe('deleteVocabulary', () => {
    it('should delete vocabulary', async () => {
      /*
       * Flow: Delete Vocabulary
       * 1. Mock vocabulary validation.
       * 2. Mock deleteEntityById.
       * 3. Call service.deleteVocabulary.
       */
      vocabularyRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      vocabularyRepo.deleteEntityById.mockResolvedValue(true);

      await service.deleteVocabulary(1);
      expect(vocabularyRepo.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
