import { MongoClient } from 'mongodb'

let db = null
let client = null

export async function connectToDatabase() {
  if (db) {
    return db
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quest-designer'
    client = new MongoClient(uri)
    
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    db = client.db()
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

export async function getDatabase() {
  if (!db) {
    return await connectToDatabase()
  }
  return db
}

export async function closeDatabase() {
  if (client) {
    await client.close()
    db = null
    client = null
    console.log('MongoDB connection closed')
  }
}

// Collections
export const COLLECTIONS = {
  NPCS: 'npcs',
  MISSIONS: 'missions'
}

