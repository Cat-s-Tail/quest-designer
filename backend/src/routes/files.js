import express from 'express'
import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_PATH = path.resolve(__dirname, '../../../data')

// Get list of files
router.get('/files', async (req, res) => {
  try {
    const files = {
      npcs: [],
      quests: [],
      other: []
    }

    // Get files from data folder
    const items = await fs.readdir(DATA_PATH, { recursive: true })

    for (const item of items) {
      const fullPath = path.join(DATA_PATH, item)
      const stat = await fs.stat(fullPath)

      if (!stat.isFile()) continue
      if (item.endsWith('.meta')) continue
      if (!item.endsWith('.json')) continue

      if (item.includes('npc')) {
        files.npcs.push(item)
      } else if (item.includes('quest')) {
        files.quests.push(item)
      } else {
        files.other.push(item)
      }
    }

    res.json(files)
  } catch (error) {
    res.status(500).json({ error: `Failed to list files: ${error.message}` })
  }
})

// Get file content
router.get('/file', async (req, res) => {
  try {
    const { path: filePath } = req.query

    if (!filePath) {
      return res.status(400).json({ error: 'path query parameter is required' })
    }

    const fullPath = path.resolve(DATA_PATH, filePath)

    // Prevent directory traversal
    if (!fullPath.startsWith(DATA_PATH)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const content = await fs.readJSON(fullPath)
    res.json(content)
  } catch (error) {
    res.status(500).json({ error: `Failed to read file: ${error.message}` })
  }
})

// Save file content
router.post('/file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body

    if (!filePath || !content) {
      return res.status(400).json({ error: 'path and content are required' })
    }

    const fullPath = path.resolve(DATA_PATH, filePath)

    // Prevent directory traversal
    if (!fullPath.startsWith(DATA_PATH)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath))

    // Save file
    await fs.writeJSON(fullPath, content, { spaces: 2 })

    res.json({ success: true, path: filePath })
  } catch (error) {
    res.status(500).json({ error: `Failed to save file: ${error.message}` })
  }
})

// Create new file
router.post('/create', async (req, res) => {
  try {
    const { path: filePath, template = 'npcs' } = req.body

    if (!filePath) {
      return res.status(400).json({ error: 'path is required' })
    }

    const fullPath = path.resolve(DATA_PATH, filePath)

    // Prevent directory traversal
    if (!fullPath.startsWith(DATA_PATH)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if file exists
    if (await fs.pathExists(fullPath)) {
      return res.status(409).json({ error: 'File already exists' })
    }

    let content = {}

    if (template === 'npcs') {
      content = { npcs: [] }
    } else if (template === 'quests') {
      content = { quests: [] }
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath))

    // Create file
    await fs.writeJSON(fullPath, content, { spaces: 2 })

    res.json({ success: true, path: filePath, content })
  } catch (error) {
    res.status(500).json({ error: `Failed to create file: ${error.message}` })
  }
})

// Delete file
router.delete('/file', async (req, res) => {
  try {
    const { path: filePath } = req.query

    if (!filePath) {
      return res.status(400).json({ error: 'path query parameter is required' })
    }

    const fullPath = path.resolve(DATA_PATH, filePath)

    // Prevent directory traversal
    if (!fullPath.startsWith(DATA_PATH)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await fs.remove(fullPath)

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: `Failed to delete file: ${error.message}` })
  }
})

export default router

