import mongoose, { type Document, Schema } from "mongoose"

export interface IProxyLog extends Document {
  method: string
  url: string
  targetUrl: string
  timestamp: Date
  statusCode: number
  responseTime: number
  userAgent?: string
  ipAddress?: string
  requestHeaders?: Record<string, string>
  responseHeaders?: Record<string, string>
  requestBody?: any
  responseBody?: any
  error?: string
}

const ProxyLogSchema = new Schema<IProxyLog>(
  {
    method: { type: String, required: true, index: true },
    url: { type: String, required: true, index: true },
    targetUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    statusCode: { type: Number, required: true, index: true },
    responseTime: { type: Number, required: true },
    userAgent: { type: String },
    ipAddress: { type: String, index: true },
    requestHeaders: { type: Schema.Types.Mixed },
    responseHeaders: { type: Schema.Types.Mixed },
    requestBody: { type: Schema.Types.Mixed },
    responseBody: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  {
    timestamps: true,
    collection: "proxy_logs",
  },
)

ProxyLogSchema.index({ timestamp: -1, method: 1 })
ProxyLogSchema.index({ timestamp: -1, statusCode: 1 })
ProxyLogSchema.index({ url: 1, timestamp: -1 })

// TTL index to automatically delete old logs (optional)
ProxyLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }) // 30 days

export const ProxyLog = mongoose.model<IProxyLog>("ProxyLog", ProxyLogSchema)
