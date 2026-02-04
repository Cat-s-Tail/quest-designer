import mongoose from 'mongoose'

// Section definition for container
const SectionDefinitionSchema = new mongoose.Schema({
  sectionID: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['Grid', 'SingleHorizontal', 'SingleVertical'],
    default: 'Grid'
  },
  gridWidth: {
    type: Number,
    default: 10
  },
  gridHeight: {
    type: Number,
    default: 10
  },
  allowedItemTypes: {
    type: [String],
    default: () => []
  },
  breakLineAfter: {
    type: Boolean,
    default: false
  },
  layoutOffset: {
    type: [Number],
    default: () => [0, 0]
  }
}, { _id: false })

// Container structure based on Unity InventorySystem
const ContainerDefinitionSchema = new mongoose.Schema({
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
  maxWeight: {
    type: Number,
    default: -1
  },
  containerPanelPrefabKey: {
    type: String,
    default: ''
  },
  sections: {
    type: [SectionDefinitionSchema],
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

// This represents a file containing multiple Containers
const ContainerFileSchema = new mongoose.Schema({
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
  containers: [ContainerDefinitionSchema]
}, {
  timestamps: true
})

// Compound unique index: project + filename must be unique
ContainerFileSchema.index({ project: 1, filename: 1 }, { unique: true })

const ContainerFile = mongoose.model('ContainerFile', ContainerFileSchema, 'container_files')

export default ContainerFile
