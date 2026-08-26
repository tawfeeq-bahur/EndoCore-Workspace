<div align="center">

# 🕊️ EndoCore Workspace

### *Privacy-Preserving Collaborative Multi-Agent Workspace & Developer Health Platform*

[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/en-us/windows)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Electron](https://img.shields.io/badge/Desktop_Agent-Electron_34-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js_4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_|_Postgres-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Gemini](https://img.shields.io/badge/Gen_AI-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Ollama](https://img.shields.io/badge/Edge_AI-Ollama-FFA500?style=for-the-badge)](https://ollama.com/)

**The ultimate developer co-working platform. Tracks activity dynamically. Sanitizes data locally at the Edge. Coordinates Scrum alignments. Keeps team energy high and prevent burnout.**

[🚀 Quick Start](#-quick-start-setup) • [✨ Features](#-core-features) • [🏗️ Architecture](#-system-architecture) • [🔌 API Reference](#-api-reference) • [🤖 Agent Roles](#-multi-agent-coordination) • [🎯 Demo](#-user-experience-showcase)

</div>

---

## 🎯 What is EndoCore Workspace?

```mermaid
graph TD
    A["💻 Active Desktop Windows"] -->|"Capture Active Window"| B["🛡️ Local Electron Agent"]
    B -->|"Sanitize via Ollama Local LLM"| C["🔐 Privacy Filter (Category/Summary)"]
    C -->|"Secure HTTPS Sync"| D["⚙️ Express.js Server"]
    D -->|"Multi-Agent Analysis"| E["🤖 Team Coordinator Agent (Gemini)"]
    D -->|"Wellness Analysis"| F["🤖 Health & Wellness Agent (Gemini)"]
    E -->|"WebSocket Broadcast"| G["🖥️ React Collaborative Dashboard"]
    F -->|"WebSocket Broadcast"| G
    G -->|"Real-Time Statuses & AI Insights"| H["👥 Collaborative Engineering Team"]
```

<div align="center">

### **Academic Problem** → **Intelligent Solution**
Sharing raw window titles violates developer privacy | **Local Edge Sanitization** processes data on-device before sync.
Team members work in silos, duplicating debug efforts | **Multi-Agent Scrum Coordinator** detects blocks and pairs peers.
High cognitive load and extended focus cause burnout | **Wellness Agent** tracks active focus limits and nudges breaks.
Simulated dummy data does not represent real teamwork | **Real-time Active Window tracking** streams actual telemetry.
No centralized visibility of distributed team statuses | **WebSocket-driven Workspace Dashboard** with instant status sync.

</div>

---

## ✨ Core Features

<table>
<tr>
<td width="50%">

### 🛡️ **Privacy-Preserving Edge Summarizer**
```mermaid
graph TD
    A["📂 Active Win Event"] --> B["🔎 Raw Title Captured"]
    B --> C["🛡️ Stage 0: Regex PII Guard"]
    C --> D["⚡ Stage 1: LRU SHA-256 Cache"]
    D --> E["🦙 Stage 2: Local Ollama (Phi-3)"]
    E --> F["✅ Sanitized Category & Title"]
    F --> G["🌐 Secure Server Sync"]
```

**On-Device Multi-Tier Privacy Sanitization:**
- 🔐 **3-Tier Protection Pipeline**: Stage 0 (Regex Scrubbing) → Stage 1 (SHA-256 LRU Cache) → Stage 2 (Ollama SLM Phi-3/Llama-3 with 800ms timeout).
- 🛡️ Converts raw sensitive names (e.g., `personal_bank_statement.pdf`) to high-level context (e.g., `[Private Document]`).
- 🛑 Configurable privacy modes (*Full Detail*, *Team Only*, *Private Workstation*).
- 🧬 Local execution via Ollama & regex engine with zero cloud data leaks.

</td>
<td width="50%">

### 🤖 **Multi-Agent Coordinator (Server)**
```mermaid
graph TD
    A["👥 Team Sanitized Logs"] --> B["🕵️ Observation Agent"]
    B --> C["🔎 Blockage Detector"]
    C --> D["🧠 Scrum Coordinator (Gemini)"]
    D --> E["💡 Peer Sync Recommendations"]
    E --> F["⚡ Dynamic AI Briefings"]
```

**Intelligent Collaboration Engine:**
- 🕵️ Monitors compile issues, long tasks, and active windows.
- 💡 Suggests collaborative pairings (e.g., *“Tawfeeq has been stuck on Prisma migrations for 30m; Sarah resolved this earlier, connect with her!”*).
- ⚡ Generates daily developer briefs with witticisms and developer humor.

</td>
</tr>
<tr>
<td width="50%">

### 🩺 **Welfare & Wellness Coach**
```mermaid
graph LR
    A["⏱️ Focus Duration"] --> B["📊 Activity Analyzer"]
    B --> C["🤖 Welfare Agent (Gemini)"]
    C --> D["⚠️ Health Threshold Check"]
    D --> E["🧘 Micro-Stretch Nudges"]
    E --> F["🍵 Hydration Alerts"]
```

**Developer Burnout Prevention:**
- 🩺 Computes continuous work thresholds using dynamic database activity checks.
- 🧘 Suggests physical stretches, posture adjustments, or water breaks.
- 📈 Live Engagement Score history mapped and visually styled.

</td>
<td width="50%">

### 👥 **Real-Time Group Dashboard**
```mermaid
graph TD
    A["⚡ Client Socket Connection"] --> B["📡 Group Channel Room"]
    B --> C["📊 Activity Updates"]
    B --> D["🕊️ Peer Waving / Nudges"]
    C --> E["🎨 HSL-Obsidian Interface"]
    D --> E
```

**High-Fidelity Co-Working Space:**
- 📡 Instant Multi-room activity broadcasting via Room WebSocket channels.
- 🕊️ Peer accountability nudges (real-time popup notifications).
- 🎨 Premium dark obsidian layouts (EndoCore Dark/Obsidian Dusk styling).

</td>
</tr>
<tr>
<td colspan="2" width="100%">

### 📊 **Real-Time Developer Workspace Metrics**
**Live Status Dashboard View:**
```
┌─ Active Member: Tawfeeq Bahur (Lead Software Developer)
├─ status: 🟢 online | activeApp: Google Chrome
├─ Today Focus Time: 1.2h / 6.0h Goal (20% Completed)
├─ Active Rooms: Engineering Group | Design & UX Crew
├─ Active Project: activity-dashboard - Antigravity IDE
└─ Workspace Support: Waved [Sarah Chen] 🕊️ | Engagement Score: 20%
```

✅ Real-time telemetry • 📡 Socket.io updates • 🎯 Dynamic timeline logs • 🧬 Zero mock data

</td>
</tr>
</table>

---

## 🏗️ System Architecture

### **High-Level Data Flow**

```mermaid
graph TB
    subgraph "Presentation Layer (Web Client)"
        A["🎨 React 19 Frontend"]
        B["⚛️ Framer Motion Views"]
    end
    
    subgraph "Local Client Edge"
        C["🖥️ Electron Tracking App"]
        D["🔧 active-win module"]
        E["🦙 Ollama Local API"]
    end
    
    subgraph "Communication Server"
        F["📡 Socket.io Gateway"]
        G["🔑 Express JWT Auth"]
    end
    
    subgraph "Backend Processing Layer"
        H["⚙️ Express.js Router"]
        I["🤖 Multi-Agent Engine (Gemini)"]
        J["🛡️ Heartbeat & Status Daemon"]
    end
    
    subgraph "Data Persistence"
        K["🗄️ SQLite Database"]
        L["📊 Prisma Client"]
        M["📝 Activity & Session Logs"]
    end
    
    C --> D
    D --> E
    E -->|Clean HTTPS POST| H
    A -->|WS Events| F
    C -->|WS Heartbeat| F
    H --> G
    G --> L
    L --> K
    K --> M
    H --> I
    J --> L
    I --> F
    F -->|Real-Time Broadcast| B
```

### **Technology Stack Matrix**

<table>
<tr>
<th colspan="2" align="center">🎨 Web Frontend (React Dashboard)</th>
<th colspan="2" align="center">⚙️ Backend Server (Express.js)</th>
<th colspan="2" align="center">🖥️ Client Desktop Agent (Electron)</th>
</tr>
<tr>
<td>Framework</td><td>React 19 + TypeScript</td>
<td>Runtime</td><td>Node.js (v18+)</td>
<td>Shell</td><td>Electron 34</td>
</tr>
<tr>
<td>Build Tool</td><td>Vite 6 + Tailwind v4</td>
<td>Routing</td><td>Express.js (TypeScript)</td>
<td>Telemetry</td><td>active-win + PowerShell App Enum</td>
</tr>
<tr>
<td>State Sync</td><td>Socket.io-client</td>
<td>Caching & Presence</td><td>Redis 7 (ioredis)</td>
<td>Privacy Engine</td><td>edgeSanitizer (Regex + Ollama + LRU)</td>
</tr>
<tr>
<td>Transitions</td><td>Motion (Framer Motion)</td>
<td>Database & ORM</td><td>SQLite / PostgreSQL + Prisma ORM</td>
<td>Local LLM</td><td>Ollama REST Client (phi3:mini)</td>
</tr>
<tr>
<td>Icons</td><td>Lucide React</td>
<td>AI Models</td><td>Gemini 2.5 Flash (@google/genai)</td>
<td>System Tray</td><td>Electron Tray & Native OS Toast Notifications</td>
</tr>
</table>

---

## 🎯 User Experience Showcase

### **User Flow: Desktop Activity Tracking & Sanitization**

```mermaid
journey
    title Developer Activity & Edge Sanitization Flow
    section Setup
      Open Electron Agent: 5: Developer
      Enter Credentials: 5: Developer
      Click "Connect Pipeline": 5: Developer
    section Live Logging
      Select Broadcast Targets (Checkboxes): 5: Developer
      Start Live Tracking: 5: Developer
      Agent captures raw window title: 5: Developer
      Ollama sanitizes raw window title on-device: 4: Developer
    section Dashboard Sync
      Secure API payload sent to backend: 5: Developer
      User status switches to "online": 5: Developer
      Timeline updates cleanly (no duplicates): 5: Developer
      Teammates see sanitized project context: 5: Developer
```

### **Scrum Coordinator & Peer Interactions**

```mermaid
journey
    title Collaborative AI Coordinator & Peer Nudging
    section Team Sync
      View Real-time occupants: 5: Developer
      Read Gemini Daily Focus briefing: 5: Developer
      See automated peer-to-peer pairings: 4: Developer
    section Peer Support
      Click "Nudge" on teammate card: 5: Developer
      Server broadcasts "peer-nudge" event: 5: Developer
      Teammate receives toast "🕊️ [Name] waved at you!": 5: Developer
```

---

## 🚀 Quick Start Setup

### ⚡ **One-Command Installation**

To install all dependencies for both the Express Server and the Electron Desktop Agent:

```bash
# Clone the repository
git clone https://github.com/tawfeeq-bahur/activity-dashboard.git
cd activity-dashboard

# Install root dependencies (Server & Web Client)
npm install

# Install Desktop Agent dependencies
cd desktop-agent
npm install
cd ..
```

### 📋 **Prerequisites**

```
✅ Node.js v18 or higher (download: nodejs.org)
✅ Git (download: git-scm.com)
✅ Windows 10/11
✅ Redis Server (running on localhost:6379 or remote URI)
✅ Ollama installed locally (for Edge AI sanitization)
✅ Gemini API Key (for Server Multi-Agent briefings)
```

### 🛠️ **Environment Configuration**

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-dashboard-key"
GEMINI_API_KEY="your-gemini-api-key"
```

Run database migrations to generate the SQLite database and create schemas:

```bash
npx prisma db push
npx prisma generate
```

### 🎉 **Launch Application**

Run both the Web Dashboard and the Desktop Agent in Development Mode:

```bash
# Start Web Server & Web Client
# (Runs Express on port 3000 & Vite React Client)
npm run dev

# Start Electron Agent (Open another terminal)
cd desktop-agent
npm run start
```

---

## 🔌 API Reference

### **🔐 Authentication Endpoints**

| Endpoint | Method | Body | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | `{ name, email, password }` | Registers user & joins Default Groups |
| `/api/auth/login` | POST | `{ email, password }` | Authenticates user & issues JWT token |

### **📡 Activity Tracker Endpoints**

| Endpoint | Method | Headers | Body | Purpose |
|---|---|---|---|---|
| `/api/my-activity` | GET | `Authorization: Bearer <token>` | - | Fetches current activity & status |
| `/api/my-activity` | POST | `Authorization: Bearer <token>` | `{ app, project, rawTitleHashed, sanitizedAtEdge, ollamaActive, openApps }` | Updates active app, heartbeats, & open applications |
| `/api/user/broadcast-groups` | POST | `Authorization: Bearer <token>` | `{ groups: ["Engineering Team", "Focus Guild"] }` | Configures active room broadcast lists |

### **👥 Group & Peer Endpoints**

| Endpoint | Method | Headers | Body / Query | Purpose |
|---|---|---|---|---|
| `/api/friends?group=...` | GET | `Authorization: Bearer <token>` | `?group=Engineering Team` | Retrieves active occupants, timelines, roles, & statuses |
| `/api/groups` | GET | `Authorization: Bearer <token>` | - | Retrieves all collaboration groups / study halls |
| `/api/groups/create` | POST | `Authorization: Bearer <token>` | `{ name, description, privacy }` | Creates a new cooperative workspace room |
| `/api/connections/wave` | POST | `Authorization: Bearer <token>` | `{ targetUserId }` | Triggers persistent peer wave with 5-minute cooldown |

### **🤖 GenAI & Analytics Endpoints**

| Endpoint | Method | Query | Response |
|---|---|---|---|
| `/api/ai-insights` | GET | `?force=true/false` | Generates a Gemini Multi-Agent Scrum briefing & coaching output |
| `/api/analytics` | GET | - | Storage, focus scores history, and comparison metrics |

---

## 📦 Project Structure

```
activity-dashboard/
│
├── desktop-agent/                    # 🖥️ Electron Tracking App
│   ├── package.json                  # Desktop agent package settings
│   ├── main.js                       # Electron entry point (active-win & notification handlers)
│   ├── edgeSanitizer.js              # 🛡️ 3-tier Edge Privacy Sanitizer (Regex, LRU Cache, Ollama)
│   ├── preload.js                    # Preload script exposing ContextBridge APIs
│   └── index.html                    # Native HTML overlay (connects to server pipeline)
│
├── prisma/                           # 🗄️ Database Schemas & Migrations
│   └── schema.prisma                 # Relational structure (User, Group, Activity, ActivityLog, DailySummary)
│
├── src/                              # 🎨 React 19 Frontend Dashboard
│   ├── ai/                           # 🤖 Multi-Agent AI System
│   │   └── multiAgentEngine.ts       # Gemini 2.5 Flash Scrum Coordinator & Welfare Coach + Heuristic Engine
│   ├── App.tsx                       # Main Dashboard component (EndoCore Dark theme)
│   ├── types.ts                      # Common TypeScript interfaces
│   ├── index.css                     # Global stylesheets & design tokens
│   └── main.tsx                      # Vite React mounting file
│
├── dev.db                            # SQLite Workspace database file
├── db.ts                             # Prisma Client adapter instantiation
├── seed.ts                           # Seeder script populating default groups & admin users
├── server.ts                         # ⚙️ Express Backend Server, Redis Caching & WebSockets (Socket.io)
├── package.json                      # Workspace dependencies & build scripts
├── tsconfig.json                     # Root TypeScript configurations
└── vite.config.ts                    # Vite client configurations
```

---

## 📡 Live Communication Architecture

### **WebSocket Event Flow**

```mermaid
sequenceDiagram
    participant Agent as Electron Agent
    participant Web as React Web Client
    participant Server as Express Server
    participant DB as SQLite Database

    Note over Agent,Server: Heartbeat Stream
    Agent->>Server: POST /api/my-activity { app: "VS Code", project: "App.tsx" }
    Server->>DB: Update lastHeartbeat (Now)
    
    Note over Server: If App/Project Context Switches
    Server->>DB: Create ActivityLog for previous app
    Server->>DB: Reset current Activity durationSeconds = 0
    Server->>Server: Run broadcastActivityUpdate()
    Server-->>Web: Socket.emit("activity-update") { status, activeApp, timeline }
    Web->>Web: Re-render occupant cards & workspace timeline
    
    Note over Web,Server: Peer wave/nudge
    Web->>Server: Socket.emit("send-nudge") { targetUserId }
    Server-->>Web: Socket.to(targetSocketId).emit("peer-nudge") { senderName }
    Web->>Web: TriggerToast("🕊️ Sarah Chen waved at you!")
```

---

## 📊 Performance & Optimization

- **Zero-Duplicate Timeline Logging**: The server only logs database entries upon a verified context change (switches between applications or active project files), ensuring clean data analytics.
- **Heartbeat Timeout Protection**: An Express daemon checks every 15 seconds for disconnected clients. If a developer closes their agent or shuts down, the server immediately marks them `"offline"`, pauses their active focus timer, and updates group occupants.
- **SQLite Adapter Connection Pooling**: Built on `@prisma/adapter-better-sqlite3` ensuring lightning-fast local queries, database locks prevention, and concurrent REST transactions safety.

---

## 🔐 Security & Privacy Architecture

- **Context Sanitization**: Developers can toggle Privacy Levels on-the-fly. Categories are filtered locally so that private details never escape the client edge.
- **JWT Authorization**: Every HTTP REST API and Socket.io handshake is secured using state-of-the-art JSON Web Tokens.
- **Local Database Isolation**: The developer workspace database runs entirely locally in SQLite, giving full sovereignty over activity tracking metrics.

---

## 🗺️ Academic Project Roadmap

```mermaid
timeline
    title EndoCore Workspace Proposal Timeline
    section Phase 1 (Baseline - Completed)
        Activity tracking : WebSockets : React Dashboard : HSL obsidian theme : Relational SQLite schema
    section Phase 2 (Mid-Term - July 2026)
        Ollama Integration : Edge Phi-3 Sanitization : Custom Privacy Rule Configs : Automatic DB Backups
    section Phase 3 (Final - Sept 2026)
        Multi-Agent System : Gemini Coordinator Agent : Scrum pairing recommendations : Welfare alert triggers
```

---

## 📜 License & Attribution

This project is open-source and distributed under the **MIT License**.

Built for academic submission and developer productivity optimization by **Tawfeeq Bahur**.

---

<div align="center">

### ⭐ Star this repository if you support privacy-preserving collaborative spaces!

*Making collaborative engineering transparent, healthy, and private — one wave at a time.*

[⬆ Back to Top](#-endocore-workspace)

</div>
