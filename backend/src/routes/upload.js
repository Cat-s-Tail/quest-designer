import express from 'express'
import NPC from '../models/NPC.js'
import Quest from '../models/Quest.js'

const router = express.Router()

// Upload NPCs from JSON
router.post('/npcs', async (req, res) => {
  try {
    const { npcs } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!npcs || !Array.isArray(npcs)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { npcs: [...] }' })
    }
    
    if (npcs.length === 0) {
      return res.status(400).json({ error: 'No NPCs to upload' })
    }
    
    // Validate that each NPC has an id
    for (const npc of npcs) {
      if (!npc.id) {
        return res.status(400).json({ error: 'All NPCs must have an id field' })
      }
    }
    
    // Use bulkWrite for upsert operations (will overwrite if exists)
    const operations = npcs.map(npc => ({
      updateOne: {
        filter: { project, id: npc.id },
        update: { $set: { ...npc, project } },
        upsert: true
      }
    }))
    
    const result = await NPC.bulkWrite(operations)
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${npcs.length} NPCs (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
      count: npcs.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount
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
    const project = req.query.project || req.body.project || 'default'
    
    if (!missions || !Array.isArray(missions)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { missions: [...] } or { quests: [...] }' })
    }
    
    if (missions.length === 0) {
      return res.status(400).json({ error: 'No missions to upload' })
    }
    
    // Validate that each mission has an id
    for (const mission of missions) {
      if (!mission.id) {
        return res.status(400).json({ error: 'All missions must have an id field' })
      }
    }
    
    // Use bulkWrite for upsert operations (will overwrite if exists)
    const operations = missions.map(mission => ({
      updateOne: {
        filter: { project, id: mission.id },
        update: { $set: { ...mission, project } },
        upsert: true
      }
    }))
    
    const result = await Quest.bulkWrite(operations)
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${missions.length} missions (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
      count: missions.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount
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
    
    const npcCount = await NPC.countDocuments({ project })
    const missionCount = await Quest.countDocuments({ project })
    
    // Also get total counts and list of projects
    const allProjects = await NPC.distinct('project')
    const questProjects = await Quest.distinct('project')
    const uniqueProjects = [...new Set([...allProjects, ...questProjects])]
    
    res.json({
      npcs: npcCount,
      missions: missionCount,
      currentProject: project,
      allProjects: uniqueProjects
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Export NPCs to JSON
router.get('/export/npcs', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const npcs = await NPC.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    res.json({ npcs })
  } catch (error) {
    console.error('Error exporting NPCs:', error)
    res.status(500).json({ error: 'Failed to export NPCs', details: error.message })
  }
})

// Export Missions to JSON
router.get('/export/missions', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const missions = await Quest.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Return with 'quests' key for compatibility with Unity game
    res.json({ quests: missions })
  } catch (error) {
    console.error('Error exporting missions:', error)
    res.status(500).json({ error: 'Failed to export missions', details: error.message })
  }
})

export default router
