import { MongoClient } from "mongodb"
import fs from "fs"
import path from "path"

const MONGODB_DB = process.env.MONGODB_DB || "careerbuilder"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

// ---- File-based MVP fallback (works on Vercel/Render too) ----
const DATA_DIR = path.join(process.cwd(), "data")
const memoryStore = new Map<string, unknown[]>()

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    } catch {
      // Read-only filesystem (some hosted runtimes). We'll fall back to in-memory.
    }
  }
}

function fileReadCollection<T>(name: string): T[] {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${name}.json`)
  if (!fs.existsSync(filePath)) {
    return ((memoryStore.get(name) as T[] | undefined) || []).map((item) => ({ ...item }))
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[]
    memoryStore.set(name, parsed)
    return parsed
  } catch {
    return ((memoryStore.get(name) as T[] | undefined) || []).map((item) => ({ ...item }))
  }
}

function fileWriteCollection<T>(name: string, data: T[]): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${name}.json`)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch {
    // Hosted runtimes may be read-only; keep functional in-memory.
  }
  memoryStore.set(name, data)
}

function isMongoConfigured() {
  const uri = process.env.MONGODB_URI
  if (!uri) return false
  if (uri.includes("<db_username>") || uri.includes("<db_password>")) return false
  return true
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Mongo timeout after ${ms}ms`)), ms)
    promise
      .then((v) => {
        clearTimeout(t)
        resolve(v)
      })
      .catch((err) => {
        clearTimeout(t)
        reject(err)
      })
  })
}

function getMongoClientPromise() {
  if (global._mongoClientPromise) {
    return global._mongoClientPromise
  }

  const mongodbUri = process.env.MONGODB_URI
  if (!mongodbUri) {
    throw new Error("Missing MONGODB_URI environment variable")
  }
  if (mongodbUri.includes("<db_username>") || mongodbUri.includes("<db_password>")) {
    throw new Error("MONGODB_URI contains placeholder credentials")
  }

  global._mongoClientPromise = new MongoClient(mongodbUri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  })
    .connect()
    .catch((error) => {
      global._mongoClientPromise = undefined
      throw error
    })

  return global._mongoClientPromise
}

let bootstrapPromise: Promise<void> | null = null

async function getDb() {
  const client = await getMongoClientPromise()
  return client.db(MONGODB_DB)
}

async function bootstrapDataIfMissing() {
  if (bootstrapPromise) {
    await bootstrapPromise
    return
  }

  bootstrapPromise = (async () => {
    const db = await getDb()
    const [usersCount, jobsCount, coursesCount] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("jobs").countDocuments(),
      db.collection("courses").countDocuments(),
    ])

    if (usersCount > 0 || jobsCount > 0 || coursesCount > 0) {
      return
    }

    const mod = (await import("./seed")) as { seedDatabase?: () => Promise<void> }
    await mod.seedDatabase?.()
  })()

  try {
    await bootstrapPromise
  } catch {
    // Keep the app responsive even if bootstrap fails.
  }
}

export async function readCollection<T>(name: string): Promise<T[]> {
  if (!isMongoConfigured()) {
    return fileReadCollection<T>(name)
  }
  try {
    const mongoPromise = (async () => {
      await bootstrapDataIfMissing()
      const db = await getDb()
      return await db.collection<T>(name).find({}, { projection: { _id: 0 } }).toArray()
    })()
    return await withTimeout(mongoPromise, 8000)
  } catch {
    return fileReadCollection<T>(name)
  }
}

export async function writeCollection<T>(name: string, data: T[]): Promise<void> {
  if (!isMongoConfigured()) {
    fileWriteCollection<T>(name, data)
    return
  }
  try {
    const mongoPromise = (async () => {
      const db = await getDb()
      const collection = db.collection(name)
      await collection.deleteMany({})
      if (data.length > 0) {
        await collection.insertMany(data as object[])
      }
    })()
    await withTimeout(mongoPromise, 8000)
  } catch {
    fileWriteCollection<T>(name, data)
  }
}

export async function findOne<T extends { id: string }>(
  collection: string,
  predicate: (item: T) => boolean
): Promise<T | undefined> {
  const items = await readCollection<T>(collection)
  return items.find(predicate)
}

export async function findMany<T extends { id: string }>(
  collection: string,
  predicate?: (item: T) => boolean
): Promise<T[]> {
  const items = await readCollection<T>(collection)
  return predicate ? items.filter(predicate) : items
}

export async function insertOne<T extends { id: string }>(
  collection: string,
  item: T
): Promise<T> {
  if (!isMongoConfigured()) {
    const items = fileReadCollection<T>(collection)
    items.push(item)
    fileWriteCollection(collection, items)
    return item
  }
  try {
    const mongoPromise = (async () => {
      const db = await getDb()
      await db.collection(collection).insertOne(item as object)
      return item
    })()
    return await withTimeout(mongoPromise, 8000)
  } catch {
    const items = fileReadCollection<T>(collection)
    items.push(item)
    fileWriteCollection(collection, items)
    return item
  }
}

export async function updateOne<T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  if (!isMongoConfigured()) {
    const items = fileReadCollection<T>(collection)
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) return null
    items[idx] = { ...items[idx], ...updates }
    fileWriteCollection(collection, items)
    return items[idx] || null
  }
  try {
    const mongoPromise = (async () => {
      const db = await getDb()
      const result = await db
        .collection<T>(collection)
        .findOneAndUpdate(
          { id } as Partial<T>,
          { $set: updates as object },
          { returnDocument: "after", projection: { _id: 0 } }
        )
      return result || null
    })()
    return await withTimeout(mongoPromise, 8000)
  } catch {
    const items = fileReadCollection<T>(collection)
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) return null
    items[idx] = { ...items[idx], ...updates }
    fileWriteCollection(collection, items)
    return items[idx] || null
  }
}

export async function deleteOne<T extends { id: string }>(
  collection: string,
  id: string
): Promise<boolean> {
  if (!isMongoConfigured()) {
    const items = fileReadCollection<T>(collection)
    const filtered = items.filter((i) => i.id !== id)
    if (filtered.length === items.length) return false
    fileWriteCollection(collection, filtered)
    return true
  }
  try {
    const mongoPromise = (async () => {
      const db = await getDb()
      const result = await db.collection<T>(collection).deleteOne({ id } as Partial<T>)
      return result.deletedCount > 0
    })()
    return await withTimeout(mongoPromise, 8000)
  } catch {
    const items = fileReadCollection<T>(collection)
    const filtered = items.filter((i) => i.id !== id)
    if (filtered.length === items.length) return false
    fileWriteCollection(collection, filtered)
    return true
  }
}
