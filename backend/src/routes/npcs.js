import express from 'express'
import NPC from '../models/NPC.js'

const router = express.Router()

// Get all NPCs for a project
router.get('/', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const npcs = await NPC.find({ project }).lean()
    
    res.json({ npcs })
  } catch (error) {
    console.error('Error fetching NPCs:', error)
    res.status(500).json({ error: 'Failed to read NPCs' })
  }
})

// Get single NPC
router.get('/:id', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const npc = await NPC.findOne({ project, id: req.params.id }).lean()
    
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
    const npc = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!npc.id) {
      return res.status(400).json({ error: 'NPC ID is required' })
    }
    
    // Add project to the NPC data
    npc.project = project
    
    // Upsert: update if exists, insert if not (based on compound unique key)
    const result = await NPC.findOneAndUpdate(
      { project, id: npc.id },
      npc,
      { upsert: true, new: true }
    ).lean()
    
    res.json(result)
  } catch (error) {
    console.error('Error saving NPC:', error)
    res.status(500).json({ error: 'Failed to save NPC' })
  }
})

// Delete NPC
router.delete('/:id', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const result = await NPC.deleteOne({ project, id: req.params.id })
    
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
