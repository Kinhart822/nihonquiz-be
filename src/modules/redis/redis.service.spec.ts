import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      mGet: jest.fn(),
      multi: jest.fn(),
      incrBy: jest.fn(),
      decrBy: jest.fn(),
      keys: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return undefined if key not found', async () => {
      /*
       * Flow: Get (Not Found)
       * 1. Mock redis get to return null.
       * 2. Call service.get.
       * 3. Verify it returns undefined.
       */
      redisClient.get.mockResolvedValue(null);
      const result = await service.get('key');
      expect(result).toBeUndefined();
    });

    it('should return default value if key not found', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await service.get('key', 'default');
      expect(result).toBe('default');
    });

    it('should parse JSON if value is stringified JSON', async () => {
      redisClient.get.mockResolvedValue('{"a":1}');
      const result = await service.get('key');
      expect(result).toEqual({ a: 1 });
    });

    it('should return original string if not JSON', async () => {
      redisClient.get.mockResolvedValue('string');
      const result = await service.get('key');
      expect(result).toBe('string');
    });
  });

  describe('set', () => {
    it('should set value without TTL', async () => {
      /*
       * Flow: Set (No TTL)
       * 1. Call service.set without TTL.
       * 2. Verify redis client's set method is called with stringified value.
       */
      await service.set('key', { a: 1 });
      expect(redisClient.set).toHaveBeenCalledWith('key', '{"a":1}');
    });

    it('should set value with TTL', async () => {
      await service.set('key', 'value', '1h');
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 3600, 'value');
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      await service.del('key');
      expect(redisClient.del).toHaveBeenCalledWith('key');
    });
  });

  describe('delMany', () => {
    it('should not call redis del if array is empty', async () => {
      await service.delMany([]);
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should call redis del with keys', async () => {
      await service.delMany(['key1', 'key2']);
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
    });
  });

  describe('exists', () => {
    it('should return true if exists', async () => {
      redisClient.exists.mockResolvedValue(1);
      const result = await service.exists('key');
      expect(result).toBe(true);
    });

    it('should return false if not exists', async () => {
      redisClient.exists.mockResolvedValue(0);
      const result = await service.exists('key');
      expect(result).toBe(false);
    });
  });

  describe('getMany', () => {
    it('should return empty array if keys empty', async () => {
      const result = await service.getMany([]);
      expect(result).toEqual([]);
    });

    it('should parse results correctly', async () => {
      redisClient.mGet.mockResolvedValue(['{"a":1}', null, 'str']);
      const result = await service.getMany(['k1', 'k2', 'k3']);
      expect(result).toEqual([{ a: 1 }, null, 'str']);
    });
  });

  describe('setMany', () => {
    it('should do nothing if empty', async () => {
      await service.setMany({});
      expect(redisClient.multi).not.toHaveBeenCalled();
    });

    it('should set values without TTL', async () => {
      const mockMulti = { set: jest.fn(), exec: jest.fn() };
      redisClient.multi.mockReturnValue(mockMulti);
      await service.setMany({ k1: 'v1', k2: { a: 1 } });
      expect(mockMulti.set).toHaveBeenCalledWith('k1', 'v1');
      expect(mockMulti.set).toHaveBeenCalledWith('k2', '{"a":1}');
      expect(mockMulti.exec).toHaveBeenCalled();
    });

    it('should set values with TTL', async () => {
      const mockMulti = { setEx: jest.fn(), exec: jest.fn() };
      redisClient.multi.mockReturnValue(mockMulti);
      await service.setMany({ k1: 'v1' }, '1h');
      expect(mockMulti.setEx).toHaveBeenCalledWith('k1', 3600, 'v1');
      expect(mockMulti.exec).toHaveBeenCalled();
    });
  });

  describe('remember', () => {
    it('should return cached value if exists', async () => {
      /*
       * Flow: Remember (Cache Hit)
       * 1. Mock redis get to return cached value.
       * 2. Call service.remember.
       * 3. Verify factory is not called and cached value is returned.
       */
      redisClient.get.mockResolvedValue('cached');
      const factory = jest.fn();
      const result = await service.remember('key', factory);
      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache if not exists', async () => {
      /*
       * Flow: Remember (Cache Miss)
       * 1. Mock redis get to return null.
       * 2. Call service.remember with factory.
       * 3. Verify factory is called and result is cached with TTL.
       */
      redisClient.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue('computed');
      const result = await service.remember('key', factory, '1h');
      expect(result).toBe('computed');
      expect(factory).toHaveBeenCalled();
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 3600, 'computed');
    });

    it('should delete key if factory returns undefined', async () => {
      redisClient.get.mockResolvedValue(null);
      const factory = jest.fn().mockResolvedValue(undefined);
      await service.remember('key', factory);
      expect(redisClient.del).toHaveBeenCalledWith('key');
    });
  });

  describe('increment', () => {
    it('should call incrBy', async () => {
      redisClient.incrBy.mockResolvedValue(2);
      const result = await service.increment('key', 2);
      expect(redisClient.incrBy).toHaveBeenCalledWith('key', 2);
      expect(result).toBe(2);
    });
  });

  describe('decrement', () => {
    it('should call decrBy', async () => {
      redisClient.decrBy.mockResolvedValue(0);
      const result = await service.decrement('key', 2);
      expect(redisClient.decrBy).toHaveBeenCalledWith('key', 2);
      expect(result).toBe(0);
    });
  });

  describe('keys', () => {
    it('should call keys', async () => {
      redisClient.keys.mockResolvedValue(['k1']);
      const result = await service.keys('k*');
      expect(redisClient.keys).toHaveBeenCalledWith('k*');
      expect(result).toEqual(['k1']);
    });
  });

  describe('expire', () => {
    it('should call expire and return true if successful', async () => {
      redisClient.expire.mockResolvedValue(1);
      const result = await service.expire('key', '1h');
      expect(redisClient.expire).toHaveBeenCalledWith('key', 3600);
      expect(result).toBe(true);
    });

    it('should return false if invalid TTL', async () => {
      const result = await service.expire('key', undefined as any);
      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should call ttl', async () => {
      redisClient.ttl.mockResolvedValue(3600);
      const result = await service.ttl('key');
      expect(redisClient.ttl).toHaveBeenCalledWith('key');
      expect(result).toBe(3600);
    });
  });

  describe('clearByPattern', () => {
    it('should delete matching keys', async () => {
      /*
       * Flow: Clear By Pattern
       * 1. Mock redis keys to return matching keys.
       * 2. Call service.clearByPattern.
       * 3. Verify redis del is called with the found keys.
       */
      redisClient.keys.mockResolvedValue(['k1', 'k2']);
      const result = await service.clearByPattern('k*');
      expect(redisClient.keys).toHaveBeenCalledWith('k*');
      expect(redisClient.del).toHaveBeenCalledWith(['k1', 'k2']);
      expect(result).toBe(2);
    });

    it('should return 0 if no matching keys', async () => {
      redisClient.keys.mockResolvedValue([]);
      const result = await service.clearByPattern('k*');
      expect(result).toBe(0);
    });
  });

  describe('parseTTL (internal via set)', () => {
    it('should throw error for invalid format', async () => {
      await expect(service.set('key', 'value', 'invalid')).rejects.toThrow();
    });

    it('should handle d unit', async () => {
      await service.set('key', 'value', '1d');
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 86400, 'value');
    });

    it('should handle s unit', async () => {
      await service.set('key', 'value', '10s');
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 10, 'value');
    });

    it('should handle m unit', async () => {
      await service.set('key', 'value', '10m');
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 600, 'value');
    });

    it('should handle numeric ttl', async () => {
      await service.set('key', 'value', 123);
      expect(redisClient.setEx).toHaveBeenCalledWith('key', 123, 'value');
    });
  });
});
