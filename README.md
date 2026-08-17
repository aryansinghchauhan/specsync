# SpecSync

> A spec-driven API validation and synchronization service built with Node.js.

SpecSync helps validate API responses against a defined API specification, detect contract violations, and process those violations through a structured backend pipeline.

## 🚀 Features

* 📋 API specification loading from YAML
* ✅ Response validation using AJV
* 🔍 Detection and logging of API contract violations
* ♻️ Duplicate violation detection
* 💡 Automatic fix suggestions for detected violations
* 🐙 GitHub issue integration for tracking violations
* ⚡ Fast API processing
* 🔧 Middleware-based request/response processing
* 🗃️ Redis support for state and caching

## 🏗️ Architecture

```text
API Request
     │
     ▼
Middleware
     │
     ▼
Response Interceptor
     │
     ▼
Response Validator
     │
     ▼
Violation Detection
     │
     ├──────────────► Deduplicator
     │
     ├──────────────► Fix Suggester
     │
     ├──────────────► Violation Logger
     │
     └──────────────► GitHub Issue
```

## 📁 Project Structure

```text
specsync/
├── specs/
│   └── api.yaml
│
├── src/
│   ├── middleware/
│   │   ├── responseInterceptor.js
│   │   └── sampler.js
│   │
│   ├── routes/
│   │
│   ├── services/
│   │   ├── deduplicator.js
│   │   ├── fixSuggester.js
│   │   ├── githubIssuer.js
│   │   ├── specLoader.js
│   │   └── violationLogger.js
│   │
│   └── validators/
│       └── responseValidator.js
│
├── demo-api.js
├── package.json
└── README.md
```

## 🛠️ Tech Stack

* **Node.js**
* **Express**
* **Fastify**
* **AJV**
* **Redis**
* **Octokit**
* **js-yaml**
* **JavaScript**

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/aryansinghchauhan/specsync.git
cd specsync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root.

```env
PORT=3000
REDIS_URL=your_redis_url
GITHUB_TOKEN=your_github_token
```

> Add only the environment variables required by your current implementation.

### 4. Start the application

```bash
npm start
```

### Development

```bash
npm run dev
```

## 📋 API Specification

The API contract used by SpecSync is defined in:

```text
specs/api.yaml
```

The specification is loaded by the service layer and used as the basis for response validation.

## 🔄 Validation Flow

```text
API Response
     ↓
Load API Specification
     ↓
Validate Response
     ↓
Contract Violation?
     │
   ┌─┴─┐
  No  Yes
  │    │
  │    ▼
  │  Log Violation
  │    │
  │    ▼
  │  Check Duplicate
  │    │
  │    ▼
  │  Generate Fix Suggestion
  │    │
  │    ▼
  │  Create GitHub Issue
  │
  ▼
Continue
```

## 🎯 Why SpecSync?

API contracts can drift as applications evolve. A response that no longer matches the expected specification can introduce bugs for consumers of the API.

SpecSync is designed to detect these contract violations and provide a structured workflow for identifying, tracking, and resolving them.

## 📌 Project Status

🚧 **Active Development**

The project is being developed and improved as part of my backend engineering journey.

## 🔮 Future Improvements

* Automated test suite
* Docker support
* CI/CD integration
* Improved violation dashboards
* More detailed fix suggestions
* Expanded API specification support
* Better monitoring and observability

## 👨‍💻 Author

**Aryan Singh Chauhan**

[GitHub](https://github.com/aryansinghchauhan)
