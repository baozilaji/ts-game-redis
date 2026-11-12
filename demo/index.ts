import { RedisManager } from '../src/manager';

const redis = RedisManager.getRedisPool()

await redis.set("name", "eric");

await redis.hsetall("user", {"name": "eric", "age": "1", "level": "10"})

let name = await redis.get("name")
console.log(name);

console.log(redis.status)

console.log(await redis.hgetall("user"))

await redis.close()