import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { LessonEntity } from './lesson.entity';

@Entity('vocabularies')
export class VocabularyEntity extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'int' })
  lessonId!: number;

  @Column({ name: 'word', type: 'varchar', length: 255 })
  word!: string;

  @Column({ name: 'reading', type: 'varchar', length: 255, nullable: true })
  reading!: string | null;

  @Column({ name: 'meaning', type: 'text' })
  meaning!: string;

  @Column({ name: 'example', type: 'text', nullable: true })
  example!: string | null;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.vocabularies)
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;
}
