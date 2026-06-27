import { AdminClassService } from './services/admin-class.service';
import { StudentClassService } from './services/student-class.service';
import { TeacherClassService } from './services/teacher-class.service';
import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { ClassRepository } from '@repositories/class.repository';
import { ClassStudentRepository } from '@repositories/class-student.repository';
import { UserRepository } from '@repositories/user.repository';
import { ClassAnnouncementRepository } from '@repositories/class-announcement.repository';
import { ClassScheduleRepository } from '@repositories/class-schedule.repository';
import { AdminClassController } from './controllers/admin-class.controller';
import { StudentClassController } from './controllers/student-class.controller';
import { TeacherClassController } from './controllers/teacher-class.controller';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      ClassRepository,
      ClassStudentRepository,
      UserRepository,
      ClassAnnouncementRepository,
      ClassScheduleRepository,
    ]),
  ],
  controllers: [
    AdminClassController,
    StudentClassController,
    TeacherClassController,
  ],
  providers: [AdminClassService, StudentClassService, TeacherClassService],
  exports: [AdminClassService, StudentClassService, TeacherClassService],
})
export class ClassModule {}
