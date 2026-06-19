import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogInterceptor } from '../../interceptors/audit-log.interceptor';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: jest.Mocked<ConversationService>;

  beforeEach(async () => {
    const mockService = {
      getListOfConversation: jest.fn(),
      getConversationsByUserId: jest.fn(),
      getListOfParticipants: jest.fn(),
      getInfoConversation: jest.fn(),
      createConversation: jest.fn(),
      editConversation: jest.fn(),
      archiveConversation: jest.fn(),
      unarchiveConversation: jest.fn(),
      muteConversation: jest.fn(),
      unmuteConversation: jest.fn(),
      pinConversation: jest.fn(),
      unpinConversation: jest.fn(),
      blockConversation: jest.fn(),
      unblockConversation: jest.fn(),
      deleteConversation: jest.fn(),
      addMemberToGroup: jest.fn(),
      kickMemberFromGroup: jest.fn(),
      leaveGroup: jest.fn(),
      changeOwnerOfGroup: jest.fn(),
      requestToJoinGroup: jest.fn(),
      processJoinGroupRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [{ provide: ConversationService, useValue: mockService }],
    })
      .overrideInterceptor(AuditLogInterceptor)
      .useValue({
        intercept: jest
          .fn()
          .mockImplementation((context, next) => next.handle()),
      })
      .compile();

    controller = module.get<ConversationController>(ConversationController);
    service = module.get(ConversationService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call createConversation', async () => {
      service.createConversation.mockResolvedValue({ id: 1 } as any);
      const dto: any = { type: 'DIRECT', participants: [2] };
      const result = await controller.create({ id: 1 } as any, dto, undefined);
      expect(service.createConversation).toHaveBeenCalledWith(
        1,
        dto,
        undefined,
      );
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('edit', () => {
    it('should call editConversation', async () => {
      service.editConversation.mockResolvedValue(true);
      const dto: any = { name: 'New Name' };
      const result = await controller.edit(
        { id: 1 } as any,
        '1',
        dto,
        undefined,
      );
      expect(service.editConversation).toHaveBeenCalledWith(
        1,
        1,
        dto,
        undefined,
      );
      expect(result).toBe(true);
    });
  });

  describe('archive', () => {
    it('should call archiveConversation', async () => {
      service.archiveConversation.mockResolvedValue(true);
      const result = await controller.archive({ id: 1 } as any, '1');
      expect(service.archiveConversation).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('mute', () => {
    it('should call muteConversation', async () => {
      service.muteConversation.mockResolvedValue(true);
      const dto: any = { muteValue: '1_HOUR' };
      const result = await controller.mute({ id: 1 } as any, '1', dto);
      expect(service.muteConversation).toHaveBeenCalledWith(1, 1, dto);
      expect(result).toBe(true);
    });
  });

  describe('block', () => {
    it('should call blockConversation', async () => {
      service.blockConversation.mockResolvedValue(true);
      const result = await controller.block({ id: 1 } as any, '1');
      expect(service.blockConversation).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });

  describe('addMember', () => {
    it('should call addMemberToGroup', async () => {
      service.addMemberToGroup.mockResolvedValue(true as any);
      const dto: any = { userIds: [2] };
      const result = await controller.addMember({ id: 1 } as any, '1', dto);
      expect(service.addMemberToGroup).toHaveBeenCalledWith(1, 1, dto);
      expect(result).toBe(true);
    });
  });
});
