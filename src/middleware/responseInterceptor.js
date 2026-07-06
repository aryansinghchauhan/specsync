import { validateResponse } from '../validators/responseValidator.js'
import { logViolation } from '../services/violationLogger.js'
import { isNewViolation } from '../services/deduplicator.js'
import { fileGithubIssue } from '../services/githubIssuer.js'

export function registerInterceptor(app, schemaMap, options = {}) {
  const sampleRate = options.sampleRate || 1.0

  app.addHook('onSend', async (request, reply, payload) => {
    try {
      if (request.url.startsWith('/specsync')) return payload
      if (Math.random() > sampleRate) return payload

      const method = request.method.toUpperCase()
      const routePath = request.url.split('?')[0]
      const key = `${method} ${routePath}`

      const schemaEntry = schemaMap[key]
      if (!schemaEntry) return payload

      // Handle payload as Buffer, string, or stream
      let rawBody
      if (typeof payload === 'string') {
        rawBody = payload
      } else if (Buffer.isBuffer(payload)) {
        rawBody = payload.toString('utf8')
      } else if (payload && typeof payload.pipe === 'function') {
        rawBody = await new Promise((resolve, reject) => {
          const chunks = []
          payload.on('data', chunk => chunks.push(chunk))
          payload.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
          payload.on('error', reject)
        })
      } else {
        return payload
      }

      let body
      try {
        body = JSON.parse(rawBody)
      } catch {
        return payload
      }

      const result = validateResponse(schemaEntry.schema, body)

      if (!result.valid) {
        const isNew = await isNewViolation(method, routePath, result.errors)

        if (isNew) {
          // Log violation with fix suggestion
          const entry = logViolation({
            method,
            path: routePath,
            statusCode: reply.statusCode,
            errors: result.errors,
            actualResponse: body,
            specKey: key
          })

          // File GitHub issue automatically
          const issueUrl = await fileGithubIssue(entry)
          if (issueUrl) {
            console.warn(`[SpecSync] ⚠ NEW violation logged + issue filed`)
            console.warn(`[SpecSync] 🔗 ${issueUrl}`)
          }

        } else {
          console.log(`[SpecSync] ↩ Duplicate suppressed: ${key}`)
        }
      } else {
        console.log(`[SpecSync] ✓ ${key} — valid`)
      }

      return rawBody

    } catch (err) {
      console.error('[SpecSync] Interceptor error:', err.message)
    }

    return payload
  })
}