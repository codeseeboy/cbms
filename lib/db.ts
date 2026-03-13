import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const memoryStore = new Map<string, unknown[]>()

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readCollection<T>(name: string): T[] {
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

export function writeCollection<T>(name: string, data: T[]): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${name}.json`)
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch {
    // Some hosted runtimes use read-only filesystems; keep app functional in-memory.
  }
  memoryStore.set(name, data)
}

export function findOne<T extends { id: string }>(
  collection: string,
  predicate: (item: T) => boolean
): T | undefined {
  const items = readCollection<T>(collection)
  return items.find(predicate)
}

export function findMany<T extends { id: string }>(
  collection: string,
  predicate?: (item: T) => boolean
): T[] {
  const items = readCollection<T>(collection)
  return predicate ? items.filter(predicate) : items
}

export function insertOne<T extends { id: string }>(
  collection: string,
  item: T
): T {
  const items = readCollection<T>(collection)
  items.push(item)
  writeCollection(collection, items)
  return item
}

export function updateOne<T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): T | null {
  const items = readCollection<T>(collection)
  const idx = items.findIndex((item) => item.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates }
  writeCollection(collection, items)
  return items[idx]
}

export function deleteOne<T extends { id: string }>(
  collection: string,
  id: string
): boolean {
  const items = readCollection<T>(collection)
  const filtered = items.filter((item) => item.id !== id)
  if (filtered.length === items.length) return false
  writeCollection(collection, filtered)
  return true
}
