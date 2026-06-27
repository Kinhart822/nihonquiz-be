import { CourseRepository } from '@database/repository/course.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { PageDto } from '@shared/dtos/page.dto';
import { httpNotFound } from '@shared/exceptions/http-exception';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let repository: jest.Mocked<CourseRepository>;

  beforeEach(async () => {
    const mockRepository = {
      getEntityById: jest.fn(),
      createEntity: jest.fn(),
      getCoursesWithFilters: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntityById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: CourseRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    repository = module.get(CourseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCourse', () => {
    it('should create and return a course', async () => {
      /*
       * Flow: Create Course
       * 1. Mock repository.createEntity to return the newly created course.
       * 2. Call service.createCourse with creation DTO.
       * 3. Verify repository is called with correct parameters.
       * 4. Verify returned entity matches expected structure.
       */
      const dto = { title: 'New Course', description: 'Desc' };
      const createdEntity = { id: 1, ...dto };
      repository.createEntity.mockResolvedValue(createdEntity as any);

      const result = await service.createCourse(dto as any);
      expect(repository.createEntity).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('getCourses', () => {
    it('should return paginated courses', async () => {
      /*
       * Flow: Get Paginated Courses
       * 1. Mock repository.getCoursesWithFilters to return data and total count.
       * 2. Call service.getCourses with filter DTO.
       * 3. Verify repository method is called with correct DTO.
       * 4. Verify result is mapped to a PageDto structure.
       */
      const filterDto = { skip: 0, take: 10 };
      const mockEntities = [{ id: 1, title: 'Course 1' }];
      repository.getCoursesWithFilters.mockResolvedValue({
        entities: mockEntities as any,
        total: 1,
      });

      const result = await service.getCourses(filterDto as any);
      expect(repository.getCoursesWithFilters).toHaveBeenCalledWith(filterDto);
      expect(result).toBeInstanceOf(PageDto);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getCourseById', () => {
    it('should throw NOT_FOUND if course does not exist', async () => {
      /*
       * Flow: Get Course Info (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.getCourseById with an invalid ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.getCourseById(999)).rejects.toThrow(httpNotFound);
    });

    it('should return course if it exists', async () => {
      /*
       * Flow: Get Course Info (Success)
       * 1. Mock repository.getEntityById to return a course entity.
       * 2. Call service.getCourseById with a valid ID.
       * 3. Verify repository is called with correct ID.
       */
      const mockEntity = { id: 1, name: 'Course' };
      repository.getEntityById.mockResolvedValue(mockEntity as any);

      const result = await service.getCourseById(1);
      expect(repository.getEntityById).toHaveBeenCalledWith(1);
      expect(result.id).toBe(1);
    });
  });

  describe('updateCourse', () => {
    it('should throw NOT_FOUND if course does not exist', async () => {
      /*
       * Flow: Update Course (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.updateCourse with a non-existent ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.updateCourse(999, {})).rejects.toThrow(httpNotFound);
    });

    it('should update and return the course', async () => {
      /*
       * Flow: Update Course (Success)
       * 1. Mock repository.getEntityById to return existing course.
       * 2. Mock repository.updateEntity to return updated course.
       * 3. Call service.updateCourse with ID and update DTO.
       * 4. Verify repository methods are called properly.
       */
      const mockEntity = { id: 1, name: 'Old Title' };
      const updatedEntity = { id: 1, name: 'New Title' };
      const dto = { name: 'New Title' };

      repository.getEntityById.mockResolvedValue(mockEntity as any);
      repository.updateEntity.mockResolvedValue(updatedEntity as any);

      const result = await service.updateCourse(1, dto);
      expect(repository.getEntityById).toHaveBeenCalledWith(1);
      expect(repository.updateEntity).toHaveBeenCalledWith(mockEntity, dto);
      expect(result).toBeDefined();
    });
  });

  describe('deleteCourse', () => {
    it('should throw NOT_FOUND if course does not exist', async () => {
      /*
       * Flow: Delete Course (Not Found)
       * 1. Mock repository.getEntityById to return null.
       * 2. Call service.deleteCourse with a non-existent ID.
       * 3. Verify NOT_FOUND exception is thrown.
       */
      repository.getEntityById.mockResolvedValue(null);

      await expect(service.deleteCourse(999)).rejects.toThrow(httpNotFound);
    });

    it('should delete the course', async () => {
      /*
       * Flow: Delete Course (Success)
       * 1. Mock repository.getEntityById to return a course.
       * 2. Mock repository.deleteEntityById to resolve successfully.
       * 3. Call service.deleteCourse with course ID.
       * 4. Verify repository.deleteEntityById is called with correct ID.
       */
      repository.getEntityById.mockResolvedValue({ id: 1 } as any);
      repository.deleteEntityById.mockResolvedValue(true);

      await service.deleteCourse(1);
      expect(repository.deleteEntityById).toHaveBeenCalledWith(1);
    });
  });
});
