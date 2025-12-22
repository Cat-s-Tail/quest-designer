import express from 'express'
import archiver from 'archiver'
import NPCFile from '../models/NPC.js'
import QuestFile from '../models/Quest.js'

const router = express.Router()

// Upload NPCs from JSON
router.post('/npcs', async (req, res) => {
  try {
    const { npcs, filename } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!npcs || !Array.isArray(npcs)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { npcs: [...], filename: "..." }' })
    }
    
    if (npcs.length === 0) {
      return res.status(400).json({ error: 'No NPCs to upload' })
    }

    // Use filename from request or generate one
    const targetFilename = filename || `npcs/npcs_${Date.now()}.json`
    
    // Validate that each NPC has an id
    for (const npc of npcs) {
      if (!npc.id) {
        return res.status(400).json({ error: 'All NPCs must have an id field' })
      }
    }
    
    // Upsert the file
    const result = await NPCFile.findOneAndUpdate(
      { project, filename: targetFilename },
      { project, filename: targetFilename, npcs },
      { upsert: true, new: true }
    )
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${npcs.length} NPCs to ${targetFilename}`,
      count: npcs.length,
      filename: targetFilename
    })
  } catch (error) {
    console.error('Error uploading NPCs:', error)
    res.status(500).json({ error: 'Failed to upload NPCs', details: error.message })
  }
})

// Upload Missions from JSON
router.post('/missions', async (req, res) => {
  try {
    // Support both 'missions' and 'quests' keys for backwards compatibility
    const quests = req.body.missions || req.body.quests
    const { filename } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!quests || !Array.isArray(quests)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { quests: [...], filename: "..." } or { missions: [...] }' })
    }
    
    if (quests.length === 0) {
      return res.status(400).json({ error: 'No quests to upload' })
    }

    // Use filename from request or generate one
    const targetFilename = filename || `quests/quests_${Date.now()}.json`
    
    // Validate that each quest has an id
    for (const quest of quests) {
      if (!quest.id) {
        return res.status(400).json({ error: 'All quests must have an id field' })
      }
    }
    
    // Upsert the file
    const result = await QuestFile.findOneAndUpdate(
      { project, filename: targetFilename },
      { project, filename: targetFilename, quests },
      { upsert: true, new: true }
    )
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${quests.length} quests to ${targetFilename}`,
      count: quests.length,
      filename: targetFilename
    })
  } catch (error) {
    console.error('Error uploading quests:', error)
    res.status(500).json({ error: 'Failed to upload quests', details: error.message })
  }
})

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    
    // Count total NPCs and Quests across all files
    const npcFiles = await NPCFile.find({ project }).lean()
    const questFiles = await QuestFile.find({ project }).lean()
    
    const npcCount = npcFiles.reduce((sum, file) => sum + (file.npcs?.length || 0), 0)
    const questCount = questFiles.reduce((sum, file) => sum + (file.quests?.length || 0), 0)
    
    // Get list of unique projects
    const npcProjects = await NPCFile.distinct('project')
    const questProjects = await QuestFile.distinct('project')
    const uniqueProjects = [...new Set([...npcProjects, ...questProjects])]
    
    res.json({
      npcs: npcCount,
      missions: questCount,
      npcFiles: npcFiles.length,
      questFiles: questFiles.length,
      currentProject: project,
      allProjects: uniqueProjects
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Export NPCs to JSON (all files combined)
router.get('/export/npcs', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await NPCFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Combine all NPCs from all files
    const allNpcs = files.flatMap(file => file.npcs || [])
    
    res.json({ npcs: allNpcs })
  } catch (error) {
    console.error('Error exporting NPCs:', error)
    res.status(500).json({ error: 'Failed to export NPCs', details: error.message })
  }
})

// Export NPCs to ZIP file (one JSON per file)
router.get('/export/npcs/zip', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await NPCFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No NPC files found for this project' })
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="npcs_${project}_${Date.now()}.zip"`)

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add each file
    files.forEach(file => {
      const filename = file.filename.replace(/\//g, '_').replace(/[^a-z0-9_.-]/gi, '_')
      archive.append(JSON.stringify({ npcs: file.npcs }, null, 2), { name: filename })
    })

    // Finalize the archive
    await archive.finalize()
  } catch (error) {
    console.error('Error exporting NPCs ZIP:', error)
    res.status(500).json({ error: 'Failed to export NPCs ZIP', details: error.message })
  }
})

// Export Missions to JSON (all files combined)
router.get('/export/missions', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await QuestFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Combine all quests from all files
    const allQuests = files.flatMap(file => file.quests || [])
    
    // Return with 'quests' key for compatibility with Unity game
    res.json({ quests: allQuests })
  } catch (error) {
    console.error('Error exporting missions:', error)
    res.status(500).json({ error: 'Failed to export missions', details: error.message })
  }
})

// Export Missions to ZIP file (one JSON per file)
router.get('/export/missions/zip', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await QuestFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No quest files found for this project' })
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="missions_${project}_${Date.now()}.zip"`)

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add each file
    files.forEach(file => {
      const filename = file.filename.replace(/\//g, '_').replace(/[^a-z0-9_.-]/gi, '_')
      archive.append(JSON.stringify({ quests: file.quests }, null, 2), { name: filename })
    })

    // Finalize the archive
    await archive.finalize()
  } catch (error) {
    console.error('Error exporting missions ZIP:', error)
    res.status(500).json({ error: 'Failed to export missions ZIP', details: error.message })
  }
})

export default router
