import { MongoClient } from "mongodb"

const MONGODB_DB = process.env.MONGODB_DB || "careerbuilder"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
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
  await bootstrapDataIfMissing()
  const db = await getDb()
  return db.collection<T>(name).find({}, { projection: { _id: 0 } }).toArray()
}

export async function writeCollection<T>(name: string, data: T[]): Promise<void> {
  const db = await getDb()
  const collection = db.collection(name)
  await collection.deleteMany({})
  if (data.length > 0) {
    await collection.insertMany(data as object[])
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
  const db = await getDb()
  await db.collection(collection).insertOne(item as object)
  return item
}

export async function updateOne<T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const db = await getDb()
  const result = await db
    .collection<T>(collection)
    .findOneAndUpdate(
      { id } as Partial<T>,
      { $set: updates as object },
      { returnDocument: "after", projection: { _id: 0 } }
    )
  return result || null
}

export async function deleteOne<T extends { id: string }>(
  collection: string,
  id: string
): Promise<boolean> {
  const db = await getDb()
  const result = await db.collection<T>(collection).deleteOne({ id } as Partial<T>)
  return result.deletedCount > 0
}
