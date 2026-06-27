import { Test, TestingModule } from '@nestjs/testing';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';

describe('LessonController', () => {
  let controller: LessonController;
  let service: jest.Mocked<LessonService>;

  beforeEach(async () => {
    const mockService = {
      createLesson: jest.fn(),
      getLessons: jest.fn(),
      getLessonById: jest.fn(),
      updateLesson: jest.fn(),
      deleteLesson: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [
        {
          provide: LessonService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LessonController>(LessonController);
    service = module.get(LessonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createLesson', () => {
    it('should call createLesson on service', async () => {
      /*
       * Flow: Create Lesson
       * 1. Mock service.createLesson to return a new lesson object.
       * 2. Call controller.createLesson with creation DTO.
       * 3. Verify service method is called with correct parameters.
       */
      const mockResult = { id: 1 };
      service.createLesson.mockResolvedValue(mockResult as any);

      const dto = { title: 'New Lesson', courseId: 1 };
      const result = await controller.createLesson(dto as any);
      expect(service.createLesson).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLessons', () => {
    it('should call getLessons on service', async () => {
      /*
       * Flow: Get Paginated Lessons
       * 1. Mock service.getLessons to return a paginated result.
       * 2. Call controller.getLessons with course ID and filter DTO.
       * 3. Verify service method is called with parsed course ID and correct DTO.
       */
      const mockResult = { data: [], meta: {} };
      service.getLessons.mockResolvedValue(mockResult as any);

      const filter = { skip: 0, take: 10 };
      const result = await controller.getLessons('1', filter as any);
      expect(service.getLessons).toHaveBeenCalledWith(1, filter);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getLessonById', () => {
    it('should call getLessonById on service', async () => {
      /*
       * Flow: Get Lesson Info
       * 1. Mock service.getLessonById to return lesson details.
       * 2. Call controller.getLessonById with string ID.
       * 3. Verify service method is called with converted numeric ID.
       */
      const mockResult = { id: 1 };
      service.getLessonById.mockResolvedValue(mockResult as any);

      const result = await controller.getLessonById('1');
      expect(service.getLessonById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('updateLesson', () => {
    it('should call updateLesson on service', async () => {
      /*
       * Flow: Update Lesson
       * 1. Mock service.updateLesson to return updated lesson.
       * 2. Call controller.updateLesson with string ID and update DTO.
       * 3. Verify service method is called with numeric ID and correct DTO.
       */
      const mockResult = { id: 1 };
      service.updateLesson.mockResolvedValue(mockResult as any);

      const dto = { title: 'Updated' };
      const result = await controller.updateLesson('1', dto as any);
      expect(service.updateLesson).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteLesson', () => {
    it('should call deleteLesson on service', async () => {
      /*
       * Flow: Delete Lesson
       * 1. Mock service.deleteLesson to return undefined (success).
       * 2. Call controller.deleteLesson with string ID.
       * 3. Verify service method is called with numeric ID.
       */
      service.deleteLesson.mockResolvedValue(undefined);

      const result = await controller.deleteLesson('1');
      expect(service.deleteLesson).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });
});
