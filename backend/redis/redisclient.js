import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@gusc1-amusing-malamute-31768.upstash.io:31768`
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();

export default redisClient;
