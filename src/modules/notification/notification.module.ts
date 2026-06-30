import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '../../shared/decorators/typeorm.module';
import { NotificationRepository } from '../../database/repository/notification.repository';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { SocketModule } from '../socket/socket.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([NotificationRepository]),
    SocketModule,
    UserModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
