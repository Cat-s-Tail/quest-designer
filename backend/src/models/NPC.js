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

const NPCSchema = new mongoose.Schema({
  project: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  id: {
    type: String,
    required: true,
    index: true
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
}, {
  timestamps: true
})

// Compound unique index: project + id must be unique
NPCSchema.index({ project: 1, id: 1 }, { unique: true })

const NPC = mongoose.model('NPC', NPCSchema, 'npcs')

export default NPC

