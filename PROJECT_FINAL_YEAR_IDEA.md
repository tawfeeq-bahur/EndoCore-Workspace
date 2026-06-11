# Final Year Project Proposal: Privacy-Preserving Collaborative Multi-Agent Workspace

This document outlines the final chosen architecture and proposal details combining **Multi-Agent Collaboration (Idea 1)** and **Privacy-Preserving Edge AI (Idea 2)**. This file serves as your permanent proposal draft and presentation notes for your academic mentors.

---

## 🎯 Proposed Project Title
**"EndoCore Workspace: A Privacy-Preserving Collaborative Platform using Edge-Based Local LLMs and Multi-Agent Coordination"**

### 🧬 The Biological & Structural Metaphor (EndoCore)
The name **EndoCore** (derived from *Endogenous/Endocellular Core*) represents the internal coordinating center of a cell. Just as cellular cores coordinate metabolism, protein routing, and cell health from within a secure boundary, our system maps these properties:
*   **The Cell Membrane (Local Edge Client):** Prevents private raw developer data from leaking outside the cell boundary, allowing only sanitized signals (summarized updates) to cross.
*   **Organelles (Developers & Rooms):** The functional units of productivity executing tasks, writing code, and collaborating.
*   **The EndoCore Network (Dashboard Server & WebSockets):** The internal core medium hosting synchronized states, messaging pipelines, and developer rooms.
*   **Intracellular Regulators (Multi-Agent System):** Server-side LLM agents that monitor workspace health, coordinate peer interactions (Scrum Coordinator), and manage physical well-being (Welfare Agent).

---

## 📋 Academic Constraints Alignment Verification
*   **Domain Alignment:** 
    *   *Agentic AI & LLMs:* Implements multiple cooperating LLM agents at the server level.
    *   *Edge AI & GenAI:* Implements local text-generation and summarization on the client machine using on-device small language models.
*   **Base Paper Constraints:** 
    *   Must be selected from **IEEE, Springer, or ScienceDirect Journals** published between **2025 and 2026**.
    *   *Crucial:* Avoid conference papers.

---

## 💡 Project Concept & Problem Statement
Modern collaborative software teams rely on activity monitoring and alignment tools to prevent duplicated effort and resolve blocks. However, developers are often hesitant to share screen details, browser history, or document names due to privacy concerns. 

This project solves this tension by introducing **Local Edge Summarization**. Telemetry data is parsed and sanitized by a local LLM running on the developer’s PC before it ever reaches the shared workspace server. The server then uses a **Multi-Agent framework** to analyze the sanitized summaries, coordinate team alignment, and alert peers to collaborative opportunities without exposing raw private logs.

---

## 🏗️ System Architecture

```
                 [ DEVELOPER'S PC - CLIENT EDGE ]
                                │
       Electron Tracking Agent (active-win tracker telemetry)
                                │
                                ▼
         Local LLM sanitizer (running Phi-3/Llama-3 via Ollama)
  (E.g., converts "Chrome - personal_bank_statement.pdf" to "Researching Finance")
                                │
                                ▼ (HTTPS POST)
                       [ BACKEND SERVER ]
                                │
                  Prisma ORM + SQLite Database
                                │
          Multi-Agent Coordination Engine (Gemini 3.5 Flash)
      (Evaluates team summaries, flags blocks, calculates scores)
                                │
                                ▼ (Socket.io Real-Time Streams)
            [ REACT COLLABORATIVE WEB DASHBOARD ]
  (Displays active room members, wellness nudges, and team AI briefings)
```

---

## 🤖 Multi-Agent Roles (Server-Side)
1.  **Observation Agent (Local Client):** Monitored by the Electron client, tracking focus sessions and logging developer compile errors or repository updates.
2.  **Scrum Coordinator Agent (Server LLM):** Scans sanitized activity logs of all room occupants. If Developer A has been stuck on a compiling issue for 30 minutes, and Developer B resolved the same issue earlier, the coordinator suggests they sync, or provides a wittily generated coaching hint.
3.  **Welfare & Productivity Agent (Server LLM):** Monitors aggregate focus durations and alerts developers when they exceed safety thresholds, suggesting micro-stretches and physical workspace adjustments to prevent cognitive burnout.

---

## 🛠️ Extended Tech Stack
*   **Client Edge:** Electron, Node.js, `active-win` integration, **Ollama API** (Local Llama-3/Phi-3 model).
*   **Web Frontend:** React, Tailwind CSS, Lucide icons, Socket.io-client.
*   **Application Server:** Express.js, TypeScript, SQLite, Prisma ORM, Socket.io, Google GenAI SDK (Gemini 3.5 Flash).

---

## 📚 Base Journal Paper Search Strategy (2025–2026)
To satisfy the Monday deadline, search **IEEE Xplore**, **SpringerLink**, or **ScienceDirect** using these terms. Remember to filter by **"Journals"** (exclude Conference proceedings) and **Year: 2025–2026**:

1.  *Search Combo A (Privacy/Edge):* `"Privacy-preserving context tracking"` OR `"Edge-based local LLM summarization"`
2.  *Search Combo B (Multi-Agents):* `"Multi-agent cooperative system in software development"` OR `"LLM agents for developer productivity"`

---

## 📅 Monday Presentation Checklist for Mentor
*   [ ] Present the proposed title: **"A Privacy-Preserving Collaborative Workspace Dashboard using Edge-Based Local LLMs and Multi-Agent Coordination"**
*   [ ] Show the System Architecture Diagram (included above).
*   [ ] Hand over the downloaded 2025/2026 IEEE/Springer base journal paper.
*   [ ] Highlight that the core database schema, React dashboard, and local desktop tracking agent are already established as a baseline.
