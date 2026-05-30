import { SocketEvent } from '@constants/socket.constant';

export class SocketEventDto {
  data!: any;
  event!: SocketEvent;
}
