import mongoose from 'mongoose'

// New NPC Node structure based on Unity StorySystem architecture
// Node types: option, dialog, instruction, exit
const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['option', 'dialog', 'instruction', 'exit']
  },
  
  // Common fields
  text: {
    type: String,
    default: ''
  },
  
  // For option nodes: Lua expression (canShow predicate)
  canShow: {
    type: String,
    default: 'true'
  },
  
  // For dialog nodes
  speaker: {
    type: String,
    default: ''
  },
  
  // For instruction nodes: Lua code to execute
  code: {
    type: String,
    default: ''
  },
  
  // Next node(s) - array of node IDs
  // Connection edges for visual editor (used by web UI, not Unity)
  next: {
    type: [String],
    default: () => []
  },
  
  // UI positioning for graph editor (not used by Unity)
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false })

const NPCItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // Entry nodes - array of node IDs for initial interaction options
  entryNodes: {
    type: [String],
    default: () => []
  },
  
  // Flat array of all dialog flow nodes
  nodes: [NodeSchema],
  
  // UI positioning for NPC in graph editor (not used by Unity)
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false })

// This represents a file containing multiple NPCs
const NPCFileSchema = new mongoose.Schema({
  project: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  filename: {
    type: String,
    required: true,
    index: true
  },
  npcs: [NPCItemSchema]
}, {
  timestamps: true
})

// Compound unique index: project + filename must be unique
NPCFileSchema.index({ project: 1, filename: 1 }, { unique: true })

const NPCFile = mongoose.model('NPCFile', NPCFileSchema, 'npc_files')

export default NPCFile
