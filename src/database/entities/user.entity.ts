import { Column, Entity, OneToMany } from 'typeorm';
import { ParticipantEntity } from './participant.entity';
import { ClassEntity } from './class.entity';
import { ClassStudentEntity } from './class-student.entity';
import {
  AccessMethod,
  RoleUser,
  UserStatus,
} from '../../constants/user.constant';
import { BaseEntity } from '../../shared/base-entity';
import { TestAttemptEntity } from './test-attempt.entity';
import { AssignmentSubmissionEntity } from './assignment-submission.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ default: '' })
  email!: string;

  @Column({ name: 'password', type: 'varchar', nullable: true })
  password!: string | null;

  @Column({ name: 'username', type: 'varchar', nullable: true, unique: true })
  username!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'background_url', type: 'varchar', nullable: true })
  backgroundUrl!: string | null;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ name: 'status', type: 'enum', enum: UserStatus, nullable: false })
  status!: UserStatus;

  @Column({
    name: 'access_method',
    type: 'enum',
    enum: AccessMethod,
    nullable: false,
  })
  accessMethod!: AccessMethod;

  @Column({ name: 'google_id', type: 'varchar', nullable: true })
  googleId!: string | null;

  @Column({
    name: 'role',
    type: 'enum',
    enum: RoleUser,
    default: RoleUser.STUDENT,
  })
  role!: RoleUser;

  @OneToMany(() => ParticipantEntity, (participant) => participant.user)
  participants!: ParticipantEntity[];

  @OneToMany(() => TestAttemptEntity, (attempt) => attempt.user)
  testAttempts!: TestAttemptEntity[];

  @OneToMany(
    () => AssignmentSubmissionEntity,
    (submission: AssignmentSubmissionEntity) => submission.student,
  )
  assignmentSubmissions!: AssignmentSubmissionEntity[];

  @OneToMany(() => ClassEntity, (classObj: ClassEntity) => classObj.teacher)
  classesTaught!: ClassEntity[];

  @OneToMany(
    () => ClassStudentEntity,
    (classStudent: ClassStudentEntity) => classStudent.student,
  )
  classesEnrolled!: ClassStudentEntity[];
}
