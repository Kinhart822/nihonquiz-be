import { ClassService } from './class.service';
import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { ClassRepository } from '@repositories/class.repository';
import { ClassStudentRepository } from '@repositories/class-student.repository';
import { UserRepository } from '@repositories/user.repository';
import { ClassAnnouncementRepository } from '@repositories/class-announcement.repository';
import { ClassScheduleRepository } from '@repositories/class-schedule.repository';
import { ClassController } from './class.controller';

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
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
