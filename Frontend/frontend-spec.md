# Citizen Services AI Assistant - Frontend Specification (v2.0)

## Project Objective

Create a secure, modern, responsive, and professional single-page Citizen Services AI Assistant web application using:

* Native HTML5
* CSS3
* Modern JavaScript (ES6+)

The frontend must:

* Support Email OTP passwordless authentication
* Manage JWT-based sessions
* Provide a streaming AI chatbot experience
* Work seamlessly on desktop and mobile
* Communicate entirely through backend REST APIs
* Require zero page reloads
* Be deployable on GitHub Pages or any static hosting platform

---

# Target File Structure

```plaintext
public/
│
├── index.html
├── style.css
├── app.js
│
└── assets/
    ├── logo.svg
    ├── seal.png
    └── icons/
```

---

# 1. HTML Architecture (`public/index.html`)

## Metadata Requirements

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Official Citizen AI Assistant Portal</title>
```

---

# 2. Application Layout

The application must behave as a Single Page Application (SPA).

Two major views must exist:

## A. Authentication View (`#auth-container`)

Centered government-style authentication card.

### Required Components

#### Branding Section

* Logo placeholder
* Text:

  ```text
  CS AI
  Official Citizen AI Assistant
  ```

---

### Input Fields

#### Citizen Name

```html
<input type="text" id="username">
```

#### Email Address

```html
<input type="email" id="email">
```

---

### OTP Trigger

```html
<button id="send-otp-btn">
   Send OTP
</button>
```

---

### OTP Verification Section (`#otp-section`)

Initially hidden.

Contains:

```html
<input type="text" id="otp" maxlength="6">
<button id="verify-btn">
   Verify & Launch
</button>
```

---

### Authentication Status Area

```html
<div id="auth-status"></div>
```

Used for:

* Errors
* Success messages
* OTP instructions
* Cooldown notices

---

# 3. Chat Dashboard (`#chat-container`)

Responsive government dashboard layout.

---

## Sidebar (`.sidebar`)

### Required Elements

* Government seal/logo placeholder
* Title:

  ```text
  Citizen AI Hub
  ```
* Logged-in citizen name
* Session information
* Log Out button anchored at bottom

---

## Main Chat Area (`.chat-main`)

### Chat Message Container

```html
<div id="chat-box"></div>
```

Requirements:

* Scrollable
* Auto-scroll intelligent behavior
* Mobile optimized
* Supports Markdown-rendered AI responses

---

### Suggested Prompt Section

Optional prompt chips shown before first message.

Examples:

* "How do I apply for income certificate?"
* "Required documents for caste certificate"
* "Track grievance application"
* "How to apply for pension scheme?"

---

### Sticky Input Footer

Contains:

```html
<input id="user-input">
<button id="send-btn">Send</button>
```

Requirements:

* Sticky bottom layout
* Mobile-safe spacing
* Keyboard accessible

---

# 4. Design System (`public/style.css`)

## Visual Theme

Professional government digital portal aesthetic.

Strictly avoid:

* Neon colors
* Cyberpunk styles
* Excessive gradients
* Gaming-style UI

---

# Color Palette

## Background

```css
#0A192F
```

Deep Slate Navy

---

## Surface Panels

```css
#112240
```

Muted Blue-Gray

---

## Primary Text

```css
#E6F1FF
```

Crisp Ice White

---

## Secondary Text

```css
#8892B0
```

Slate Silver

---

## Accent Color

```css
#64FFDA
```

Clean Teal Mint

---

# Typography

Preferred stack:

```css
font-family:
system-ui,
-apple-system,
BlinkMacSystemFont,
"Segoe UI",
Inter,
sans-serif;
```

---

# Input Styling

Requirements:

* Border radius: 4px
* Smooth focus transitions
* Surface-colored backgrounds
* Accent border on focus
* Accessible contrast ratio

---

# Chat Bubble Design

## User Messages

* Right aligned
* Background:

  ```css
  #172A45
  ```
* Rounded corners
* Clear spacing

---

## Assistant Messages

* Left aligned
* Transparent or soft surface
* Rich Markdown formatting support

Must properly style:

```css
h1
h2
h3
ul
ol
li
strong
code
pre
table
blockquote
```

---

# Loading States

Elegant pulse animation.

Examples:

```text
Assistant is preparing guidance...
Citizen AI Assistant is typing...
```

---

# Responsive Design

Mandatory mobile-first behavior.

## Mobile Breakpoint

```css
@media (max-width: 768px)
```

Requirements:

* Sidebar collapses into top navigation
* Chat occupies full width
* Larger touch targets
* Sticky footer input preserved
* Reduced padding for compact screens

---

# Accessibility Requirements

Mandatory accessibility support.

## Include

### Labels

```html
<label for="email">
```

### ARIA Attributes

```html
aria-label
aria-live="polite"
```

### Keyboard Navigation

* Enter to send
* Tab navigation support
* Focus visibility

---

# 5. Frontend Logic Controller (`public/app.js`)

---

# Global Configuration

```javascript
const API_URL = "https://your-backend-domain.com";
```

Do NOT depend on:

```javascript
window.location.origin
```

because frontend and backend may be hosted separately.

---

# Application State

Track:

```javascript
sessionToken
chatHistory
streamingState
typingState
```

---

# 6. Session Lifecycle Management

## On Application Startup

Check for:

```javascript
localStorage.getItem('citizen_jwt')
```

If token exists:

1. Validate token with backend
2. Restore chat history
3. Load dashboard automatically

---

# Required Validation Endpoint

```plaintext
POST /api/auth/validate
```

If invalid:

* Clear storage
* Return user to authentication view

---

# 7. Authentication Flow

---

## `requestOTP()`

### Endpoint

```plaintext
POST /api/auth/request-otp
```

### Payload

```json
{
  "username": "",
  "email": ""
}
```

### Requirements

* Disable resend for 30 seconds
* Show cooldown countdown
* Display errors gracefully

---

# 8. OTP Verification

## `verifyOTP()`

### Endpoint

```plaintext
POST /api/auth/verify-otp
```

### Success Flow

* Receive JWT token
* Store securely
* Launch dashboard
* Persist citizen session

### Local Storage Keys

```plaintext
citizen_jwt
citizen_name
citizen_chat_history
```

---

# 9. AI Chat Flow

## `sendMessage()`

### Requirements

* Prevent empty submissions
* Append citizen bubble instantly
* Show typing/loading state
* Stream AI responses progressively
* Maintain scroll position intelligently

---

# Chat Endpoint

```plaintext
POST /api/chat
```

### Required Headers

```plaintext
Authorization: Bearer <JWT>
Content-Type: application/json
```

---

# Streaming Support (Recommended)

Frontend should support:

* Chunked streaming
* SSE (Server-Sent Events)
* Progressive rendering

Example:

```javascript
const reader = response.body.getReader();
```

---

# 10. Safe Markdown Rendering

NEVER render raw AI HTML directly.

Mandatory stack:

## Markdown Parser

Use:

* Marked.js

## Sanitizer

Use:

* DOMPurify

---

# Safe Rendering Flow

```javascript
const rawHtml = marked.parse(aiText);
const safeHtml = DOMPurify.sanitize(rawHtml);

messageDiv.innerHTML = safeHtml;
```

---

# 11. Conversation Persistence

Persist recent conversation locally.

Recommended:

```javascript
localStorage.setItem(
   'citizen_chat_history',
   JSON.stringify(messages)
);
```

Restore automatically on startup.

---

# 12. Intelligent Auto Scroll

Only auto-scroll if user is already near bottom.

Prevent forced scrolling during history reading.

---

# 13. Logout Flow

## `logOut()`

Must:

* Remove JWT
* Clear chat history
* Clear timers
* Stop active streams
* Reset UI state

---

# 14. Error Handling Standards

---

## Authentication Errors

Support:

* Invalid OTP
* Expired OTP
* Too many attempts
* Network unavailable

---

## Chat Errors

Support:

* Unauthorized session
* AI timeout
* Backend unavailable
* Rate limiting
* Streaming interruption

---

# 15. Security Requirements

---

## MVP Storage

JWT stored in:

```javascript
localStorage
```

---

## Future Upgrade Recommendation

Move to:

* Secure HTTP-only cookies

---

# Security Headers Recommendation

Backend should implement:

```plaintext
Content-Security-Policy
X-Frame-Options
Referrer-Policy
Permissions-Policy
```

---

# 16. Performance Goals

Target:

* Fast first load
* Minimal dependencies
* Lightweight bundle
* Smooth mobile performance

---

# 17. Deployment Compatibility

Frontend must work on:

* GitHub Pages
* Netlify
* Vercel
* Static CDN hosting

Backend hosted independently.

---

# 18. Recommended Future Enhancements

## V2 Ideas

* Multi-language support
* Voice input
* Speech synthesis
* PDF download of guidance
* Citizen ticket history
* Dark/light accessibility themes
* AI memory context
* Real-time notification system

---

# Final Objective Summary

The final frontend must feel like:

* A modern government digital assistance platform
* Professional and trustworthy
* Lightweight and secure
* Accessible to non-technical citizens
* Mobile-friendly
* AI-native
* Production-ready for MVP deployment
