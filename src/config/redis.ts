import { createClient } from "redis"
import { logger } from "../utils/logger"

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect()
    logger.info("Connected to Redis")

    redisClient.on("error", (error) => {
      logger.error("Redis connection error:", error)
    })

    redisClient.on("disconnect", () => {
      logger.warn("Redis disconnected")
    })
  } catch (error) {
    logger.warn("Failed to connect to Redis:", error)
  }
}
