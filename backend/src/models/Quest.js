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

const QuestSchema = new mongoose.Schema({
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
}, {
  timestamps: true
})

// Compound unique index: project + id must be unique
QuestSchema.index({ project: 1, id: 1 }, { unique: true })

const Quest = mongoose.model('Quest', QuestSchema, 'missions')

export default Quest

