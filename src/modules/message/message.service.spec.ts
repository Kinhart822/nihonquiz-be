import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  ConversationStatus,
  MessageAttachmentStatus,
  MessageAttachmentType,
  MessageStatus,
  MessageType,
  ParticipantStatus,
  RoleUser,
} from '@constants/user.constant';
import { SystemConfigService } from '@modules/system-config/system-config.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationRepository } from '@repositories/conversation.repository';
import { MessageAttachmentRepository } from '@repositories/message-attachment.repository';
import { MessagePinRepository } from '@repositories/message-pin.repository';
import { MessageRepository } from '@repositories/message.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import {
  httpBadRequest,
  httpForbidden,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import { MessageService } from './message.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

describe('MessageService', () => {
  let service: MessageService;
  let messageRepository: jest.Mocked<MessageRepository>;
  let conversationRepository: jest.Mocked<ConversationRepository>;
  let participantRepository: jest.Mocked<ParticipantRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;
  let messageAttachmentRepository: jest.Mocked<MessageAttachmentRepository>;
  let messagePinRepository: jest.Mocked<MessagePinRepository>;
  let systemConfigService: jest.Mocked<SystemConfigService>;
  let fileUploadQueue: any;

  beforeEach(async () => {
    const mockMessageRepository = {
      findOne: jest.fn(),
      getConversationMessagesWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockConversationRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockParticipantRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      incrementUnreadCount: jest.fn(),
    };

    const mockSocketEmitterService = {
      emitGlobalConversationUpdate: jest.fn(),
      emitNewMessage: jest.fn(),
      emitEditMessage: jest.fn(),
      emitMarkMessageAsRead: jest.fn(),
      emitPinMessage: jest.fn(),
    };

    const mockMessageAttachmentRepository = {
      getConversationAttachmentsWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockMessagePinRepository = {
      findOne: jest.fn(),
      getPinnedMessagesWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockSystemConfigService = {
      get: jest.fn(),
    };

    const mockFileUploadQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: MessageRepository, useValue: mockMessageRepository },
        {
          provide: ConversationRepository,
          useValue: mockConversationRepository,
        },
        { provide: ParticipantRepository, useValue: mockParticipantRepository },
        { provide: SocketEmitterService, useValue: mockSocketEmitterService },
        {
          provide: MessageAttachmentRepository,
          useValue: mockMessageAttachmentRepository,
        },
        { provide: MessagePinRepository, useValue: mockMessagePinRepository },
        { provide: SystemConfigService, useValue: mockSystemConfigService },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: mockFileUploadQueue,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageRepository = module.get(MessageRepository);
    conversationRepository = module.get(ConversationRepository);
    participantRepository = module.get(ParticipantRepository);
    socketEmitterService = module.get(SocketEmitterService);
    messageAttachmentRepository = module.get(MessageAttachmentRepository);
    messagePinRepository = module.get(MessagePinRepository);
    systemConfigService = module.get(SystemConfigService);
    fileUploadQueue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Helper Validation Methods', () => {
    describe('validateConversation', () => {
      it('should throw not found if conversation does not exist', async () => {
        conversationRepository.findOne.mockResolvedValueOnce(null);
        await expect(service['validateConversation'](1)).rejects.toThrow(
          httpNotFound,
        );
      });

      it('should throw bad request if conversation is blocked', async () => {
        conversationRepository.findOne.mockResolvedValueOnce({
          id: 1,
          status: ConversationStatus.BLOCKED,
        } as any);
        await expect(service['validateConversation'](1)).rejects.toThrow(
          httpBadRequest,
        );
      });

      it('should return conversation if valid', async () => {
        const mockConv = { id: 1, status: ConversationStatus.ACTIVE };
        conversationRepository.findOne.mockResolvedValueOnce(mockConv as any);
        const result = await service['validateConversation'](1);
        expect(result).toEqual(mockConv);
      });
    });

    describe('validateParticipant', () => {
      it('should throw bad request if not participant', async () => {
        participantRepository.findOne.mockResolvedValueOnce(null);
        await expect(service['validateParticipant'](1, 1)).rejects.toThrow(
          httpBadRequest,
        );
      });

      it('should throw forbidden if participant blocked', async () => {
        participantRepository.findOne.mockResolvedValueOnce({
          status: ParticipantStatus.BLOCKED,
        } as any);
        await expect(service['validateParticipant'](1, 1)).rejects.toThrow(
          httpForbidden,
        );
      });

      it('should return participant if active', async () => {
        const mockParticipant = { status: ParticipantStatus.ACTIVE };
        participantRepository.findOne.mockResolvedValueOnce(
          mockParticipant as any,
        );
        const result = await service['validateParticipant'](1, 1);
        expect(result).toEqual(mockParticipant);
      });
    });
  });

  describe('sendMessage', () => {
    const mockConv = {
      id: 1,
      status: ConversationStatus.ACTIVE,
      lastMessageSeq: 0,
    };
    const mockParticipant = {
      id: 1,
      userId: 1,
      status: ParticipantStatus.ACTIVE,
    };

    beforeEach(() => {
      conversationRepository.findOne.mockResolvedValue({ ...mockConv } as any);
      participantRepository.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      participantRepository.find.mockResolvedValue([]);
    });

    it('should throw if no content and no files', async () => {
      await expect(
        service.sendMessage(1, { conversationId: 1, content: '' }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create text message successfully', async () => {
      const dto = { conversationId: 1, content: 'Hello' };
      const createdMessage = {
        id: 1,
        type: MessageType.TEXT,
        content: 'Hello',
        conversationId: 1,
      };
      messageRepository.create.mockReturnValue({ ...createdMessage } as any);
      messageRepository.save.mockResolvedValue({ ...createdMessage } as any);

      await service.sendMessage(1, dto);

      expect(messageRepository.save).toHaveBeenCalled();
      expect(socketEmitterService.emitNewMessage).toHaveBeenCalled();
      expect(conversationRepository.update).toHaveBeenCalled();
      expect(participantRepository.incrementUnreadCount).toHaveBeenCalled();
    });

    it('should queue file uploads if attachments provided', async () => {
      const dto = { conversationId: 1, content: 'Hello' };
      const createdMessage = {
        id: 1,
        type: MessageType.ATTACHMENT,
        content: 'Hello',
        conversationId: 1,
      };
      messageRepository.create.mockReturnValue({ ...createdMessage } as any);
      messageRepository.save.mockResolvedValue({ ...createdMessage } as any);

      const files = [
        {
          originalname: 'test.png',
          size: 100,
          buffer: Buffer.from('test'),
          mimetype: 'image/png',
        },
      ] as any;
      messageAttachmentRepository.create.mockReturnValue({ id: 1 } as any);

      await service.sendMessage(1, dto, files);

      expect(messageAttachmentRepository.save).toHaveBeenCalled();
      expect(fileUploadQueue.add).toHaveBeenCalledWith(
        FILE_UPLOAD_JOB.UPLOAD_ATTACHMENT,
        expect.any(Object),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read and emit event', async () => {
      const mockConv = {
        id: 1,
        status: ConversationStatus.ACTIVE,
        lastMessageSeq: 5,
      };
      const mockParticipant = {
        id: 1,
        userId: 1,
        status: ParticipantStatus.ACTIVE,
        user: { email: 'a@a.com' },
      };

      conversationRepository.findOne.mockResolvedValue({ ...mockConv } as any);
      participantRepository.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      participantRepository.find.mockResolvedValue([]);

      await service.markAsRead(1, { conversationId: 1 });

      expect(participantRepository.update).toHaveBeenCalledWith(
        { conversationId: 1, userId: 1 },
        { lastReadSeq: 5, unreadCount: 0 },
      );
      expect(socketEmitterService.emitMarkMessageAsRead).toHaveBeenCalled();
    });
  });

  describe('pinMessage', () => {
    it('should throw if already pinned', async () => {
      const mockMessage = { id: 1, conversationId: 1 };
      const mockParticipant = { id: 1, status: ParticipantStatus.ACTIVE };

      messageRepository.findOne.mockResolvedValue({ ...mockMessage } as any);
      participantRepository.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      messagePinRepository.findOne.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.pinMessage(1, { messageId: 1, conversationId: 1 }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should pin message', async () => {
      const mockMessage = { id: 1, conversationId: 1 };
      const mockParticipant = { id: 1, status: ParticipantStatus.ACTIVE };

      messageRepository.findOne.mockResolvedValue({ ...mockMessage } as any);
      participantRepository.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      messagePinRepository.findOne.mockResolvedValue(null);

      await service.pinMessage(1, { messageId: 1, conversationId: 1 });

      expect(messagePinRepository.create).toHaveBeenCalled();
      expect(messagePinRepository.save).toHaveBeenCalled();
      expect(socketEmitterService.emitPinMessage).toHaveBeenCalled();
    });
  });
});
