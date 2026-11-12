import Redis from 'ioredis';
import { createPool, type Pool } from 'generic-pool';
import { RedisPoolConf } from './types';

export class RedisPool {
  private pool: Pool<Redis>;

  constructor(opts: RedisPoolConf = {}) {
    this.pool = createPool<Redis>(
      {
        create: async () => {
          const client = new Redis({
            host: opts.host ?? '127.0.0.1',
            port: opts.port ?? 6379,
            password: opts.password,
            db: opts.db,
            keyPrefix: opts.keyPrefix,
            retryStrategy: (times) => Math.min(times * 100, 3000),
            lazyConnect: false,
          });
          return client;
        },
        destroy: async (client) => {
          try {
            await client.quit();
          } catch {
            client.disconnect();
          }
        },
        validate: async (client) => {
          try {
            const pong = await client.ping();
            return pong === 'PONG';
          } catch {
            return false;
          }
        },
      },
      {
        max: opts.max ?? 10,
        min: opts.min ?? 2,
        idleTimeoutMillis: opts.idleTimeout ?? 30000,
        acquireTimeoutMillis: opts.acquireTimeout ?? 5000,
        testOnBorrow: true,
        testOnReturn: true,
      },
    );
  }

  async close(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }

  get status() {
    return {
      size: this.pool.size,
      available: this.pool.available,
      borrowed: this.pool.borrowed,
      pending: this.pool.pending,
      max: this.pool.max,
      min: this.pool.min,
    };
  }

  async acquire(): Promise<Redis> {
    return this.pool.acquire();
  }

  async release(client: Redis): Promise<void> {
    await this.pool.release(client);
  }

  async execute<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
    const client = await this.acquire();
    try {
      return await fn(client);
    } finally {
      await this.release(client);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK' | null> {
    return this.execute(async (c) => {
      if (ttl) return c.set(key, value, 'EX', ttl);
      return c.set(key, value);
    });
  }
  async get(key: string): Promise<string | null> {
    return this.execute((c) => c.get(key));
  }

  async del(...keys: string[]): Promise<number> {
    return this.execute((c) => c.del(...keys));
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.execute((c) => c.expire(key, seconds));
  }

  async exists(...keys: string[]): Promise<number> {
    return this.execute((c) => c.exists(...keys));
  }

  async incr(key: string): Promise<number> {
    return this.execute((c) => c.incr(key));
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.execute((c) => c.hset(key, field, value));
  }

  async hsetall(key: string, mapping: Record<string, string>): Promise<number> {
    return this.execute((c) => c.hset(key, mapping));
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.execute((c) => c.hgetall(key));
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.execute((c) => c.lpush(key, ...values));
  }

  async rpop(key: string): Promise<string | null> {
    return this.execute((c) => c.rpop(key));
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.execute((c) => c.sadd(key, ...members));
  }

  async smembers(key: string): Promise<string[]> {
    return this.execute((c) => c.smembers(key));
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.execute((c) => c.zadd(key, score, member));
  }

  async zrangebyscore(key: string, min: number | string, max: number | string): Promise<string[]> {
    return this.execute((c) => c.zrangebyscore(key, min, max));
  }
}
