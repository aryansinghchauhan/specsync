import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

const validatorCache = new Map()

export function validateResponse(schema, body) {
  const cacheKey = JSON.stringify(schema)

  if (!validatorCache.has(cacheKey)) {
    const compiled = ajv.compile(schema)
    validatorCache.set(cacheKey, compiled)
  }

  const validate = validatorCache.get(cacheKey)
  const valid = validate(body)

  if (valid) {
    return { valid: true }
  }

  const errors = validate.errors.map(err => ({
    field: err.instancePath || '(root)',
    message: err.message,
    value: err.data
  }))

  return { valid: false, errors }
}