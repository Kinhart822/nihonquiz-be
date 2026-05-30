import { FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import { CloudinaryModule } from '@modules/cloudinary/cloudinary.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { UserRepository } from '@repositories/user.repository';
import { TypeOrmExModule } from '@shared/decorators/typeorm.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([UserRepository]),
    CloudinaryModule,
    BullModule.registerQueue({
      name: FILE_UPLOAD_QUEUE,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
