import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from './socket.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
    };
    const mockConfigService = {
      get: jest.fn().mockReturnValue('secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
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
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should disconnect if token not found', async () => {
      /*
       * Flow: Handle Connection (No Token)
       * 1. Check client handshake for token.
       * 2. If token is missing, call client.disconnect().
       */
      const client = {
        id: '1',
        handshake: { query: {}, headers: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      } as any as Socket;

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      /*
       * Flow: Handle Connection (Invalid Token)
       * 1. Extract token from client handshake.
       * 2. Verify token via JwtService.
       * 3. If verify throws, call client.disconnect().
       */
      const client = {
        id: '1',
        handshake: { headers: { authorization: 'Bearer invalid' } },
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      } as any as Socket;

      jwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should disconnect if token payload is null', async () => {
      /*
       * Flow: Handle Connection (Null Payload)
       * 1. Extract token.
       * 2. Verify token.
       * 3. If payload is null, call client.disconnect().
       */
      const client = {
        id: '1',
        handshake: { query: { authorization: 'token' } },
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      } as any as Socket;

      jwtService.verify.mockReturnValue(null as any);

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should join user room if token is valid', async () => {
      /*
       * Flow: Handle Connection (Success)
       * 1. Extract and verify token.
       * 2. Get user payload.
       * 3. Call client.join with user-specific room.
       * 4. Attach payload to client.data.
       */
      const client = {
        id: '1',
        handshake: { headers: { authorization: 'Bearer valid-token' } },
        disconnect: jest.fn(),
        join: jest.fn(),
        data: {},
      } as any as Socket;

      const payload = { email: 'TEST@example.com' };
      jwtService.verify.mockReturnValue(payload as any);

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('user-room-test@example.com');
      expect(client.data.user).toEqual(payload);
      expect(client.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('handlePing', () => {
    it('should return pong', () => {
      /*
       * Flow: Handle Ping
       * 1. Receive ping event.
       * 2. Return 'pong'.
       */
      expect(gateway.handlePing()).toBe('pong');
    });
  });

  describe('handleJoinConversation', () => {
    it('should join conversation room', () => {
      /*
       * Flow: Handle Join Conversation
       * 1. Receive 'joinConversation' event with conversation ID.
       * 2. Call client.join with conversation-specific room.
       */
      const client = {
        id: '1',
        join: jest.fn(),
      } as any as Socket;

      gateway.handleJoinConversation(client, 123);

      expect(client.join).toHaveBeenCalledWith('conversation-room-123');
    });
  });

  describe('handleLeaveConversation', () => {
    it('should leave conversation room', () => {
      /*
       * Flow: Handle Leave Conversation
       * 1. Receive 'leaveConversation' event with conversation ID.
       * 2. Call client.leave with conversation-specific room.
       */
      const client = {
        id: '1',
        leave: jest.fn(),
      } as any as Socket;

      gateway.handleLeaveConversation(client, 123);

      expect(client.leave).toHaveBeenCalledWith('conversation-room-123');
    });
  });

  describe('handleDisconnect', () => {
    it('should not throw', () => {
      /*
       * Flow: Handle Disconnect
       * 1. Receive disconnect event.
       * 2. Handle gracefully without throwing errors.
       */
      const client = { id: '1' } as any as Socket;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });
});
