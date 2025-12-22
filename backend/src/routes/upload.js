import express from 'express'
import { getDatabase, COLLECTIONS } from '../config/database.js'

const router = express.Router()

// Upload NPCs from JSON
router.post('/npcs', async (req, res) => {
  try {
    const db = await getDatabase()
    const { npcs } = req.body
    
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
    
    // Clear existing NPCs and insert new ones
    const collection = db.collection(COLLECTIONS.NPCS)
    await collection.deleteMany({})
    
    const result = await collection.insertMany(npcs)
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${result.insertedCount} NPCs`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error('Error uploading NPCs:', error)
    res.status(500).json({ error: 'Failed to upload NPCs', details: error.message })
  }
})

// Upload Missions from JSON
router.post('/missions', async (req, res) => {
  try {
    const db = await getDatabase()
    // Support both 'missions' and 'quests' keys for backwards compatibility
    const missions = req.body.missions || req.body.quests
    
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
    
    // Clear existing missions and insert new ones
    const collection = db.collection(COLLECTIONS.MISSIONS)
    await collection.deleteMany({})
    
    const result = await collection.insertMany(missions)
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${result.insertedCount} missions`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error('Error uploading missions:', error)
    res.status(500).json({ error: 'Failed to upload missions', details: error.message })
  }
})

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase()
    
    const npcCount = await db.collection(COLLECTIONS.NPCS).countDocuments()
    const missionCount = await db.collection(COLLECTIONS.MISSIONS).countDocuments()
    
    res.json({
      npcs: npcCount,
      missions: missionCount
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Export NPCs to JSON
router.get('/export/npcs', async (req, res) => {
  try {
    const db = await getDatabase()
    const npcs = await db.collection(COLLECTIONS.NPCS).find({}).toArray()
    
    // Remove MongoDB _id field from each document
    const cleanNpcs = npcs.map(({ _id, ...npc }) => npc)
    
    res.json({ npcs: cleanNpcs })
  } catch (error) {
    console.error('Error exporting NPCs:', error)
    res.status(500).json({ error: 'Failed to export NPCs', details: error.message })
  }
})

// Export Missions to JSON
router.get('/export/missions', async (req, res) => {
  try {
    const db = await getDatabase()
    const missions = await db.collection(COLLECTIONS.MISSIONS).find({}).toArray()
    
    // Remove MongoDB _id field from each document
    const cleanMissions = missions.map(({ _id, ...mission }) => mission)
    
    // Return with 'quests' key for compatibility with Unity game
    res.json({ quests: cleanMissions })
  } catch (error) {
    console.error('Error exporting missions:', error)
    res.status(500).json({ error: 'Failed to export missions', details: error.message })
  }
})

export default router

