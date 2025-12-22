import express from 'express'
import { getDatabase, COLLECTIONS } from '../config/database.js'

const router = express.Router()

// Get all NPCs
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase()
    const npcs = await db.collection(COLLECTIONS.NPCS).find({}).toArray()
    
    // Return in the same format as before
    res.json({ npcs: npcs })
  } catch (error) {
    console.error('Error fetching NPCs:', error)
    res.status(500).json({ error: 'Failed to read NPCs' })
  }
})

// Get single NPC
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase()
    const npc = await db.collection(COLLECTIONS.NPCS).findOne({ id: req.params.id })
    
    if (!npc) {
      return res.status(404).json({ error: 'NPC not found' })
    }
    
    res.json(npc)
  } catch (error) {
    console.error('Error fetching NPC:', error)
    res.status(500).json({ error: 'Failed to read NPC' })
  }
})

// Create/Update NPC
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase()
    const npc = req.body
    
    if (!npc.id) {
      return res.status(400).json({ error: 'NPC ID is required' })
    }
    
    // Upsert: update if exists, insert if not
    await db.collection(COLLECTIONS.NPCS).updateOne(
      { id: npc.id },
      { $set: npc },
      { upsert: true }
    )
    
    res.json(npc)
  } catch (error) {
    console.error('Error saving NPC:', error)
    res.status(500).json({ error: 'Failed to save NPC' })
  }
})

// Delete NPC
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase()
    const result = await db.collection(COLLECTIONS.NPCS).deleteOne({ id: req.params.id })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'NPC not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting NPC:', error)
    res.status(500).json({ error: 'Failed to delete NPC' })
  }
})

export default router
