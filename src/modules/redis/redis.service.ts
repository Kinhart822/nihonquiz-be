import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly pendingPromises: Partial<Record<string, Promise<unknown>>> =
    {};

  constructor(
    @Inject('REDIS')
    private readonly redisClient: RedisClientType,
  ) {}

  /**
   * Get value from Redis with automatic deserialization
   */
  async get<T = unknown>(
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    const data = await this.redisClient.get(key);

    if (data == null) {
      return defaultValue;
    }

    try {
      return (typeof data === 'string' ? JSON.parse(data) : data) as T;
    } catch {
      // Nếu không parse được, trả về data gốc
      return data as T;
    }
  }

  /**
   * Set value to Redis with automatic serialization
   */
  async set(key: string, value: unknown, ttl?: number | string): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);

    const parsedTTL = this.parseTTL(ttl);

    if (parsedTTL) {
      await this.redisClient.setEx(key, parsedTTL.ttl, serialized);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  /**
   * Delete key from Redis
   */
  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Delete multiple keys from Redis
   */
  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.redisClient.del(keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result > 0;
  }

  /**
   * Get multiple keys at once
   */
  async getMany<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    const values = await this.redisClient.mGet(keys);
    return values.map((val) => {
      if (!val) return null;
      try {
        return (typeof val === 'string' ? JSON.parse(val) : val) as T;
      } catch {
        return val as T;
      }
    });
  }

  /**
   * Set multiple keys at once
   */
  async setMany(
    entries: Record<string, unknown>,
    ttl?: number | string,
  ): Promise<void> {
    const keys = Object.keys(entries);
    if (keys.length === 0) return;

    // mSet doesn't support TTL, so we need to use pipeline
    const pipeline = this.redisClient.multi();

    const parsedTTL = this.parseTTL(ttl);

    for (const [key, value] of Object.entries(entries)) {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (parsedTTL) {
        pipeline.setEx(key, parsedTTL.ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }

    await pipeline.exec();
  }

  /**
   * Remember pattern: Get from cache or execute factory and cache result
   * Prevents cache stampede by deduplicating concurrent requests
   */
  remember<T>(
    key: string,
    valueFactory: () => T | Promise<T>,
    ttl?: number | string,
  ): Promise<T> {
    const promise: Promise<T> | undefined = this.pendingPromises[
      key
    ] as Promise<T>;

    if (promise) {
      return promise;
    }

    return (this.pendingPromises[key] = (async () => {
      let value = await this.get<T>(key);

      if (value == null) {
        value = await valueFactory();

        if (value != undefined) {
          await this.set(key, value, ttl);
        } else {
          await this.del(key);
        }
      }

      return value as T;
    })()).finally(() => {
      delete this.pendingPromises[key];
    });
  }

  /**
   * Increment a key's value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    return await this.redisClient.incrBy(key, amount);
  }

  /**
   * Decrement a key's value
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    return await this.redisClient.decrBy(key, amount);
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.redisClient.keys(pattern);
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number | string): Promise<boolean> {
    const parsedTTL = this.parseTTL(ttl);
    if (!parsedTTL) return false;

    return (await this.redisClient.expire(key, parsedTTL.ttl)) === 1;
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  /**
   * Clear all keys matching a pattern
   */
  async clearByPattern(pattern: string): Promise<number> {
    const keys = await this.keys(pattern);
    if (keys.length === 0) return 0;

    await this.delMany(keys);
    return keys.length;
  }

  /**
   * Parse TTL from string format (e.g., "5m", "1h", "7d") or number (seconds)
   */
  private parseTTL(
    ttl: string | number | undefined,
  ): { ttl: number } | undefined {
    if (typeof ttl === 'undefined') {
      return undefined;
    }

    if (typeof ttl === 'number') {
      return { ttl };
    }

    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Invalid TTL format: ${ttl}. Use format like "5s", "10m", "1h", "7d"`,
      );
    }

    let value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        // seconds - no conversion needed
        break;
      case 'm':
        value *= 60;
        break;
      case 'h':
        value *= 3600;
        break;
      case 'd':
        value *= 86400;
        break;
      default:
        throw new Error(`Invalid TTL unit: ${unit}`);
    }

    return { ttl: value };
  }

  /**
   * Get the native Redis client for advanced operations
   */
  get native(): RedisClientType {
    return this.redisClient;
  }
}
