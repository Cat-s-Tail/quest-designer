import express from 'express'
import archiver from 'archiver'
import NPCFile from '../models/NPC.js'
import MissionFile from '../models/Quest.js'

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
    const missions = req.body.missions || req.body.quests
    const { filename } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!missions || !Array.isArray(missions)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { missions: [...], filename: "..." }' })
    }
    
    if (missions.length === 0) {
      return res.status(400).json({ error: 'No missions to upload' })
    }

    // Use filename from request or generate one
    const targetFilename = filename || `missions/missions_${Date.now()}.json`
    
    // Validate that each mission has an id
    for (const mission of missions) {
      if (!mission.id) {
        return res.status(400).json({ error: 'All missions must have an id field' })
      }
    }
    
    // Upsert the file - always use 'missions' key
    const result = await MissionFile.findOneAndUpdate(
      { project, filename: targetFilename },
      { project, filename: targetFilename, missions },
      { upsert: true, new: true }
    )
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${missions.length} missions to ${targetFilename}`,
      count: missions.length,
      filename: targetFilename
    })
  } catch (error) {
    console.error('Error uploading missions:', error)
    res.status(500).json({ error: 'Failed to upload missions', details: error.message })
  }
})

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    
    // Count total NPCs and Missions across all files
    const npcFiles = await NPCFile.find({ project }).lean()
    const missionFiles = await MissionFile.find({ project }).lean()
    
    const npcCount = npcFiles.reduce((sum, file) => sum + (file.npcs?.length || 0), 0)
    const missionCount = missionFiles.reduce((sum, file) => sum + (file.missions?.length || 0), 0)
    
    // Get list of unique projects
    const npcProjects = await NPCFile.distinct('project')
    const missionProjects = await MissionFile.distinct('project')
    const uniqueProjects = [...new Set([...npcProjects, ...missionProjects])]
    
    res.json({
      npcs: npcCount,
      missions: missionCount,
      npcFiles: npcFiles.length,
      missionFiles: missionFiles.length,
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
    const files = await MissionFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Combine all missions from all files
    const allMissions = files.flatMap(file => file.missions || [])
    
    // Return with 'missions' key
    res.json({ missions: allMissions })
  } catch (error) {
    console.error('Error exporting missions:', error)
    res.status(500).json({ error: 'Failed to export missions', details: error.message })
  }
})

// Export Missions to ZIP file (one JSON per file)
router.get('/export/missions/zip', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await MissionFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No mission files found for this project' })
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
      archive.append(JSON.stringify({ missions: file.missions }, null, 2), { name: filename })
    })

    // Finalize the archive
    await archive.finalize()
  } catch (error) {
    console.error('Error exporting missions ZIP:', error)
    res.status(500).json({ error: 'Failed to export missions ZIP', details: error.message })
  }
})

export default router
