import express from 'express'
import { getDatabase, COLLECTIONS } from '../config/database.js'

const router = express.Router()

// Get all missions (quests)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase()
    const missions = await db.collection(COLLECTIONS.MISSIONS).find({}).toArray()
    
    // Return in the same format as before
    res.json({ quests: missions })
  } catch (error) {
    console.error('Error fetching missions:', error)
    res.status(500).json({ error: 'Failed to read missions' })
  }
})

// Get single mission
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase()
    const mission = await db.collection(COLLECTIONS.MISSIONS).findOne({ id: req.params.id })
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission not found' })
    }
    
    res.json(mission)
  } catch (error) {
    console.error('Error fetching mission:', error)
    res.status(500).json({ error: 'Failed to read mission' })
  }
})

// Create/Update mission
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase()
    const mission = req.body
    
    if (!mission.id) {
      return res.status(400).json({ error: 'Mission ID is required' })
    }
    
    // Upsert: update if exists, insert if not
    await db.collection(COLLECTIONS.MISSIONS).updateOne(
      { id: mission.id },
      { $set: mission },
      { upsert: true }
    )
    
    res.json(mission)
  } catch (error) {
    console.error('Error saving mission:', error)
    res.status(500).json({ error: 'Failed to save mission' })
  }
})

// Delete mission
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase()
    const result = await db.collection(COLLECTIONS.MISSIONS).deleteOne({ id: req.params.id })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Mission not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting mission:', error)
    res.status(500).json({ error: 'Failed to delete mission' })
  }
})

export default router
