import { Module } from '@nestjs/common';
import { ClassAnnouncementRepository } from '@repositories/class-announcement.repository';
import { ClassScheduleRepository } from '@repositories/class-schedule.repository';
import { ClassStudentRepository } from '@repositories/class-student.repository';
import { ClassRepository } from '@repositories/class.repository';
import { UserRepository } from '@repositories/user.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { NotificationModule } from '../notification/notification.module';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      ClassRepository,
      ClassStudentRepository,
      UserRepository,
      ClassAnnouncementRepository,
      ClassScheduleRepository,
    ]),
    NotificationModule,
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
