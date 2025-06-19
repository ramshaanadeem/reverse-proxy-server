import mongoose, { type Document, Schema } from "mongoose"

export interface IProxyConfig extends Document {
  loggingEnabled: boolean
  whitelistedEndpoints: string[]
  blacklistedEndpoints: string[]
  rateLimitEnabled: boolean
  maxRequestsPerMinute: number
  maxRequestsPerHour: number
  cacheEnabled: boolean
  cacheTTL: number
  targetUrl: string
  timeout: number
  retryAttempts: number
  logRequestBody: boolean
  logResponseBody: boolean
  maxLogSize: number
}

const ProxyConfigSchema = new Schema<IProxyConfig>(
  {
    loggingEnabled: { type: Boolean, default: true },
    whitelistedEndpoints: [{ type: String }],
    blacklistedEndpoints: [{ type: String }],
    rateLimitEnabled: { type: Boolean, default: false },
    maxRequestsPerMinute: { type: Number, default: 100 },
    maxRequestsPerHour: { type: Number, default: 1000 },
    cacheEnabled: { type: Boolean, default: false },
    cacheTTL: { type: Number, default: 300 }, // 5 minutes
    targetUrl: { type: String, default: "https://jsonplaceholder.typicode.com" },
    timeout: { type: Number, default: 30000 }, // 30 seconds
    retryAttempts: { type: Number, default: 3 },
    logRequestBody: { type: Boolean, default: false },
    logResponseBody: { type: Boolean, default: false },
    maxLogSize: { type: Number, default: 1024 * 1024 }, // 1MB
  },
  {
    timestamps: true,
  },
)

export const ProxyConfig = mongoose.model<IProxyConfig>("ProxyConfig", ProxyConfigSchema)
