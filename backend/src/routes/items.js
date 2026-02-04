import express from 'express'
import ItemFile from '../models/Item.js'

const router = express.Router()

// Get all item files for a project
router.get('/files', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ItemFile.find({ project }).lean()
    
    res.json({ files })
  } catch (error) {
    console.error('Error fetching item files:', error)
    res.status(500).json({ error: 'Failed to read item files' })
  }
})

// Get a specific item file
router.get('/files/:filename', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const filename = req.params.filename
    
    const file = await ItemFile.findOne({ project, filename }).lean()
    
    if (!file) {
      return res.status(404).json({ error: 'Item file not found' })
    }
    
    res.json(file)
  } catch (error) {
    console.error('Error fetching item file:', error)
    res.status(500).json({ error: 'Failed to read item file' })
  }
})

// Create/Update item file
router.post('/files', async (req, res) => {
  try {
    const { filename, items } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' })
    }
    
    // Upsert: update if exists, insert if not
    const result = await ItemFile.findOneAndUpdate(
      { project, filename },
      { project, filename, items },
      { upsert: true, new: true }
    ).lean()
    
    res.json(result)
  } catch (error) {
    console.error('Error saving item file:', error)
    res.status(500).json({ error: 'Failed to save item file' })
  }
})

// Delete item file
router.delete('/files/:filename', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const filename = req.params.filename
    
    const result = await ItemFile.deleteOne({ project, filename })
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item file not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting item file:', error)
    res.status(500).json({ error: 'Failed to delete item file' })
  }
})

export default router
