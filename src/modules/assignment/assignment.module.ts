import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { AssignmentAttachmentRepository } from '@database/repository/assignment-attachment.repository';
import { AssignmentSubmissionAttachmentRepository } from '@database/repository/assignment-submission-attachment.repository';
import { AssignmentSubmissionRepository } from '@database/repository/assignment-submission.repository';
import { AssignmentRepository } from '@database/repository/assignment.repository';
import { ClassRepository } from '@database/repository/class.repository';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      AssignmentRepository,
      AssignmentSubmissionRepository,
      ClassRepository,
      AssignmentAttachmentRepository,
      AssignmentSubmissionAttachmentRepository,
    ]),
    BullModule.registerQueue({
      name: FILE_UPLOAD_QUEUE,
    }),
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
