import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readCollection<T>(name: string): T[] {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${name}.json`)
  if (!fs.existsSync(filePath)) return []
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"))
  } catch {
    return []
  }
}

export function writeCollection<T>(name: string, data: T[]): void {
  ensureDir()
  const filePath = path.join(DATA_DIR, `${name}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
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
