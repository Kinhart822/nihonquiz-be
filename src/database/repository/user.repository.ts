import { Order } from '@constants/pagination.constant';
import { RoleUser } from '@constants/user.constant';
import { UserEntity } from '@entities/user.entity';
import { UserFilterDto } from '@modules/user/dtos/user.req.dto';
import { CustomRepository } from '@shared/decorators/typeorm.decorator';
import { BaseRepository } from './base.repository';

@CustomRepository(UserEntity)
export class UserRepository extends BaseRepository<UserEntity> {
  async getUserListByFilter(
    filterDto: UserFilterDto,
    options?: {
      isAdmin: boolean;
      isTeacher: boolean;
      isStudent: boolean;
    },
  ): Promise<{ entities: UserEntity[]; total: number }> {
    const { keyword, statuses, direction } = filterDto;
    let role = RoleUser.STUDENT;

    if (options?.isAdmin) {
      role = RoleUser.ADMIN;
    } else if (options?.isTeacher) {
      role = RoleUser.TEACHER;
    }

    const queryBuilder = this.createQueryBuilder('user').where(
      'user.role = :role',
      { role },
    );

    if (statuses) {
      queryBuilder.andWhere('user.status IN (:...statuses)', { statuses });
    }

    if (keyword) {
      queryBuilder.andWhere(
        'user.email ILIKE :keyword OR user.username ILIKE :keyword',
        {
          keyword: `%${keyword}%`,
        },
      );
    }

    queryBuilder
      .orderBy('user.createdAt', direction || Order.DESC)
      .skip(filterDto.skip)
      .take(filterDto.limit);

    const [entities, total] = await queryBuilder.getManyAndCount();
    return { entities, total };
  }
}
