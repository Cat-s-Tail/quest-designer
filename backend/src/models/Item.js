import mongoose from 'mongoose'

// Action definition for item
const ActionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  canExecute: {
    type: String,
    default: ''
  },
  onExecute: {
    type: String,
    default: ''
  }
}, { _id: false })

// Item structure based on Unity InventorySystem
const ItemDefinitionSchema = new mongoose.Schema({
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
  icon: {
    type: String,
    default: ''
  },
  worldPrefab: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'generic'
  },
  size: {
    type: [Number],
    default: () => [1, 1]
  },
  weight: {
    type: Number,
    default: 1.0
  },
  maxStack: {
    type: Number,
    default: 1
  },
  fractional: {
    type: Boolean,
    default: false
  },
  maxDurability: {
    type: Number,
    default: -1
  },
  rarity: {
    type: Number,
    default: 0
  },
  customProperties: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  actions: {
    type: [ActionSchema],
    default: () => []
  },
  
  // Graph editor fields (for visual editing, not used by Unity)
  next: {
    type: [String],
    default: () => []
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false })

// This represents a file containing multiple Items
const ItemFileSchema = new mongoose.Schema({
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
  items: [ItemDefinitionSchema]
}, {
  timestamps: true
})

// Compound unique index: project + filename must be unique
ItemFileSchema.index({ project: 1, filename: 1 }, { unique: true })

const ItemFile = mongoose.model('ItemFile', ItemFileSchema, 'item_files')

export default ItemFile
