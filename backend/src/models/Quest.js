import mongoose from 'mongoose'

// New Mission/Quest structure based on Unity StorySystem architecture
const MissionItemSchema = new mongoose.Schema({
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
  category: {
    type: String,
    default: 'general'
  },
  
  // Lua expression string to determine if mission can be unlocked
  canUnlock: {
    type: String,
    default: 'true'
  },
  
  // JSON logical expression defining mission objectives
  // Structure: { "and": [...], "or": [...], "not": {...} }
  // Each objective has: objective_id, related_event, validate (Lua), count, requirement, description, reset_on_death
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: () => ({ and: [] })
  },
  
  // Array of Lua script names (can be @references like "@mission_evaluate_standard")
  // Scripts execute sequentially, passing context between them
  onEvent: {
    type: [String],
    default: () => []
  },
  
  // Optional metadata
  rewards: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  // Mission connections for visual editor (for readability only, not used by Unity)
  next: [{
    type: String
  }],
  
  // UI positioning for graph editor (not used by Unity)
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false })

// This represents a file containing multiple Missions
const MissionFileSchema = new mongoose.Schema({
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
  missions: [MissionItemSchema]
}, {
  timestamps: true
})

// Compound unique index: project + filename must be unique
MissionFileSchema.index({ project: 1, filename: 1 }, { unique: true })

const MissionFile = mongoose.model('MissionFile', MissionFileSchema, 'mission_files')

export default MissionFile
