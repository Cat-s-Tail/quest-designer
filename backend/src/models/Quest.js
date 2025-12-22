import mongoose from 'mongoose'

const ObjectiveSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['submit', 'event']
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 1
  },
  // For submit type
  item: {
    type: String
  },
  // For event type
  eventType: {
    type: String
  },
  eventCondition: {
    type: String
  },
  // Optional conditions
  conditions: [{
    type: String
  }]
}, { _id: false })

const RewardsSchema = new mongoose.Schema({
  xp: {
    type: Number,
    default: 0
  },
  money: {
    type: Number,
    default: 0
  },
  reputation: {
    type: Number,
    default: 0
  },
  items: [{
    type: String
  }]
}, { _id: false })

const QuestItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  giver: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  objectiveStructure: {
    type: String,
    default: ''
  },
  objectives: [ObjectiveSchema],
  rewards: {
    type: RewardsSchema,
    default: () => ({})
  },
  unlocks: [{
    type: String
  }],
  repeatable: {
    type: Boolean,
    default: false
  }
}, { _id: false })

// This represents a file containing multiple Quests
const QuestFileSchema = new mongoose.Schema({
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
  quests: [QuestItemSchema]
}, {
  timestamps: true
})

// Compound unique index: project + filename must be unique
QuestFileSchema.index({ project: 1, filename: 1 }, { unique: true })

const QuestFile = mongoose.model('QuestFile', QuestFileSchema, 'quest_files')

export default QuestFile
