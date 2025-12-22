import express from 'express'
import Quest from '../models/Quest.js'

const router = express.Router()

// Get all quests for a project
router.get('/', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const quests = await Quest.find({ project }).lean()
    
    res.json({ quests })
  } catch (error) {
    console.error('Error fetching quests:', error)
    res.status(500).json({ error: 'Failed to read quests' })
  }
})

// Get single quest
router.get('/:id', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const quest = await Quest.findOne({ project, id: req.params.id }).lean()
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' })
    }
    
    res.json(quest)
  } catch (error) {
    console.error('Error fetching quest:', error)
    res.status(500).json({ error: 'Failed to read quest' })
  }
})

// Create/Update quest
router.post('/', async (req, res) => {
  try {
    const quest = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!quest.id) {
      return res.status(400).json({ error: 'Quest ID is required' })
    }
    
    // Add project to the quest data
    quest.project = project
    
    // Upsert: update if exists, insert if not (based on compound unique key)
    const result = await Quest.findOneAndUpdate(
      { project, id: quest.id },
      quest,
      { upsert: true, new: true }
    ).lean()
    
    res.json(result)
  } catch (error) {
    console.error('Error saving quest:', error)
    res.status(500).json({ error: 'Failed to save quest' })
  }
})

// Delete quest
router.delete('/:id', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const result = await Quest.deleteOne({ project, id: req.params.id })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Quest not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting quest:', error)
    res.status(500).json({ error: 'Failed to delete quest' })
  }
})

export default router
