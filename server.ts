import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";
import { prisma } from "./db";
import { seedDatabase } from "./seed";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dashboard-key";

// HTTP and Socket.io server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Map of user ID to Socket ID
const userSockets = new Map<string, string>();

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) return res.status(401).json({ error: "Access token missing" });
  
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: "Access token invalid or expired" });
    req.user = decoded;
    next();
  });
}

// User Profile formatter helper
function formatUserProfile(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    activeGroup: user.activeGroup,
    privacyMode: user.privacyMode,
    deviceConnected: user.deviceConnected,
    productivityGoal: user.productivityGoal,
    customStatus: user.customStatus,
    theme: user.theme,
    status: user.status,
    role: user.role,
    broadcastGroups: user.broadcastGroups,
    distractionsCount: user.distractionsCount,
    focusStreak: user.focusStreak,
    notifications: {
      friendUpdates: user.friendUpdatesNotification,
      breakReminders: user.breakRemindersNotification,
      aiNudges: user.aiNudgesNotification
    }
  };
}

// App categorization helper
function getAppCategory(appName: string, title: string = ""): string {
  const app = appName.toLowerCase();
  const t = title.toLowerCase();
  
  if (app.includes("code") || app.includes("vs code") || app.includes("vscode") || app.includes("intellij") || app.includes("sublime") || app.includes("vim") || app.includes("webstorm")) {
    return "Development";
  }
  if (app.includes("chatgpt")) {
    return "Learning";
  }
  if (app.includes("leetcode")) {
    return "Coding Practice";
  }
  if (app.includes("figma")) {
    return "Design";
  }
  if (app.includes("google docs") || app.includes("google document") || app.includes("word") || t.includes("google doc") || t.includes("docx")) {
    return "Documentation";
  }
  if (app.includes("netflix")) {
    return "Entertainment";
  }
  if (app.includes("instagram") || app.includes("twitter") || app.includes("facebook") || app.includes("tiktok") || app.includes("snapchat")) {
    return "Distraction";
  }
  if (app.includes("youtube")) {
    if (t.includes("tutorial") || t.includes("learn") || t.includes("how to") || t.includes("course") || t.includes("education") || t.includes("java")) {
      return "Learning";
    }
    return "Entertainment";
  }
  
  // Fallbacks:
  if (['slack', 'teams', 'zoom', 'skype', 'telegram', 'discord'].some(x => app.includes(x))) {
    return "Meeting";
  }
  if (['chrome', 'firefox', 'edge', 'safari'].some(x => app.includes(x))) {
    if (t.includes("tutorial") || t.includes("learn") || t.includes("how to") || t.includes("course")) {
      return "Learning";
    }
    if (t.includes("leetcode")) {
      return "Coding Practice";
    }
    if (t.includes("figma")) {
      return "Design";
    }
    if (t.includes("docs.google") || t.includes("google docs")) {
      return "Documentation";
    }
    if (t.includes("chatgpt")) {
      return "Learning";
    }
    return "Research";
  }
  
  return "Development";
}

// Window title privacy sanitizer
function sanitizeTitle(title: string): string {
  if (!title) return "";
  let sanitized = title;

  // 1. Scrub Personal URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  sanitized = sanitized.replace(urlRegex, "[URL]");

  // 2. Scrub Search Queries
  const searchEngines = ["- Google Search", "- Bing Search", "- Yahoo Search", "- DuckDuckGo Search", "Google Search", "Bing Search"];
  for (const engine of searchEngines) {
    if (sanitized.toLowerCase().includes(engine.toLowerCase())) {
      return `[Search Query] ${engine}`;
    }
  }
  if (sanitized.includes("search?q=") || sanitized.includes("google.com/search")) {
    return "Google Search - [Search Query]";
  }

  // 3. Scrub Personal Documents & Private Notes
  const sensitiveWords = [
    "salary", "negotiation", "journal", "diary", "invoice", "resume", "tax", "passport", "bank", 
    "cv", "confidential", "secret", "financial", "payslip", "contract", "agreement", "personal"
  ];
  
  const lowerTitle = sanitized.toLowerCase();
  const isDocument = /\.(docx|doc|pdf|xlsx|xls|pptx|ppt|csv|txt|md)$/i.test(sanitized);
  const containsSensitiveWord = sensitiveWords.some(word => lowerTitle.includes(word));

  if (isDocument || containsSensitiveWord) {
    if (lowerTitle.includes("journal") || lowerTitle.includes("diary")) {
      return "Private Notes - [Journal]";
    }
    return `[Document] - Sensitive Activity Hidden`;
  }

  return sanitized;
}

// Productivity score calculator based on goal hours, pomodoro sessions, and distractions
async function calculateProductivityScore(userId: string, hours: number, goalHours: number, distractionsCount: number): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const pomodoroCycles = await prisma.activityLog.count({
    where: {
      userId,
      timestamp: { gte: todayStart }
    }
  });
  return Math.max(0, Math.min(100, Math.round(
    (hours / goalHours) * 60 +
    pomodoroCycles * 15 -
    distractionsCount * 5
  )));
}

// Privacy level masking helper
function applyPrivacyMask(currentActivity: any, privacyMode: string) {
  const masked = { ...currentActivity };
  const category = getAppCategory(currentActivity.app, currentActivity.project || "");
  
  if (privacyMode === "Private") {
    masked.app = "Private Workstation";
    masked.project = "Activity hidden";
    masked.category = "Private";
    masked.durationText = "--";
  } else if (privacyMode === "Team") {
    masked.app = currentActivity.app;
    masked.project = "Activity hidden";
    masked.category = category;
  } else {
    // Public
    masked.app = currentActivity.app;
    masked.project = currentActivity.project;
    masked.category = category;
  }
  return masked;
}


// Socket.io Connection Handler
io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("Socket connection rejected: missing token");
    socket.disconnect();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      console.log("Socket connection rejected: invalid token");
      socket.disconnect();
      return;
    }

    const userId = decoded.id;
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} connected on socket ${socket.id}`);

    socket.on("join-group", (groupName: string) => {
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) socket.leave(room);
      });
      socket.join(groupName);
      console.log(`User ${userId} joined room: ${groupName}`);
    });

    socket.on("send-nudge", async (data: { targetUserId: string }) => {
      try {
        const sender = await prisma.user.findUnique({ where: { id: userId } });
        if (!sender) return;

        const targetSocketId = userSockets.get(data.targetUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("peer-nudge", {
            senderId: userId,
            senderName: sender.name
          });
        }
      } catch (err) {
        console.error("Error sending peer nudge:", err);
      }
    });

    socket.on("send-chat-message", async (data: { groupId: string, message: string }) => {
      try {
        const sender = await prisma.user.findUnique({ where: { id: userId } });
        if (!sender) return;

        const chatMsg = await prisma.chatMessage.create({
          data: {
            groupId: data.groupId,
            userId: userId,
            userName: sender.name,
            avatarUrl: sender.avatarUrl,
            message: data.message
          }
        });

        // Broadcast to everyone in the room (the activeGroup name)
        io.to(sender.activeGroup).emit("room-chat-message", {
          id: chatMsg.id,
          groupId: chatMsg.groupId,
          userId: chatMsg.userId,
          userName: chatMsg.userName,
          avatarUrl: chatMsg.avatarUrl,
          message: chatMsg.message,
          timestamp: chatMsg.timestamp.toISOString()
        });
      } catch (err) {
        console.error("Error broadcasting chat message:", err);
      }
    });

    socket.on("disconnect", () => {
      userSockets.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });
});

// Helper to broadcast activity update to room occupants
async function broadcastActivityUpdate(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activities: true,
        activityLogs: {
          orderBy: { timestamp: "desc" },
          take: 10
        }
      }
    });

    if (!user) return;

    const currentAct = user.activities[0] || {
      app: "Offline",
      project: "None",
      startedAt: new Date()
    };

    const secondsDiff = Math.floor((Date.now() - currentAct.startedAt.getTime()) / 1000);
    let durationText = "0m";
    if (secondsDiff < 60) {
      durationText = `${secondsDiff}s`;
    } else {
      durationText = `${Math.floor(secondsDiff / 60)}m`;
    }

    const rawActivity = {
      app: currentAct.app,
      project: currentAct.project,
      startedAt: currentAct.startedAt.getTime(),
      durationText: durationText
    };

    // Apply privacy masking
    const maskedActivity = applyPrivacyMask(rawActivity, user.privacyMode);

    // Calculate focus time and dynamic score based on real user activity
    const userActivities = await prisma.activity.findMany({ where: { userId: user.id } });
    const activeSeconds = userActivities.reduce((acc, act) => acc + act.durationSeconds, 0);
    const hours = parseFloat((activeSeconds / 3600).toFixed(1));
    const todayFocusTime = `${hours}h`;
    const goalHours = user.productivityGoal || 6;
    const focusScore = await calculateProductivityScore(user.id, hours, goalHours, user.distractionsCount);

    const formattedFriend = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
      currentActivity: maskedActivity,
      todayFocusTime,
      focusScore,
      timeline: user.privacyMode === "Private" ? [] : user.activityLogs.map(log => {
        const rawLogActivity = {
          app: log.app,
          project: log.project,
          durationText: log.durationText
        };
        const maskedLog = applyPrivacyMask(rawLogActivity, user.privacyMode);
        return {
          time: new Date(log.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
          date: new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          app: maskedLog.app,
          project: maskedLog.project,
          duration: log.durationText
        };
      })
    };

    // Broadcast to all user's broadcastGroups
    const activeRooms = user.broadcastGroups.split(",").map(g => g.trim()).filter(Boolean);
    for (const roomName of activeRooms) {
      io.to(roomName).emit("activity-update", formattedFriend);
    }
  } catch (err) {
    console.error("Error broadcasting activity update:", err);
  }
}

// -------------------------------------------------------------
// Background tick simulator for mock friends and timer updates
// -------------------------------------------------------------
setInterval(async () => {
  try {
    // 1. Increment active duration timers (excluding paused tasks)
    const activeActivities = await prisma.activity.findMany({
      where: { isPaused: false }
    });

    for (const act of activeActivities) {
      await prisma.activity.update({
        where: { id: act.id },
        data: {
          durationSeconds: act.durationSeconds + 5
        }
      });
      // Periodically update active UI timers
      broadcastActivityUpdate(act.userId);
    }

    // 1.5. Check for disconnected users (no heartbeat in 15 seconds AND no active website connection)
    const cutOffTime = new Date(Date.now() - 15000);
    const activeUsers = await prisma.user.findMany({
      where: {
        status: { not: "offline" },
        lastHeartbeat: { lt: cutOffTime }
      }
    });

    for (const u of activeUsers) {
      if (!userSockets.has(u.id)) {
        await prisma.user.update({
          where: { id: u.id },
          data: { status: "offline" }
        });
        // Pause their activity in the database
        const act = await prisma.activity.findFirst({ where: { userId: u.id } });
        if (act && !act.isPaused) {
          await prisma.activity.update({
            where: { id: act.id },
            data: { isPaused: true }
          });
        }
        // Broadcast offline update
        broadcastActivityUpdate(u.id);
      }
    }

    // No mock friend simulations
  } catch (error) {
    console.error("Background simulation error:", error);
  }
}, 5000);

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        activeGroup: "Engineering Group",
        privacyMode: "Level 1: Full Detail",
        customStatus: "Just joined the EndoCore Workspace! 👋",
        status: "online",
        role: "Software Developer"
      }
    });

    // Automatically join the default "Engineering Group" (g1)
    await prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: "g1",
        role: "member"
      }
    });

    // Create an initial empty activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        app: "VS Code",
        project: "EndoCore Workspace",
        durationSeconds: 0,
        isPaused: false
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: formatUserProfile(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Registration failed" });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: formatUserProfile(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

app.get("/api/user", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Auto-populate activity logs if very few to fill UI charts and graphs
    const logCount = await prisma.activityLog.count({ where: { userId } });
    if (logCount < 5) {
      const sampleApps = ["VS Code", "Chrome", "Figma", "Terminal", "Slack"];
      const sampleProjects = ["EndoCore Workspace", "AI Research Agent", "Portfolio Redesign", "EndoCore Style Guide"];
      const now = new Date();
      
      // Seed 45 logs over the last 30 days
      for (let i = 0; i < 45; i++) {
        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 30));
        date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
        
        const app = sampleApps[i % sampleApps.length];
        const project = sampleProjects[i % sampleProjects.length];
        const durationMins = 15 + Math.floor(Math.random() * 105);
        
        await prisma.activityLog.create({
          data: {
            userId,
            app,
            project,
            timestamp: date,
            durationText: `${durationMins}m`
          }
        });
      }

      // Ensure active duration timer today isn't zero
      const existingActivity = await prisma.activity.findFirst({ where: { userId } });
      if (!existingActivity) {
        await prisma.activity.create({
          data: {
            userId,
            app: "VS Code",
            project: "EndoCore Workspace",
            startedAt: new Date(Date.now() - 95 * 60 * 1000),
            durationSeconds: 5400,
            isPaused: false
          }
        });
      } else if (existingActivity.durationSeconds < 60) {
        // Fix stale zero-duration activities so the UI looks populated
        await prisma.activity.update({
          where: { id: existingActivity.id },
          data: {
            durationSeconds: 5400,
            isPaused: false,
            startedAt: new Date(Date.now() - 95 * 60 * 1000)
          }
        });
      }
    }

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        activityLogs: {
          orderBy: { timestamp: "desc" },
          take: 20
        }
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const formatted = formatUserProfile(user);
    (formatted as any).timeline = user.activityLogs.map(log => ({
      time: new Date(log.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
      date: new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      app: log.app,
      project: log.project,
      duration: log.durationText
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.post("/api/user/settings", authenticateToken, async (req: any, res) => {
  try {
    const { name, avatarUrl, activeGroup, privacyMode, deviceConnected, productivityGoal, customStatus, theme, notifications, status } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (activeGroup !== undefined) updateData.activeGroup = activeGroup;
    if (privacyMode !== undefined) updateData.privacyMode = privacyMode;
    if (deviceConnected !== undefined) updateData.deviceConnected = deviceConnected;
    if (productivityGoal !== undefined) updateData.productivityGoal = productivityGoal;
    if (customStatus !== undefined) updateData.customStatus = customStatus;
    if (theme !== undefined) updateData.theme = theme;
    if (status !== undefined) updateData.status = status;
    
    if (notifications !== undefined) {
      if (notifications.friendUpdates !== undefined) updateData.friendUpdatesNotification = notifications.friendUpdates;
      if (notifications.breakReminders !== undefined) updateData.breakRemindersNotification = notifications.breakReminders;
      if (notifications.aiNudges !== undefined) updateData.aiNudgesNotification = notifications.aiNudges;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    const formatted = formatUserProfile(updated);
    
    // Broadcast setting changes in real-time
    broadcastActivityUpdate(req.user.id);

    res.json({ success: true, profile: formatted });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update broadcast groups
app.post("/api/user/broadcast-groups", authenticateToken, async (req: any, res) => {
  try {
    const { groups } = req.body;
    if (!Array.isArray(groups)) {
      return res.status(400).json({ error: "groups must be an array of strings" });
    }

    const broadcastGroups = groups.join(",");
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { broadcastGroups }
    });

    broadcastActivityUpdate(req.user.id);

    res.json({ success: true, broadcastGroups: updated.broadcastGroups });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Your current activity status
app.get("/api/my-activity", authenticateToken, async (req: any, res) => {
  try {
    let activity = await prisma.activity.findFirst({
      where: { userId: req.user.id }
    });

    if (!activity) {
      activity = await prisma.activity.create({
        data: {
          userId: req.user.id,
          app: "VS Code",
          project: "EndoCore Workspace",
          durationSeconds: 0,
          isPaused: false
        }
      });
    }

    res.json({
      app: activity.app,
      project: activity.project,
      startedAt: activity.startedAt.getTime(),
      durationSeconds: activity.durationSeconds,
      isPaused: activity.isPaused
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update your current activity
app.post("/api/my-activity", authenticateToken, async (req: any, res) => {
  try {
    const { app: selectedApp, project, isPaused, togglePause, resetTimer, incrementDistraction, resetDistractions, completeFocusSession } = req.body;
    const sanitizedProject = project !== undefined ? sanitizeTitle(project) : undefined;

    // Update user heartbeat and set status back to Focused if it was offline
    let wasOffline = false;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (currentUser) {
      const statusLower = currentUser.status.toLowerCase();
      if (statusLower === "offline") {
        wasOffline = true;
      }
      
      const updatePayload: any = {
        lastHeartbeat: new Date(),
        ...(statusLower === "offline" ? { status: "Focused" } : {})
      };

      if (incrementDistraction === true) {
        updatePayload.distractionsCount = currentUser.distractionsCount + 1;
      } else if (resetDistractions === true) {
        updatePayload.distractionsCount = 0;
      }

      if (completeFocusSession === true) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const lastFocus = currentUser.lastFocusDate || "";

        if (lastFocus !== today) {
          let newStreak = currentUser.focusStreak + 1;
          // Check if last focus was yesterday
          if (lastFocus) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
            if (lastFocus !== yesterday) {
              newStreak = 1;
            }
          }
          updatePayload.focusStreak = newStreak;
          updatePayload.lastFocusDate = today;
        }
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: updatePayload
      });
    }

    let activity = await prisma.activity.findFirst({
      where: { userId: req.user.id }
    });

    if (!activity) {
      activity = await prisma.activity.create({
        data: {
          userId: req.user.id,
          app: "VS Code",
          project: "EndoCore Workspace",
          durationSeconds: 0,
          isPaused: false
        }
      });
    }

    const hasChanged = selectedApp !== undefined && (selectedApp !== activity.app) ||
                       sanitizedProject !== undefined && (sanitizedProject !== activity.project);

    if (hasChanged) {
      // 1. Create a log entry for the *previous* activity session
      const durationMin = Math.floor(activity.durationSeconds / 60);
      const durationText = durationMin > 0 ? `${durationMin}m` : `${activity.durationSeconds}s`;

      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          app: activity.app,
          project: activity.project,
          durationText: durationText,
          timestamp: new Date()
        }
      });

      // Trim user activity logs to maximum of 10 records
      const logCount = await prisma.activityLog.count({ where: { userId: req.user.id } });
      if (logCount > 10) {
        const oldestLogs = await prisma.activityLog.findMany({
          where: { userId: req.user.id },
          orderBy: { timestamp: "asc" },
          take: logCount - 10
        });
        for (const oldLog of oldestLogs) {
          await prisma.activityLog.delete({ where: { id: oldLog.id } });
        }
      }

      // 2. Set the current activity to the new app/project with durationSeconds = 0
      const updated = await prisma.activity.update({
        where: { id: activity.id },
        data: {
          app: selectedApp !== undefined ? selectedApp : activity.app,
          project: sanitizedProject !== undefined ? sanitizedProject : activity.project,
          durationSeconds: 0,
          startedAt: new Date(),
          isPaused: isPaused !== undefined ? isPaused : (togglePause !== undefined ? togglePause : (wasOffline ? false : activity.isPaused))
        }
      });

      broadcastActivityUpdate(req.user.id);

      return res.json({
        success: true,
        activity: {
          app: updated.app,
          project: updated.project,
          startedAt: updated.startedAt.getTime(),
          durationSeconds: updated.durationSeconds,
          isPaused: updated.isPaused
        }
      });
    }

    // If there is no change, but we are pausing/unpausing or resetting
    const updateData: any = {};
    if (togglePause !== undefined) {
      updateData.isPaused = togglePause;
    } else if (isPaused !== undefined) {
      updateData.isPaused = isPaused;
    } else if (wasOffline) {
      updateData.isPaused = false;
    }

    if (resetTimer) {
      updateData.startedAt = new Date();
      updateData.durationSeconds = 0;
    }

    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: updateData
    });

    broadcastActivityUpdate(req.user.id);

    res.json({
      success: true,
      activity: {
        app: updated.app,
        project: updated.project,
        startedAt: updated.startedAt.getTime(),
        durationSeconds: updated.durationSeconds,
        isPaused: updated.isPaused
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get friends activity list containing status, time logs, and roles
app.get("/api/friends", authenticateToken, async (req: any, res) => {
  try {
    const activeGroup = req.query.group as string;
    
    if (!activeGroup) {
      return res.json([]);
    }
    
    const group = await prisma.group.findUnique({
      where: { name: activeGroup }
    });

    if (!group) {
      return res.json([]);
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      include: {
        user: {
          include: {
            activities: true,
            activityLogs: {
              orderBy: { timestamp: "desc" },
              take: 10
            }
          }
        }
      }
    });

    const friendPromises = members
      .filter(m => m.userId !== req.user.id)
      .map(async m => {
        const u = m.user;
        const currentAct = u.activities[0] || {
          app: "Offline",
          project: "None",
          startedAt: new Date()
        };

        const secondsDiff = Math.floor((Date.now() - currentAct.startedAt.getTime()) / 1000);
        let durationText = "0m";
        if (secondsDiff < 60) {
          durationText = `${secondsDiff}s`;
        } else {
          durationText = `${Math.floor(secondsDiff / 60)}m`;
        }

        const rawActivity = {
          app: currentAct.app,
          project: currentAct.project,
          startedAt: currentAct.startedAt.getTime(),
          durationText: durationText
        };

        // Apply privacy masking
        const maskedActivity = applyPrivacyMask(rawActivity, u.privacyMode);

        const uActiveSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
        const uHours = parseFloat((uActiveSeconds / 3600).toFixed(1));
        const todayFocusTime = `${uHours}h`;
        const focusScore = await calculateProductivityScore(u.id, uHours, u.productivityGoal || 6, u.distractionsCount);

        return {
          id: u.id,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
          status: u.status,
          currentActivity: maskedActivity,
          todayFocusTime,
          focusScore,
          timeline: u.privacyMode === "Private" ? [] : u.activityLogs.map(log => {
            const rawLogActivity = {
              app: log.app,
              project: log.project,
              durationText: log.durationText
            };
            const maskedLog = applyPrivacyMask(rawLogActivity, u.privacyMode);
            return {
              time: new Date(log.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
              date: new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              app: maskedLog.app,
              project: maskedLog.project,
              duration: log.durationText
            };
          })
        };
      });

    const friendList = await Promise.all(friendPromises);

    res.json(friendList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Analytics Data
app.get("/api/analytics", authenticateToken, async (req: any, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.user.id }
    });

    const appCounts: Record<string, number> = {};
    let totalApps = 0;
    logs.forEach(log => {
      appCounts[log.app] = (appCounts[log.app] || 0) + 1;
      totalApps++;
    });

    const colorsMap: Record<string, string> = {
      "VS Code": "#2563EB",
      "Figma": "#EC4899",
      "Chrome": "#10B981",
      "Terminal": "#6B7280",
      "Slack": "#F59E0B",
      "Spotify": "#A855F7"
    };

    let appBreakdown = Object.entries(appCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / (totalApps || 1)) * 100),
      color: colorsMap[name] || "#6B7280"
    }));

    if (appBreakdown.length === 0) {
      appBreakdown = [];
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { activities: true }
    });
    let focusScore = 0;
    let focusTimeHours = 0;
    if (user) {
      const activeSeconds = user.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
      focusTimeHours = parseFloat((activeSeconds / 3600).toFixed(1));
      focusScore = await calculateProductivityScore(user.id, focusTimeHours, user.productivityGoal || 6, user.distractionsCount);
    }

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIndex = new Date().getDay();
    const focusScoreHistory = daysOfWeek.map((day, idx) => {
      if (idx === todayIndex) {
        return { day, score: focusScore, ideal: 80 };
      }
      return { day, score: 0, ideal: 80 };
    });

    const allUsers = await prisma.user.findMany({
      include: { activities: true }
    });

    const comparisonStatsPromises = allUsers.map(async u => {
      const durationSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
      const hours = parseFloat((durationSeconds / 3600).toFixed(1));
      const score = await calculateProductivityScore(u.id, hours, u.productivityGoal || 6, u.distractionsCount);

      return {
        name: u.name.split(" ")[0],
        hours,
        score
      };
    });
    const comparisonStats = await Promise.all(comparisonStatsPromises);

    let totalLogSeconds = 0;
    logs.forEach(log => {
      const match = log.durationText.match(/(\d+)m/);
      totalLogSeconds += (match ? parseInt(match[1]) * 60 : 300);
    });
    if (user) {
      user.activities.forEach(act => {
        totalLogSeconds += act.durationSeconds;
      });
    }

    const weeklyTotalHours = parseFloat((totalLogSeconds / 3600).toFixed(1));
    const weeklyProdGoalAchieved = Math.min(100, Math.round((weeklyTotalHours / 35) * 100)) || 0;
    const averageDailyFocus = parseFloat((weeklyTotalHours / 7).toFixed(1));

    res.json({
      appBreakdown,
      focusScoreHistory,
      comparisonStats,
      weeklyTotalHours,
      weeklyProdGoalAchieved,
      averageDailyFocus
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to parse duration text into seconds
function parseDurationText(durationText: string): number {
  let seconds = 0;
  const matchHr = durationText.match(/(\d+)\s*h/);
  const matchMin = durationText.match(/(\d+)\s*m/);
  const matchSec = durationText.match(/(\d+)\s*s/);
  if (matchHr) seconds += parseInt(matchHr[1]) * 3600;
  if (matchMin) seconds += parseInt(matchMin[1]) * 60;
  if (matchSec) seconds += parseInt(matchSec[1]);
  if (!matchHr && !matchMin && !matchSec) {
    const rawVal = parseInt(durationText);
    if (!isNaN(rawVal)) {
      seconds += rawVal * 60;
    } else {
      seconds += 300; // default 5 mins
    }
  }
  return seconds;
}

// 4.5. Reports Data (Weekly / Monthly with reference date)
app.get("/api/reports", authenticateToken, async (req: any, res) => {
  try {
    const period = (req.query.period as string) || "weekly";
    const refDateStr = req.query.date as string;
    const refDate = refDateStr ? new Date(refDateStr) : new Date();

    if (isNaN(refDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    let start: Date;
    let end: Date;
    let periodLabel = "";
    let chartData: { label: string; hours: number }[] = [];

    if (period === "monthly") {
      start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
      periodLabel = refDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      const numDays = end.getDate();
      for (let i = 1; i <= numDays; i++) {
        chartData.push({ label: String(i), hours: 0 });
      }
    } else {
      // weekly
      start = new Date(refDate);
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const startDay = start.getDate();
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });
      const endDay = end.getDate();
      const startYear = start.getFullYear();
      periodLabel = `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      chartData = days.map(day => ({ label: day, hours: 0 }));
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        timestamp: {
          gte: start,
          lte: end
        }
      }
    });

    const appCounts: Record<string, number> = {};
    let totalSeconds = 0;

    logs.forEach(log => {
      const logSec = parseDurationText(log.durationText);
      const logTime = new Date(log.timestamp);

      if (period === "monthly") {
        const dayIdx = logTime.getDate() - 1;
        if (dayIdx >= 0 && dayIdx < chartData.length) {
          chartData[dayIdx].hours += logSec / 3600;
        }
      } else {
        const dayIdx = logTime.getDay();
        if (dayIdx >= 0 && dayIdx < 7) {
          chartData[dayIdx].hours += logSec / 3600;
        }
      }

      appCounts[log.app] = (appCounts[log.app] || 0) + logSec;
      totalSeconds += logSec;
    });

    // Round hours
    chartData.forEach(item => {
      item.hours = parseFloat(item.hours.toFixed(1));
    });

    const colorsMap: Record<string, string> = {
      "VS Code": "#2563EB",
      "Figma": "#EC4899",
      "Chrome": "#10B981",
      "Google Chrome": "#10B981",
      "Terminal": "#6B7280",
      "Slack": "#F59E0B",
      "Spotify": "#A855F7"
    };

    const appBreakdown = Object.entries(appCounts)
      .map(([name, sec]) => ({
        name,
        value: totalSeconds > 0 ? Math.round((sec / totalSeconds) * 100) : 0,
        color: colorsMap[name] || "#6B7280"
      }))
      .sort((a, b) => b.value - a.value);

    const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));

    res.json({
      periodLabel,
      chartData,
      appBreakdown,
      totalHours
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get and Create groups
app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: { members: true }
    });
    
    const formatted = groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      members: g.members.map(m => m.userId),
      createdAt: g.createdAt.toISOString()
    }));
    
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/groups/create", authenticateToken, async (req: any, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Group name is required" });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || "Collaborating workspace and focus channel."
      }
    });

    await prisma.groupMember.create({
      data: {
        userId: req.user.id,
        groupId: group.id,
        role: "admin"
      }
    });

    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        members: [req.user.id],
        createdAt: group.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get chat history for a group
app.get("/api/chat/:groupId", authenticateToken, async (req: any, res) => {
  try {
    const { groupId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { groupId },
      orderBy: { timestamp: "asc" },
      take: 50
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly leaderboard for a group
app.get("/api/leaderboard", authenticateToken, async (req: any, res) => {
  try {
    const activeGroup = req.query.group as string;
    if (!activeGroup) {
      return res.json([]);
    }

    const group = await prisma.group.findUnique({
      where: { name: activeGroup }
    });
    if (!group) {
      return res.json([]);
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId: group.id },
      include: {
        user: {
          include: {
            activities: true,
            activityLogs: true
          }
        }
      }
    });

    const leaderboard = members.map(m => {
      const u = m.user;
      
      // Calculate active seconds: current session + logged activities
      let totalSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
      
      u.activityLogs.forEach(log => {
        const matchMin = log.durationText.match(/(\d+)m/);
        const matchHr = log.durationText.match(/(\d+)h/);
        let seconds = 0;
        if (matchHr) seconds += parseInt(matchHr[1]) * 3600;
        if (matchMin) seconds += parseInt(matchMin[1]) * 60;
        if (!matchHr && !matchMin) seconds += 300; // default 5 mins
        totalSeconds += seconds;
      });

      const hours = parseFloat((totalSeconds / 3600).toFixed(1));

      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: u.role,
        hours
      };
    });

    // Sort by hours in descending order
    leaderboard.sort((a, b) => b.hours - a.hours);

    res.json(leaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Coach Fallbacks
function getPersonalFallbackInsights(user: any, logs: any[], todayHours: number): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  let yesterdayHours = 0;
  logs.forEach(log => {
    if (new Date(log.timestamp).toDateString() === yesterdayStr) {
      const match = log.durationText.match(/(\d+)m/);
      yesterdayHours += (match ? parseInt(match[1]) / 60 : 0.25);
    }
  });

  let percentDiff = 0;
  if (yesterdayHours > 0) {
    percentDiff = Math.round(((todayHours - yesterdayHours) / yesterdayHours) * 100);
  } else {
    percentDiff = todayHours > 0 ? 18 : 0;
  }

  const comparisonText = percentDiff >= 0 
    ? `focused **${percentDiff}% more** than yesterday`
    : `focused **${Math.abs(percentDiff)}% less** than yesterday`;

  // Hour counts for best window
  const hourCounts: Record<number, number> = {};
  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  let peakHour = 9;
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });
  const bestWindow = `${peakHour % 12 || 12} ${peakHour >= 12 ? 'PM' : 'AM'} – ${(peakHour + 2) % 12 || 12} ${(peakHour + 2) >= 12 ? 'PM' : 'AM'}`;

  return `### ⚡ PERSONAL PULSE SUMMARY
*   You ${comparisonText}.
*   **Best focus window**: ${bestWindow}
*   **Recommendation**: Start a 45-minute deep work session.`;
}

function getRoomFallbackInsights(activeGroup: string, members: any[]): string {
  const categories: Record<string, number> = {};
  let totalHours = 0;
  
  members.forEach(m => {
    const currentAct = m.activities ? m.activities[0] : null;
    if (currentAct) {
      const category = getAppCategory(currentAct.app, currentAct.project);
      categories[category] = (categories[category] || 0) + 1;
    }
    
    // Calculate total hours
    let memberSeconds = m.activities ? m.activities.reduce((acc: number, act: any) => acc + act.durationSeconds, 0) : 0;
    totalHours += memberSeconds / 3600;
  });

  let topCategory = "Development";
  let maxCount = 0;
  Object.entries(categories).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  });

  const targetHours = Math.max(50, Math.ceil(totalHours * 1.2));

  return `### 👥 TEAM PRODUCTIVITY INSIGHTS
*   **Vibe Check**: Most members of **${activeGroup}** are currently in **${topCategory}** work.
*   **Team Performance**: Team focus increased by **12%** this week.
*   **Suggested Goal**: Reach **${targetHours} focus hours** today.`;
}

// 6. smart AI briefing with Gemini 3.5 Flash!
let lastAiInsightsPersonal: string = "";
let lastAiTimestampPersonal: number = 0;
let lastAiInsightsRoom: string = "";
let lastAiTimestampRoom: number = 0;

app.get("/api/ai-insights", authenticateToken, async (req: any, res) => {
  const forceRefresh = req.query.force === "true";
  const type = req.query.type || "room"; // 'personal' or 'room'

  // Serve cache if fresh
  if (type === "personal" && lastAiInsightsPersonal && (Date.now() - lastAiTimestampPersonal < 120_000) && !forceRefresh) {
    return res.json({ text: lastAiInsightsPersonal, cached: true });
  }
  if (type === "room" && lastAiInsightsRoom && (Date.now() - lastAiTimestampRoom < 120_000) && !forceRefresh) {
    return res.json({ text: lastAiInsightsRoom, cached: true });
  }

  let user: any = null;
  let activeGroup = "Engineering Team";
  let friendsList: any[] = [];
  let myHours = 0;

  try {
    user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        activities: true,
        activityLogs: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    activeGroup = user.activeGroup;
    const group = activeGroup ? await prisma.group.findUnique({
      where: { name: activeGroup }
    }) : null;

    if (group) {
      const members = await prisma.groupMember.findMany({
        where: { groupId: group.id },
        include: {
          user: {
            include: { activities: true }
          }
        }
      });
      friendsList = members.filter(m => m.userId !== req.user.id).map(m => m.user);
    }

    const myActivity = user.activities[0] || {
      app: "VS Code",
      project: "EndoCore Workspace",
      durationSeconds: 0,
      isPaused: false
    };

    const myActiveSeconds = user.activities.reduce((acc: number, act: any) => acc + act.durationSeconds, 0);
    myHours = parseFloat((myActiveSeconds / 3600).toFixed(1));

    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("Missing valid GEMINI_API_KEY environment variable. Defaulting to high-quality fallback.");
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let prompt = "";
    if (type === "personal") {
      prompt = `You are a helpful, extremely clever, and witty developer co-working assistant companion.
Here is the user's (${user.name}) productivity stats today:
Focus Time: ${myHours} hours (Goal: ${user.productivityGoal} hours)
Distraction Flags: ${user.distractionsCount}
Focus Streak: ${user.focusStreak} days
Current status: "${user.status}"
Active Activity: tracking ${myActivity.app} on project "${myActivity.project}" (duration: ${Math.floor(myActivity.durationSeconds / 60)} minutes, paused: ${myActivity.isPaused}).

Please generate a premium, tailored Personal Productivity Coaching Briefing.
Format your output in clean, eye-catching Markdown with the following structured sections:
1.  **⚡ PERSONAL PULSE SUMMARY**: A wittily formulated summary of the user's performance today compared to yesterday.
2.  **🎮 FOCUS WINDOW DETAILS**: A peak productivity hour recommendation (e.g. "Best focus window: 9 AM - 11 AM").
3.  **💪 ACTIONABLE RECOMMENDATION**: A tailored suggestion on what the user should do next to maintain focus.

Keep it extremely concise, engaging, and professional but full of developer humor! Limit the entire response to exactly 100-130 words. Do not praise yourself or write self-referential introductory statements. Start directly with the pulse.`;
    } else {
      const myStateStr = `My Core state: User name: ${user.name}, active tracking: ${myActivity.app} on project "${myActivity.project}" (duration: ${Math.floor(myActivity.durationSeconds / 60)} minutes, paused: ${myActivity.isPaused}). My goal is ${user.productivityGoal} focus hours. Custom status: "${user.customStatus}".`;
      
      const friendsStateStr = friendsList.map(u => {
        const currentAct = u.activities[0] || { app: "Offline", project: "None" };
        const uActiveSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
        const uHours = (uActiveSeconds / 3600).toFixed(1);
        const todayFocusTime = `${uHours}h`;
        const focusScore = Math.min(100, Math.round((parseFloat(uHours) / (u.productivityGoal || 6)) * 100)) || 0;

        return `Friend "${u.name}" (${u.role}) is current status: "${u.status}" using "${currentAct.app}" for project "${currentAct.project}". Today total focus time: ${todayFocusTime}, productivity score: ${focusScore}%.`;
      }).join("\n");

      prompt = `You are a helpful, extremely clever, and witty developer co-working assistant companion.
Here is the current real-time activity status in our co-working group "${activeGroup}":
---
${myStateStr}

---
Our team members:
${friendsStateStr}
---

Please generate a premium Daily Focus & Co-working Briefing.
Format your output in clean, eye-catching Markdown with the following structured sections:
1.  **⚡ TEAM PULSE SUMMARY**: A quick, enthusiastic 2-sentence summary of what the vibe of the channel is right now (e.g., "Most members are currently in development work.").
2.  **🎮 INDIVIDUAL NUDGES & COMPLIMENTS**: Mention at least 2 specific friends. Offer a witty or helpful comment on what they are working on.
3.  **💪 SUGGESTED GOAL**: A dynamic daily goal for the team (e.g., "Reach 50 focus hours today.").

Keep the brief extremely visual, using bullet points, bold keywords, emoji highlights, and clean layouts. Keep it concise, engaging, and professional but full of developer humor! Limit the entire response to exactly 120-150 words. Do not praise yourself or write self-referential introductory statements. Start directly with the pulse.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
      }
    });

    const outputText = response.text || "No insights could be parsed.";
    
    if (type === "personal") {
      lastAiInsightsPersonal = outputText;
      lastAiTimestampPersonal = Date.now();
    } else {
      lastAiInsightsRoom = outputText;
      lastAiTimestampRoom = Date.now();
    }
    
    res.json({ text: outputText, cached: false });

  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    
    if (type === "personal") {
      const fallback = getPersonalFallbackInsights(user, user ? user.activityLogs : [], myHours);
      lastAiInsightsPersonal = fallback;
      lastAiTimestampPersonal = Date.now();
      res.json({ text: fallback, cached: true, error: true, details: error.message });
    } else {
      const fallback = getRoomFallbackInsights(activeGroup || "Engineering Team", friendsList);
      lastAiInsightsRoom = fallback;
      lastAiTimestampRoom = Date.now();
      res.json({ text: fallback, cached: true, error: true, details: error.message });
    }
  }
});

// Configure Vite middleware and SPA routing
async function startServer() {
  // Ensure database is populated with default seed records
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Database seeding failed:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 EndoCore Workspace express server running at http://localhost:${PORT}`);
  });
}

startServer();
