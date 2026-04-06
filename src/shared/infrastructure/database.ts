/**
 * MongoDB Connection Configuration
 */

import mongoose from 'mongoose';
import { getLogger } from './logger';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

type MongooseGlobalCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type CommandStartMeta = {
  startedAt: number;
  commandName: string;
  collection?: string;
  database?: string;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseGlobalCache;
  __mongoCommandMonitoringSetupDone?: boolean;
  __mongoCommandStartMap?: Map<number, CommandStartMeta>;
};

const cached: MongooseGlobalCache = globalForMongoose.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = cached;
}

mongoose.connection.on('disconnected', () => {
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('error', () => {
  cached.conn = null;
});

export async function connectDB() {
  const readyState = mongoose.connection.readyState;

  // 1 = connected
  if (cached.conn && readyState === 1) {
    return cached.conn;
  }

  // 2 = connecting
  if (readyState === 2 && cached.promise) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // 0 = disconnected, 3 = disconnecting
  if (readyState === 0 || readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const enableCommandMonitoring =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_MONGODB_QUERY_DEBUG === 'true';
    const opts = {
      bufferCommands: false,
      monitorCommands: enableCommandMonitoring,
      // MongoDB Atlas SSL/TLS configuration
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      // Connection timeout and retry settings
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
    const logger = getLogger();
    logger.info('MongoDB connected successfully');
  } catch (e) {
    cached.promise = null;
    const logger = getLogger();
    logger.error('MongoDB connection failed', e as Error);
    throw e;
  }

  if (!globalForMongoose.__mongoCommandMonitoringSetupDone) {
    const logger = getLogger();
    const slowQueryThresholdMs = Number.parseInt(process.env.MONGODB_SLOW_QUERY_MS ?? '250', 10);
    const enabled =
      process.env.NODE_ENV !== 'production' || process.env.ENABLE_MONGODB_QUERY_DEBUG === 'true';

    if (enabled) {
      const startMap = globalForMongoose.__mongoCommandStartMap ?? new Map<number, CommandStartMeta>();
      if (!globalForMongoose.__mongoCommandStartMap) {
        globalForMongoose.__mongoCommandStartMap = startMap;
      }

      const client = mongoose.connection.getClient();
      client.on('commandStarted', (event: { requestId: number; commandName: string; command: Record<string, unknown>; databaseName?: string }) => {
        const collection = Object.keys(event.command || {}).find(
          (key) => Array.isArray((event.command as Record<string, unknown>)[key]) || typeof (event.command as Record<string, unknown>)[key] === 'string'
        );
        startMap.set(event.requestId, {
          startedAt: Date.now(),
          commandName: event.commandName,
          collection: collection ? String((event.command as Record<string, unknown>)[collection]) : undefined,
          database: event.databaseName,
        });
      });

      client.on('commandSucceeded', (event: { requestId: number }) => {
        const start = startMap.get(event.requestId);
        if (!start) return;
        startMap.delete(event.requestId);
        const durationMs = Date.now() - start.startedAt;
        if (durationMs >= slowQueryThresholdMs) {
          logger.warn('Slow Mongo command detected', {
            command: start.commandName,
            collection: start.collection,
            database: start.database,
            durationMs,
          });
        }
      });

      client.on('commandFailed', (event: { requestId: number; failure?: unknown }) => {
        const start = startMap.get(event.requestId);
        if (!start) return;
        startMap.delete(event.requestId);
        logger.error('Mongo command failed', undefined, {
          command: start.commandName,
          collection: start.collection,
          database: start.database,
          durationMs: Date.now() - start.startedAt,
          failure: event.failure,
        });
      });
    }

    globalForMongoose.__mongoCommandMonitoringSetupDone = true;
  }

  return cached.conn;
}
