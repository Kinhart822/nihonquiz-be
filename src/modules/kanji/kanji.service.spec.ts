import { Test, TestingModule } from '@nestjs/testing';
import { KanjiService } from './kanji.service';
import { KanjiRepository } from '@database/repository/kanji.repository';

describe('KanjiService', () => {
  let service: KanjiService;
  let kanjiRepo: jest.Mocked<KanjiRepository>;

  beforeEach(async () => {
    const mockKanjiRepo = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getKanjisWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KanjiService,
        {
          provide: KanjiRepository,
          useValue: mockKanjiRepo,
        },
      ],
    }).compile();

    service = module.get(KanjiService);
    kanjiRepo = module.get(KanjiRepository);
  });

  describe('createKanji', () => {
    it('should create kanji successfully', async () => {
      /*
       * Flow: Create Kanji (Success)
       * 1. Mock kanjiRepo.createEntity to return saved data.
       * 2. Call service.createKanji.
       * 3. Verify createEntity is called.
       */
      kanjiRepo.createEntity.mockResolvedValue({ id: 1 } as any);

      const result = await service.createKanji({
        character: 'a',
        meaning: 'b',
      });
      expect(kanjiRepo.createEntity).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('getAllKanjis', () => {
    it('should return paginated kanjis', async () => {
      /*
       * Flow: Get Kanjis
       * 1. Mock getKanjisWithFilters.
       * 2. Call service.getAllKanjis.
       */
      kanjiRepo.getKanjisWithFilters.mockResolvedValue({
        entities: [],
        total: 0,
      });

      const result = await service.getAllKanjis({} as any);
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
