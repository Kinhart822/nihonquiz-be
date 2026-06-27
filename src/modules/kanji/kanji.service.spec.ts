import { Test, TestingModule } from '@nestjs/testing';
import { KanjiService } from './kanji.service';
import { KanjiRepository } from '@database/repository/kanji.repository';
import { LessonRepository } from '@database/repository/lesson.repository';
import { httpErrors, httpNotFound } from '@shared/exceptions/http-exception';

describe('KanjiService', () => {
  let service: KanjiService;
  let kanjiRepo: jest.Mocked<KanjiRepository>;
  let lessonRepo: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const mockKanjiRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getKanjisWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };
    const mockLessonRepo = {
      getEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanjiService,
        {
          provide: KanjiRepository,
          useValue: mockKanjiRepo,
        },
        {
          provide: LessonRepository,
          useValue: mockLessonRepo,
        },
      ],
    }).compile();

    service = module.get(KanjiService);
    kanjiRepo = module.get(KanjiRepository);
    lessonRepo = module.get(LessonRepository);
  });

  describe('createKanji', () => {
    it('should create kanji successfully', async () => {
      /*
       * Flow: Create Kanji (Success)
       * 1. Mock lesson validation to succeed.
       * 2. Mock kanjiRepo.createEntity to return saved data.
       * 3. Call service.createKanji.
       * 4. Verify createEntity is called.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      kanjiRepo.createEntity.mockResolvedValue({ id: 1 } as any);

      const result = await service.createKanji({
        lessonId: 1,
        character: 'a',
        meaning: 'b',
      });
      expect(lessonRepo.getEntityById).toHaveBeenCalledWith(1);
      expect(kanjiRepo.createEntity).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Create Kanji (Lesson Not Found)
       * 1. Mock lesson validation to return null.
       * 2. Expect service.createKanji to throw.
       */
      lessonRepo.getEntityById.mockResolvedValue(null);
      await expect(service.createKanji({ lessonId: 1 } as any)).rejects.toThrow(
        httpNotFound,
      );
    });
  });

  describe('getKanjisByLesson', () => {
    it('should return paginated kanjis', async () => {
      /*
       * Flow: Get Kanjis
       * 1. Mock lesson validation.
       * 2. Mock getKanjisWithFilters.
       * 3. Call service.getKanjisByLesson.
       */
      lessonRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      kanjiRepo.getKanjisWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      });

      const result = await service.getKanjisByLesson(1, {} as any);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('getKanjiById', () => {
    it('should return kanji', async () => {
      /*
       * Flow: Get Kanji
       * 1. Mock kanji validation.
       * 2. Call service.getKanjiById.
       */
      kanjiRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      const result = await service.getKanjiById(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateKanji', () => {
    it('should update kanji', async () => {
      /*
       * Flow: Update Kanji
       * 1. Mock kanji validation.
       * 2. Mock updateEntity.
       * 3. Call service.updateKanji.
       */
      kanjiRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      kanjiRepo.updateEntity.mockResolvedValue({
        id: 1,
        character: 'b',
      } as any);

      const result = await service.updateKanji(1, { character: 'b' });
      expect(kanjiRepo.updateEntity).toHaveBeenCalled();
      expect(result.character).toBe('b');
    });
  });

  describe('deleteKanji', () => {
    it('should delete kanji', async () => {
      /*
       * Flow: Delete Kanji
       * 1. Mock kanji validation.
       * 2. Mock deleteEntityById.
       * 3. Call service.deleteKanji.
       */
      kanjiRepo.getEntityById.mockResolvedValue({ id: 1 } as any);
      kanjiRepo.deleteEntityById.mockResolvedValue(true);

      await service.deleteKanji(1);
      expect(kanjiRepo.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
