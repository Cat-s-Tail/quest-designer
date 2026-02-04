import express from 'express'
import ContainerFile from '../models/Container.js'

const router = express.Router()

// Get all container files for a project
router.get('/files', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ContainerFile.find({ project }).lean()
    
    res.json({ files })
  } catch (error) {
    console.error('Error fetching container files:', error)
    res.status(500).json({ error: 'Failed to read container files' })
  }
})

// Get a specific container file
router.get('/files/:filename', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const filename = req.params.filename
    
    const file = await ContainerFile.findOne({ project, filename }).lean()
    
    if (!file) {
      return res.status(404).json({ error: 'Container file not found' })
    }
    
    res.json(file)
  } catch (error) {
    console.error('Error fetching container file:', error)
    res.status(500).json({ error: 'Failed to read container file' })
  }
})

// Create/Update container file
router.post('/files', async (req, res) => {
  try {
    const { filename, containers } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' })
    }
    
    // Upsert: update if exists, insert if not
    const result = await ContainerFile.findOneAndUpdate(
      { project, filename },
      { project, filename, containers },
      { upsert: true, new: true }
    ).lean()
    
    res.json(result)
  } catch (error) {
    console.error('Error saving container file:', error)
    res.status(500).json({ error: 'Failed to save container file' })
  }
})

// Delete container file
router.delete('/files/:filename', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const filename = req.params.filename
    
    const result = await ContainerFile.deleteOne({ project, filename })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Container file not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting container file:', error)
    res.status(500).json({ error: 'Failed to delete container file' })
  }
})

export default router
