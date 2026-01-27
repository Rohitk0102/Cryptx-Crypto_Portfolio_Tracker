import Redis from 'ioredis';

class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > this.maxReconnectAttempts) {
          console.error('❌ Redis: Max reconnection attempts reached');
          return null; // Stop retrying
        }
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (max)
        const delay = Math.min(times * 1000, 32000);
        console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${times}/${this.maxReconnectAttempts})`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some(targetError => err.message.includes(targetError));
      },
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      keepAlive: 30000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      console.log('🔌 Redis: Connecting...');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis: Connected and ready');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔌 Redis: Connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Redis: Reconnecting (attempt ${this.reconnectAttempts})`);
    });

    this.client.on('end', () => {
      console.log('🛑 Redis: Connection ended');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('✅ Redis: Initial connection successful');
    } catch (error) {
      console.error('❌ Redis: Failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      console.log('✅ Redis: Disconnected gracefully');
    } catch (error) {
      console.error('❌ Redis: Error during disconnect:', error);
      // Force disconnect if graceful quit fails
      this.client.disconnect();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  // Wrapper methods with error handling
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`❌ Redis GET error for key "${key}":`, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<'OK' | null> {
    try {
      return await this.client.set(key, value);
    } catch (error) {
      console.error(`❌ Redis SET error for key "${key}":`, error);
      return null;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    try {
      return await this.client.setex(key, seconds, value);
    } catch (error) {
      console.error(`❌ Redis SETEX error for key "${key}":`, error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error(`❌ Redis DEL error for key "${key}":`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key "${key}":`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      console.error(`❌ Redis EXPIRE error for key "${key}":`, error);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`❌ Redis TTL error for key "${key}":`, error);
      return -2; // Key doesn't exist
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Redis KEYS error for pattern "${pattern}":`, error);
      return [];
    }
  }

  async flushdb(): Promise<'OK' | null> {
    try {
      return await this.client.flushdb();
    } catch (error) {
      console.error('❌ Redis FLUSHDB error:', error);
      return null;
    }
  }

  // Direct access to client for advanced operations
  getClient(): Redis {
    return this.client;
  }

  // Alias for backward compatibility
  async quit(): Promise<void> {
    return this.disconnect();
  }
}

// Export singleton instance
const redisClient = new RedisClient();
export default redisClient;

