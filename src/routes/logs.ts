import express from "express"
import { ProxyLog } from "../models/ProxyLog"

const router = express.Router()

// Get logs with filtering and pagination
router.get("/", async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      method,
      statusCode,
      url,
      startDate,
      endDate,
      sortBy = "timestamp",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter: any = {}

    if (method) {
      filter.method = method
    }

    if (statusCode) {
      filter.statusCode = Number.parseInt(statusCode as string)
    }

    if (url) {
      filter.url = { $regex: url, $options: "i" }
    }

    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string)
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string)
      }
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1

    // Execute query with pagination
    const skip = (Number.parseInt(page as string) - 1) * Number.parseInt(limit as string)

    const [logs, total] = await Promise.all([
      ProxyLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number.parseInt(limit as string))
        .lean(),
      ProxyLog.countDocuments(filter),
    ])

    res.json({
      logs,
      pagination: {
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string),
        total,
        pages: Math.ceil(total / Number.parseInt(limit as string)),
      },
    })
  } catch (error) {
    next(error)
  }
})

// Get log statistics
router.get("/stats", async (req, res, next) => {
  try {
    const stats = await ProxyLog.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          successfulRequests: {
            $sum: { $cond: [{ $lt: ["$statusCode", 400] }, 1, 0] },
          },
          errorRequests: {
            $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
          },
        },
      },
    ])

    const methodStats = await ProxyLog.aggregate([
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
        },
      },
    ])

    const statusStats = await ProxyLog.aggregate([
      {
        $group: {
          _id: "$statusCode",
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      overview: stats[0] || {
        totalRequests: 0,
        avgResponseTime: 0,
        successfulRequests: 0,
        errorRequests: 0,
      },
      methodDistribution: methodStats,
      statusDistribution: statusStats,
    })
  } catch (error) {
    next(error)
  }
})

// Delete logs
router.delete("/", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    const filter: any = {}
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate as string)
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate as string)
      }
    }

    const result = await ProxyLog.deleteMany(filter)

    res.json({
      message: "Logs deleted successfully",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    next(error)
  }
})

export default router
