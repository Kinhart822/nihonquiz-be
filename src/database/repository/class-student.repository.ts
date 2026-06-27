import { ClassStudentEntity } from '@entities/class-student.entity';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';
import {
  ClassStudentFilterDto,
  GetMyClassesQueryDto,
} from '@modules/class/dtos/class.req.dto';
import { Order } from '@constants/pagination.constant';

@CustomRepository(ClassStudentEntity)
export class ClassStudentRepository extends BaseRepository<ClassStudentEntity> {
  async getStudentsWithFilters(
    classId: number,
    filterDto: ClassStudentFilterDto,
  ): Promise<{ entities: ClassStudentEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('classStudent');

    queryBuilder.leftJoinAndSelect('classStudent.student', 'student');

    queryBuilder.where('classStudent.classId = :classId', { classId });

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(student.email LIKE :search OR student.username LIKE :search)',
        {
          search: `%${filterDto.search}%`,
        },
      );
    }

    if (filterDto.status) {
      queryBuilder.andWhere('classStudent.status = :status', {
        status: filterDto.status,
      });
    }

    queryBuilder
      .orderBy('classStudent.createdAt', filterDto.direction || Order.DESC)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }

  async getMyClassesWithFilters(
    studentId: number,
    filterDto: GetMyClassesQueryDto,
  ): Promise<{ entities: ClassStudentEntity[]; total: number }> {
    const queryBuilder = this.createQueryBuilder('classStudent');
    queryBuilder.innerJoinAndSelect('classStudent.class', 'class');

    queryBuilder.where('classStudent.studentId = :studentId', { studentId });

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(class.name LIKE :search OR class.code LIKE :search)',
        {
          search: `%${filterDto.search}%`,
        },
      );
    }

    queryBuilder
      .orderBy('class.createdAt', filterDto.direction || Order.DESC)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
