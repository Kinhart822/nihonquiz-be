import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import {
  SendMessageDto,
  EditMessageDto,
  MarkAsReadDto,
  PinMessageDto,
  UnpinMessageDto,
} from './dtos/message.req.dto';

describe('MessageController', () => {
  let controller: MessageController;
  let messageService: jest.Mocked<MessageService>;

  beforeEach(async () => {
    const mockMessageService = {
      getConversationMessages: jest.fn(),
      getMessageInfo: jest.fn(),
      getConversationAttachments: jest.fn(),
      getPinnedMessages: jest.fn(),
      sendMessage: jest.fn(),
      editMessage: jest.fn(),
      markAsRead: jest.fn(),
      pinMessage: jest.fn(),
      unpinMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [{ provide: MessageService, useValue: mockMessageService }],
    }).compile();

    controller = module.get<MessageController>(MessageController);
    messageService = module.get(MessageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getListByConversationId', () => {
    it('should call getConversationMessages', async () => {
      messageService.getConversationMessages.mockResolvedValue({} as any);
      const user = { id: 1 };
      const filter = { skip: 0 };
      const result = await controller.getListByConversationId(
        user as any,
        filter as any,
        '1',
      );
      expect(messageService.getConversationMessages).toHaveBeenCalledWith(
        1,
        filter,
        user,
      );
      expect(result).toEqual({});
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessage with files', async () => {
      const mockResult = { id: 1 };
      messageService.sendMessage.mockResolvedValue(mockResult as any);
      const user = { id: 1 };
      const dto: SendMessageDto = { conversationId: 1, content: 'test' };
      const files = [{ originalname: 'file.png' }] as any;

      const result = await controller.sendMessage(user as any, dto, files);

      expect(messageService.sendMessage).toHaveBeenCalledWith(1, dto, files);
      expect(result).toEqual(mockResult);
    });
  });

  describe('editMessage', () => {
    it('should call editMessage', async () => {
      const mockResult = { id: 1 };
      messageService.editMessage.mockResolvedValue(mockResult as any);
      const user = { id: 1 };
      const dto: EditMessageDto = {
        conversationId: 1,
        messageId: 1,
        content: 'edit',
      };

      const result = await controller.editMessage(user as any, dto, undefined);

      expect(messageService.editMessage).toHaveBeenCalledWith(
        1,
        dto,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('markAsRead', () => {
    it('should call markAsRead', async () => {
      messageService.markAsRead.mockResolvedValue(true);
      const user = { id: 1 };
      const dto: MarkAsReadDto = { conversationId: 1 };

      const result = await controller.markAsRead(user as any, dto);

      expect(messageService.markAsRead).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(true);
    });
  });

  describe('pinMessage', () => {
    it('should call pinMessage', async () => {
      messageService.pinMessage.mockResolvedValue(true);
      const user = { id: 1 };
      const dto: PinMessageDto = { messageId: 1, conversationId: 1 };

      const result = await controller.pinMessage(user as any, dto);

      expect(messageService.pinMessage).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(true);
    });
  });

  describe('unpinMessage', () => {
    it('should call unpinMessage', async () => {
      messageService.unpinMessage.mockResolvedValue(true);
      const user = { id: 1 };
      const dto: UnpinMessageDto = { messageId: 1, conversationId: 1 };

      const result = await controller.unpinMessage(user as any, dto);

      expect(messageService.unpinMessage).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(true);
    });
  });
});
