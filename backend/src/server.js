import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDatabase, closeDatabase } from './config/database.js'
import questRoutes from './routes/quests.js'
import npcRoutes from './routes/npcs.js'
import uploadRoutes from './routes/upload.js'
import filesRoutes from './routes/files.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Routes
app.use('/api/quests', questRoutes)
app.use('/api/missions', questRoutes) // Alias for quests -> missions
app.use('/api/npcs', npcRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/files', filesRoutes)

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

