import mongoose from 'mongoose'

const OptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    default: ''
  },
  entryNode: {
    type: String,
    default: null
  }
}, { _id: false })

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['dialog', 'options', 'commands', 'condition']
  },
  // For dialog nodes
  texts: [{
    type: String
  }],
  // For options nodes
  options: [OptionSchema],
  // For command nodes
  actions: [{
    type: String
  }],
  // For condition nodes
  conditions: [mongoose.Schema.Types.Mixed],
  // Next node
  next: {
    type: String,
    default: null
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
  options: [OptionSchema],
  nodes: [NodeSchema]
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
