import { Test, TestingModule } from '@nestjs/testing';
import { KanjiController } from './kanji.controller';
import { KanjiService } from './kanji.service';

describe('KanjiController', () => {
  let controller: KanjiController;
  let service: jest.Mocked<KanjiService>;

  beforeEach(async () => {
    const mockService = {
      createKanji: jest.fn(),
      getKanjisByLesson: jest.fn(),
      getKanjiById: jest.fn(),
      updateKanji: jest.fn(),
      deleteKanji: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KanjiController],
      providers: [
        {
          provide: KanjiService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(KanjiController);
    service = module.get(KanjiService);
  });

  describe('createKanji', () => {
    it('should create kanji', async () => {
      /*
       * Flow: Create Kanji
       * 1. Mock service.createKanji.
       * 2. Call controller.createKanji.
       * 3. Verify service is called with correct DTO.
       */
      service.createKanji.mockResolvedValue({ id: 1 } as any);
      const dto: any = { character: 'test' };
      const result = await controller.createKanji(dto);
      expect(service.createKanji).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getKanjisByLesson', () => {
    it('should get kanjis', async () => {
      /*
       * Flow: Get Kanjis By Lesson
       * 1. Mock service.getKanjisByLesson.
       * 2. Call controller.getKanjisByLesson.
       * 3. Verify service is called with correct params.
       */
      service.getKanjisByLesson.mockResolvedValue({ data: [] } as any);
      const filterDto: any = {};
      const result = await controller.getKanjisByLesson('1', filterDto);
      expect(service.getKanjisByLesson).toHaveBeenCalledWith(1, filterDto);
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getKanjiById', () => {
    it('should get kanji by id', async () => {
      /*
       * Flow: Get Kanji By ID
       * 1. Mock service.getKanjiById.
       * 2. Call controller.getKanjiById.
       * 3. Verify service is called with correct ID.
       */
      service.getKanjiById.mockResolvedValue({ id: 1 } as any);
      const result = await controller.getKanjiById('1');
      expect(service.getKanjiById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateKanji', () => {
    it('should update kanji', async () => {
      /*
       * Flow: Update Kanji
       * 1. Mock service.updateKanji.
       * 2. Call controller.updateKanji.
       * 3. Verify service is called with correct ID and DTO.
       */
      service.updateKanji.mockResolvedValue({ id: 1 } as any);
      const dto: any = { character: 'test' };
      const result = await controller.updateKanji('1', dto);
      expect(service.updateKanji).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteKanji', () => {
    it('should delete kanji', async () => {
      /*
       * Flow: Delete Kanji
       * 1. Mock service.deleteKanji.
       * 2. Call controller.deleteKanji.
       * 3. Verify service is called with correct ID.
       */
      service.deleteKanji.mockResolvedValue(undefined);
      const result = await controller.deleteKanji('1');
      expect(service.deleteKanji).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });
});
