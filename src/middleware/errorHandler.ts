import type { Request, Response, NextFunction } from "express"
import { logger } from "../utils/logger"

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): Response | void => {
  logger.error("Error occurred:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err: any) => err.message)
    return res.status(400).json({ error: "Validation Error", details: errors })
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0]
    return res.status(400).json({ error: `${field} already exists` })
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" })
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" })
  }

  // Default error
  return res.status(error.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  })
}
