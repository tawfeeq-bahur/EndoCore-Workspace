# 🎧 EndoCore Mobile — Spotify-Grade Developer Focus Companion

EndoCore Mobile is the Android companion app for **EndoCore Workspace** — bringing Spotify's sleek dark UI/UX design language to developer focus sessions, real-time collaboration rooms, peer waves, and Gemini AI briefings.

---

## 🎨 Design Rationale ("Obsidian Pulse")

- **Palette & Accents:** Built upon a deep obsidian `#0A0A0C` background and `#131317` / `#1C1C22` elevated glass surfaces. We chose **Electric Teal (`#00E5FF`)** as the primary focus accent combined with **Neon Violet (`#9D4EDD`)** and **Emerald Pulse (`#10B981`)** to evoke both the signature EndoCore dove (`🕊️`) brand motif and active flow states.
- **The Spotify Metaphor:**
  - **Now Playing bar** ➔ **Current Focus Session Mini-Player** (active app, elapsed timer, live equalizer animation, tap to expand).
  - **Playlists** ➔ **Collaboration Rooms** (squads, active member badges, live status).
  - **Made For You Mixes** ➔ **Gemini 2.5 Flash AI Briefings** (Scrum coordinator + wellness recommendations).
  - **Artist Profiles** ➔ **Teammate Live Cards** (focus score, current project, 1-tap peer wave with 5-minute cooldown).
  - **Track Queue** ➔ **Today's Activity Timeline Queue** (chronological app & context switches).

---

## 📱 Features & Screens

1. **Home Screen (`HomeScreen.kt`):** Dynamic time-of-day greeting ("Good morning, Tawfeeq"), active session card, quick task switcher rail, horizontal rail of collaboration rooms, featured AI briefing hero card, and live teammates rail.
2. **Now Focusing Player Sheet (`NowFocusingScreen.kt`):** Full-screen expandable player with glowing circular focus ring, elapsed timer, goal progress, active task switcher, deep work mode, pomodoro timer, and today's activity queue.
3. **Collaboration Rooms (`RoomsScreen.kt`):** Room search/filter, live occupant counts, pinned rooms, broadcasting toggles, and interactive occupant cards with 1-tap **Peer Waves (`🕊️`)**.
4. **AI Insights & Wrapped (`InsightsScreen.kt`):** Spotify-Wrapped style stat cards with weekly growth, Canvas hourly focus bar chart, Scrum Coordinator recommendations (Gemini 2.5 Flash), and Wellness Coach alerts.
5. **Profile & Privacy Tier (`ProfileScreen.kt`):** 3-tier privacy model (**Full Detail**, **Team Only**, **Private Workstation**), broadcast room toggles, JWT authentication, and backend endpoint settings.
6. **Persistent Mini-Player (`FocusMiniPlayer.kt`):** Sits above the bottom navigation on every screen, featuring live pulsating equalizer bars and smooth spring expansion.

---

## 🔌 Backend Synchronization & API Endpoints

EndoCore Mobile communicates with the Express.js + Socket.io backend:

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticates user with JWT token |
| `/api/my-activity` | GET / POST | Fetches status & sends 15s activity heartbeats |
| `/api/groups` | GET | Lists collaboration rooms |
| `/api/friends?group=...` | GET | Returns live occupants & focus status |
| `/api/connections/wave` | POST | Sends peer waves with 5-minute cooldown guard |
| `/api/ai-insights` | GET | Retrieves Gemini 2.5 Flash Scrum + Wellness briefing |
| `/api/analytics` | GET | Weekly focus score history & distribution |

*Socket.io real-time events:* `activity-update`, `peer-nudge`.

---

## 🔒 Privacy Guarantee

Window titles and active apps are sanitized locally on your desktop agent (Regex → SHA-256 LRU Cache → Local Ollama Phi-3) before synchronization. No raw source code or credentials ever leave your local workstation.
