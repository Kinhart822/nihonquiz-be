import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base-entity';

@Entity('kanjis')
export class KanjiEntity extends BaseEntity {
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
}
