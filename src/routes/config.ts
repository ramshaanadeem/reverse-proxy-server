import express from "express"
import Joi from "joi"
import { ProxyConfig } from "../models/ProxyConfig"
import { create } from "domain"


const router = express.Router()

// Validation schema
const configSchema = Joi.object({
  loggingEnabled: Joi.boolean(),
  whitelistedEndpoints: Joi.array().items(Joi.string()),
  blacklistedEndpoints: Joi.array().items(Joi.string()),
  rateLimitEnabled: Joi.boolean(),
  maxRequestsPerMinute: Joi.number().min(1).max(10000),
  maxRequestsPerHour: Joi.number().min(1).max(100000),
  cacheEnabled: Joi.boolean(),
  cacheTTL: Joi.number().min(1).max(86400),
  targetUrl: Joi.string().uri(),
  timeout: Joi.number().min(1000).max(300000),
  retryAttempts: Joi.number().min(0).max(10),
  logRequestBody: Joi.boolean(),
  logResponseBody: Joi.boolean(),
  maxLogSize: Joi.number().min(1024).max(10485760),
  _id: Joi.string().optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
})

// Get current configuration
router.get("/", async (req, res, next) => {
  try {
    let config = await ProxyConfig.findOne()

    if (!config) {
      // Create default configuration
      config = new ProxyConfig()
      await config.save()
    }

    res.json(config)
  } catch (error) {
    next(error)
  }
})

// Update configuration (admin only)
router.put("/", async (req, res, next) => {
  try {
    const { error, value } = configSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }

    let config = await ProxyConfig.findOne()

    if (!config) {
      config = new ProxyConfig(value)
    } else {
      Object.assign(config, value)
    }

    await config.save()


    return res.json({
      message: "Configuration updated successfully",
      config,
    })
  } catch (error) {
    return next(error)
  }
})

// Reset configuration to defaults 
router.post("/reset", async (req, res, next) => {
  try {
    await ProxyConfig.deleteMany({})
    const config = new ProxyConfig()
    await config.save()


    res.json({
      message: "Configuration reset to defaults",
      config,
    })
  } catch (error) {
    next(error)
  }
})

export default router
