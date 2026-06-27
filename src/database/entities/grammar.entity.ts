import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { LessonEntity } from './lesson.entity';

@Entity('grammars')
export class GrammarEntity extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'int' })
  lessonId!: number;

  @Column({ name: 'structure', type: 'varchar', length: 255 })
  structure!: string;

  @Column({ name: 'meaning', type: 'text' })
  meaning!: string;

  @Column({ name: 'explanation', type: 'text', nullable: true })
  explanation!: string | null;

  @Column({ name: 'example', type: 'text', nullable: true })
  example!: string | null;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.grammars)
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;
}
