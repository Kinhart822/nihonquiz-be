import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { ClassEntity } from './class.entity';
import { UserEntity } from './user.entity';

@Entity('class_announcements')
export class ClassAnnouncementEntity extends BaseEntity {
  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'author_id', type: 'int' })
  authorId!: number;

  @ManyToOne(() => ClassEntity)
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'author_id' })
  author!: UserEntity;
}
