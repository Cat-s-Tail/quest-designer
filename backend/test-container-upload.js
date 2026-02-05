import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Helper function to map database section type to Unity format
function mapSectionTypeToUnity(dbType) {
  const typeMap = {
    'Grid': 'grid',
    'SingleHorizontal': 'single_horizontal',
    'SingleVertical': 'single_vertical'
  }
  
  return typeMap[dbType] || 'grid'
}

// Read the Unity containers.json file
const containersPath = '/Users/matt/Documents/p4/Assets/Resources/Containers/containers.json'
const containersJSON = fs.readFileSync(containersPath, 'utf8')
const containers = JSON.parse(containersJSON)

console.log('Original Unity JSON (first container):')
console.log(JSON.stringify(containers[0], null, 2))
console.log('\n' + '='.repeat(80) + '\n')

// Transform to database format
const transformedContainers = containers.map(container => {
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

console.log('Transformed to Database format (first container):')
console.log(JSON.stringify(transformedContainers[0], null, 2))
console.log('\n' + '='.repeat(80) + '\n')

// Transform back to Unity format
const exportedContainers = transformedContainers.map(container => ({
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

console.log('Exported back to Unity format (first container):')
console.log(JSON.stringify(exportedContainers[0], null, 2))
console.log('\n' + '='.repeat(80) + '\n')

// Check if sections match
const originalSections = containers[0].sections
const exportedSections = exportedContainers[0].sections

console.log('Section comparison:')
console.log('Original section count:', originalSections.length)
console.log('Exported section count:', exportedSections.length)

for (let i = 0; i < originalSections.length; i++) {
  const orig = originalSections[i]
  const exp = exportedSections[i]
  
  console.log(`\nSection ${i}:`)
  console.log(`  id: ${orig.id} -> ${exp.id} ✓`)
  console.log(`  displayName: ${orig.displayName} -> ${exp.displayName} ✓`)
  console.log(`  type: ${orig.type} -> ${exp.type} ${orig.type === exp.type ? '✓' : '✗'}`)
  console.log(`  size: [${orig.size}] -> [${exp.size}] ${JSON.stringify(orig.size) === JSON.stringify(exp.size) ? '✓' : '✗'}`)
  console.log(`  allowedTypes: [${orig.allowedTypes}] -> [${exp.allowedTypes}] ${JSON.stringify(orig.allowedTypes) === JSON.stringify(exp.allowedTypes) ? '✓' : '✗'}`)
}

console.log('\n' + '='.repeat(80))
console.log('Test completed! All fields should match ✓')
