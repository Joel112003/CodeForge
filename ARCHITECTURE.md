# CodeForge — Architecture, Flowcharts & Challenges

> A full technical breakdown of how CodeForge works internally — every flow, every connection, every challenge faced and solved.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication Flow](#2-authentication-flow)
3. [Code Execution Flow](#3-code-execution-flow)
4. [Real-Time Collaboration Flow](#4-real-time-collaboration-flow)
5. [Room Join & Leave Flow](#5-room-join--leave-flow)
6. [Frontend State Architecture](#6-frontend-state-architecture)
7. [How Everything Connects](#7-how-everything-connects)
8. [Challenges Faced & How I Solved Them](#8-challenges-faced--how-i-solved-them)

---

## 1. System Overview

```mermaid
graph TD
    USER["👤 Browser (React + Vite)"]

    subgraph Frontend
        PAGES["Pages\nLanding / Login / Register\nDashboard / Editor / Playground"]
        STORE["Zustand Store\nauthStore · toastStore"]
        SOCKET_HOOK["useSocket Hook\nSocket.IO Client"]
        API_SVC["api.js\nAxios + CSRF headers"]
    end

    subgraph Backend["Backend (Node.js / Express)"]
        EXPRESS["Express HTTP Server"]
        SOCKET_SRV["Socket.IO Server"]
        QUEUE["BullMQ Queue\n+ Worker"]
        AUTH_MW["Auth Middleware\nJWT + Cookie"]
        CSRF_MW["CSRF Middleware"]
        RATE_MW["Rate Limiter"]
    end

    subgraph Storage
        PG[("PostgreSQL\nusers · executions")]
        REDIS[("Redis\nJob Queue · Room State\nMember Sets")]
        DOCKER["🐳 Docker\nnode:alpine\npython:alpine"]
    end

    USER --> PAGES
    PAGES --> API_SVC
    PAGES --> SOCKET_HOOK
    API_SVC -->|HTTP REST| EXPRESS
    SOCKET_HOOK -->|WebSocket| SOCKET_SRV
    EXPRESS --> AUTH_MW --> CSRF_MW --> RATE_MW
    EXPRESS --> PG
    SOCKET_SRV --> QUEUE
    QUEUE --> REDIS
    QUEUE --> DOCKER
    QUEUE --> PG
    DOCKER -->|stdout/stderr| QUEUE
    QUEUE -->|emit output| SOCKET_SRV
    SOCKET_SRV -->|stream| SOCKET_HOOK
    STORE -.->|reads| PAGES
```

---

## 2. Authentication Flow

### How it works

```mermaid
sequenceDiagram
    actor User
    participant React as React (Frontend)
    participant Axios as api.js (Axios)
    participant Express as Express Server
    participant BCrypt as bcrypt
    participant JWT as JWT
    participant PG as PostgreSQL
    participant Cookie as HttpOnly Cookie

    User->>React: Fill register / login form
    React->>Axios: POST /api/auth/login { email, password }
    Axios->>Express: HTTP Request + CSRF header
    Express->>Express: CSRF middleware check
    Express->>PG: SELECT user WHERE email = ?
    PG-->>Express: user row (hashed password)
    Express->>BCrypt: compare(input, hash)
    BCrypt-->>Express: ✅ match
    Express->>JWT: sign({ userId, email })
    JWT-->>Express: token string
    Express->>Cookie: Set-Cookie: token=... HttpOnly Secure SameSite=Strict
    Express-->>Axios: 200 { user, csrfToken }
    Axios-->>React: response
    React->>React: authStore.setAuth(user, csrfToken)
    React->>User: Redirect → /dashboard
```

### Session hydration on page reload

```mermaid
flowchart LR
    A["App mounts"] --> B["GET /api/auth/me\n(cookie sent automatically)"]
    B --> C{Cookie valid?}
    C -->|Yes| D["setAuth(user, csrfToken)\nsetHydrated(true)"]
    C -->|No| E["setHydrated(true)\nuser = null"]
    D --> F["ProtectedRoute\nallows access"]
    E --> G["ProtectedRoute\nredirects → /login"]
```

### CSRF Protection detail

```mermaid
flowchart TD
    A["Login / Register"] --> B["Server returns csrfToken\nin JSON body"]
    B --> C["Stored in authStore\n(memory only — not localStorage)"]
    C --> D["Every non-GET request via api.js\nadds X-CSRF-Token header"]
    D --> E["csrfProtection middleware\nchecks header matches session"]
    E -->|Match| F["✅ Request proceeds"]
    E -->|No match| G["❌ 403 Forbidden"]
```

---

## 3. Code Execution Flow

### Full pipeline

```mermaid
sequenceDiagram
    actor Dev as Developer
    participant Editor as Editor.jsx
    participant Hook as useSocket.js
    participant SockSrv as socketHandlers.js
    participant Queue as queue.js (BullMQ)
    participant Redis as Redis
    participant Engine as executionEngine.js
    participant Docker as Docker Container
    participant DB as PostgreSQL

    Dev->>Editor: Click RUN button
    Editor->>Hook: runCode(language, code, roomId)
    Hook->>SockSrv: emit run_code { language, code, roomId }
    SockSrv->>SockSrv: normalizeLanguage()\nvalidate SUPPORTED_LANGUAGES
    SockSrv->>Hook: emit status: QUEUED
    SockSrv->>Queue: executionQueue.add("run", job)
    Queue->>Redis: persist job
    Redis-->>Queue: job stored
    Queue->>DB: INSERT executions (status=RUNNING)
    Queue->>Engine: executeCode(language, code, callback)
    Engine->>Docker: docker run --network none\n--memory 50m --cpus 0.5
    Docker-->>Engine: stdout/stderr stream chunks
    Engine->>Queue: callback(chunk, type) per line
    Queue->>Hook: emit output { data, type } per chunk
    Hook->>Editor: onOutput → setOutputLines
    Docker-->>Engine: process exit
    Queue->>DB: UPDATE executions SET status=COMPLETED output=...
    Queue->>Hook: emit status: COMPLETED
    Hook->>Editor: onStatus → setStatus
```

### Language normalization

```mermaid
flowchart LR
    INPUT["Input: 'js' / 'JS' / 'javascript'"] --> N["normalizeLanguage()"]
    N --> MAP{"alias map"}
    MAP -->|js → javascript| OUT["'javascript'"]
    MAP -->|py → python| OUT2["'python'"]
    MAP -->|unknown| ERR["emit error:\nUnsupported language"]
    OUT --> VALIDATE["SUPPORTED_LANGUAGES.includes()"]
    OUT2 --> VALIDATE
    VALIDATE -->|pass| DOCKER
    VALIDATE -->|fail| ERR
    DOCKER["Docker execution"]
```

### Execution status machine

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> QUEUED : run_code emitted
    QUEUED --> RUNNING : worker picks up job
    RUNNING --> COMPLETED : exit code 0
    RUNNING --> ERROR : exception / non-zero exit
    RUNNING --> TIMEOUT : > 5 seconds
    COMPLETED --> IDLE : user clears output
    ERROR --> IDLE : user clears output
    TIMEOUT --> IDLE : user clears output
```

---

## 4. Real-Time Collaboration Flow

### Code sync between users

```mermaid
sequenceDiagram
    actor UserA as User A (host)
    actor UserB as User B (collaborator)
    participant Srv as Socket.IO Server
    participant Redis as Redis (room state)

    UserA->>Srv: types code → emit code_change\n{ roomId, code, language }
    Srv->>Redis: updateRoomCode(roomId, code, language)
    Srv->>UserB: emit code_updated { code, language }
    Note over UserB: isRemoteUpdate.current = true\nsetCode(code) — no echo back
    UserB->>Srv: types code → emit code_change
    Srv->>Redis: updateRoomCode(...)
    Srv->>UserA: emit code_updated { code, language }
    Note over UserA: isRemoteUpdate.current = true\nsetCode(code)
```

### Why `isRemoteUpdate` ref?

```mermaid
flowchart TD
    A["Remote code_updated event arrives"]
    A --> B["isRemoteUpdate.current = true"]
    B --> C["setCode(remoteCode)"]
    C --> D["handleCodeChange fires\nbecause Monaco onChange"]
    D --> E{isRemoteUpdate.current?}
    E -->|true| F["Skip sendCodeChange()\nNo echo loop! ✅"]
    E -->|false| G["sendCodeChange() → broadcast"]
    F --> H["setTimeout → isRemoteUpdate = false"]
```

---

## 5. Room Join & Leave Flow

### Join flow

```mermaid
flowchart TD
    A["User navigates to /editor/:roomId"] --> B["Editor.jsx mounts"]
    B --> C["useEffect:\njoinRoom(roomId, user.id, user.email)"]
    C --> D["useSocket emit join_room\n{ roomId, userId UUID, displayName email }"]
    D --> E["socketHandlers: getRoom(roomId)"]
    E --> F{Room in Redis?}
    F -->|No| G["emit error: Room not found"]
    F -->|Yes| H["socket.join(normalizedRoomId)\nsocket.data.userId = UUID\nsocket.data.displayName = email"]
    H --> I["addMember(roomId, email)\ngetMembers(roomId)"]
    I --> J["emit room_joined → sender\n{ room, members }"]
    J --> K["Editor: setMembers + setCode + setLanguage"]
    I --> L["emit member_joined → all others\n{ userId: email, members }"]
    L --> M["Other clients: setMembers(members)"]
```

### Leave flow (disconnect)

```mermaid
flowchart TD
    A["User closes tab / navigates away"] --> B["Socket disconnect event"]
    B --> C["socketHandlers disconnect handler"]
    C --> D["const { roomId, userId, displayName } = socket.data"]
    D --> E["removeMember(roomId, displayName)\n⚠️ Must use displayName (email)\nnot UUID — that's what was stored"]
    E --> F["getMembers(roomId)"]
    F --> G["io.to(roomId).emit member_left\n{ userId: displayName, members }"]
    G --> H["All clients:\nonMemberLeft → setMembers(members)"]
    H --> I["MemberList re-renders\nwithout the left user ✅"]
```

---

## 6. Frontend State Architecture

```mermaid
graph TD
    subgraph Zustand["Zustand Global State"]
        AUTH["authStore\n─────────\nuser: { id, email }\ncsrfToken: string\nhydrated: boolean\n─────────\nsetAuth()\nlogout()\nsetHydrated()"]
        TOAST["toastStore\n─────────\ntoasts: Toast[]\n─────────\naddToast()\nremoveToast()"]
    end

    subgraph LocalState["Local Component State"]
        ED["Editor.jsx\n─────────\nlanguage\ncode\noutputLines\nstatus\nmembers\nconnected"]
        DASH["Dashboard.jsx\n─────────\nhistory[]\nloading\ncreating\njoinOpen"]
        PG["Playground.jsx\n─────────\nlanguage\ncode\noutputLines\nstatus"]
    end

    subgraph Hooks["Custom Hooks"]
        SOCK["useSocket()\n─────────\nrunCode()\njoinRoom()\nsendCodeChange()\nconnected: boolean"]
    end

    AUTH --> ED
    AUTH --> DASH
    TOAST --> ToastContainer["ToastContainer\n(renders in App.jsx)"]
    SOCK --> ED
    SOCK --> PG
    ED --> LocalState
    DASH --> LocalState
```

### Data flow for toast system

```mermaid
flowchart LR
    A["Any component calls\nshowToast(msg, variant)"] --> B["toastMessages.js\nshowToast()"]
    B --> C["toastStore.getState().addToast()"]
    C --> D["toastStore: toasts array updates"]
    D --> E["ToastContainer subscribes\nvia useToastStore()"]
    E --> F["Renders Toast components\nwith AnimatePresence"]
    F --> G["Auto-dismiss after 4s\nremoveToast(id)"]
```

---

## 7. How Everything Connects

```mermaid
graph LR
    subgraph Client
        UI["React UI"]
        ZS["Zustand"]
        AX["Axios\napi.js"]
        SC["Socket.IO\nclient"]
    end

    subgraph Server
        EX["Express\nREST API"]
        SIO["Socket.IO\nServer"]
        MW["Middleware\nCSRF·Auth·Rate"]
        QW["BullMQ\nWorker"]
    end

    subgraph Data
        PG[("PostgreSQL")]
        RD[("Redis")]
        DK["Docker"]
    end

    UI -- "HTTP\n/api/auth\n/api/rooms\n/api/execute" --> AX
    AX -- "X-CSRF-Token\ncookie" --> EX
    EX --> MW --> PG

    UI -- "run_code\njoin_room\ncode_change" --> SC
    SC -- "WebSocket" --> SIO
    SIO -- "add to queue" --> QW
    QW -- "job store" --> RD
    QW -- "spawn" --> DK
    DK -- "stdout chunks" --> QW
    QW -- "emit output\nemit status" --> SIO
    SIO -- "output\nstatus\nmember_joined\ncode_updated" --> SC
    SC -- "callbacks" --> UI
    QW -- "INSERT/UPDATE\nexecutions" --> PG

    SIO -- "room state\nmember sets" --> RD
```

---

## 8. Challenges Faced & How I Solved Them

---

### Challenge 1 — Terminal not showing output (Stale Closure Bug)

**Problem:**
When the user clicked Run, the terminal stayed empty. The socket was connected and jobs were running (confirmed via logs), but `onOutput` was never updating the React state.

**Root Cause:**
`useSocket.js` registered the `output` event listener inside `useEffect([], ...)` — empty deps array means it runs once. The `onOutput` callback captured at mount time had a stale reference to the `setOutputLines` function from the first render. State updates from the socket were being discarded silently.

```mermaid
flowchart TD
    A["useEffect runs once on mount"] --> B["socket.on('output', onOutput)"]
    B --> C["onOutput captured from first render"]
    C --> D["State changes → component re-renders"]
    D --> E["New onOutput created with new setOutputLines"]
    E --> F["But socket still holds OLD onOutput reference"]
    F --> G["socket emits 'output'"]
    G --> H["OLD onOutput called → stale closure\nsetOutputLines does nothing ❌"]
```

**Solution — Ref Forwarding Pattern:**

```mermaid
flowchart TD
    A["Create refs for each callback\nonOutputRef = useRef(onOutput)"]
    B["Sync refs on every render\nuseEffect: onOutputRef.current = onOutput"]
    C["Socket listener delegates through ref\nsocket.on('output', data => onOutputRef.current?.(data))"]
    A --> B --> C
    C --> D["Socket always calls the LATEST callback ✅\nNo stale closures"]
```

---

### Challenge 2 — Circular Import Crash (queue ↔ socketHandlers)

**Problem:**
`socketHandlers.js` imported `executionQueue` from `queue.js`. `queue.js` imported `getSocket` from `socketHandlers.js`. Node.js ESM handled this but one module received an incomplete binding — `getSocket` was `undefined` at runtime, so every socket lookup failed silently and output was never emitted.

```mermaid
flowchart LR
    A["socketHandlers.js\nimport executionQueue\nfrom queue.js"] --> B["queue.js\nimport getSocket\nfrom socketHandlers.js"]
    B --> A
    B --> C["getSocket = undefined at runtime\n(circular ESM binding)"]
    C --> D["socket?.emit() → no-op ❌"]
```

**Solution — setIo injection pattern:**

```mermaid
flowchart TD
    A["server.js creates io = new Server(httpServer)"]
    A --> B["setupSocket(io) — wires socket events"]
    A --> C["setIo(io) — injects io into queue.js"]
    C --> D["queue.js stores _io reference"]
    D --> E["Worker: _io.sockets.sockets.get(socketId)"]
    E --> F["Direct socket lookup via Socket.IO's\nown internal map ✅\nNo circular dependency"]
```

---

### Challenge 3 — UUID vs Email mismatch crashing executions

**Problem:**
After joining a room, running code caused:
```
job failed: invalid input syntax for type uuid: "user@gmail.com"
```

**Root Cause Chain:**

```mermaid
flowchart TD
    A["Editor.jsx:\njoinRoom(roomId, user.email || user.id)"]
    A -->|email passed as userId| B["socket.emit join_room\n{ userId: 'user@gmail.com' }"]
    B --> C["socket.data.userId = 'user@gmail.com'"]
    C --> D["run_code handler:\nexecutionQueue.add({ userId: socket.data.userId })"]
    D --> E["queue worker:\nINSERT INTO executions (user_id)\nVALUES ('user@gmail.com')"]
    E --> F["PostgreSQL: user_id is UUID type\n❌ CRASH"]
```

**Solution — Split UUID from DisplayName:**

```mermaid
flowchart TD
    A["Editor.jsx:\njoinRoom(roomId, user.id, user.email)"]
    A --> B["socket.emit join_room\n{ userId: UUID, displayName: email }"]
    B --> C["socket.data.userId = UUID\nsocket.data.displayName = email"]
    C --> D["addMember(roomId, email)\n— Redis stores email for display"]
    C --> E["run_code:\nINSERT INTO executions (user_id)\nVALUES (UUID) ✅"]
    D --> F["MemberList shows emails ✅"]
    E --> G["DB accepts UUID ✅"]
```

---

### Challenge 4 — Member never removed on disconnect

**Problem:**
When a user left the room, their name stayed in the member list permanently.

**Root Cause:**
At `join_room` we stored `displayName` (email) in the Redis member set.
At `disconnect` we called `removeMember(roomId, userId)` — passing the UUID.
Redis set lookup is exact — UUID ≠ email → nothing deleted.

```mermaid
flowchart LR
    JOIN["join_room:\naddMember(roomId, 'user@email.com')"]
    REDIS[("Redis Set\n'user@email.com'")]
    DISC["disconnect:\nremoveMember(roomId, 'uuid-1234')"]
    MISS["❌ 'uuid-1234' not in set\nNothing removed"]

    JOIN --> REDIS
    DISC --> MISS
    REDIS -.->|never touched| DISC
```

**Solution:**

```mermaid
flowchart LR
    JOIN["join_room:\nsocket.data.displayName = email\naddMember(roomId, email)"]
    REDIS[("Redis Set\n'user@email.com'")]
    DISC["disconnect:\nremoveMember(roomId, displayName)\n= removeMember(roomId, email)"]
    OK["✅ Email found and removed\nGetMembers → updated list\nio.emit member_left → all clients"]

    JOIN --> REDIS
    DISC --> OK
    REDIS --> OK
```

---

### Challenge 5 — dotenv loaded after validateEnv

**Problem:**
`validateEnv()` ran before `dotenv.config()` — all env vars were `undefined` during validation. The server would start with no DB/Redis config, causing silent connection failures.

```mermaid
flowchart LR
    A["validateEnv() ← runs first\nall process.env = undefined"]
    B["dotenv.config() ← runs second\nnow env loaded but too late"]
    A --> FAIL["Validation passes with undefined\nDB / Redis connection fails silently ❌"]
    B --> FAIL
```

**Fix:**
```mermaid
flowchart LR
    A["dotenv.config() ← runs FIRST"] --> B["validateEnv() ← now sees real values"]
    B --> C["All connections initialized correctly ✅"]
```

---

### Challenge 6 — Guest execution security (userId override)

**Problem:**
The `run_code` socket handler previously accepted a `userId` field from the client:
```js
socket.on("run_code", async ({ language, code, roomId, userId }) => {
  if (userId) socket.data.userId = userId  // ← DANGEROUS
```
Any client could send `userId: someOtherUUID` and write execution records to another user's account.

**Solution:**
`socket.data.userId` is now **set once at `join_room`** and **never overrideable** by any subsequent client event. The `run_code` handler ignores any userId in the payload entirely.

```mermaid
flowchart TD
    A["join_room event\n— authenticated context\n— userId verified from JWT session"]
    A --> B["socket.data.userId = verifiedUUID\n(set once, immutable for this connection)"]
    B --> C["run_code event\n— ignores any userId in payload"]
    C --> D["Uses socket.data.userId only\n✅ Tamper-proof"]
```

---

### Challenge 7 — Real-time output echo loop

**Problem:**
When User B received `code_updated` and called `setCode()`, Monaco's `onChange` fired, which called `sendCodeChange()` again, which broadcast back to everyone — creating an infinite loop.

**Solution — `isRemoteUpdate` ref guard:**

```mermaid
sequenceDiagram
    participant A as User A
    participant Srv as Server
    participant B as User B

    A->>Srv: code_change { code: "hello" }
    Srv->>B: code_updated { code: "hello" }
    Note over B: isRemoteUpdate.current = true
    B->>B: setCode("hello") → Monaco onChange fires
    B->>B: handleCodeChange checks isRemoteUpdate
    Note over B: isRemoteUpdate = true → SKIP sendCodeChange
    Note over B: setTimeout → isRemoteUpdate = false
    B--xSrv: ❌ Does NOT echo back
```

---

*End of Architecture Document*

> This document was written as a companion to `README.md`.
> All diagrams use [Mermaid](https://mermaid.js.org/) — render in GitHub, VS Code (Markdown Preview Mermaid), or [mermaid.live](https://mermaid.live).
