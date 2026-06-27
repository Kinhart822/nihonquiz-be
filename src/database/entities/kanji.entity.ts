import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';
import { LessonEntity } from './lesson.entity';

@Entity('kanjis')
export class KanjiEntity extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'int' })
  lessonId!: number;

  @Column({ name: 'character', type: 'varchar', length: 50 })
  character!: string;

  @Column({ name: 'onyomi', type: 'varchar', length: 255, nullable: true })
  onyomi!: string | null;

  @Column({ name: 'kunyomi', type: 'varchar', length: 255, nullable: true })
  kunyomi!: string | null;

  @Column({ name: 'meaning', type: 'text' })
  meaning!: string;

  @Column({ name: 'examples', type: 'text', nullable: true })
  examples!: string | null;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.kanjis)
  @JoinColumn({ name: 'lesson_id' })
  lesson!: LessonEntity;
}
