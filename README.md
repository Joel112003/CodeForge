# CodeForge

> **A real-time collaborative code execution platform** — write, run, and share code with your team in live sessions backed by a Redis-powered job queue and WebSocket-driven real-time sync.

🔗 **Live Demo:** [code-forge-two.vercel.app](https://code-forge-two.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Getting Started (Local)](#getting-started-local)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [Security](#security)
- [Design System](#design-system)
- [Known Limitations](#known-limitations)

---

## Overview

CodeForge is a SaaS-grade collaborative coding environment. Users can:

- **Run code** in a sandboxed process (JavaScript, Python) with real-time terminal output streamed back via WebSockets.
- **Create rooms** and invite others to collaborate with live code sync — every keystroke is broadcast to all session members instantly.
- **Join sessions** from a shared link or room code, see who's online, and watch output as it streams.
- **Track history** — all executions are persisted to PostgreSQL with language, code, output, duration, and status.
- **Use the Playground** as a guest — run code without signing up, executions are not saved.

---

## Architecture

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
│             child_process.spawn()                            │
│           (node / python3 subprocess)                        │
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
1. Client emits  run_code  { language, code, roomId }
2. Socket handler validates language → emits status: QUEUED
3. Job added to BullMQ queue (language, code, socketId, roomId, userId)
4. Worker picks up job → spawns child_process (node/python3) with 10s timeout
5. Stdout/stderr chunks stream back via  socket.emit("output", chunk)
6. On completion → status: COMPLETED + DB record updated
7. All room members receive output in real time via  socket.to(roomId)
```

---

## Feature Highlights

| Feature | Detail |
|---|---|
| **Sandboxed Execution** | Each run spawns a fresh child process. 10s timeout, streamed stdout/stderr |
| **Real-time Collab** | Socket.IO rooms — code changes broadcast to every member via `code_updated` event |
| **Job Queue** | BullMQ + Redis — runs are queued, not blocking. Concurrency = 5 workers |
| **Execution History** | PostgreSQL stores every run: language, code, output, duration, status |
| **Guest Mode** | `/playground` — no auth required, runs not saved, rooms unavailable |
| **Join by Link** | Share `/editor/:roomId` URL or 8-char room code. Room expires in 24 hours |
| **Member Presence** | Live member list — join/leave events update all clients instantly |
| **CSRF Protection** | Double-submit cookie pattern on all non-GET API routes |
| **Rate Limiting** | `apiLimiter` (global) + `executionLimiter` (20 exec/hour per IP) |
| **Refresh Tokens** | Rotating refresh token strategy — access tokens expire in 1hr, auto-refreshed silently |

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
| boneyard-js | 1.8 | Form schema registry |
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

---

## Project Structure

```
CodeExecutionEngine/
├── frontend/
│   └── src/
│       ├── bones/                  # boneyard-js form schemas + registry
│       ├── components/
│       │   ├── editor/
│       │   │   ├── CodeEditor.jsx      # Monaco wrapper
│       │   │   └── LanguageSelector.jsx
│       │   ├── layout/
│       │   │   ├── EditorTopbar.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   ├── room/
│       │   │   ├── JoinRoomModal.jsx
│       │   │   └── MemberList.jsx      # Live member presence panel
│       │   ├── terminal/
│       │   │   └── Terminal.jsx        # Output stream renderer
│       │   └── ui/
│       │       ├── Badge.jsx           # Status badge (IDLE/RUNNING/etc)
│       │       ├── Button.jsx
│       │       ├── Skeleton.jsx        # Shimmer loading states
│       │       └── Toast.jsx           # Glassmorphic toast system
│       ├── config/
│       │   └── constants.js            # API_URL, LANGUAGES, DEFAULT_CODE
│       ├── hooks/
│       │   └── useSocket.js            # Socket.IO hook (stale-closure safe)
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Editor.jsx              # Collaborative code editor
│       │   ├── History.jsx
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Playground.jsx          # Guest mode editor
│       │   └── Register.jsx
│       ├── services/
│       │   └── api.js                  # Axios instance + interceptors + all API calls
│       ├── store/
│       │   ├── authStore.js            # Zustand auth state
│       │   └── toastStore.js           # Zustand toast queue
│       └── utils/
│           └── toastMessages.js        # Typed toast helpers
│
└── backend/
    ├── server.js                       # Entry point: Express + Socket.IO setup
    └── src/
        ├── config/
        │   ├── db.js                   # PostgreSQL pool (SSL in production)
        │   ├── env.js                  # Required env var validation
        │   ├── migrate.js              # CREATE TABLE IF NOT EXISTS migrations
        │   └── redis.js                # ioredis client
        ├── controllers/
        │   ├── auth.controller.js      # Register, Login, Me, Logout, Refresh
        │   ├── execute.controller.js
        │   └── room.controller.js
        ├── middleware/
        │   ├── auth.middleware.js       # JWT verification
        │   ├── csrfProtection.js
        │   ├── errorHandler.js
        │   ├── rateLimiter.js
        │   └── validateExecution.js    # Language + code length validation
        ├── routes/
        │   ├── auth.routes.js
        │   ├── execute.routes.js
        │   └── room.routes.js
        └── services/
            ├── containerCleanup.js     # No-op in production (cloud-safe)
            ├── executionEngine.js      # child_process executor (node / python3)
            ├── queue.js                # BullMQ worker (setIo pattern)
            ├── roomManager.js          # Redis room + member management
            └── socketHandlers.js       # All Socket.IO event handlers
```

---

## Deployment

The production deployment uses a split frontend/backend model.

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && node src/config/migrate.js` |
| Start Command | `npm start` |
| Runtime | Node |

**Required environment variables on Render:**

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
REDIS_URL=rediss://...upstash.io:6379
JWT_SECRET=<64-byte random hex>
CLIENT_URL=https://your-app.vercel.app
```

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

> The `frontend/vercel.json` rewrite rule handles SPA routing — all paths fall back to `index.html` so React Router works on direct URL access and page refresh.

### Running DB Migrations

Migrations run automatically as part of the Render build command:
```
npm install && node src/config/migrate.js
```
Uses `CREATE TABLE IF NOT EXISTS` — safe to run on every deploy, existing data is never affected.

---

## Getting Started (Local)

### Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x | |
| npm | 10.x | |
| Python 3 | 3.10+ | Required for Python execution locally |
| PostgreSQL | 15.x | Or use Neon.tech |
| Redis | 7.x | Or use Upstash |

> **No Docker required** — the execution engine uses `child_process.spawn()` (node / python3) in both local and production environments.

---

### Environment Variables

Create `backend/.env`:

```env
# ── Server ─────────────────────────────────────────────
PORT=8080
NODE_ENV=development

# ── Client (CORS origin) ────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── PostgreSQL ──────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@localhost:5432/codeforge

# ── Redis ───────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Auth ────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-minimum-64-chars
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

---

### Running Locally

#### 1. Database setup

```bash
createdb codeforge
cd backend
node src/config/migrate.js
```

#### 2. Start the backend

```bash
cd backend
npm install
npm run dev
# → Server running on http://localhost:8080
```

#### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → Vite dev server on http://localhost:5173
```

> **Order matters:** Start Redis and PostgreSQL before the backend. Start the backend before the frontend.

---

## API Reference

All routes are prefixed with `/api`. Non-GET routes require the `X-CSRF-Token` header (value returned by `/api/auth/me`).

### Auth

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/login` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/logout` | Cookie | — | `200` |
| `GET` | `/api/auth/me` | Cookie | — | `{ user, csrfToken }` |
| `POST` | `/api/auth/refresh` | Cookie | — | `{ user, csrfToken }` |

### Execution

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/execute` | Cookie | `{ language, code }` | `{ executionId }` |
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

### Client → Server (emit)

| Event | Payload | Description |
|---|---|---|
| `run_code` | `{ language, code, roomId? }` | Queue code for execution |
| `join_room` | `{ roomId, userId, displayName }` | Join a collaborative room |
| `code_change` | `{ roomId, code, language }` | Broadcast code update to room |

### Server → Client (listen)

| Event | Payload | Description |
|---|---|---|
| `status` | `"QUEUED" \| "RUNNING" \| "COMPLETED" \| "ERROR"` | Execution status update |
| `output` | `{ output, data, type }` | Stdout/stderr chunk |
| `room_joined` | `{ room, roomId, members }` | Confirmation + initial state |
| `member_joined` | `{ userId, members }` | Someone joined the room |
| `member_left` | `{ userId, members }` | Someone left the room |
| `code_updated` | `{ code, language, roomId }` | Remote code change |
| `error` | `string` | Error message from server |

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
```

> Run `node src/config/migrate.js` from the `backend/` directory to auto-create all tables.

---

## Security

| Mechanism | Implementation |
|---|---|
| **Passwords** | bcrypt, 10 salt rounds |
| **Sessions** | HttpOnly + Secure + `SameSite=None` (production cross-origin) / `SameSite=Lax` (local) |
| **Refresh Tokens** | Rotating tokens stored as SHA-256 hashes in PostgreSQL. Single-use, 7-day TTL |
| **CSRF** | Double-submit pattern — token in `/me` response, required as `X-CSRF-Token` header |
| **Rate Limiting** | Global: 100 req/15min. Execution: 20 runs/hour per IP |
| **Code Sandbox** | Subprocess timeout 10s. Process killed with SIGKILL on timeout |
| **Input Validation** | Max 10,000 chars. Language must be in `SUPPORTED_LANGUAGES` whitelist |
| **Helmet** | CSP, HSTS (prod only), frameAncestors none |
| **userId Trust** | `socket.data.userId` set only at `join_room` — never overrideable by client events |

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
| `TIMEOUT` | Yellow |

---

## Known Limitations

- **Languages supported:** JavaScript and Python only. Adding a language requires updating `RUNNERS` in `executionEngine.js`.
- **No process isolation:** The `child_process` approach runs code directly on the server (no Docker sandbox). Suitable for portfolio/demo use. For production-grade isolation, replace with Docker on a VPS that exposes `/var/run/docker.sock`.
- **Room persistence:** Rooms are stored in Redis and expire after 24 hours. No permanent room history.
- **Guest execution history:** Guest runs via `/playground` are not saved to the database.
- **Horizontal scaling:** The `setIo` pattern in `queue.js` uses in-process Socket.IO access — won't work across multiple Node processes without `@socket.io/redis-adapter`.
- **Render free tier cold starts:** Free instances sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

<div align="center">

Built with ♦ by Joel Kunjumon · MIT License

</div>
