import { FILE_UPLOAD_JOB, FILE_UPLOAD_QUEUE } from '@constants/queue.constant';
import {
  ConversationStatus,
  ConversationType,
  ParticipantRole,
  ParticipantStatus,
  UserStatus,
} from '@constants/user.constant';
import { RedisService } from '@modules/redis/redis.service';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { ConversationRepository } from '@repositories/conversation.repository';
import { ParticipantRepository } from '@repositories/participant.repository';
import { UserRepository } from '@repositories/user.repository';
import {
  httpBadRequest,
  httpForbidden,
  httpNotFound,
} from '@shared/exceptions/http-exception';
import { SocketEmitterService } from '../socket/socket-emitter.service';
import { ConversationService } from './conversation.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => ({}),
}));

describe('ConversationService', () => {
  let service: ConversationService;
  let conversationRepository: jest.Mocked<ConversationRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let participantRepository: jest.Mocked<ParticipantRepository>;
  let socketEmitterService: jest.Mocked<SocketEmitterService>;
  let fileUploadQueue: any;

  beforeEach(async () => {
    const mockConversationRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockParticipantRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const mockSocketEmitterService = {
      emitCreateConversation: jest.fn(),
      emitEditConversation: jest.fn(),
      emitArchiveConversation: jest.fn(),
      emitUnarchiveConversation: jest.fn(),
      emitMuteConversation: jest.fn(),
      emitUnmuteConversation: jest.fn(),
      emitPinConversation: jest.fn(),
      emitUnpinConversation: jest.fn(),
      emitAddMemberToGroup: jest.fn(),
    };

    const mockRedisService = {
      set: jest.fn(),
      get: jest.fn(),
    };

    const mockFileUploadQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: ConversationRepository,
          useValue: mockConversationRepository,
        },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: ParticipantRepository, useValue: mockParticipantRepository },
        { provide: SocketEmitterService, useValue: mockSocketEmitterService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: getQueueToken(FILE_UPLOAD_QUEUE),
          useValue: mockFileUploadQueue,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
    conversationRepository = module.get(ConversationRepository);
    userRepository = module.get(UserRepository);
    participantRepository = module.get(ParticipantRepository);
    socketEmitterService = module.get(SocketEmitterService);
    fileUploadQueue = module.get(getQueueToken(FILE_UPLOAD_QUEUE));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createConversation', () => {
    const mockUser = { id: 1, status: UserStatus.ACTIVE };

    it('should throw forbidden if user is blocked', async () => {
      /*
       * Flow: Create Conversation (Blocked User)
       * 1. Query DB for the creator's user status.
       * 2. If status is BLOCKED, throw Forbidden exception.
       */
      userRepository.findOne.mockResolvedValueOnce({
        status: UserStatus.BLOCKED,
      } as any);
      await expect(
        service.createConversation(1, {
          participants: [],
          type: ConversationType.DIRECT,
          name: '',
        }),
      ).rejects.toThrow(httpForbidden);
    });

    it('should throw bad request if creating direct conv with multiple participants', async () => {
      /*
       * Flow: Create DIRECT Conversation (Invalid Participants)
       * 1. Check user status is ACTIVE.
       * 2. Validate participant array.
       * 3. If type is DIRECT and multiple participants exist, throw BadRequest.
       */
      userRepository.findOne.mockResolvedValueOnce(mockUser as any);
      const dto = {
        participants: [2, 3],
        type: ConversationType.DIRECT,
        name: '',
      };
      userRepository.find.mockResolvedValueOnce([{ id: 2 }, { id: 3 }] as any);

      await expect(service.createConversation(1, dto)).rejects.toThrow(
        httpBadRequest,
      );
    });

    it('should throw bad request if direct conversation already exists', async () => {
      /*
       * Flow: Create DIRECT Conversation (Already Exists)
       * 1. Check user status.
       * 2. Validate participants.
       * 3. Query DB to check if a DIRECT conversation between these 2 users already exists.
       * 4. If it exists, throw BadRequest.
       */
      userRepository.findOne.mockResolvedValueOnce(mockUser as any);
      userRepository.find.mockResolvedValueOnce([{ id: 2 }] as any);
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 5 }), // Exists
      };
      conversationRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await expect(
        service.createConversation(1, {
          participants: [2],
          type: ConversationType.DIRECT,
          name: '',
        }),
      ).rejects.toThrow(httpBadRequest);
    });

    it('should create conversation successfully', async () => {
      /*
       * Flow: Create GROUP Conversation
       * 1. Validate creator is ACTIVE.
       * 2. Validate all participants exist.
       * 3. Create Conversation entity and save to DB.
       * 4. Add creator and other users as Participants to the conversation.
       * 5. Emit 'conversation.create' socket event to all members.
       */
      userRepository.findOne.mockResolvedValueOnce(mockUser as any);
      userRepository.find.mockResolvedValueOnce([{ id: 2 }, { id: 3 }] as any);
      const dto = {
        participants: [2, 3],
        type: ConversationType.GROUP,
        name: 'Test Group',
      };
      const createdConv = { id: 1, type: ConversationType.GROUP, ownerId: 1 };
      conversationRepository.create.mockReturnValue(createdConv as any);
      conversationRepository.save.mockResolvedValue(createdConv as any);
      participantRepository.create.mockReturnValue({} as any);

      const result = await service.createConversation(1, dto);

      expect(conversationRepository.save).toHaveBeenCalled();
      expect(participantRepository.save).toHaveBeenCalled();
      expect(socketEmitterService.emitCreateConversation).toHaveBeenCalled();
      expect(result).toEqual(createdConv);
    });
  });

  describe('editConversation', () => {
    it('should update and emit event', async () => {
      /*
       * Flow: Edit Conversation Name
       * 1. Retrieve Conversation by ID.
       * 2. Verify requester is a participant and has permission (e.g., OWNER for group).
       * 3. Update conversation name in DB.
       * 4. Emit 'conversation.edit' socket event to participants.
       */
      const mockConv = { id: 1, type: ConversationType.GROUP };
      const mockParticipant = {
        id: 1,
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.ACTIVE,
      };

      conversationRepository.findOneBy.mockResolvedValue(mockConv as any);
      participantRepository.findOne.mockResolvedValue({
        ...mockParticipant,
        user: {},
      } as any);

      await service.editConversation(1, 1, { name: 'New Name' });

      expect(conversationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
      expect(socketEmitterService.emitEditConversation).toHaveBeenCalled();
    });
  });

  describe('archiveConversation', () => {
    it('should archive and emit event', async () => {
      /*
       * Flow: Archive Conversation
       * 1. Retrieve Conversation.
       * 2. Verify requester is an active participant.
       * 3. Change participant status to ARCHIVED in DB.
       * 4. Emit 'conversation.archive' socket event to the user.
       */
      const mockConv = { id: 1 };
      const mockParticipant = {
        id: 1,
        status: ParticipantStatus.ACTIVE,
        user: { email: 'test@test.com' },
      };

      conversationRepository.findOneBy.mockResolvedValue(mockConv as any);
      participantRepository.findOne.mockResolvedValue(mockParticipant as any);

      await service.archiveConversation(1, 1);

      expect(participantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ParticipantStatus.ARCHIVED }),
      );
      expect(socketEmitterService.emitArchiveConversation).toHaveBeenCalled();
    });
  });

  describe('addMemberToGroup', () => {
    it('should add valid members to group', async () => {
      /*
       * Flow: Add Members to Group
       * 1. Retrieve Conversation (must be GROUP type).
       * 2. Verify requester is OWNER or ADMIN of the group.
       * 3. Verify new users exist and are not already in the group.
       * 4. Create new Participant records for added users.
       * 5. Emit 'group.member.added' socket event to the group.
       */
      const mockConv = { id: 1, type: ConversationType.GROUP };
      const mockOwner = {
        id: 1,
        role: ParticipantRole.OWNER,
        status: ParticipantStatus.ACTIVE,
        user: {},
      };

      conversationRepository.findOneBy.mockResolvedValue(mockConv as any);
      participantRepository.findOne.mockResolvedValue(mockOwner as any);

      userRepository.find.mockResolvedValue([
        { id: 2, status: UserStatus.ACTIVE },
      ] as any);
      participantRepository.find.mockResolvedValue([]); // No existing participant

      await service.addMemberToGroup(1, 1, { userIds: [2] });

      expect(participantRepository.create).toHaveBeenCalled();
      expect(participantRepository.save).toHaveBeenCalled();
    });
  });
});
