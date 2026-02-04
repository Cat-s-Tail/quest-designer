import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDatabase, closeDatabase } from './config/database.js'
import uploadRoutes from './routes/upload.js'
import filesRoutes from './routes/files.js'
import itemsRoutes from './routes/items.js'
import containersRoutes from './routes/containers.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001

// CORS configuration - allow frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'http://localhost:3000'] 
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
}

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 增加到 100 次/分钟
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter rate limit for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // 增加到 50 次/分钟
  message: 'Too many uploads from this IP, please try again later.',
})

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Apply rate limiting
app.use('/api/', limiter)
app.use('/api/upload', uploadLimiter)

// Routes
app.use('/api/upload', uploadRoutes)
app.use('/api/files', filesRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/containers', containersRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

// Connect to MongoDB and start server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  await closeDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...')
  await closeDatabase()
  process.exit(0)
})

