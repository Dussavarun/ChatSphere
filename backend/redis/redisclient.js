// import {createClient} from "redis";

// const redisClient = createClient();

// redisClient.on("error", (err) => console.error("Redis Client Error", err));

// await redisClient.connect();

// export default redisClient;

import { Redis } from '@upstash/redis'

const redisClient = new Redis({
  url: 'https://gusc1-amusing-malamute-31768.upstash.io',
  token: 'AXwYASQgNTdhMGMzY2YtYmI1OC00Y2Q2LThhMWEtYmUxYzVmNTAyYjE0YWFmM2FjNWVjMmU2NGQ2YmEzMGRiNGE5OGZhMzBhMDQ=',
})

export default redisClient;



