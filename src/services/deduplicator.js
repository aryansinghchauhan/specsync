import Redis from 'ioredis'

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    })

redis.on('connect', () => console.log('[SpecSync] Redis connected'))
redis.on('error', (err) => console.error('[SpecSync] Redis error:', err.message))

// How long to suppress duplicate violations (in seconds)
// Default: 1 hour — same violation won't fire again for 60 minutes
const DEDUP_WINDOW = parseInt(process.env.DEDUP_WINDOW_SECONDS || '3600')

/**
 * Returns true if this violation is NEW (not seen recently)
 * Returns false if we already logged this violation recently (duplicate)
 *
 * Key format: "specsync:violation:GET /users:/0/id:must be integer"
 * TTL: DEDUP_WINDOW seconds — after that, violation is "fresh" again
 */
export async function isNewViolation(method, path, errors) {
  // Build a unique fingerprint from method + path + error fields
  const fingerprint = errors
    .map(e => `${e.field}:${e.message}`)
    .sort()
    .join('|')

  const key = `specsync:violation:${method}:${path}:${fingerprint}`

  // NX = only set if key doesn't exist, EX = expire after DEDUP_WINDOW seconds
  const result = await redis.set(key, '1', 'EX', DEDUP_WINDOW, 'NX')

  // result is 'OK' if key was newly created (new violation)
  // result is null if key already existed (duplicate — suppress it)
  return result === 'OK'
}

export async function getRedisClient() {
  return redis
}

export async function closeRedis() {
  await redis.quit()
}