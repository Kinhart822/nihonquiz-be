import { Test, TestingModule } from '@nestjs/testing';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyController', () => {
  let controller: VocabularyController;
  let service: jest.Mocked<VocabularyService>;

  beforeEach(async () => {
    const mockService = {
      createVocabulary: jest.fn(),
      getVocabulariesByLesson: jest.fn(),
      getVocabularyById: jest.fn(),
      updateVocabulary: jest.fn(),
      deleteVocabulary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabularyController],
      providers: [
        {
          provide: VocabularyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(VocabularyController);
    service = module.get(VocabularyService);
  });

  describe('createVocabulary', () => {
    it('should create vocabulary', async () => {
      /*
       * Flow: Create Vocabulary
       * 1. Mock service.createVocabulary.
       * 2. Call controller.createVocabulary.
       * 3. Verify service is called with correct DTO.
       */
      service.createVocabulary.mockResolvedValue({ id: 1 } as any);
      const dto: any = { word: 'test' };
      const result = await controller.createVocabulary(dto);
      expect(service.createVocabulary).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getVocabulariesByLesson', () => {
    it('should get vocabularies', async () => {
      /*
       * Flow: Get Vocabularies By Lesson
       * 1. Mock service.getVocabulariesByLesson.
       * 2. Call controller.getVocabulariesByLesson.
       * 3. Verify service is called with correct params.
       */
      service.getVocabulariesByLesson.mockResolvedValue({ data: [] } as any);
      const filterDto: any = {};
      const result = await controller.getVocabulariesByLesson('1', filterDto);
      expect(service.getVocabulariesByLesson).toHaveBeenCalledWith(
        1,
        filterDto,
      );
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getVocabularyById', () => {
    it('should get vocabulary by id', async () => {
      /*
       * Flow: Get Vocabulary By ID
       * 1. Mock service.getVocabularyById.
       * 2. Call controller.getVocabularyById.
       * 3. Verify service is called with correct ID.
       */
      service.getVocabularyById.mockResolvedValue({ id: 1 } as any);
      const result = await controller.getVocabularyById('1');
      expect(service.getVocabularyById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateVocabulary', () => {
    it('should update vocabulary', async () => {
      /*
       * Flow: Update Vocabulary
       * 1. Mock service.updateVocabulary.
       * 2. Call controller.updateVocabulary.
       * 3. Verify service is called with correct ID and DTO.
       */
      service.updateVocabulary.mockResolvedValue({ id: 1 } as any);
      const dto: any = { word: 'test' };
      const result = await controller.updateVocabulary('1', dto);
      expect(service.updateVocabulary).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteVocabulary', () => {
    it('should delete vocabulary', async () => {
      /*
       * Flow: Delete Vocabulary
       * 1. Mock service.deleteVocabulary.
       * 2. Call controller.deleteVocabulary.
       * 3. Verify service is called with correct ID.
       */
      service.deleteVocabulary.mockResolvedValue(undefined);
      const result = await controller.deleteVocabulary('1');
      expect(service.deleteVocabulary).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });
});
