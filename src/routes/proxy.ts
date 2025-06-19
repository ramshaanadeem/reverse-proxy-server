import express from "express"
import { createProxyMiddleware as proxyMiddleware, type Options } from "http-proxy-middleware"
import { ProxyLog } from "../models/ProxyLog"
import { ProxyConfig } from "../models/ProxyConfig"
import { redisClient } from "../config/redis"
import { logger } from "../utils/logger"
import rateLimit from "express-rate-limit"

const router = express.Router()

// Dynamic rate limiter based on config
const createDynamicRateLimit = async () => {
  const config = (await ProxyConfig.findOne()) || new ProxyConfig()

  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.maxRequestsPerMinute,
    skip: () => !config.rateLimitEnabled,
    message: "Rate limit exceeded. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  })
}
function bufferBody(req: any) {
  if (!req.body) return null
  const body = JSON.stringify(req.body)
  return Buffer.from(body)
}

// Proxy middleware with logging and caching
const createProxy = () => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    const startTime = Date.now()
    const config = (await ProxyConfig.findOne()) || new ProxyConfig()

    // Check if endpoint is blacklisted
    if (config.blacklistedEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
      res.status(403).json({ error: "Endpoint is blacklisted" })
      return Promise.resolve()
    }

    // Check if endpoint is whitelisted (if whitelist is not empty)
    if (config.whitelistedEndpoints.length > 0) {
      const isWhitelisted = config.whitelistedEndpoints.some((endpoint) => req.path.startsWith(endpoint))
      if (!isWhitelisted) {
        res.status(403).json({ error: "Endpoint not whitelisted" })
        return Promise.resolve()
      }
    }

    // Check cache if enabled
    if (config.cacheEnabled && req.method === "GET") {
      try {
        const cacheKey = `proxy:${req.path}:${JSON.stringify(req.query)}`
        const cachedResponse = await redisClient.get(cacheKey)

        if (cachedResponse) {
          logger.info(`Cache hit for ${req.path}`)
          res.json(JSON.parse(cachedResponse))
          return Promise.resolve()
        }
      } catch (error) {
        logger.warn("Cache check failed:", error)
      }
    }

    // Create proxy options
    const proxyOptions: Options = {
      target: config.targetUrl,
      changeOrigin: true,
      timeout: config.timeout,
      pathRewrite: {
        "^/api/users": "/users",
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader("Connection", "close")
        logger.info(`Proxying ${req.method} ${req.path} to ${config.targetUrl}`)
        if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
          if (req.body) {
            const bodyData = JSON.stringify(req.body)
      
            proxyReq.setHeader("Content-Type", "application/json")
            proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData))
      
            proxyReq.write(bodyData)
          }
        }
      },
      onProxyRes: async (proxyRes, req, res) => {
        const responseTime = Date.now() - startTime

        // Log the request if logging is enabled
        if (config.loggingEnabled) {
          try {
            const logData = {
              method: req.method,
              url: req.path,
              targetUrl: `${config.targetUrl}${req.path}`,
              timestamp: new Date(),
              statusCode: proxyRes.statusCode || 0,
              responseTime,
              userAgent: req.get("User-Agent"),
              ipAddress: req.ip,
              requestHeaders: config.logRequestBody ? req.headers : undefined,
              responseHeaders: config.logResponseBody ? proxyRes.headers : undefined,
            }

            await ProxyLog.create(logData)
          } catch (error) {
            logger.error("Failed to log proxy request:", error)
          }
        }

        // Cache successful GET responses if caching is enabled
        if (config.cacheEnabled && req.method === "GET" && proxyRes.statusCode === 200) {
          try {
            let body = ""
            proxyRes.on("data", (chunk) => {
              body += chunk
            })

            proxyRes.on("end", async () => {
              try {
                const cacheKey = `proxy:${req.path}:${JSON.stringify(req.query)}`
                await redisClient.setEx(cacheKey, config.cacheTTL, body)
                logger.info(`Cached response for ${req.path}`)
              } catch (error) {
                logger.warn("Failed to cache response:", error)
              }
            })
          } catch (error) {
            logger.warn("Cache storage failed:", error)
          }
        }
      },
      onError: async (err, req, res) => {
        const responseTime = Date.now() - startTime

        logger.error("Proxy error:", err)

        // Log the error if logging is enabled
        if (config.loggingEnabled) {
          try {
            await ProxyLog.create({
              method: req.method,
              url: req.path,
              targetUrl: `${config.targetUrl}${req.path}`,
              timestamp: new Date(),
              statusCode: 500,
              responseTime,
              userAgent: req.get("User-Agent"),
              ipAddress: req.ip,
              error: err.message,
            })
          } catch (logError) {
            logger.error("Failed to log proxy error:", logError)
          }
        }

        res.status(500).json({ error: "Proxy request failed" })
      },
    }

    // Apply proxy middleware
    const proxy = proxyMiddleware(proxyOptions)
    return proxy(req, res, next)
  }
}

// Apply rate limiting and proxy middleware
router.use(async (req, res, next) => {
  const rateLimiter = await createDynamicRateLimit()
  rateLimiter(req, res, next)
})

router.use("/*", createProxy())

export default router
