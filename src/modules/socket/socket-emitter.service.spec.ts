import { Test, TestingModule } from '@nestjs/testing';
import { SocketEmitterService } from './socket-emitter.service';
import { SocketEvent } from '../../constants/socket.constant';

jest.mock('@socket.io/redis-emitter', () => {
  return {
    Emitter: jest.fn().mockImplementation(() => {
      return {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };
    }),
  };
});

describe('SocketEmitterService', () => {
  let service: SocketEmitterService;
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketEmitterService,
        {
          provide: 'REDIS',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<SocketEmitterService>(SocketEmitterService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    /*
     * Flow: should be defined
     * 1. Setup mock data and dependencies.
     * 2. Execute the method under test.
     * 3. Verify the expected results and behavior.
     */
    expect(service).toBeDefined();
    expect(service.emitter).toBeDefined();
  });

  describe('emitEvent', () => {
    it('should emit event to user room', () => {
      /*
       * Flow: Emit Event to User
       * 1. Call emitEvent with email, event type, and data.
       * 2. Verify emitter sends payload to the user-specific room.
       */
      service.emitEvent('test@example.com', SocketEvent.USER_BLOCKED, {
        id: 1,
      });
      expect(service.emitter.to).toHaveBeenCalledWith(
        'user-room-test@example.com',
      );
      expect(service.emitter.emit).toHaveBeenCalledWith(
        SocketEvent.USER_BLOCKED,
        {
          event: SocketEvent.USER_BLOCKED,
          data: { id: 1 },
        },
      );
    });

    it('should catch error if emitter fails', () => {
      /*
       * Flow: Emit Event to User (Error Handling)
       * 1. Mock emitter to throw an error.
       * 2. Call emitEvent.
       * 3. Verify it does not throw an unhandled exception.
       */
      (service.emitter.to as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      expect(() =>
        service.emitEvent('test@example.com', SocketEvent.USER_BLOCKED, {}),
      ).not.toThrow();
    });
  });

  describe('emitEventToConversation', () => {
    it('should emit event to conversation room', () => {
      /*
       * Flow: Emit Event to Conversation
       * 1. Call emitEventToConversation with conversation ID, event type, and data.
       * 2. Verify emitter sends payload to the conversation-specific room.
       */
      service.emitEventToConversation(123, SocketEvent.NEW_MESSAGE, { id: 1 });
      expect(service.emitter.to).toHaveBeenCalledWith('conversation-room-123');
      expect(service.emitter.emit).toHaveBeenCalledWith(
        SocketEvent.NEW_MESSAGE,
        {
          event: SocketEvent.NEW_MESSAGE,
          data: { id: 1 },
        },
      );
    });

    it('should catch error if emitter fails', () => {
      /*
       * Flow: Emit Event to Conversation (Error Handling)
       * 1. Mock emitter to throw an error.
       * 2. Call emitEventToConversation.
       * 3. Verify it does not throw an unhandled exception.
       */
      (service.emitter.to as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      expect(() =>
        service.emitEventToConversation(123, SocketEvent.NEW_MESSAGE, {}),
      ).not.toThrow();
    });
  });

  describe('Specific emit methods', () => {
    beforeEach(() => {
      jest.spyOn(service, 'emitEvent');
      jest.spyOn(service, 'emitEventToConversation');
    });

    it('should call emitEvent for user events', () => {
      /*
       * Flow: User-Specific Event Methods
       * 1. Call each user-specific emit method.
       * 2. Verify it delegates to emitEvent with correct parameters.
       */
      service.emitUserBlocked('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.USER_BLOCKED,
        {},
      );

      service.emitUserUnblocked('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.USER_UNBLOCKED,
        {},
      );

      service.emitUserDeleted('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.USER_DELETED,
        {},
      );

      service.emitUserProfileUpdate('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.PROFILE_UPDATE,
        {},
      );

      service.emitUserProfileStatusChangek('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.PROFILE_STATUS_CHANGE,
        {},
      );

      service.emitMarkMessageAsRead('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.MARK_MESSAGE_AS_READ,
        {},
      );

      service.emitSendFriendRequest('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.SEND_FRIEND_REQUEST,
        {},
      );

      service.emitFriendRequestStatusChange('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.FRIEND_REQUEST_STATUS_CHANGE,
        {},
      );

      service.emitRemoveFriend('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.REMOVE_FRIEND,
        {},
      );

      service.emitBlockFriend('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.BLOCK_FRIEND,
        {},
      );

      service.emitUnblockFriend('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.UNBLOCK_FRIEND,
        {},
      );

      service.emitArchiveConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.ARCHIVE_CONVERSATION,
        {},
      );

      service.emitUnarchiveConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.UNARCHIVE_CONVERSATION,
        {},
      );

      service.emitMuteConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.MUTE_CONVERSATION,
        {},
      );

      service.emitUnmuteConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.UNMUTE_CONVERSATION,
        {},
      );

      service.emitPinConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.PIN_CONVERSATION,
        {},
      );

      service.emitUnpinConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.UNPIN_CONVERSATION,
        {},
      );

      service.emitRemoveConversation('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.REMOVE_CONVERSATION,
        {},
      );

      service.emitNewJoinRequest('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.NEW_JOIN_REQUEST,
        {},
      );

      service.emitJoinRequestRejected('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.JOIN_REQUEST_REJECTED,
        {},
      );

      service.emitGlobalConversationUpdate('test@example.com', {});
      expect(service.emitEvent).toHaveBeenCalledWith(
        'test@example.com',
        SocketEvent.GLOBAL_CONVERSATION_UPDATE,
        {},
      );
    });

    it('should call emitEventToConversation for conversation events', () => {
      /*
       * Flow: Conversation-Specific Event Methods
       * 1. Call each conversation-specific emit method.
       * 2. Verify it delegates to emitEventToConversation with correct parameters.
       */
      service.emitNewMessage(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.NEW_MESSAGE,
        {},
      );

      service.emitEditMessage(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.EDIT_MESSAGE,
        {},
      );

      service.emitDeleteMessage(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.DELETE_MESSAGE,
        {},
      );

      service.emitUpdateAttachment(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.UPDATE_ATTACHMENT,
        {},
      );

      service.emitPinMessage(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.PIN_MESSAGE,
        {},
      );

      service.emitUnpinMessage(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.UNPIN_MESSAGE,
        {},
      );

      service.emitCreateConversation(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.CREATE_CONVERSATION,
        {},
      );

      service.emitEditConversation(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.EDIT_CONVERSATION,
        {},
      );

      service.emitUpdateConversationAvatar(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.UPDATE_CONVERSATION_AVATAR,
        {},
      );

      service.emitBlockConversation(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.BLOCK_CONVERSATION,
        {},
      );

      service.emitUnblockConversation(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.UNBLOCK_CONVERSATION,
        {},
      );

      service.emitDeleteConversation(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.DELETE_CONVERSATION,
        {},
      );

      service.emitAddMemberToGroup(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.ADD_MEMBER_TO_GROUP,
        {},
      );

      service.emitRemoveMemberFromGroup(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.REMOVE_MEMBER_FROM_GROUP,
        {},
      );

      service.emitLeaveGroup(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.LEAVE_GROUP,
        {},
      );

      service.emitChangeOwnerOfGroup(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.CHANGE_OWNER_OF_GROUP,
        {},
      );

      service.emitJoinRequestApproved(1, {});
      expect(service.emitEventToConversation).toHaveBeenCalledWith(
        1,
        SocketEvent.JOIN_REQUEST_APPROVED,
        {},
      );
    });
  });
});
