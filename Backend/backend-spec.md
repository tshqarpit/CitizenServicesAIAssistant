# Citizen AI Assistant Backend Specification (v1.1)

## Objective

Build a secure, scalable, and production-ready Node.js + Express.js REST API backend for the Citizen Services AI Assistant platform.

The backend must:

* Authenticate citizens using passwordless Email OTP authentication
* Securely issue JWT session tokens
* Query verified government service guides from Supabase
* Generate contextual AI responses using Google Gemini
* Prevent hallucinations by enforcing strict database-grounded AI responses
* Remain deployable on free-tier infrastructure platforms

---

# Backend Architecture Goals

The backend architecture must provide:

* Secure citizen authentication
* Lightweight REST API design
* Strict AI safety and hallucination prevention
* Modular code organization
* Free-tier optimized deployment
* Future scalability for semantic search and admin workflows

---

# Target Runtime Environment

* Node.js 20+
* Express.js

---

# Required Core Dependencies

The backend setup process must initialize `package.json` and install the following dependencies:

```bash
npm init -y

npm install express cors dotenv jsonwebtoken \
@supabase/supabase-js @google/genai \
drizzle-orm @supabase/realtime-js \
helmet express-rate-limit compression morgan
```

---

# Recommended File Structure

```text
src/
│
├── server.js
│
├── config/
│   ├── supabase.js
│   ├── gemini.js
│
├── middleware/
│   ├── auth.js
│   ├── rateLimiter.js
│
├── routes/
│   ├── auth.js
│   ├── chat.js
│
├── services/
│   ├── keywordExtractor.js
│   ├── promptBuilder.js
│
├── utils/
│   ├── jwt.js
│   ├── logger.js
│
└── public/
```

---

# Environment Variables

Create a `.env` file with the following values:

```env
PORT=5000

FRONTEND_URL=https://your-github-pages-url

SUPABASE_URL=
SUPABASE_ANON_KEY=

JWT_SECRET=

GEMINI_API_KEY=
```

---

# 1. Core Server Configuration (`src/server.js`)

## Requirements

### Initialize Environment Variables

```javascript
dotenv.config();
```

---

### Create Express Server Instance

The server must listen on:

```javascript
process.env.PORT || 5000
```

---

### Apply Security Middleware

Use Helmet to protect against common browser vulnerabilities.

```javascript
app.use(helmet());
```

---

### Enable CORS Protection

Only allow requests from the deployed frontend origin.

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

### Enable JSON Body Parsing

```javascript
app.use(express.json());
```

---

### Enable Compression

```javascript
app.use(compression());
```

Improves performance on free-tier hosting platforms.

---

### Enable Request Logging

```javascript
app.use(morgan('dev'));
```

Useful for debugging and monitoring.

---

### Serve Static Assets

```javascript
app.use(express.static('public'));
```

---

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

Useful for uptime monitoring systems.

---

### Route Mounting

```javascript
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
```

---

# 2. Supabase Configuration (`src/config/supabase.js`)

## Requirements

Initialize the Supabase client using environment variables.

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
```

---

# 3. Google Gemini Configuration (`src/config/gemini.js`)

## Requirements

Initialize the Google Gen AI SDK.

```javascript
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

module.exports = ai;
```

---

# 4. JWT Authentication Middleware (`src/middleware/auth.js`)

## Requirements

Create a secure Express middleware that:

* Extracts JWT tokens from Authorization headers
* Validates JWT signatures
* Blocks unauthorized requests
* Injects verified user data into request scope

---

## Required Authentication Flow

### Authorization Header Format

```text
Authorization: Bearer <token>
```

---

### Validation Rules

* Reject missing tokens with `401 Unauthorized`
* Reject invalid or expired tokens with `403 Forbidden`
* Verify JWT using:

```javascript
jsonwebtoken.verify(token, process.env.JWT_SECRET)
```

---

### Attach Verified User Data

On successful verification:

```javascript
req.user = {
  userId,
  email
};
```

Then execute:

```javascript
next();
```

---

### Recommended Middleware Structure

```javascript
const authHeader = req.headers.authorization;

if (!authHeader?.startsWith('Bearer ')) {
  return res.status(401).json({
    error: 'Authorization token missing'
  });
}
```

---

# 5. OTP Authentication Routes (`src/routes/auth.js`)

## Requirements

Create an isolated Express router.

---

# Endpoint 1 — Request OTP

## Route

```http
POST /api/auth/request-otp
```

---

## Request Body

```json
{
  "email": "citizen@example.com"
}
```

---

## Workflow

### Validate Email Format

Reject invalid email structures before contacting Supabase.

---

### Apply Rate Limiting

Prevent OTP abuse.

Recommended policy:

* Maximum 5 requests
* Per 15 minutes
* Per IP address

---

### Trigger OTP Delivery

Use:

```javascript
supabase.auth.signInWithOtp({
  email
});
```

This sends the OTP through Supabase + Resend SMTP integration.

---

## Response

### Success

```json
{
  "message": "OTP sent successfully"
}
```

### Failure

```json
{
  "error": "Unable to send OTP"
}
```

---

# Endpoint 2 — Verify OTP

## Route

```http
POST /api/auth/verify-otp
```

---

## Request Body

```json
{
  "email": "citizen@example.com",
  "token": "123456"
}
```

---

## OTP Verification Logic

Use:

```javascript
supabase.auth.verifyOtp({
  email,
  token,
  type: 'email'
});
```

---

## JWT Session Generation

On successful verification:

```javascript
jsonwebtoken.sign(
  {
    userId,
    email
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '7d'
  }
);
```

---

## Response

### Success

```json
{
  "token": "<jwt-token>"
}
```

### Failure

```json
{
  "error": "Invalid or expired OTP"
}
```

---

# 6. AI Chat Route (`src/routes/chat.js`)

## Requirements

Create a protected Express router.

Attach the custom JWT middleware to all chat routes.

---

# Main Chat Endpoint

## Route

```http
POST /api/chat
```

---

## Authentication

Protected route.

Requires valid JWT token.

---

## Request Body

```json
{
  "message": "How do I apply for an income certificate?"
}
```

---

# AI Workflow Pipeline

## Step 1 — Validate Input

Reject:

* empty requests
* oversized prompts
* malformed payloads

Recommended maximum:

```javascript
message.length <= 1000
```

---

## Step 2 — Sanitize User Input

Remove:

* HTML tags
* scripts
* excessive symbols
* suspicious prompt injection patterns

---

## Step 3 — Extract Search Keywords

Recommended extraction logic:

```javascript
const keywords = message
  .toLowerCase()
  .replace(/[^\w\s]/g, '')
  .split(/\s+/)
  .filter(word => word.length > 2);
```

---

## Step 4 — Query Supabase

## Target Table

```text
citizen_services_v1
```

---

## Query Logic

Perform keyword-based matching using:

```javascript
.ilike('keywords', `%keyword%`)
```

Search using multiple extracted keywords.

Limit response size for MVP optimization.

Recommended limit:

```javascript
.limit(1)
```

---

# Expected Database Fields

| Column             | Purpose                    |
| ------------------ | -------------------------- |
| id                 | Primary key                |
| service_name       | Service title              |
| keywords           | Search tags                |
| department_name    | Government department      |
| eligibility        | Eligibility conditions     |
| required_documents | Required documents         |
| full_guide_text    | Full service instructions  |
| official_link      | Official government URL    |
| updated_at         | Record freshness timestamp |

---

# Context Compilation

Compile retrieved database content into a structured context block.

Example:

```text
Service Name:
Income Certificate

Department:
Revenue Department

Required Documents:
Aadhaar Card, Address Proof

Guide:
[Full official instructions]
```

---

# No-Match Fallback Logic

If no matching database record exists:

```text
Official workflow information for this service is currently unavailable in the verified database.
Please visit the official department website or contact the department helpdesk for assistance.
```

---

# 7. Google Gemini Integration

## Model Configuration

Use:

```javascript
gemini-2.5-flash
```

---

# AI Safety Configuration

## Temperature

Use low creativity:

```javascript
temperature: 0.2
```

Government assistants must prioritize:

* consistency
* accuracy
* predictability

---

## Output Token Limit

```javascript
maxOutputTokens: 700
```

Protects against:

* abuse
* excessive API usage
* free-tier exhaustion

---

# Mandatory System Prompt

```text
You are an official Citizen Services AI Portal Assistant.

Your responsibility is to provide accurate,
clear, step-by-step citizen guidance.

STRICT RULES:
1. Use ONLY the verified database context.
2. Never invent government rules or procedures.
3. If information is unavailable, say so clearly.
4. Keep responses concise and structured.
5. Prefer numbered steps.
6. Mention required documents if available.
7. Mention eligibility conditions if available.

Verified Database Context:
[DATABASE_CONTEXT]
```

---

# 8. API Response Format

## Success Response

```json
{
  "reply": "Step-by-step guidance text"
}
```

---

## Error Response

```json
{
  "error": "Internal server error"
}
```

Never expose:

* raw database errors
* stack traces
* API internals

---

# 9. Security Requirements

## Mandatory Protections

### JWT Verification

Protect all AI endpoints.

---

### Rate Limiting

Protect:

* OTP routes
* chat endpoints

---

### Input Validation

Validate:

* email
* token
* message payloads

---

### Input Sanitization

Prevent:

* prompt injection
* HTML injection
* malformed payload attacks

---

### Secure Environment Variables

Never hardcode:

* API keys
* JWT secrets
* Supabase credentials

---

# 10. Deployment Target

## Backend Hosting

Recommended:

* Render Free Tier Web Service

---

## Frontend Hosting

Recommended:

* GitHub Pages

---

# 11. Future Upgrade Roadmap (v2+)

## Recommended Enhancements

### Semantic Search

Replace keyword matching with:

* embeddings
* pgvector
* vector similarity search

---

### Conversation History

Store:

* citizen chat sessions
* previous service interactions
* contextual follow-up memory

---

### Admin Dashboard

Allow authorized administrators to:

* upload service guides
* edit workflows
* revise policies
* manage department records

---

### Department Routing

Automatically identify:

* passport services
* ration card services
* pension workflows
* certificate applications
* grievance systems

---

# Final Architectural Principles

This backend must maintain the following design philosophy:

* Secure by default
* Database-grounded AI only
* Hallucination-resistant responses
* Free-tier optimized infrastructure
* Lightweight modular architecture
* Scalable future upgrade path

The AI assistant must NEVER fabricate government procedures or unofficial workflows under any condition.
