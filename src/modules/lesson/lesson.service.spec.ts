import { LessonRepository } from '@database/repository/lesson.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { PageDto } from '@shared/dtos/page.dto';
import { httpNotFound } from '@shared/exceptions/http-exception';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
  let service: LessonService;
  let repository: jest.Mocked<LessonRepository>;

  beforeEach(async () => {
    const mockRepository = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getLessonsWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: LessonRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LessonService>(LessonService);
    repository = module.get(LessonRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLesson', () => {
    it('should create and return a lesson', async () => {
      /*
       * Flow: Create Lesson
       * 1. Mock repository.createEntity to return the new lesson.
       * 2. Call service.createLesson with creation DTO.
       * 3. Verify repository is called with correct parameters.
       * 4. Verify returned entity matches expected structure.
       */
      const dto = { name: 'New Lesson', courseId: 1 } as any;
      const createdEntity = { id: 1, ...dto };
      repository.createEntity.mockResolvedValue(createdEntity as any);

      const result = await service.createLesson(dto as any);
      expect(repository.createEntity).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('getLessons', () => {
    it('should return paginated lessons', async () => {
      /*
       * Flow: Get Paginated Lessons
       * 1. Mock repository.getLessonsWithFilters to return data and total count.
       * 2. Call service.getLessons with course ID and filter DTO.
       * 3. Verify repository method is called with correct DTO.
       * 4. Verify result is mapped to a PageDto structure.
       */
      const filterDto = { skip: 0, take: 10 };
      const mockEntities = [{ id: 1, name: 'Lesson 1' }];
      repository.getLessonsWithFilters.mockResolvedValue({
        entities: mockEntities as any,
        total: 1,
      });

      const result = await service.getLessons(1, filterDto as any);
      expect(repository.getLessonsWithFilters).toHaveBeenCalledWith(
        1,
        filterDto,
      );
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getLessonById', () => {
    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Get Lesson Info (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.getLessonById with an invalid ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.getLessonById(999)).rejects.toThrow(httpNotFound);
    });

    it('should return lesson if it exists', async () => {
      /*
       * Flow: Get Lesson Info (Success)
       * 1. Mock repository.getEntityById to return a lesson entity.
       * 2. Call service.getLessonById with a valid ID.
       * 3. Verify repository is called with correct ID.
       */
      const mockEntity = { id: 1, name: 'Lesson' };
      repository.getEntityById.mockResolvedValue(mockEntity as any);

      const result = await service.getLessonById(1);
      expect(repository.getEntityById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateLesson', () => {
    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Update Lesson (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.updateLesson with a non-existent ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.updateLesson(999, {})).rejects.toThrow(httpNotFound);
    });

    it('should update and return the lesson', async () => {
      /*
       * Flow: Update Lesson (Success)
       * 1. Mock repository.getEntityById to return existing lesson.
       * 2. Mock repository.updateEntity to return updated lesson.
       * 3. Call service.updateLesson with ID and update DTO.
       * 4. Verify repository methods are called properly.
       */
      const mockEntity = { id: 1, name: 'Old Title' };
      const updatedEntity = { id: 1, name: 'New Title' };
      const dto = { name: 'New Title' };

      repository.getEntityById.mockResolvedValue(mockEntity as any);
      repository.updateEntity.mockResolvedValue(updatedEntity as any);

      const result = await service.updateLesson(1, dto);
      expect(repository.getEntityById).toHaveBeenCalledWith(1);
      expect(repository.updateEntity).toHaveBeenCalledWith(mockEntity, dto);
      expect(result).toBeDefined();
    });
  });

  describe('deleteLesson', () => {
    it('should throw NOT_FOUND if lesson does not exist', async () => {
      /*
       * Flow: Delete Lesson (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.deleteLesson with a non-existent ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.deleteLesson(999)).rejects.toThrow(httpNotFound);
    });

    it('should delete the lesson', async () => {
      /*
       * Flow: Delete Lesson (Success)
       * 1. Mock repository.getEntityById to return a lesson.
       * 2. Mock repository.deleteEntityById to resolve successfully.
       * 3. Call service.deleteLesson with lesson ID.
       * 4. Verify repository.deleteEntityById is called with correct ID.
       */
      repository.getEntityById.mockResolvedValue({ id: 1 } as any);
      repository.deleteEntityById.mockResolvedValue(undefined);

      await service.deleteLesson(1);
      expect(repository.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
