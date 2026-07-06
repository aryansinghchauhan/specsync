/**
 * Generates fix suggestions based on AJV validation errors.
 * Rule-based approach — no external API needed.
 * Architecture supports dropping in Claude/OpenAI later.
 */
export function generateFixSuggestion(method, path, errors, actualResponse) {
  const suggestions = errors.map(err => {
    const { field, message } = err

    // Missing required property
    if (message.includes('must have required property')) {
      const match = message.match(/'(.+)'/)
      const propName = match ? match[1] : 'unknown'
      return {
        field,
        issue: message,
        fix: `Add the required field "${propName}" to your response object.`,
        example: `"${propName}": <value>`
      }
    }

    // Wrong type
    if (message.includes('must be integer')) {
      return {
        field,
        issue: message,
        fix: `Field at "${field}" must be an integer, not a string or float.`,
        example: `Change "${err.value}" to ${parseInt(err.value) || 0}`
      }
    }

    if (message.includes('must be string')) {
      return {
        field,
        issue: message,
        fix: `Field at "${field}" must be a string.`,
        example: `Change ${JSON.stringify(err.value)} to "${err.value}"`
      }
    }

    if (message.includes('must be number')) {
      return {
        field,
        issue: message,
        fix: `Field at "${field}" must be a number.`,
        example: `Change "${err.value}" to ${parseFloat(err.value) || 0}`
      }
    }

    if (message.includes('must be boolean')) {
      return {
        field,
        issue: message,
        fix: `Field at "${field}" must be true or false.`,
        example: `Change "${err.value}" to true or false`
      }
    }

    // Format errors (email, date-time, uuid etc)
    if (message.includes('must match format')) {
      const formatMatch = message.match(/"(.+)"/)
      const format = formatMatch ? formatMatch[1] : 'unknown'
      const formatExamples = {
        email: 'user@example.com',
        'date-time': '2026-01-01T00:00:00.000Z',
        date: '2026-01-01',
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        uri: 'https://example.com'
      }
      return {
        field,
        issue: message,
        fix: `Field at "${field}" must be a valid ${format}.`,
        example: `"${field}": "${formatExamples[format] || `valid-${format}-value`}"`
      }
    }

    // Enum errors
    if (message.includes('must be equal to one of')) {
      return {
        field,
        issue: message,
        fix: `Field at "${field}" has an invalid value. Check the allowed values in your OpenAPI spec.`,
        example: null
      }
    }

    // Additional properties not allowed
    if (message.includes('must NOT have additional properties')) {
      return {
        field,
        issue: message,
        fix: `Remove extra fields from your response that aren't defined in the spec.`,
        example: null
      }
    }

    // Fallback
    return {
      field,
      issue: message,
      fix: `Fix the field "${field}" to match the OpenAPI spec for ${method} ${path}.`,
      example: null
    }
  })

  return {
    summary: `Found ${errors.length} violation(s) in ${method} ${path}`,
    suggestions,
    generatedAt: new Date().toISOString()
  }
}