import mongoose from "mongoose"
import { logger } from "../utils/logger"

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/reverse-proxy"

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    })

    logger.info("Connected to MongoDB")

    mongoose.connection.on("error", (error) => {
      logger.error("MongoDB connection error:", error)
    })

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected")
    })

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected")
    })
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error)
    throw error
  }
}
