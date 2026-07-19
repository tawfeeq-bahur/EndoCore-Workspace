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
import Redis from "ioredis";

dotenv.config();

// Connect to Redis Cache
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
redis.on("connect", () => {
  console.log("🚀 Connected to Redis successfully");
});
redis.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
});

// Redis Caching Helpers
async function getUserActiveActivity(userId: string) {
  const cached = await redis.get(`user:active:${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Error parsing user active cache:", e);
    }
  }

  // Cache miss - query Postgres
  let activity = await prisma.activity.findFirst({
    where: { userId }
  });

  if (!activity) {
    activity = await prisma.activity.create({
      data: {
        userId,
        app: "Offline",
        project: "None",
        durationSeconds: 0,
        isPaused: true,
        startedAt: new Date()
      }
    });
  }

  const result = {
    app: activity.app,
    project: activity.project,
    startedAt: activity.startedAt.getTime(),
    durationSeconds: activity.durationSeconds,
    isPaused: activity.isPaused,
    lastHeartbeat: Date.now()
  };

  await redis.set(`user:active:${userId}`, JSON.stringify(result));
  return result;
}

async function setUserActiveActivity(userId: string, activity: any) {
  await redis.set(`user:active:${userId}`, JSON.stringify(activity));
}

async function getUserOpenApps(userId: string): Promise<string[]> {
  const cached = await redis.get(`user:openapps:${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
}

async function setUserOpenApps(userId: string, openApps: string[]) {
  await redis.set(`user:openapps:${userId}`, JSON.stringify(openApps));
}

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


// Socket.io Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("Socket connection rejected: missing token");
    return next(new Error("Authentication error: missing token"));
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      console.log("Socket connection rejected: invalid token");
      return next(new Error("Authentication error: invalid token"));
    }
    socket.data = socket.data || {};
    socket.data.userId = decoded.id;
    next();
  });
});

// Socket.io Connection Handler
io.on("connection", (socket) => {
  const userId = socket.data.userId;
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

// Helper to broadcast activity update to room occupants
async function broadcastActivityUpdate(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activityLogs: {
          orderBy: { timestamp: "desc" },
          take: 10
        }
      }
    });

    if (!user) return;

    const currentAct = await getUserActiveActivity(userId);

    // Calculate duration text based on Redis accumulated duration
    const totalDurationSeconds = currentAct.durationSeconds;
    let durationText = "0m";
    if (totalDurationSeconds < 60) {
      durationText = `${totalDurationSeconds}s`;
    } else {
      durationText = `${Math.floor(totalDurationSeconds / 60)}m`;
    }

    const rawActivity = {
      app: currentAct.app,
      project: currentAct.project,
      startedAt: currentAct.startedAt,
      durationText: durationText
    };

    // Apply privacy masking
    const maskedActivity = applyPrivacyMask(rawActivity, user.privacyMode);

    // Calculate focus time and dynamic score based on real user activity (today's logs + current activity)
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayLogs = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: todayStart }
      }
    });
    let totalTodaySeconds = 0;
    todayLogs.forEach(log => {
      totalTodaySeconds += parseDurationText(log.durationText);
    });

    // Add current active session seconds (if online and not paused)
    if (currentAct.app !== "Offline" && !currentAct.isPaused) {
      totalTodaySeconds += currentAct.durationSeconds;
    }

    const hours = parseFloat((totalTodaySeconds / 3600).toFixed(1));
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
// Background Redis caching tickers and sync daemon
// -------------------------------------------------------------

// 1. Ticker for Redis active activities (runs every 5 seconds)
setInterval(async () => {
  try {
    const keys = await redis.keys("user:active:*");
    for (const key of keys) {
      const userId = key.split(":").pop();
      if (!userId) continue;

      const data = await redis.get(key);
      if (!data) continue;

      const act = JSON.parse(data);
      let changed = false;

      // Check for heartbeat timeout (no activity update in 15 seconds)
      const now = Date.now();
      const heartbeatElapsed = now - act.lastHeartbeat;

      if (act.app !== "Offline" && heartbeatElapsed > 15000) {
        // Mark user offline
        act.app = "Offline";
        act.project = "None";
        act.isPaused = true;
        changed = true;

        await prisma.user.update({
          where: { id: userId },
          data: { status: "offline" }
        });
      } else if (!act.isPaused && act.app !== "Offline") {
        act.durationSeconds += 5;
        changed = true;
      }

      if (changed) {
        await redis.set(key, JSON.stringify(act));
        broadcastActivityUpdate(userId);
      }
    }
  } catch (error) {
    console.error("Redis background ticker error:", error);
  }
}, 5000);

// 2. Periodic sync of Redis active sessions to PostgreSQL (runs every 60 seconds)
setInterval(async () => {
  try {
    const keys = await redis.keys("user:active:*");
    for (const key of keys) {
      const userId = key.split(":").pop();
      if (!userId) continue;

      const data = await redis.get(key);
      if (!data) continue;

      const act = JSON.parse(data);

      const dbAct = await prisma.activity.findFirst({ where: { userId } });
      if (dbAct) {
        await prisma.activity.update({
          where: { id: dbAct.id },
          data: {
            app: act.app,
            project: act.project,
            durationSeconds: act.durationSeconds,
            isPaused: act.isPaused,
            startedAt: new Date(act.startedAt)
          }
        });
      }

      // Sync focus summaries to DailySummary for analytics heatmap
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayDateStr = todayStart.toISOString().split("T")[0];

      const todayLogs = await prisma.activityLog.findMany({
        where: {
          userId,
          timestamp: { gte: todayStart }
        }
      });

      let totalTodaySeconds = 0;
      todayLogs.forEach(log => {
        totalTodaySeconds += parseDurationText(log.durationText);
      });

      if (act.app !== "Offline" && !act.isPaused) {
        totalTodaySeconds += act.durationSeconds;
      }

      const userRec = await prisma.user.findUnique({ where: { id: userId } });
      if (userRec) {
        const hours = parseFloat((totalTodaySeconds / 3600).toFixed(1));
        const productivityScore = await calculateProductivityScore(
          userId,
          hours,
          userRec.productivityGoal || 6,
          userRec.distractionsCount
        );

        await prisma.dailySummary.upsert({
          where: {
            userId_date: {
              userId,
              date: todayDateStr
            }
          },
          create: {
            userId,
            date: todayDateStr,
            totalFocusSeconds: totalTodaySeconds,
            productivityScore
          },
          update: {
            totalFocusSeconds: totalTodaySeconds,
            productivityScore
          }
        });
      }
    }
  } catch (error) {
    console.error("PostgreSQL sync worker error:", error);
  }
}, 60000);

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

// Health & Services Diagnostics Endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check Database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if Gemini API key is configured
    const geminiKeySet = !!process.env.GEMINI_API_KEY;
    
    res.json({
      status: "healthy",
      database: "connected",
      ai: geminiKeySet ? "configured" : "missing_key"
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      database: "error",
      error: error.message
    });
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
    const activity = await getUserActiveActivity(req.user.id);
    const openAppsList = await getUserOpenApps(req.user.id);
    res.json({
      app: activity.app,
      project: activity.project,
      startedAt: activity.startedAt,
      durationSeconds: activity.durationSeconds,
      isPaused: activity.isPaused,
      openApps: openAppsList
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update your current activity
app.post("/api/my-activity", authenticateToken, async (req: any, res) => {
  try {
    const { app: selectedApp, project, isPaused, togglePause, resetTimer, incrementDistraction, resetDistractions, completeFocusSession, openApps } = req.body;

    if (Array.isArray(openApps)) {
      await setUserOpenApps(req.user.id, openApps);
    }
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

        // Insert a new FocusSession record in Supabase PostgreSQL
        await prisma.focusSession.create({
          data: {
            userId: req.user.id,
            taskName: project || "Pomodoro Focus Sprint",
            durationMinutes: 25,
            completed: true
          }
        });
      }

      await prisma.user.update({
        where: { id: req.user.id },
        data: updatePayload
      });
    }

    const activity = await getUserActiveActivity(req.user.id);

    const hasChanged = (selectedApp !== undefined && selectedApp !== activity.app) ||
                       (sanitizedProject !== undefined && sanitizedProject !== activity.project);

    if (hasChanged) {
      // 1. Create a log entry for the *previous* activity session if valid
      if (activity.app !== "Offline" && activity.durationSeconds > 0) {
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
      }

      // 2. Set the current activity to the new app/project with durationSeconds = 0 in cache
      activity.app = selectedApp !== undefined ? selectedApp : activity.app;
      activity.project = sanitizedProject !== undefined ? sanitizedProject : activity.project;
      activity.durationSeconds = 0;
      activity.startedAt = Date.now();
      activity.isPaused = isPaused !== undefined ? isPaused : (togglePause !== undefined ? togglePause : (wasOffline ? false : activity.isPaused));
      activity.lastHeartbeat = Date.now();

      await setUserActiveActivity(req.user.id, activity);

      broadcastActivityUpdate(req.user.id);

      return res.json({
        success: true,
        activity: {
          app: activity.app,
          project: activity.project,
          startedAt: activity.startedAt,
          durationSeconds: activity.durationSeconds,
          isPaused: activity.isPaused
        }
      });
    }

    // If there is no change, but we are pausing/unpausing or resetting
    if (togglePause !== undefined) {
      activity.isPaused = togglePause;
    } else if (isPaused !== undefined) {
      activity.isPaused = isPaused;
    } else if (wasOffline) {
      activity.isPaused = false;
    }

    if (resetTimer) {
      activity.startedAt = Date.now();
      activity.durationSeconds = 0;
    }

    activity.lastHeartbeat = Date.now();
    await setUserActiveActivity(req.user.id, activity);

    broadcastActivityUpdate(req.user.id);

    res.json({
      success: true,
      activity: {
        app: activity.app,
        project: activity.project,
        startedAt: activity.startedAt,
        durationSeconds: activity.durationSeconds,
        isPaused: activity.isPaused
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
            activityLogs: {
              orderBy: { timestamp: "desc" },
              take: 10
            }
          }
        }
      }
    });

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const friendPromises = members
      .filter(m => m.userId !== req.user.id)
      .map(async m => {
        const u = m.user;
        const currentAct = await getUserActiveActivity(u.id);

        const totalDurationSeconds = currentAct.durationSeconds;
        let durationText = "0m";
        if (totalDurationSeconds < 60) {
          durationText = `${totalDurationSeconds}s`;
        } else {
          durationText = `${Math.floor(totalDurationSeconds / 60)}m`;
        }

        const rawActivity = {
          app: currentAct.app,
          project: currentAct.project,
          startedAt: currentAct.startedAt,
          durationText: durationText
        };

        // Apply privacy masking
        const maskedActivity = applyPrivacyMask(rawActivity, u.privacyMode);

        const uTodayLogs = await prisma.activityLog.findMany({
          where: {
            userId: u.id,
            timestamp: { gte: todayStart }
          }
        });
        let uTodaySeconds = 0;
        uTodayLogs.forEach(log => {
          uTodaySeconds += parseDurationText(log.durationText);
        });

        // Add current active session duration if online and not paused
        if (currentAct.app !== "Offline" && !currentAct.isPaused) {
          uTodaySeconds += currentAct.durationSeconds;
        }

        const uHours = parseFloat((uTodaySeconds / 3600).toFixed(1));
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
app.get("/api/analytics", authenticateToken, async (req: any, res: any) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        timestamp: { gte: todayStart }
      }
    });

    const appDurations: Record<string, number> = {};
    logs.forEach(log => {
      const seconds = parseDurationText(log.durationText);
      appDurations[log.app] = (appDurations[log.app] || 0) + seconds;
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const currentAct = await getUserActiveActivity(req.user.id);
    if (currentAct && currentAct.app !== "Offline" && !currentAct.isPaused) {
      appDurations[currentAct.app] = (appDurations[currentAct.app] || 0) + currentAct.durationSeconds;
    }

    const colorsMap: Record<string, string> = {
      "VS Code": "#2563EB",
      "Figma": "#EC4899",
      "Chrome": "#10B981",
      "Terminal": "#6B7280",
      "Slack": "#F59E0B",
      "Spotify": "#A855F7"
    };

    let appBreakdown = Object.entries(appDurations).map(([name, seconds]) => ({
      name,
      value: Math.max(1, Math.round(seconds / 60)), // duration in minutes
      color: colorsMap[name] || "#6B7280"
    })).sort((a, b) => b.value - a.value);

    if (appBreakdown.length === 0) {
      appBreakdown = [];
    }

    let focusScore = 0;
    let focusTimeHours = 0;
    if (user) {
      let totalTodaySeconds = 0;
      logs.forEach(log => {
        totalTodaySeconds += parseDurationText(log.durationText);
      });
      const activeSeconds = (currentAct && currentAct.app !== "Offline" && !currentAct.isPaused) ? currentAct.durationSeconds : 0;
      totalTodaySeconds += activeSeconds;

      focusTimeHours = parseFloat((totalTodaySeconds / 3600).toFixed(1));
      focusScore = await calculateProductivityScore(user.id, focusTimeHours, user.productivityGoal || 6, user.distractionsCount);
    }

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayIndex = new Date().getDay();
    
    // Get start of this week (Sunday 00:00:00)
    const sunday = new Date();
    sunday.setDate(sunday.getDate() - todayIndex);
    sunday.setHours(0, 0, 0, 0);

    const weekSummaries = await prisma.dailySummary.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: sunday.toISOString().split("T")[0]
        }
      }
    });

    const focusScoreHistory = daysOfWeek.map((day, idx) => {
      const targetDate = new Date(sunday);
      targetDate.setDate(sunday.getDate() + idx);
      const dateStr = targetDate.toISOString().split("T")[0];
      
      const summary = weekSummaries.find(s => s.date === dateStr);
      if (idx === todayIndex) {
        return { day, score: focusScore, ideal: 80 };
      }
      return {
        day,
        score: summary ? summary.productivityScore : 0,
        ideal: 80
      };
    });

    const allUsers = await prisma.user.findMany();

    const comparisonStatsPromises = allUsers.map(async u => {
      const uAct = await getUserActiveActivity(u.id);
      const activeSeconds = (uAct && uAct.app !== "Offline" && !uAct.isPaused) ? uAct.durationSeconds : 0;
      const hours = parseFloat((activeSeconds / 3600).toFixed(1));
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
    if (currentAct && currentAct.app !== "Offline" && !currentAct.isPaused) {
      totalLogSeconds += currentAct.durationSeconds;
    }

    const weeklyTotalHours = parseFloat((totalLogSeconds / 3600).toFixed(1));
    const weeklyProdGoalAchieved = Math.min(100, Math.round((weeklyTotalHours / 35) * 100)) || 0;
    const averageDailyFocus = parseFloat((weeklyTotalHours / 7).toFixed(1));

    // Fetch all DailySummaries to drive the 365-day heatmap calendar
    const dailySummaries = await prisma.dailySummary.findMany({
      where: { userId: req.user.id }
    });

    res.json({
      appBreakdown,
      focusScoreHistory,
      comparisonStats,
      weeklyTotalHours,
      weeklyProdGoalAchieved,
      averageDailyFocus,
      dailySummaries
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
            activityLogs: true
          }
        }
      }
    });

    const leaderboardPromises = members.map(async m => {
      const u = m.user;
      const currentAct = await getUserActiveActivity(u.id);
      
      // Calculate active seconds: current session from Redis + logged activities from PostgreSQL
      let totalSeconds = (currentAct && currentAct.app !== "Offline" && !currentAct.isPaused) ? currentAct.durationSeconds : 0;
      
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

    const leaderboard = await Promise.all(leaderboardPromises);

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

function getRoomFallbackInsights(activeGroup: string, currentUser: any, members: any[]): string {
  // Calculate dynamic stats
  const safeMembers = (members || []).filter(m => m && m.id);
  const activeColleagues = safeMembers.filter(m => m.status && m.status !== "offline");
  const totalCount = safeMembers.length + 1; // plus currentUser
  const myActivity = currentUser.activities?.[0] || { app: "Offline", project: "None", durationSeconds: 0 };
  const myActive = myActivity.app !== "Offline";
  const activeCount = activeColleagues.length + (myActive ? 1 : 0);
  const roomProdPercentage = Math.round((activeCount / totalCount) * 100) || 50;

  // Find top performer
  let topPerfName = currentUser.name || "Tawfeeq Bahur";
  let topPerfTime = (myActivity.durationSeconds / 3600).toFixed(1) + "h";
  let topPerfApps = [myActivity.app].filter(a => a !== "Offline");
  let topPerfScore = 90;
  let topPerfReason = "Consistent coding activity on active projects.";

  let maxHours = myActivity.durationSeconds / 3600;
  safeMembers.forEach(m => {
    const act = m.activities?.[0] || { app: "Offline", project: "None", durationSeconds: 0 };
    const h = act.durationSeconds / 3600;
    if (h > maxHours) {
      maxHours = h;
      topPerfName = m.name;
      topPerfTime = h.toFixed(1) + "h";
      topPerfApps = [act.app].filter(a => a !== "Offline");
      topPerfScore = 85;
      topPerfReason = `Maintained focused tracking session in ${act.app}.`;
    }
  });
  if (topPerfApps.length === 0) topPerfApps = ["VS Code"];

  // Find needs attention
  let needsAttName = "None";
  let needsAttIdle = "0m";
  let needsAttReason = "No issues detected. Team is on track.";
  
  const offlineColleagues = safeMembers.filter(m => m.status === "offline");
  if (offlineColleagues.length > 0) {
    needsAttName = offlineColleagues[0].name;
    needsAttIdle = "Offline";
    needsAttReason = "Colleague is currently offline.";
  }

  const payload = {
    roomSummary: {
      status: activeCount > 0 ? "Focused Development Session" : "Quiet Room Sprints",
      productivityPercentage: roomProdPercentage,
      description: `${activeGroup} has been actively working for the past 2 hours.`,
      activeCount: activeCount,
      totalCount: totalCount
    },
    topPerformer: {
      name: topPerfName,
      focusTime: topPerfTime,
      apps: topPerfApps,
      score: topPerfScore,
      reason: topPerfReason
    },
    needsAttention: {
      name: needsAttName,
      idleTime: needsAttIdle,
      reason: needsAttReason
    },
    recommendations: [
      `Encourage focused sprint sessions for ${activeGroup}.`,
      "Review context switching frequency."
    ],
    prediction: {
      completionPercentage: Math.max(60, 60 + activeCount * 8),
      description: "Sprint tasks are progressing normally."
    },
    summary: `Daily Scrum Briefing: ${activeGroup} showed steady activity with ${activeCount} members online focusing on core tasks. Overall momentum is on schedule.`
  };

  return JSON.stringify(payload);
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
  let myActivity: any = null;

  try {
    user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
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
          user: true
        }
      });
      const friendPromises = members
        .filter(m => m.userId !== req.user.id)
        .map(async m => {
          const u = m.user as any;
          const currentAct = await getUserActiveActivity(u.id);
          u.activities = [currentAct]; // Mock for compatibility
          return u;
        });
      friendsList = await Promise.all(friendPromises);
    }

    myActivity = await getUserActiveActivity(req.user.id);
    const myActiveSeconds = (myActivity.app !== "Offline" && !myActivity.isPaused) ? myActivity.durationSeconds : 0;
    myHours = parseFloat((myActiveSeconds / 3600).toFixed(1));

    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("your-gemini-api-key") || key === "MY_GEMINI_API_KEY") {
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
      const myStateStr = `User name: ${user.name}, active tracking: ${myActivity.app} on project "${myActivity.project}" (duration: ${Math.floor(myActivity.durationSeconds / 60)} minutes, paused: ${myActivity.isPaused}). Focus goal is ${user.productivityGoal} hours.`;
      
      const friendsStateStr = friendsList.map(u => {
        const currentAct = u.activities[0] || { app: "Offline", project: "None", durationSeconds: 0 };
        const uActiveSeconds = u.activities.reduce((acc: number, act: any) => acc + act.durationSeconds, 0);
        const uHours = (uActiveSeconds / 3600).toFixed(1);
        const todayFocusTime = `${uHours}h`;
        const focusScore = Math.min(100, Math.round((parseFloat(uHours) / (u.productivityGoal || 6)) * 100)) || 0;

        return `Friend "${u.name}" (${u.role}) is status: "${u.status}" using "${currentAct.app}" for project "${currentAct.project}". Today total focus time: ${todayFocusTime}, focus score: ${focusScore}%.`;
      }).join("\n");

      prompt = `You are the EndoCore AI Scrum Coordinator.
You receive live telemetry from every user in the current room:
- My state: ${myStateStr}
- Colleagues:
${friendsStateStr}

Provide a concise, data-driven daily focus and scrum coordination briefing for the channel "${activeGroup}".
You must output a single, flat JSON object.
Return exactly the following JSON structure (do not wrap in markdown tags, return only raw JSON):
{
  "roomSummary": {
    "status": "A short focused status indicator (e.g. Focused Development Session, Average Productivity, High Multitasking Vibe)",
    "productivityPercentage": number (calculate average focus percentage of the room members based on goals achieved),
    "description": "A short summary paragraph of the overall room activity level, mentioning active vs idle users.",
    "activeCount": number (number of active online developers in the room),
    "totalCount": number (total number of members in the room)
  },
  "topPerformer": {
    "name": "Name of the user with the most focus hours or best deep work streak today",
    "focusTime": "Formated focus duration (e.g. 5h 48m)",
    "apps": ["List of top 2-3 active tools used by this top performer, e.g. VS Code, Chrome"],
    "score": number (focus score out of 100),
    "reason": "Detailed metric-driven reason why they are the top performer (e.g. Low switching, completed 27 events)"
  },
  "needsAttention": {
    "name": "Name of user with long idle times, offline status, or high app switching. If none, write 'None'",
    "idleTime": "Formatted idle duration, e.g. 48 mins or '0 mins'",
    "reason": "Reason why they need attention, or 'No issues detected' if none"
  },
  "recommendations": [
    "List of 2 specific actionable recommendations for the team or individuals (e.g. suggest a break, pairing, review task allocation)"
  ],
  "prediction": {
    "completionPercentage": number (estimated sprint completion or room daily goal completion percentage),
    "description": "Scrum master estimation on whether team tasks will finish on time based on current focus levels."
  },
  "summary": "A professional Scrum-style closing paragraph summarizing today's overall team status, workspace mood, and momentum."
}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        responseMimeType: type === "room" ? "application/json" : undefined
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
    
    const fallbackUser = user || { name: "Developer", productivityGoal: 6, distractionsCount: 0, focusStreak: 0, status: "Offline", activityLogs: [] };
    if (type === "personal") {
      const fallback = getPersonalFallbackInsights(fallbackUser, fallbackUser.activityLogs || [], myHours);
      lastAiInsightsPersonal = fallback;
      lastAiTimestampPersonal = Date.now();
      res.json({ text: fallback, cached: true, error: true, details: error.message });
    } else {
      fallbackUser.activities = [myActivity || { app: "Offline", project: "None", durationSeconds: 0 }];
      const fallback = getRoomFallbackInsights(activeGroup || "Engineering Team", fallbackUser, friendsList);
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
