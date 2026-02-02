import express from 'express'
import NPCFile from '../models/NPC.js'
import QuestFile from '../models/Quest.js'

const router = express.Router()

// Get list of files
router.get('/files', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    
    const npcFiles = await NPCFile.find({ project }).select('filename').lean()
    const questFiles = await QuestFile.find({ project }).select('filename').lean()
    
    const files = {
      npcs: npcFiles.map(f => f.filename),
      quests: questFiles.map(f => f.filename),
      other: []
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
    const project = req.query.project || 'default'

    if (!filePath) {
      return res.status(400).json({ error: 'path query parameter is required' })
    }

    // Determine if it's an NPC or Quest file
    let content
    if (filePath.includes('npc')) {
      const file = await NPCFile.findOne({ project, filename: filePath }).select('-_id -__v -createdAt -updatedAt').lean()
      if (!file) {
        return res.status(404).json({ error: 'File not found' })
      }
      content = { npcs: file.npcs }
    } else if (filePath.includes('quest')) {
      const file = await QuestFile.findOne({ project, filename: filePath }).select('-_id -__v -createdAt -updatedAt').lean()
      if (!file) {
        return res.status(404).json({ error: 'File not found' })
      }
      content = { quests: file.quests }
    } else {
      return res.status(400).json({ error: 'Cannot determine file type from path' })
    }

    res.json(content)
  } catch (error) {
    res.status(500).json({ error: `Failed to read file: ${error.message}` })
  }
})

// Save file content
router.post('/file', async (req, res) => {
  try {
    const { path: filePath, content } = req.body
    const project = req.query.project || req.body.project || 'default'

    if (!filePath || !content) {
      return res.status(400).json({ error: 'path and content are required' })
    }

    // Determine if it's an NPC or Quest file and save
    if (filePath.includes('npc') && content.npcs) {
      await NPCFile.findOneAndUpdate(
        { project, filename: filePath },
        { project, filename: filePath, npcs: content.npcs },
        { upsert: true, new: true }
      )
    } else if (filePath.includes('quest') && content.quests) {
      await QuestFile.findOneAndUpdate(
        { project, filename: filePath },
        { project, filename: filePath, quests: content.quests },
        { upsert: true, new: true }
      )
    } else {
      return res.status(400).json({ error: 'Invalid file type or content format' })
    }

    res.json({ success: true, path: filePath })
  } catch (error) {
    res.status(500).json({ error: `Failed to save file: ${error.message}` })
  }
})

// Create new file
router.post('/create', async (req, res) => {
  try {
    const { path: filePath, template = 'npcs' } = req.body
    const project = req.query.project || req.body.project || 'default'

    if (!filePath) {
      return res.status(400).json({ error: 'path is required' })
    }

    // Check if file exists
    if (template === 'npcs') {
      const existing = await NPCFile.findOne({ project, filename: filePath })
      if (existing) {
        return res.status(409).json({ error: 'File already exists' })
      }
      await NPCFile.create({ project, filename: filePath, npcs: [] })
    } else if (template === 'quests') {
      const existing = await QuestFile.findOne({ project, filename: filePath })
      if (existing) {
        return res.status(409).json({ error: 'File already exists' })
      }
      await QuestFile.create({ project, filename: filePath, quests: [] })
    }

    const content = template === 'npcs' ? { npcs: [] } : { quests: [] }
    res.json({ success: true, path: filePath, content })
  } catch (error) {
    res.status(500).json({ error: `Failed to create file: ${error.message}` })
  }
})

// Delete file
router.delete('/file', async (req, res) => {
  try {
    const { path: filePath } = req.query
    const project = req.query.project || 'default'

    if (!filePath) {
      return res.status(400).json({ error: 'path query parameter is required' })
    }

    // Determine if it's an NPC or Quest file and delete
    if (filePath.includes('npc')) {
      await NPCFile.deleteOne({ project, filename: filePath })
    } else if (filePath.includes('quest')) {
      await QuestFile.deleteOne({ project, filename: filePath })
    } else {
      return res.status(400).json({ error: 'Cannot determine file type from path' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: `Failed to delete file: ${error.message}` })
  }
})

// Clear all data for a project
router.post('/clear-project', async (req, res) => {
  try {
    const project = req.query.project || req.body.project || 'default'

    // Delete all NPCs and Quests for this project
    const npcResult = await NPCFile.deleteMany({ project })
    const questResult = await QuestFile.deleteMany({ project })

    res.json({ 
      success: true, 
      deletedNPCs: npcResult.deletedCount,
      deletedQuests: questResult.deletedCount,
      project 
    })
  } catch (error) {
    res.status(500).json({ error: `Failed to clear project data: ${error.message}` })
  }
})

export default router
