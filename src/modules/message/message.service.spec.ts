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
  let messageRepo: jest.Mocked<MessageRepository>;
  let conversationRepo: jest.Mocked<ConversationRepository>;
  let participantRepo: jest.Mocked<ParticipantRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;
  let messageAttachmentRepo: jest.Mocked<MessageAttachmentRepository>;
  let messagePinRepo: jest.Mocked<MessagePinRepository>;
  let systemConfigService: jest.Mocked<SystemConfigService>;
  let fileUploadQueue: any;

  beforeEach(async () => {
    const mockMessageRepo = {
      findOne: jest.fn(),
      getConversationMessagesWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockConversationRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const mockParticipantRepo = {
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

    const mockMessageAttachmentRepo = {
      getConversationAttachmentsWithFilters: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockMessagePinRepo = {
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
        { provide: MessageRepository, useValue: mockMessageRepo },
        {
          provide: ConversationRepository,
          useValue: mockConversationRepo,
        },
        { provide: ParticipantRepository, useValue: mockParticipantRepo },
        { provide: SocketEmitterService, useValue: mockSocketEmitterService },
        {
          provide: MessageAttachmentRepository,
          useValue: mockMessageAttachmentRepo,
        },
        { provide: MessagePinRepository, useValue: mockMessagePinRepo },
        { provide: SystemConfigService, useValue: mockSystemConfigService },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: mockFileUploadQueue,
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageRepo = module.get(MessageRepository);
    conversationRepo = module.get(ConversationRepository);
    participantRepo = module.get(ParticipantRepository);
    socketEmitterService = module.get(SocketEmitterService);
    messageAttachmentRepo = module.get(MessageAttachmentRepository);
    messagePinRepo = module.get(MessagePinRepository);
    systemConfigService = module.get(SystemConfigService);
    fileUploadQueue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Helper Validation Methods', () => {
    describe('validateConversation', () => {
      it('should throw not found if conversation does not exist', async () => {
        /*
         * Flow: Validate Conversation (Not Found)
         * 1. Attempt to fetch conversation from DB.
         * 2. If null, throw NotFound exception.
         */
        conversationRepo.findOne.mockResolvedValueOnce(null);
        await expect(service['validateConversation'](1)).rejects.toThrow(
          httpNotFound,
        );
      });

      it('should throw bad request if conversation is blocked', async () => {
        /*
         * Flow: Validate Conversation (Blocked)
         * 1. Fetch conversation.
         * 2. If status is BLOCKED, throw BadRequest exception.
         */
        conversationRepo.findOne.mockResolvedValueOnce({
          id: 1,
          status: ConversationStatus.BLOCKED,
        } as any);
        await expect(service['validateConversation'](1)).rejects.toThrow(
          httpBadRequest,
        );
      });

      it('should return conversation if valid', async () => {
        /*
         * Flow: Validate Conversation (Success)
         * 1. Fetch conversation.
         * 2. Ensure it exists and is ACTIVE.
         * 3. Return the conversation entity.
         */
        const mockConv = { id: 1, status: ConversationStatus.ACTIVE };
        conversationRepo.findOne.mockResolvedValueOnce(mockConv as any);
        const result = await service['validateConversation'](1);
        expect(result).toEqual(mockConv);
      });
    });

    describe('validateParticipant', () => {
      it('should throw bad request if not participant', async () => {
        /*
         * Flow: Validate Participant (Not Found)
         * 1. Attempt to fetch participant link between user and conversation.
         * 2. If null, throw BadRequest exception.
         */
        participantRepo.findOne.mockResolvedValueOnce(null);
        await expect(service['validateParticipant'](1, 1)).rejects.toThrow(
          httpBadRequest,
        );
      });

      it('should throw forbidden if participant blocked', async () => {
        /*
         * Flow: Validate Participant (Blocked)
         * 1. Fetch participant record.
         * 2. If participant status is BLOCKED, throw Forbidden exception.
         */
        participantRepo.findOne.mockResolvedValueOnce({
          status: ParticipantStatus.BLOCKED,
        } as any);
        await expect(service['validateParticipant'](1, 1)).rejects.toThrow(
          httpForbidden,
        );
      });

      it('should return participant if active', async () => {
        /*
         * Flow: Validate Participant (Success)
         * 1. Fetch participant record.
         * 2. Ensure it exists and is ACTIVE.
         * 3. Return the participant entity.
         */
        const mockParticipant = { status: ParticipantStatus.ACTIVE };
        participantRepo.findOne.mockResolvedValueOnce(mockParticipant as any);
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
      conversationRepo.findOne.mockResolvedValue({ ...mockConv } as any);
      participantRepo.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      participantRepo.find.mockResolvedValue([]);
    });

    it('should throw if no content and no files', async () => {
      /*
       * Flow: Send Message (Validation Error)
       * 1. Verify message payload.
       * 2. If content is empty AND there are no attachments, throw BadRequest exception.
       */
      await expect(
        service.sendMessage(1, { conversationId: 1, content: '' }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create text message successfully', async () => {
      /*
       * Flow: Send Text Message
       * 1. Validate conversation and participant.
       * 2. Create Message entity with TEXT type.
       * 3. Save message to DB.
       * 4. Update Conversation's lastMessageSeq.
       * 5. Increment unreadCount for all other participants.
       * 6. Emit 'message.new' socket event.
       */
      const dto = { conversationId: 1, content: 'Hello' };
      const createdMessage = {
        id: 1,
        type: MessageType.TEXT,
        content: 'Hello',
        conversationId: 1,
      };
      messageRepo.create.mockReturnValue({ ...createdMessage } as any);
      messageRepo.save.mockResolvedValue({ ...createdMessage } as any);

      await service.sendMessage(1, dto);

      expect(messageRepo.save).toHaveBeenCalled();
      expect(socketEmitterService.emitNewMessage).toHaveBeenCalled();
      expect(conversationRepo.update).toHaveBeenCalled();
      expect(participantRepo.incrementUnreadCount).toHaveBeenCalled();
    });

    it('should queue file uploads if attachments provided', async () => {
      /*
       * Flow: Send Attachment Message
       * 1. Validate conversation and participant.
       * 2. Create Message entity with ATTACHMENT type.
       * 3. Save message to DB.
       * 4. Create MessageAttachment records in PENDING state.
       * 5. Queue file processing job in BullMQ (FILE_UPLOAD_QUEUE).
       * 6. Emit initial message socket event to clients.
       */
      const dto = { conversationId: 1, content: 'Hello' };
      const createdMessage = {
        id: 1,
        type: MessageType.ATTACHMENT,
        content: 'Hello',
        conversationId: 1,
      };
      messageRepo.create.mockReturnValue({ ...createdMessage } as any);
      messageRepo.save.mockResolvedValue({ ...createdMessage } as any);

      const files = [
        {
          originalname: 'test.png',
          size: 100,
          buffer: Buffer.from('test'),
          mimetype: 'image/png',
        },
      ] as any;
      messageAttachmentRepo.create.mockReturnValue({ id: 1 } as any);

      await service.sendMessage(1, dto, files);

      expect(messageAttachmentRepo.save).toHaveBeenCalled();
      expect(fileUploadQueue.add).toHaveBeenCalledWith(
        FILE_UPLOAD_JOB.UPLOAD_ATTACHMENT,
        expect.any(Object),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read and emit event', async () => {
      /*
       * Flow: Mark Conversation as Read
       * 1. Fetch conversation's lastMessageSeq.
       * 2. Update the user's participant record:
       *    - set lastReadSeq to conversation's lastMessageSeq
       *    - set unreadCount to 0
       * 3. Emit 'message.read' socket event to sync other devices.
       */
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

      conversationRepo.findOne.mockResolvedValue({ ...mockConv } as any);
      participantRepo.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      participantRepo.find.mockResolvedValue([]);

      await service.markAsRead(1, { conversationId: 1 });

      expect(participantRepo.update).toHaveBeenCalledWith(
        { conversationId: 1, userId: 1 },
        { lastReadSeq: 5, unreadCount: 0 },
      );
      expect(socketEmitterService.emitMarkMessageAsRead).toHaveBeenCalled();
    });
  });

  describe('pinMessage', () => {
    it('should throw if already pinned', async () => {
      /*
       * Flow: Pin Message (Already Pinned)
       * 1. Validate participant has permission to pin.
       * 2. Check if a MessagePin record already exists for this message.
       * 3. If it exists, throw BadRequest exception.
       */
      const mockMessage = { id: 1, conversationId: 1 };
      const mockParticipant = { id: 1, status: ParticipantStatus.ACTIVE };

      messageRepo.findOne.mockResolvedValue({ ...mockMessage } as any);
      participantRepo.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      messagePinRepo.findOne.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.pinMessage(1, { messageId: 1, conversationId: 1 }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should pin message', async () => {
      /*
       * Flow: Pin Message (Success)
       * 1. Validate participant has permission to pin.
       * 2. Ensure message exists and belongs to the conversation.
       * 3. Create a MessagePin record linked to the user and message.
       * 4. Emit 'message.pin' socket event to the conversation.
       */
      const mockMessage = { id: 1, conversationId: 1 };
      const mockParticipant = { id: 1, status: ParticipantStatus.ACTIVE };

      messageRepo.findOne.mockResolvedValue({ ...mockMessage } as any);
      participantRepo.findOne.mockResolvedValue({
        ...mockParticipant,
      } as any);
      messagePinRepo.findOne.mockResolvedValue(null);

      await service.pinMessage(1, { messageId: 1, conversationId: 1 });

      expect(messagePinRepo.create).toHaveBeenCalled();
      expect(messagePinRepo.save).toHaveBeenCalled();
      expect(socketEmitterService.emitPinMessage).toHaveBeenCalled();
    });
  });
});
