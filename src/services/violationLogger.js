import fs from 'fs'
import path from 'path'
import { generateFixSuggestion } from './fixSuggester.js'

const LOG_FILE = path.resolve('violations.json')

// Safe JSON reader — handles BOM and empty files
function readViolations() {
  try {
    if (!fs.existsSync(LOG_FILE)) return []
    let raw = fs.readFileSync(LOG_FILE, 'utf8')
    // Strip BOM if present
    raw = raw.replace(/^\uFEFF/, '').trim()
    if (!raw || raw === '') return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// Initialize file cleanly
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '[]', 'utf8')
}

export function logViolation(violation) {
  const existing = readViolations()

  const fixSuggestion = generateFixSuggestion(
    violation.method,
    violation.path,
    violation.errors,
    violation.actualResponse
  )

  const entry = {
    id: `v_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...violation,
    fixSuggestion
  }

  existing.push(entry)
  fs.writeFileSync(LOG_FILE, JSON.stringify(existing, null, 2), 'utf8')

  console.warn(`[SpecSync] ⚠ Violation: ${violation.method} ${violation.path}`)
  console.warn(`[SpecSync] 💡 Fix: ${fixSuggestion.summary}`)

  return entry
}

export function getViolations() {
  return readViolations()
}