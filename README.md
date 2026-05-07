# CodeForge

> **A real-time collaborative code execution platform** — write, run, and share code with your team in live sessions backed by isolated Docker containers, a Redis-powered job queue, and WebSocket-driven real-time sync.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
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

- **Run code** in isolated Docker containers (JavaScript, Python) with real-time terminal output streamed back via WebSockets.
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
│   (sessions,         │                                       │
│    executions)       ▼                                       │
│              Docker Container                                │
│           (node:alpine / python:alpine)                      │
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
4. Worker picks up job → spawns Docker container with resource limits
5. Stdout/stderr chunks stream back via  socket.emit("output", chunk)
6. On completion → status: COMPLETED + DB record updated
7. All room members receive output in real time via  socket.to(roomId)
```

---

## Feature Highlights

| Feature | Detail |
|---|---|
| **Isolated Execution** | Each run spawns a fresh Docker container. 5s timeout, 50MB memory cap, no network access |
| **Real-time Collab** | Socket.IO rooms — code changes broadcast to every member via `code_updated` event |
| **Job Queue** | BullMQ + Redis — runs are queued, not blocking. Concurrency = 5 workers |
| **Execution History** | PostgreSQL stores every run: language, code, output, duration, status |
| **Guest Mode** | `/playground` — no auth required, runs not saved, rooms unavailable |
| **Join by Link** | Share `/editor/:roomId` URL or 8-char room code. Room expires in 24 hours |
| **Member Presence** | Live member list — join/leave events update all clients instantly |
| **CSRF Protection** | Double-submit cookie pattern on all non-GET API routes |
| **Rate Limiting** | `apiLimiter` (global) + `executionLimiter` (20 exec/hour per IP) |

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
| Express | HTTP server & routing |
| Socket.IO | WebSocket server |
| BullMQ | Redis-backed job queue |
| ioredis | Redis client |
| pg | PostgreSQL client (connection pool) |
| bcrypt | Password hashing |
| jsonwebtoken | JWT access tokens |
| dockerode | Docker container management |
| helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| uuid | Room ID generation |

---

## Project Structure

```
CodeExecutionEngine/
├── frontend/
│   └── src/
│       ├── bones/                  # boneyard-js form schemas + registry
│       │   ├── login-form.bones.json
│       │   ├── register-form.bones.json
│       │   └── registry.js
│       ├── components/
│       │   ├── editor/
│       │   │   ├── CodeEditor.jsx      # Monaco wrapper
│       │   │   └── LanguageSelector.jsx
│       │   ├── layout/
│       │   │   ├── EditorTopbar.jsx    # Topbar for Editor + Playground
│       │   │   ├── Navbar.jsx          # App + public navbar variants
│       │   │   ├── NoiseBackground.jsx
│       │   │   └── ProtectedRoute.jsx
│       │   ├── room/
│       │   │   ├── JoinRoomModal.jsx   # Join by code or URL
│       │   │   └── MemberList.jsx      # Live member presence panel
│       │   ├── terminal/
│       │   │   └── Terminal.jsx        # Output stream renderer
│       │   └── ui/
│       │       ├── Badge.jsx           # Status badge (IDLE/RUNNING/etc)
│       │       ├── Button.jsx          # Reusable button w/ variants
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
│       │   └── api.js                  # Axios instance + all API calls
│       ├── store/
│       │   ├── authStore.js            # Zustand auth state
│       │   └── toastStore.js           # Zustand toast queue
│       └── utils/
│           └── toastMessages.js        # Typed toast helpers
│
└── backend/
    ├── server.js                       # Entry point: Express + Socket.IO
    └── src/
        ├── config/
        │   ├── db.js                   # PostgreSQL pool
        │   ├── env.js                  # Env var validation
        │   └── redis.js                # ioredis client
        ├── controllers/
        │   ├── auth.controller.js
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
            ├── containerCleanup.js     # Orphan Docker container removal
            ├── executionEngine.js      # Docker spawner + stream reader
            ├── queue.js                # BullMQ worker (setIo pattern)
            ├── roomManager.js          # Redis room + member management
            └── socketHandlers.js       # All Socket.IO event handlers
```

---

## Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Docker | 24.x (must be running) |
| PostgreSQL | 15.x |
| Redis | 7.x |

> **Docker must be running** before starting the backend. The execution engine pulls `node:alpine` and `python:alpine` images on first run.

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
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRES_IN=7d

# ── Execution limits ────────────────────────────────────
MAX_CODE_LENGTH=10000
EXECUTION_TIMEOUT_MS=5000
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

---

### Running Locally

#### 1. Database setup

```bash
# Create the database
createdb codeforge

# Run migrations
cd backend
node src/migrate.js
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

> **Order matters:** Start Redis and PostgreSQL before the backend. Start the backend before the frontend (for socket connection).

---

## API Reference

All routes are prefixed with `/api`. Non-GET routes require the `X-CSRF-Token` header (value from `/api/auth/me` response).

### Auth

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/login` | — | `{ email, password }` | `{ user, csrfToken }` |
| `POST` | `/api/auth/logout` | Cookie | — | `204` |
| `GET` | `/api/auth/me` | Cookie | — | `{ user, csrfToken }` |

### Execution

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/execute` | Cookie | `{ language, code }` | `{ executionId }` |
| `GET` | `/api/execute/history` | Cookie | — | `Execution[]` |

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
-- Users
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Executions
CREATE TABLE executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,
  code        TEXT NOT NULL,
  output      TEXT,
  status      TEXT NOT NULL DEFAULT 'RUNNING',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

> Run `node src/migrate.js` from the backend directory to auto-create these tables.

---

## Security

| Mechanism | Implementation |
|---|---|
| **Passwords** | bcrypt with salt rounds = 12 |
| **Sessions** | HttpOnly + Secure + SameSite=Strict cookies |
| **CSRF** | Double-submit pattern — token in `/me` response, required as `X-CSRF-Token` header |
| **Rate Limiting** | Global: 100 req/15min. Execution: 20 runs/hour per IP |
| **Code Sandbox** | Docker: `--network none`, `--memory 50m`, `--cpus 0.5`, 5s timeout |
| **Input Validation** | Max 10,000 chars. Language must be in `SUPPORTED_LANGUAGES` whitelist |
| **Helmet** | CSP, HSTS (prod only), frameAncestors none |
| **userId Trust** | `socket.data.userId` is set only at `join_room` — never overrideable by client events |

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

- **Languages supported:** JavaScript and Python only. Adding a language requires updating `SUPPORTED_LANGUAGES` in `executionEngine.js` and adding a Docker image entry.
- **Room persistence:** Rooms are stored in Redis and expire after 24 hours. There is no permanent room history.
- **Guest execution history:** Guest runs via `/playground` are not saved to the database.
- **Horizontal scaling:** The `setIo` pattern in `queue.js` uses in-process Socket.IO access — this will not work across multiple Node processes without Redis adapter for Socket.IO (`@socket.io/redis-adapter`).
- **Docker cold start:** First run of each language may take a few seconds if the Docker image is not cached locally.

---

<div align="center">

Built with ♦ by Joel Kunjumon · MIT License

</div>
