import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO

/**
 * Files a GitHub issue for a violation.
 * Called only for NEW violations (deduplication already handled by Redis).
 */
export async function fileGithubIssue(violation) {
  const { method, path, errors, fixSuggestion, actualResponse, timestamp } = violation

  // Build issue title
  const title = `[SpecSync] API violation: ${method} ${path}`

  // Build issue body in markdown
  const errorRows = errors
    .map(e => `| \`${e.field}\` | ${e.message} |`)
    .join('\n')

  const fixRows = fixSuggestion.suggestions
    .map(s => [
      `**Field:** \`${s.field}\``,
      `**Issue:** ${s.issue}`,
      `**Fix:** ${s.fix}`,
      s.example ? `**Example:** \`${s.example}\`` : null
    ]
      .filter(Boolean)
      .join('\n')
    )
    .join('\n\n---\n\n')

  const body = `
## 🚨 API Contract Violation Detected

**Endpoint:** \`${method} ${path}\`
**Detected at:** ${timestamp}
**Total errors:** ${errors.length}

---

## ❌ Validation Errors

| Field | Error |
|-------|-------|
${errorRows}

---

## 💡 Fix Suggestions

${fixRows}

---

## 📦 Actual Response That Caused This

\`\`\`json
${JSON.stringify(actualResponse, null, 2)}
\`\`\`

---

*This issue was automatically filed by [SpecSync](https://github.com/${OWNER}/${REPO}) — an API contract enforcement proxy.*
`.trim()

  try {
    const response = await octokit.issues.create({
      owner: OWNER,
      repo: REPO,
      title,
      body,
      labels: ['specsync', 'api-violation']
    })

    console.log(`[SpecSync] 📋 GitHub issue filed: ${response.data.html_url}`)
    return response.data.html_url

  }  catch (err) {
  console.error(`[SpecSync] GitHub issue failed: ${err.message}`)
  console.error(`[SpecSync] Full error:`, JSON.stringify(err.response?.data || err, null, 2))
  return null


  }
}