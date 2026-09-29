# CodeForge

[![CI](https://github.com/Joel112003/CodeForge/actions/workflows/ci.yml/badge.svg)](https://github.com/Joel112003/CodeForge/actions/workflows/ci.yml)

> **A real-time collaborative code execution platform** — write, run, and share code with your team in live sessions backed by a Redis-powered job queue and WebSocket-driven real-time sync.

🔗 **Live Demo:** [code-forge-two.vercel.app](https://code-forge-two.vercel.app)

**GitHub About:** Real-time collaborative code editor and runner for JavaScript and Python (Monaco, Socket.IO, BullMQ, Redis)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Getting Started (Local)](#getting-started-local)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Results](#results)
- [Security](#security)
- [Design System](#design-system)
- [Known Limitations](#known-limitations)

---

## Overview

CodeForge is a SaaS-grade collaborative coding environment. Users can:

- **Run code** in a separate host child process (JavaScript, Python) with real-time terminal output streamed back via WebSockets.
- **Create rooms** and invite others to collaborate with live code sync — every keystroke is broadcast to all session members instantly.
- **Join sessions** from a shared link or room code, see who's online, and watch output as it streams.
- **Use the Playground** as a guest — run code without signing up, executions are not saved.
- **Reset passwords** securely via time-limited email tokens (10-minute expiry, single-use).

---

## Architecture

```mermaid
flowchart LR
  Client[React client] -->|HTTP and Socket.IO| Express[Express and Socket.IO]
  Express --> Queue[BullMQ]
  Queue --> Redis[(Redis)]
  Queue --> Worker[Worker]
  Worker --> Child[Host child process]
  Child -->|stdout and stderr chunks| Worker
  Worker -->|streamed output| Express
  Express --> Client
```

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│                                                             │
│  Landing → Login/Register → Dashboard → Editor / Playground │
│                    ↕ HTTP (REST)   ↕ WebSocket (Socket.IO)  │
└────────────────────────┬────────────────────┬───────────────┘
                         │                    │
                         ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js / Express)                │
│                                                              │
│  Auth Routes    Execution Routes    Room Routes              │
│       │               │                  │                   │
│       │          validateExecution   authenticateToken       │
│       │               │                                      │
│       ▼               ▼                                      │
│   PostgreSQL    BullMQ Queue  ←── Redis (job store)          │
│   (users,            │                                       │
│    executions)        ▼                                       │
│             child_process execution worker                  │
│             (node / python runtime)                         │
│                      │                                       │
│              Stdout/Stderr stream                            │
│                      │                                       │
│              Socket.IO emit → Client terminal                │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
              Redis (room state + member sets)
```

### Request lifecycle — code execution

```
1. Client emits  run_code  { language, code, roomId, sessionId }
2. Socket handler validates language → emits status: { status: QUEUED, sessionId }
3. Job added to BullMQ queue (language, code, socketId, roomId, userId, sessionId)
4. Worker picks up job → starts a host child process with a 10s timeout
5. Stdout/stderr chunks stream back via  socket.emit("output", { ...chunk, sessionId })
6. Client filters events by sessionId — prevents cross-contamination between tabs/sessions
7. On completion → status: COMPLETED + DB record updated
8. All room members receive output in real time via  socket.to(roomId)
```

---

## Feature Highlights

| Feature | Detail |
|---|---|
| **Execution Isolation** | Each run uses a fresh host child process with a 10s timeout and output limit; this is not a security sandbox |
| **Session-scoped Output** | Every run tagged with a `sessionId` — output events are strictly scoped, no cross-contamination between Playground and Editor |
| **Real-time Collab** | Socket.IO rooms — code changes broadcast to every member via `code_updated` event |
| **Job Queue** | BullMQ + Redis — runs are queued, not blocking. Concurrency = 5 workers |
| **Password Reset** | Email-based flow via SendGrid HTTP API (SMTP-free, works on Render). 10-minute token expiry, single-use |
| **Guest Mode** | `/playground` — no auth required, runs not saved, rooms unavailable |
| **Join by Link** | Share `/editor/:roomId` URL or 8-char room code. Room expires in 24 hours |
| **Member Presence** | Live member list — join/leave events update all clients instantly |
| **CSRF Protection** | Double-submit cookie pattern on all non-GET API routes |
| **Rate Limiting** | `apiLimiter` (global) + `executionLimiter` (20 exec/hour per IP) |
| **Refresh Tokens** | Rotating refresh token strategy — access tokens expire in 1hr, auto-refreshed silently |
| **DB Resilience** | Pool error handler prevents 57P01 crash. `idleTimeoutMillis: 10000` recycles connections before managed Postgres kills them |

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| Zustand | 5 | Global state (auth, toasts) |
| Framer Motion | 12 | Animations & transitions |
| Monaco Editor | 4 | Code editor (VS Code engine) |
| Socket.IO Client | 4 | Real-time WebSocket connection |
| Axios | 1 | HTTP client with CSRF header injection |
| Tailwind CSS | 4 | Utility classes (layout only) |

### Backend

| Package | Purpose |
|---|---|
| Express 5 | HTTP server & routing |
| Socket.IO | WebSocket server |
| BullMQ | Redis-backed job queue |
| ioredis | Redis client |
| pg | PostgreSQL client (connection pool) |
| bcrypt | Password hashing |
| jsonwebtoken | JWT access tokens |
| helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| uuid | Room ID generation |

### Infrastructure (Production)

| Service | Provider | Purpose |
|---|---|---|
| Backend API | [Render](https://render.com) | Node.js Web Service |
| Frontend | [Vercel](https://vercel.com) | Static site + SPA routing |
| PostgreSQL | [Neon.tech](https://neon.tech) | Serverless Postgres (free tier) |
| Redis | [Upstash](https://upstash.com) | Serverless Redis (BullMQ + room state) |
| Email | [SendGrid](https://sendgrid.com) | Transactional email via HTTP API (SMTP-free) |

---

## Project Structure

```
CodeExecutionEngine/
├── frontend/
│   └── src/
│       ├── bones/                  # boneyard-js form schemas + registry
│       ├── components/
│       │   ├── editor/
│       │   │   ├── CodeEditor.jsx          # Monaco wrapper
│       │   │   └── LanguageSelector.jsx    # Custom dropdown (not native select)
│       │   ├── layout/
│       │   │   ├── EditorTopbar.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   ├── room/
│       │   │   ├── JoinRoomModal.jsx
│       │   │   └── MemberList.jsx          # Live member presence panel
│       │   ├── terminal/
│       │   │   └── Terminal.jsx            # Output stream renderer
│       │   └── ui/
│       │       ├── Badge.jsx               # Status badge (IDLE/RUNNING/etc)
│       │       ├── Button.jsx
│       │       ├── Skeleton.jsx            # Shimmer loading states
│       │       └── Toast.jsx               # Dark-theme toast system
│       ├── config/
│       │   └── constants.js                # API_URL, LANGUAGES, DEFAULT_CODE
│       ├── hooks/
│       │   └── useSocket.js                # Socket.IO hook with sessionId scoping
│       ├── pages/
│       │   ├── Dashboard.jsx               # Launch hub (New/Join/Playground)
│       │   ├── Editor.jsx                  # Collaborative code editor
│       │   ├── ForgotPassword.jsx
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Playground.jsx              # Guest mode editor
│       │   ├── Register.jsx
│       │   └── ResetPassword.jsx
│       ├── services/
│       │   └── api.js                      # Axios instance + interceptors + all API calls
│       ├── store/
│       │   ├── authStore.js                # Zustand auth state
│       │   └── toastStore.js               # Zustand toast queue
│       └── utils/
│           └── toastMessages.js            # Typed toast helpers
│
└── backend/
    ├── server.js                           # Entry point: Express + Socket.IO setup
    └── src/
        ├── config/
        │   ├── db.js                       # PostgreSQL pool (idle timeout + error handler)
        │   ├── env.js                      # Required env var validation
        │   ├── migrate.js                  # CREATE TABLE IF NOT EXISTS migrations
        │   └── redis.js                    # ioredis client
        ├── controllers/
        │   ├── auth.controller.js          # Register, Login, Me, Logout, Refresh, ForgotPassword, ResetPassword
        │   ├── execute.controller.js
        │   └── room.controller.js
        ├── middleware/
        │   ├── auth.middleware.js          # JWT verification
        │   ├── csrfProtection.js
        │   ├── errorHandler.js
        │   ├── rateLimiter.js
        │   └── validateExecution.js        # Language + code length validation
        ├── routes/
        │   ├── auth.routes.js
        │   ├── execute.routes.js
        │   └── room.routes.js
        └── services/
            ├── email.js                    # SendGrid HTTP API (port 443, no SMTP)
            ├── executionEngine.js          # child_process executor
            ├── execution.js                # timeout and output limits
            ├── queue.js                    # BullMQ worker — tags all events with sessionId
            ├── roomManager.js              # Redis room + member management
            └── socketHandlers.js           # All Socket.IO event handlers
```

---

## Deployment

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && node src/config/migrate.js` |
| Start Command | `npm start` |
| Runtime | Node |

**Required environment variables on the backend host:**

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
REDIS_URL=rediss://...upstash.io:6379
JWT_SECRET=<64-byte random hex>
CLIENT_URL=https://your-app.vercel.app
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=your-verified-sender@example.com
EXECUTION_TIMEOUT_MS=10000
EXECUTION_MAX_OUTPUT_BYTES=65536
EXECUTION_MAX_STDIN_BYTES=65536
EXECUTION_MAX_STDIN_BYTES=65536
```

The backend uses the host's Node.js runtime and Python runtime. Python must be
available as `python3` on Linux/macOS or through the `py` launcher on Windows.

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

**Required environment variable on Vercel:**

```env
VITE_API_URL=https://your-backend.onrender.com
```

> The `frontend/vercel.json` rewrite rule handles SPA routing — all paths fall back to `index.html`.

### Running DB Migrations

```
npm install && node src/config/migrate.js
```

Uses `CREATE TABLE IF NOT EXISTS` — safe to run on every deploy.

---

## Getting Started (Local)

### Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x | |
| npm | 10.x | |
| Python 3 | 3.10+ | Required for Python execution |
| PostgreSQL | 15.x | Or use Neon.tech |
| Redis | 7.x | Or use Upstash |

Node.js and Python must be installed on the backend host.

### Environment Variables

Create `backend/.env`:

```env
PORT=8080
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/codeforge
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-minimum-64-chars
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=your-verified-sender@example.com
EXECUTION_TIMEOUT_MS=10000
EXECUTION_MAX_OUTPUT_BYTES=65536
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

### Running Locally

```bash
# 1. Database setup
createdb codeforge
cd backend && node src/config/migrate.js

# 2. Backend
cd backend && npm install && npm run dev
# → http://localhost:8080

# 3. Frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

> **Order matters:** Start Redis and PostgreSQL before the backend.

---

## API Reference

All routes prefixed with `/api`. Non-GET routes require `X-CSRF-Token` header (value from `/api/auth/me`).

### Auth

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/login` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/logout` | Cookie | — | `200` |
| `GET` | `/api/auth/me` | Cookie | — | `{ user, csrfToken }` |
| `POST` | `/api/auth/refresh` | Cookie | — | `{ user, csrfToken }` |
| `POST` | `/api/auth/forgot-password` | — | `{ email }` | `200` |
| `POST` | `/api/auth/reset-password` | — | `{ token, password }` | `200` |

### Execution

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/execute` | Cookie | `{ language, code, stdin? }` | Execution result with status, stdout, stderr, and exit code |
| `GET` | `/api/history` | Cookie | — | `Execution[]` |
| `GET` | `/api/history/:id` | Cookie | — | `Execution` |

### Rooms

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/rooms` | Cookie | — | `{ roomId, room }` |
| `GET` | `/api/rooms/:roomId` | Cookie | — | `Room` |

---

## WebSocket Events

Connect to the Socket.IO server at `VITE_API_URL` with `withCredentials: true`.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `run_code` | `{ language, code, stdin?, roomId?, sessionId }` | Queue code for execution |
| `join_room` | `{ roomId, userId, displayName }` | Join a collaborative room |
| `code_change` | `{ roomId, code, language }` | Broadcast code update to room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `status` | `{ status, sessionId }` | Execution status update |
| `output` | `{ output, data, type, sessionId }` | Stdout/stderr chunk |
| `room_joined` | `{ room, roomId, members }` | Confirmation + initial state |
| `member_joined` | `{ userId, members }` | Someone joined the room |
| `member_left` | `{ userId, members }` | Someone left the room |
| `code_updated` | `{ code, language, roomId }` | Remote code change |
| `error` | `string` | Error message from server |

> All `output` and `status` events carry a `sessionId`. The client drops any event whose `sessionId` doesn't match the current active run.

Execution statuses are `QUEUED`, `RUNNING`, `COMPLETED`, `COMPILE_ERROR`,
`RUNTIME_ERROR`, `TIMEOUT`, `OUTPUT_LIMIT`, `INVALID_LANGUAGE`, and
`EXECUTION_ERROR`. Only exit code 0 produces `COMPLETED`.

## Testing

Backend unit and integration tests use Jest, Supertest, and offline mocks for
PostgreSQL, Redis, and email delivery. The original Node execution test remains
available as a focused runtime check.

```bash
cd backend
npm test
npm run test:coverage
npm run test:execution
```

The load test submits real Socket.IO `run_code` requests at 2, 5, 10, 25, 50,
and 100 concurrent clients:

```bash
npm run load-test
```

Results are written to `backend/load-test/results/latest.json` and
`backend/load-test/results/latest.csv`.

## Results

Measured locally by `npm run load-test`; execution and end-to-end times are
averages in milliseconds from `backend/load-test/results/latest.json`.

| Concurrent clients | Successful executions | Average execution time | Average end-to-end time |
|---:|---:|---:|---:|
| 2 | 2 | 377 ms | 598 ms |
| 5 | 5 | 325 ms | 508 ms |
| 10 | 10 | 326 ms | 720 ms |
| 25 | 25 | 336 ms | 1,391 ms |
| 50 | 50 | 351 ms | 2,513 ms |
| 100 | 100 | 332 ms | 4,674 ms |

CPU and memory values were not collected by this load-test script.

---

## Database Schema

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  language    VARCHAR(30) NOT NULL,
  code        TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'QUEUED',
  output      TEXT,
  error       TEXT,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Security

CodeForge uses host-level child processes, not Docker, VMs, or containers. Each
run gets a unique temporary workspace and a sanitized environment containing
only `PATH`; source files are removed in cleanup. Timeout, output, and input
limits are enforced, and Windows process trees are terminated with `taskkill`.

This prevents accidental cross-execution workspace sharing and limits runaway
output or execution time. It does not provide complete network, CPU, memory,
filesystem, or process-count isolation from the host. Production hostile
multi-tenant execution requires an OS sandbox, VM, or container boundary.

| Mechanism | Implementation |
|---|---|
| **Passwords** | bcrypt, 10 salt rounds |
| **Sessions** | HttpOnly + Secure + `SameSite=None` (production) / `SameSite=Lax` (local) |
| **Refresh Tokens** | Rotating tokens stored as SHA-256 hashes. Single-use, 7-day TTL |
| **Password Reset** | Single-use token hashed with SHA-256, 10-minute expiry. Resets all refresh tokens on use |
| **CSRF** | Double-submit pattern — token in `/me` response, required as `X-CSRF-Token` header |
| **Rate Limiting** | Global: 100 req/15min. Execution: 20 runs/hour per IP |
| **Code Execution** | Host child process, 10-second timeout, input/output limits, sanitized environment, and process-tree cleanup where supported |
| **Input Validation** | Max 10,000 chars. Language must be in `SUPPORTED_LANGUAGES` whitelist |
| **Helmet** | CSP, HSTS (prod only), frameAncestors none |
| **userId Trust** | `socket.data.userId` set only at `join_room` — never overrideable by client events |
| **Email Enumeration** | Forgot-password always returns the same message regardless of whether email exists |

---

## Design System

CodeForge uses a custom warm parchment design language.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `parchment` | `#F8F4ED` | Page background |
| `panel` | `#FAF7F0` | Card / panel surface |
| `panelDeep` | `#F5F0E8` | Input / secondary surface |
| `ink` | `#1A1208` | Primary text |
| `muted` | `#7A6E5A` | Secondary text |
| `faint` | `#A0917E` | Placeholder / labels |
| `rule` | `#E0D8CA` | Borders / dividers |
| `accent` | `#C04A1A` | Primary action (burnt terracotta) |
| `accent2` | `#8C3310` | Shadow / deep accent |

### Typography

| Family | Usage |
|---|---|
| `DM Mono` | All UI text, code labels, buttons |
| `Spectral` | Headings, logo mark, serif display |

### Status Badges

| Status | Color |
|---|---|
| `IDLE` | Warm gray |
| `QUEUED` | Amber |
| `RUNNING` | Accent orange |
| `COMPLETED` | Green |
| `ERROR` | Red |
| `TIMEOUT` | Red |
| `RESOURCE_LIMIT` | Red |

---

## Known Limitations

- **Languages supported:** JavaScript and Python only. Adding a language requires updating `RUNNERS` in `executionEngine.js`.
- **Security limitation:** Host child-process execution does not isolate network, memory, CPU, filesystem, or process creation. Use only with trusted users.
- **Load-test measurements:** The harness records request, queue, execution, success, failure, and timeout results. CPU and memory values require an external host metrics source.
- **Room persistence:** Rooms are stored in Redis and expire after 24 hours.
- **Guest execution history:** Guest runs via `/playground` are not saved to the database.
- **Horizontal scaling:** The `setIo` pattern in `queue.js` uses in-process Socket.IO access — won't work across multiple Node processes without `@socket.io/redis-adapter`.
- **Render free tier cold starts:** Free instances sleep after 15 minutes. First request after sleep takes ~30 seconds.

---

<div align="center">

Built by Joel Kunjumon · MIT License

</div>
