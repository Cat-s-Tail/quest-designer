import express from 'express'
import archiver from 'archiver'
import NPCFile from '../models/NPC.js'
import MissionFile from '../models/Quest.js'
import ItemFile from '../models/Item.js'
import ContainerFile from '../models/Container.js'

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

// Upload Items from JSON
router.post('/items', async (req, res) => {
  try {
    const { items, filename } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { items: [...], filename: "..." }' })
    }
    
    if (items.length === 0) {
      return res.status(400).json({ error: 'No items to upload' })
    }

    // Use filename from request or generate one
    const targetFilename = filename || `items/items_${Date.now()}.json`
    
    // Validate that each item has an id
    for (const item of items) {
      if (!item.id) {
        return res.status(400).json({ error: 'All items must have an id field' })
      }
    }
    
    // Upsert the file
    const result = await ItemFile.findOneAndUpdate(
      { project, filename: targetFilename },
      { project, filename: targetFilename, items },
      { upsert: true, new: true }
    )
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${items.length} items to ${targetFilename}`,
      count: items.length,
      filename: targetFilename
    })
  } catch (error) {
    console.error('Error uploading items:', error)
    res.status(500).json({ error: 'Failed to upload items', details: error.message })
  }
})

// Upload Containers from JSON
router.post('/containers', async (req, res) => {
  try {
    let { containers, filename } = req.body
    const project = req.query.project || req.body.project || 'default'
    
    if (!containers || !Array.isArray(containers)) {
      return res.status(400).json({ error: 'Invalid data format. Expected { containers: [...], filename: "..." }' })
    }
    
    if (containers.length === 0) {
      return res.status(400).json({ error: 'No containers to upload' })
    }

    // Use filename from request or generate one
    const targetFilename = filename || `containers/containers_${Date.now()}.json`
    
    // Transform Unity JSON format to database format
    containers = containers.map(container => {
      // Validate that container has an id
      if (!container.id) {
        throw new Error('All containers must have an id field')
      }

      // Transform sections
      const transformedSections = (container.sections || []).map(section => {
        // Map Unity field names to database field names
        const transformed = {
          sectionID: section.id,
          name: section.displayName || section.name || '',
          type: mapSectionType(section.type),
          gridWidth: Array.isArray(section.size) ? section.size[0] : 10,
          gridHeight: Array.isArray(section.size) ? section.size[1] : 10,
          allowedItemTypes: section.allowedTypes || section.allowedItemTypes || [],
          breakLineAfter: section.breakLineAfter !== undefined ? section.breakLineAfter : false,
          layoutOffset: section.layoutOffset || [0, 0]
        }
        
        return transformed
      })

      return {
        id: container.id,
        name: container.name,
        description: container.description || '',
        icon: container.icon || '',
        maxWeight: container.maxWeight !== undefined ? container.maxWeight : -1,
        containerPanelPrefabKey: container.panelPrefab || container.containerPanelPrefabKey || '',
        sections: transformedSections,
        next: container.next || [],
        position: container.position || { x: 0, y: 0 }
      }
    })
    
    // Upsert the file
    const result = await ContainerFile.findOneAndUpdate(
      { project, filename: targetFilename },
      { project, filename: targetFilename, containers },
      { upsert: true, new: true }
    )
    
    res.json({ 
      success: true, 
      message: `Successfully uploaded ${containers.length} containers to ${targetFilename}`,
      count: containers.length,
      filename: targetFilename
    })
  } catch (error) {
    console.error('Error uploading containers:', error)
    res.status(500).json({ error: 'Failed to upload containers', details: error.message })
  }
})

// Helper function to map Unity section type to database type
function mapSectionType(unityType) {
  if (!unityType) return 'Grid'
  
  const typeMap = {
    'grid': 'Grid',
    'single_horizontal': 'SingleHorizontal',
    'single_vertical': 'SingleVertical',
    'Grid': 'Grid',
    'SingleHorizontal': 'SingleHorizontal',
    'SingleVertical': 'SingleVertical'
  }
  
  return typeMap[unityType] || 'Grid'
}

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

// Export Items to JSON (all files combined)
router.get('/export/items', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ItemFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Combine all items from all files
    const allItems = files.flatMap(file => file.items || [])
    
    // Return as array (Unity format)
    res.json(allItems)
  } catch (error) {
    console.error('Error exporting items:', error)
    res.status(500).json({ error: 'Failed to export items', details: error.message })
  }
})

// Export Items to ZIP file (one JSON per file)
router.get('/export/items/zip', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ItemFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No item files found for this project' })
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="items_${project}_${Date.now()}.zip"`)

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add each file
    files.forEach(file => {
      const filename = file.filename.replace(/\//g, '_').replace(/[^a-z0-9_.-]/gi, '_')
      // Export as array (Unity format)
      archive.append(JSON.stringify(file.items, null, 2), { name: filename })
    })

    // Finalize the archive
    await archive.finalize()
  } catch (error) {
    console.error('Error exporting items ZIP:', error)
    res.status(500).json({ error: 'Failed to export items ZIP', details: error.message })
  }
})

// Export Containers to JSON (all files combined)
router.get('/export/containers', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ContainerFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    // Combine all containers from all files
    const allContainers = files.flatMap(file => file.containers || [])
    
    // Transform back to Unity format
    const transformedContainers = allContainers.map(container => ({
      id: container.id,
      name: container.name,
      description: container.description,
      icon: container.icon,
      maxWeight: container.maxWeight,
      panelPrefab: container.containerPanelPrefabKey,
      sections: (container.sections || []).map(section => ({
        id: section.sectionID,
        displayName: section.name,
        type: mapSectionTypeToUnity(section.type),
        size: [section.gridWidth, section.gridHeight],
        allowedTypes: section.allowedItemTypes || [],
        breakLineAfter: section.breakLineAfter,
        layoutOffset: section.layoutOffset
      }))
    }))
    
    res.json(transformedContainers)
  } catch (error) {
    console.error('Error exporting containers:', error)
    res.status(500).json({ error: 'Failed to export containers', details: error.message })
  }
})

// Export Containers to ZIP file (one JSON per file)
router.get('/export/containers/zip', async (req, res) => {
  try {
    const project = req.query.project || 'default'
    const files = await ContainerFile.find({ project }).select('-_id -__v -createdAt -updatedAt -project').lean()
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'No container files found for this project' })
    }

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="containers_${project}_${Date.now()}.zip"`)

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    // Pipe archive to response
    archive.pipe(res)

    // Add each file
    files.forEach(file => {
      const filename = file.filename.replace(/\//g, '_').replace(/[^a-z0-9_.-]/gi, '_')
      
      // Transform back to Unity format
      const transformedContainers = (file.containers || []).map(container => ({
        id: container.id,
        name: container.name,
        description: container.description,
        icon: container.icon,
        maxWeight: container.maxWeight,
        panelPrefab: container.containerPanelPrefabKey,
        sections: (container.sections || []).map(section => ({
          id: section.sectionID,
          displayName: section.name,
          type: mapSectionTypeToUnity(section.type),
          size: [section.gridWidth, section.gridHeight],
          allowedTypes: section.allowedItemTypes || [],
          breakLineAfter: section.breakLineAfter,
          layoutOffset: section.layoutOffset
        }))
      }))
      
      archive.append(JSON.stringify(transformedContainers, null, 2), { name: filename })
    })

    // Finalize the archive
    await archive.finalize()
  } catch (error) {
    console.error('Error exporting containers ZIP:', error)
    res.status(500).json({ error: 'Failed to export containers ZIP', details: error.message })
  }
})

// Helper function to map database section type to Unity format
function mapSectionTypeToUnity(dbType) {
  const typeMap = {
    'Grid': 'grid',
    'SingleHorizontal': 'single_horizontal',
    'SingleVertical': 'single_vertical'
  }
  
  return typeMap[dbType] || 'grid'
}

export default router
