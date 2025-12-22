import mongoose from 'mongoose'

let isConnected = false

export async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quest-designer'
    
    await mongoose.connect(uri)
    isConnected = true
    
    console.log('✅ Connected to MongoDB with Mongoose')
    
    return mongoose.connection
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

export async function getDatabase() {
  if (!isConnected) {
    await connectToDatabase()
  }
  return mongoose.connection.db
}

export async function closeDatabase() {
  if (isConnected) {
    await mongoose.connection.close()
    isConnected = false
    console.log('MongoDB connection closed')
  }
}

// Collections
export const COLLECTIONS = {
  NPCS: 'npcs',
  MISSIONS: 'missions'
}
