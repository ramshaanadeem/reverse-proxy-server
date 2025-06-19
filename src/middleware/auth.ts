import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { logger } from "../utils/logger"

export interface AuthRequest extends Request {
  user?: any
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const user = await User.findById(decoded.userId).select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token or user inactive." })
    }

    req.user = user
    next()
    return
  } catch (error) {
    logger.error("Auth middleware error:", error)
    return res.status(401).json({ error: "Invalid token." })
  }
}