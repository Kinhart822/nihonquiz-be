import { Test, TestingModule } from '@nestjs/testing';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

describe('GrammarController', () => {
  let controller: GrammarController;
  let service: jest.Mocked<GrammarService>;

  beforeEach(async () => {
    const mockService = {
      createGrammar: jest.fn(),
      getGrammarsByLesson: jest.fn(),
      getGrammarById: jest.fn(),
      updateGrammar: jest.fn(),
      deleteGrammar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrammarController],
      providers: [
        {
          provide: GrammarService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(GrammarController);
    service = module.get(GrammarService);
  });

  describe('createGrammar', () => {
    it('should create grammar', async () => {
      /*
       * Flow: Create Grammar
       * 1. Mock service.createGrammar.
       * 2. Call controller.createGrammar.
       * 3. Verify service is called with correct DTO.
       */
      service.createGrammar.mockResolvedValue({ id: 1 } as any);
      const dto: any = { structure: 'test' };
      const result = await controller.createGrammar(dto);
      expect(service.createGrammar).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('getGrammarsByLesson', () => {
    it('should get grammars', async () => {
      /*
       * Flow: Get Grammars By Lesson
       * 1. Mock service.getGrammarsByLesson.
       * 2. Call controller.getGrammarsByLesson.
       * 3. Verify service is called with correct params.
       */
      service.getGrammarsByLesson.mockResolvedValue({ data: [] } as any);
      const filterDto: any = {};
      const result = await controller.getGrammarsByLesson('1', filterDto);
      expect(service.getGrammarsByLesson).toHaveBeenCalledWith(1, filterDto);
      expect(result).toEqual({ data: [] });
    });
  });

  describe('getGrammarById', () => {
    it('should get grammar by id', async () => {
      /*
       * Flow: Get Grammar By ID
       * 1. Mock service.getGrammarById.
       * 2. Call controller.getGrammarById.
       * 3. Verify service is called with correct ID.
       */
      service.getGrammarById.mockResolvedValue({ id: 1 } as any);
      const result = await controller.getGrammarById('1');
      expect(service.getGrammarById).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('updateGrammar', () => {
    it('should update grammar', async () => {
      /*
       * Flow: Update Grammar
       * 1. Mock service.updateGrammar.
       * 2. Call controller.updateGrammar.
       * 3. Verify service is called with correct ID and DTO.
       */
      service.updateGrammar.mockResolvedValue({ id: 1 } as any);
      const dto: any = { structure: 'test' };
      const result = await controller.updateGrammar('1', dto);
      expect(service.updateGrammar).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteGrammar', () => {
    it('should delete grammar', async () => {
      /*
       * Flow: Delete Grammar
       * 1. Mock service.deleteGrammar.
       * 2. Call controller.deleteGrammar.
       * 3. Verify service is called with correct ID.
       */
      service.deleteGrammar.mockResolvedValue(undefined);
      const result = await controller.deleteGrammar('1');
      expect(service.deleteGrammar).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });
});
