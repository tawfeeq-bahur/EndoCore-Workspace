import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import http from "http";
import multer from "multer";
import { Server } from "socket.io";
import { prisma } from "./db";
import { seedDatabase } from "./seed";
import Redis from "ioredis";
import { createRoomTransactional, recordTrackingConsent } from "./src/services/roomService";
import { requireRoomRole, requireRoomPermission } from "./src/middleware/roomAuth";
import { generateMultiAgentBriefing } from "./src/ai/multiAgentEngine";
import goalRoutes from "./src/routes/goalRoutes.ts";
import { exec } from "child_process";

dotenv.config();

// Connect to Redis Cache with Resilient In-Memory Fallback
let isRedisConnected = false;
let redisWarned = false;

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null // Don't hang on connection failures
});

const memoryCache = new Map<string, { value: string; expiresAt?: number }>();

redis.on("connect", () => {
  isRedisConnected = true;
  redisWarned = false;
  console.log("🚀 Connected to Redis successfully");
});

redis.on("error", (err: any) => {
  if (isRedisConnected || !redisWarned) {
    console.warn("⚠️ Redis server not available at " + (process.env.REDIS_URL || "redis://localhost:6379") + ". Operating with in-memory cache fallback.");
    redisWarned = true;
  }
  isRedisConnected = false;
});

function safeMemoryGet(key: string): string | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function safeMemorySet(key: string, value: string, ttlSeconds?: number) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
  memoryCache.set(key, { value, expiresAt });
}

function safeMemoryKeys(pattern: string): string[] {
  const now = Date.now();
  const prefix = pattern.replace("*", "");
  const result: string[] = [];
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiresAt && now > item.expiresAt) {
      memoryCache.delete(key);
      continue;
    }
    if (key.startsWith(prefix)) {
      result.push(key);
    }
  }
  return result;
}

async function safeRedisGet(key: string): Promise<string | null> {
  if (isRedisConnected) {
    try {
      const val = await redis.get(key);
      if (val !== null) {
        safeMemorySet(key, val);
        return val;
      }
    } catch (err) {
      isRedisConnected = false;
    }
  }
  return safeMemoryGet(key);
}

async function safeRedisSet(key: string, value: string, mode?: string, duration?: number): Promise<void> {
  const ttlSeconds = mode === "EX" && typeof duration === "number" ? duration : undefined;
  safeMemorySet(key, value, ttlSeconds);
  if (isRedisConnected) {
    try {
      if (mode === "EX" && duration) {
        await redis.set(key, value, "EX", duration);
      } else {
        await redis.set(key, value);
      }
    } catch (err) {
      isRedisConnected = false;
    }
  }
}

async function safeRedisKeys(pattern: string): Promise<string[]> {
  const memKeys = safeMemoryKeys(pattern);
  if (isRedisConnected) {
    try {
      const redisKeys = await redis.keys(pattern);
      return Array.from(new Set([...memKeys, ...redisKeys]));
    } catch (err) {
      isRedisConnected = false;
    }
  }
  return memKeys;
}

async function safeRedisTtl(key: string): Promise<number> {
  if (isRedisConnected) {
    try {
      return await redis.ttl(key);
    } catch (err) {
      isRedisConnected = false;
    }
  }
  const item = memoryCache.get(key);
  if (!item || !item.expiresAt) return -1;
  const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : -2;
}

// Redis / In-Memory Caching Helpers
async function getPresence(userId: string): Promise<any> {
  const cached = await safeRedisGet(`presence:user:${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return { state: "offline" };
}

async function setPresence(userId: string, data: any) {
  // Save with 60s expiration (TTL)
  await safeRedisSet(`presence:user:${userId}`, JSON.stringify(data), "EX", 60);
}

async function syncPresenceToRedis(userId: string, activity: any, userStatus: string, activeGroup: string) {
  const currentStatus = (userStatus || "online").toLowerCase();
  let presenceState: "online" | "focusing" | "break" | "busy" | "offline" = "online";
  
  if (!activity || activity.app === "Offline") {
    presenceState = "offline";
  } else if (activity.isPaused) {
    presenceState = "break";
  } else if (currentStatus === "busy" || currentStatus === "focus" || currentStatus === "focused") {
    presenceState = "busy";
  } else {
    presenceState = "focusing";
  }

  const presencePayload = {
    state: presenceState,
    appCategory: getAppCategory(activity ? activity.app : "Offline", (activity ? activity.project : "") || ""),
    appName: activity ? activity.app : "Offline",
    roomId: activeGroup || "",
    focusStartedAt: activity ? new Date(activity.startedAt).toISOString() : new Date().toISOString(),
    lastHeartbeatAt: Date.now()
  };
  await setPresence(userId, presencePayload);
}

async function getUserActiveActivity(userId: string) {
  const cached = await safeRedisGet(`user:active:${userId}`);
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
        app: "VS Code",
        project: "EndoCore Workspace",
        durationSeconds: 0,
        isPaused: false,
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

  await safeRedisSet(`user:active:${userId}`, JSON.stringify(result));
  return result;
}

async function setUserActiveActivity(userId: string, activity: any) {
  await safeRedisSet(`user:active:${userId}`, JSON.stringify(activity));
}

async function getUserOpenApps(userId: string): Promise<string[]> {
  const cached = await safeRedisGet(`user:openapps:${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }
  return [];
}

async function setUserOpenApps(userId: string, openApps: string[]) {
  await safeRedisSet(`user:openapps:${userId}`, JSON.stringify(openApps));
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://endocore-workspace.vercel.app",
  "https://endocore-workspace.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

// Production CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// Mount Goal Routes
app.use("/api/goals", authenticateToken, goalRoutes);
const storage = multer.diskStorage({
  destination: function (req: any, file, cb) {
    cb(null, path.join(process.cwd(), "public/uploads/"));
  },
  filename: function (req: any, file, cb) {
    const ext = file.originalname.split('.').pop();
    cb(null, `${req.user?.id}-${Date.now()}.${ext}`);
  }
});
const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dashboard-key";

// HTTP and Socket.io server setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
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
  
  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: "Access token invalid or expired" });
    
    // In case the DB was reset and the UUID changed, fetch the latest user by email
    const { prisma } = await import("./db.js");
    const realUser = await prisma.user.findUnique({ where: { email: decoded.email } });
    
    req.user = decoded;
    if (realUser) {
      req.user.id = realUser.id;
    }
    
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
    },
    username: user.username,
    headline: user.headline,
    presenceVisibility: user.presenceVisibility,
    activityVisibility: user.activityVisibility,
    showDailyFocusTime: user.showDailyFocusTime,
    showCurrentRoom: user.showCurrentRoom,
    allowFocusInvites: user.allowFocusInvites,
    allowRoomInvites: user.allowRoomInvites,
    allowJoinRequests: user.allowJoinRequests
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

  // Join user room for multi-device delivery
  socket.join(`user:${userId}`);

  socket.on("join-group", (groupName: string) => {
    // Leave previous rooms (except private user room and socket ID room)
    socket.rooms.forEach(room => {
      if (room !== socket.id && room !== `user:${userId}`) socket.leave(room);
    });
    socket.join(groupName);
    console.log(`User ${userId} joined room: ${groupName}`);
  });

  socket.on("send-nudge", async (data: { targetUserId: string }) => {
    try {
      const sender = await prisma.user.findUnique({ where: { id: userId } });
      if (!sender) return;

      // Target the user-specific room
      io.to(`user:${data.targetUserId}`).emit("peer-nudge", {
        senderId: userId,
        senderName: sender.name
      });
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
    const keys = await safeRedisKeys("user:active:*");
    for (const key of keys) {
      const userId = key.split(":").pop();
      if (!userId) continue;

      const data = await safeRedisGet(key);
      if (!data) continue;

      const act = JSON.parse(data);
      let changed = false;

      // Agent stays active continuously unless user explicitly pauses tracking or sets app to Offline
      if (!act.isPaused && act.app && act.app !== "Offline") {
        act.durationSeconds += 5;
        changed = true;
      }

      if (changed) {
        await safeRedisSet(key, JSON.stringify(act));
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
    const keys = await safeRedisKeys("user:active:*");
    for (const key of keys) {
      const userId = key.split(":").pop();
      if (!userId) continue;

      const data = await safeRedisGet(key);
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
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        username,
        headline: "Software Developer",
        activeGroup: "",
        privacyMode: "Level 1: Full Detail",
        customStatus: "Just joined EndoCore Workspace! 👋",
        status: "online",
        role: "Software Developer",
        broadcastGroups: ""
      }
    });

    // Create initial active activity
    const initialActivity = {
      app: "Offline",
      project: "None",
      startedAt: Date.now(),
      durationSeconds: 0,
      isPaused: false,
      lastHeartbeat: Date.now()
    };

    await prisma.activity.create({
      data: {
        userId: user.id,
        app: initialActivity.app,
        project: initialActivity.project,
        durationSeconds: 0,
        isPaused: false
      }
    });

    await setUserActiveActivity(user.id, initialActivity);
    await syncPresenceToRedis(user.id, initialActivity, user.status, user.activeGroup);

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

  const cleanEmail = (email || "").trim().toLowerCase();

  // SPECIAL JUDGE SHOWCASE DEMO ACCOUNT AUTO-HANDLER
  if (cleanEmail === "showcase" || cleanEmail === "showcase@endocore.io") {
    if (password !== "123") {
      return res.status(400).json({ error: "Invalid email or password. Password for showcase is 123" });
    }

    try {
      let showcaseUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: "showcase@endocore.io" },
            { username: "showcase" }
          ]
        }
      });

      if (!showcaseUser) {
        showcaseUser = await prisma.user.create({
          data: {
            email: "showcase@endocore.io",
            username: "showcase",
            passwordHash: bcrypt.hashSync("123", 10),
            name: "Alex Mercer",
            role: "Lead Systems Architect & Core Developer",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            activeGroup: "Engineering Group",
            privacyMode: "Public",
            deviceConnected: "WS-STUDIO-PRO-01",
            productivityGoal: 6,
            status: "online",
            focusStreak: 3
          }
        });

        // Seed initial activity for Showcase User
        try {
          await prisma.activity.create({
            data: {
              userId: showcaseUser.id,
              app: "Antigravity IDE",
              project: "EndoCore Workstation Pipeline Engine",
              startedAt: new Date(Date.now() - 5.8 * 3600 * 1000),
              durationSeconds: Math.floor(5.8 * 3600),
              isPaused: false
            }
          });
        } catch (e) {}

        // Seed Connected Devices for Showcase User
        const defaultDevices = [
          { deviceName: "WS-STUDIO-PRO-01 (Windows Workstation)", platform: "WINDOWS", pushToken: `token_showcase_ws11` },
          { deviceName: "Pixel 8 Pro (Mobile Browser)", platform: "ANDROID", pushToken: `token_showcase_pixel8` },
          { deviceName: "MacBook Pro 16\" (M3 Max)", platform: "MACOS", pushToken: `token_showcase_macbook` },
          { deviceName: "Dell UltraSharp U2723QE (4K Dual Display)", platform: "WINDOWS", pushToken: `token_showcase_dell` },
          { deviceName: "iPad Pro 12.9\" (Tablet Companion)", platform: "IOS", pushToken: `token_showcase_ipad` }
        ];

        for (const dev of defaultDevices) {
          try {
            await prisma.userDevice.upsert({
              where: { pushToken: dev.pushToken },
              update: { enabled: true, lastSeenAt: new Date() },
              create: {
                userId: showcaseUser.id,
                deviceName: dev.deviceName,
                platform: dev.platform as any,
                pushToken: dev.pushToken,
                enabled: true,
                lastSeenAt: new Date()
              }
            });
          } catch (e) {}
        }
      }

      const token = jwt.sign({ id: showcaseUser.id, email: showcaseUser.email }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ success: true, token, user: formatUserProfile(showcaseUser) });
    } catch (err: any) {
      console.error("Error creating/logging into Showcase user:", err);
      return res.status(500).json({ error: "Showcase account error: " + err.message });
    }
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { email: `${cleanEmail}@endocore.io` }
        ]
      }
    });

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

// -------------------------------------------------------------
// EndoCore Peer Wave Signal & Notifications API
// -------------------------------------------------------------

// Persistent Wave Signal Endpoint with 5-minute Cooldown & Spam Protection
app.post(["/api/connections/wave", "/api/connections/:connectionId/wave"], authenticateToken, async (req: any, res) => {
  try {
    const senderId = req.user.id;
    const targetUserId = req.body.targetUserId || req.params.connectionId || req.body.connectionId;

    if (!targetUserId) {
      return res.status(400).json({ error: "Target user ID is required" });
    }

    if (senderId === targetUserId) {
      return res.status(400).json({ error: "You cannot wave at yourself" });
    }

    // 1. Verify Sender and Receiver Existence
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!sender || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Check User Block Status
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: senderId }
        ]
      }
    });

    if (isBlocked) {
      return res.status(403).json({ error: "Cannot send wave to this user" });
    }

    // 3. Spam Protection & Testing Cooldown Check (10 seconds for testing)
    const cooldownKey = `wave:cooldown:${senderId}:${targetUserId}`;
    const ttl = await safeRedisTtl(cooldownKey);
    if (ttl > 0) {
      const cooldownEndsAt = new Date(Date.now() + ttl * 1000).toISOString();
      return res.status(429).json({
        error: `Wave cooldown active. Please wait ${ttl}s before waving again.`,
        cooldownSecondsRemaining: ttl,
        cooldownEndsAt
      });
    }

    // Set 10-second testing cooldown
    await safeRedisSet(cooldownKey, "active", "EX", 10);

    // 4. Database Persistence (Save Notification Record for Offline Delivery)
    const notification = await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        senderId: senderId,
        type: "CONNECTION_WAVE",
        title: `👋 ${sender.name} waved at you`,
        body: "They're checking in and cheering on your focus.",
        metadata: {
          senderId: sender.id,
          senderName: sender.name,
          senderAvatarUrl: sender.avatarUrl
        }
      }
    });

    // 5. Socket.io Realtime Delivery to all Active Receiver Devices (`user:${targetUserId}`)
    const payload = {
      notificationId: notification.id,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatarUrl: sender.avatarUrl,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString()
    };

    io.to(`user:${targetUserId}`).emit("connection:wave", payload);
    io.to(`user:${targetUserId}`).emit("peer-nudge", { senderId: sender.id, senderName: sender.name });

    const cooldownEndsAt = new Date(Date.now() + 10 * 1000).toISOString();
    res.json({
      success: true,
      message: `Wave sent to ${targetUser.name}`,
      notificationId: notification.id,
      cooldownSeconds: 10,
      cooldownEndsAt
    });
  } catch (error: any) {
    console.error("Error sending wave:", error);
    res.status(500).json({ error: error.message || "Failed to send wave" });
  }
});

// Notifications List Endpoint
app.get("/api/notifications", authenticateToken, async (req: any, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 30
    });
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark Notifications as Read Endpoint
app.post("/api/notifications/mark-read", authenticateToken, async (req: any, res) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, readAt: null },
      data: { readAt: new Date() }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

// -------------------------------------------------------------
// My Integrations & Timesheets Dashboard Endpoints (added)
// -------------------------------------------------------------

// GET /api/integrations - Fetch integration catalog for logged-in user
app.get("/api/integrations", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const providers = [
      "GITHUB", "JIRA", "GOOGLE_CALENDAR", "LINEAR",
      "SLACK", "GITLAB", "FIGMA", "NOTION",
      "MICROSOFT_TEAMS", "GOOGLE_DRIVE", "TRELLO", "ASANA"
    ];
    
    // Get existing integrations
    const existing = await prisma.userIntegration.findMany({
      where: { userId }
    });
    
    const existingProviders = existing.map(e => e.provider);
    const missingProviders = providers.filter(p => !existingProviders.includes(p));
    
    // Create missing default integration settings
    if (missingProviders.length > 0) {
      const dataToCreate = missingProviders.map(p => ({
        userId,
        provider: p,
        username: p === "GITHUB" ? "@tawfeeqbahur" : 
                  p === "JIRA" ? "tawfeeq.jira.corp" : 
                  p === "GOOGLE_CALENDAR" ? "tawfeeq@endocore.io" : 
                  p === "LINEAR" ? "workspace/engineering" : 
                  p === "SLACK" ? "endocore-team.slack.com" : 
                  p === "GITLAB" ? "gitlab.com/tawfeeq" : 
                  p === "FIGMA" ? "Tawfeeq Bahur (Personal)" : 
                  p === "NOTION" ? "EndoCore Wiki Workspace" : 
                  p === "MICROSOFT_TEAMS" ? "tawfeeq.b@endocore.microsoft.com" : 
                  p === "GOOGLE_DRIVE" ? "drive.google.com/endocore-drive" : 
                  p === "TRELLO" ? "trello.com/tawfeeq" : 
                  "asana.com/endocore-workspace",
        isConnected: ["GITHUB", "JIRA", "GOOGLE_CALENDAR"].includes(p), // Connect top 3 by default, matching Image 1
        autoPauseCalendar: p === "GOOGLE_CALENDAR" ? true : false
      }));
      
      await prisma.userIntegration.createMany({
        data: dataToCreate
      });
    }
    
    const allIntegrations = await prisma.userIntegration.findMany({
      where: { userId }
    });
    
    res.json(allIntegrations);
  } catch (error: any) {
    console.error("Error fetching integrations:", error);
    const providers = [
      "GITHUB", "JIRA", "GOOGLE_CALENDAR", "LINEAR",
      "SLACK", "GITLAB", "FIGMA", "NOTION",
      "MICROSOFT_TEAMS", "GOOGLE_DRIVE", "TRELLO", "ASANA"
    ];
    const fallback = providers.map((p, idx) => ({
      id: `fallback-${idx}`,
      userId: req.user?.id || "demo",
      provider: p,
      username: p === "GITHUB" ? "@tawfeeqbahur" : 
                p === "JIRA" ? "tawfeeq.jira.corp" : 
                p === "GOOGLE_CALENDAR" ? "tawfeeq@endocore.io" : 
                p === "LINEAR" ? "workspace/engineering" : 
                p === "SLACK" ? "endocore-team.slack.com" : 
                p === "GITLAB" ? "gitlab.com/tawfeeq" : 
                p === "FIGMA" ? "Tawfeeq Bahur (Personal)" : 
                p === "NOTION" ? "EndoCore Wiki Workspace" : 
                p === "MICROSOFT_TEAMS" ? "tawfeeq.b@endocore.microsoft.com" : 
                p === "GOOGLE_DRIVE" ? "drive.google.com/endocore-drive" : 
                p === "TRELLO" ? "trello.com/tawfeeq" : 
                "asana.com/endocore-workspace",
      isConnected: ["GITHUB", "JIRA", "GOOGLE_CALENDAR"].includes(p),
      autoPauseCalendar: p === "GOOGLE_CALENDAR",
      lastSyncedAt: new Date().toISOString()
    }));
    res.json(fallback);
  }
});

// POST /api/integrations/:provider/connect - Connect an integration
app.post("/api/integrations/:provider/connect", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    const { username } = req.body;
    
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toUpperCase()
        }
      }
    });
    
    if (!integration) {
      return res.status(404).json({ error: "Integration settings not found" });
    }
    
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        isConnected: true,
        username: username || integration.username,
        lastSyncedAt: new Date()
      }
    });
    
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/integrations/:provider/disconnect - Disconnect an integration
app.post("/api/integrations/:provider/disconnect", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toUpperCase()
        }
      }
    });
    
    if (!integration) {
      return res.status(404).json({ error: "Integration settings not found" });
    }
    
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        isConnected: false,
        lastSyncedAt: new Date()
      }
    });
    
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/integrations/:provider - Update integration settings (Workspace / Account Identifier, Auto Pause)
app.patch("/api/integrations/:provider", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    const { username, autoPauseCalendar } = req.body;
    
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toUpperCase()
        }
      }
    });
    
    if (!integration) {
      return res.status(404).json({ error: "Integration settings not found" });
    }
    
    const updated = await prisma.userIntegration.update({
      where: { id: integration.id },
      data: {
        username: username !== undefined ? username : integration.username,
        autoPauseCalendar: autoPauseCalendar !== undefined ? autoPauseCalendar : integration.autoPauseCalendar,
        lastSyncedAt: new Date()
      }
    });
    
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/timesheets - Fetch summary metrics and logged entries
app.get("/api/timesheets", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    let timesheets = await prisma.timesheet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    
    // Seed default initial timesheets ONLY for showcase demo account
    if (timesheets.length === 0 && req.user?.email === "showcase@endocore.io") {
      const initial = [
        { clientName: "EndoCore Corp", projectName: "Core Engine API Integration", billableHours: 12.5, nonBillableHours: 2.0, hourlyRate: 150.0, period: "Current Week", status: "Approved" },
        { clientName: "ISHRAE India", projectName: "Website Redesign & Portal", billableHours: 8.0, nonBillableHours: 1.5, hourlyRate: 120.0, period: "Current Week", status: "Approved" },
        { clientName: "Farm2Bag", projectName: "GraphQL Gateway Resolver", billableHours: 6.0, nonBillableHours: 0.5, hourlyRate: 120.0, period: "Last Week", status: "Approved" }
      ];
      
      for (const item of initial) {
        await prisma.timesheet.create({
          data: {
            userId,
            ...item
          }
        });
      }
      
      timesheets = await prisma.timesheet.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
    }
    
    const totalBillableHours = timesheets.reduce((acc, curr) => acc + curr.billableHours, 0);
    const totalNonBillableHours = timesheets.reduce((acc, curr) => acc + curr.nonBillableHours, 0);
    const totalBilledRevenue = timesheets.reduce((acc, curr) => acc + (curr.billableHours * curr.hourlyRate), 0);
    const totalHours = totalBillableHours + totalNonBillableHours;
    const efficiencyIndex = totalHours > 0 ? Math.round((totalBillableHours / totalHours) * 100) : 100;
    const activeProjects = Array.from(new Set(timesheets.map(t => t.projectName))).length;
    
    res.json({
      timesheets,
      summary: {
        totalBillableHours,
        totalBilledRevenue,
        activeProjects,
        efficiencyIndex
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/timesheets - Log a manual billing hours entry
app.post("/api/timesheets", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { clientName, projectName, billableHours, hourlyRate } = req.body;
    
    if (!clientName || !projectName || !billableHours || !hourlyRate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const timesheet = await prisma.timesheet.create({
      data: {
        userId,
        clientName,
        projectName,
        billableHours: parseFloat(billableHours),
        hourlyRate: parseFloat(hourlyRate),
        period: "Current Week",
        status: "Approved"
      }
    });
    
    res.json(timesheet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/commits - Fetch active git history dynamically using shell execution
app.get("/api/commits", authenticateToken, async (req: any, res) => {
  exec("git log -n 5 --pretty=format:\"%h|%an|%ar|%s\"", (error: any, stdout: string, stderr: any) => {
    if (error || stderr) {
      // No mock commits for real users — return empty array
      return res.json([]);
    }
    
    const lines = stdout.split("\n").filter(Boolean);
    const commits = lines.map(line => {
      const parts = line.split("|");
      const hash = parts[0];
      const author = parts[1];
      const time = parts[2];
      const message = parts[3];
      
      const additions = Math.floor(Math.random() * 150) + 5;
      const deletions = Math.floor(Math.random() * 50) + 1;
      return {
        hash: hash || "unknown",
        author: author || "Developer",
        time: time || "recently",
        message: message || "Workstation sync commit",
        stats: `+${additions} -${deletions}`
      };
    });
    
    res.json(commits);
  });
});

// Multi-Agent GenAI Scrum & Welfare Briefing Endpoint
app.get("/api/ai-insights", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const activeRoomName = user.activeGroup || "Engineering Team";

    // Fetch members in user's active workspace room
    const groupMembers = await prisma.user.findMany({
      where: { activeGroup: activeRoomName },
      select: { id: true, name: true, privacyMode: true }
    });

    // Gather current activity state of all room occupants
    const memberActivities = await Promise.all(
      groupMembers.map(async (m) => {
        const act = await getUserActiveActivity(m.id);
        return {
          id: m.id,
          name: m.name,
          app: act.app || "Offline",
          project: act.project || "Workspace Activity",
          durationSeconds: act.durationSeconds || 0,
          privacyMode: m.privacyMode || "Public"
        };
      })
    );

    // Execute Multi-Agent Swarm Pipeline
    const briefing = await generateMultiAgentBriefing(memberActivities);

    // Broadcast real-time briefing to active room via WebSockets
    io.to(activeRoomName).emit("ai:briefing_updated", briefing);

    res.json(briefing);
  } catch (error: any) {
    console.error("Error executing Multi-Agent insights:", error);
    res.status(500).json({ error: error.message || "Failed to generate multi-agent briefing" });
  }
});

// -------------------------------------------------------------
// EndoCore Room System 2.0 API Endpoints
// -------------------------------------------------------------

// 1. Create Room Endpoint (5-Step Wizard with Transaction)
app.post("/api/rooms", authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.user.id;
    const room = await createRoomTransactional({
      ...req.body,
      ownerId
    });
    res.json({ success: true, room });
  } catch (error: any) {
    console.error("Error creating room:", error);
    res.status(400).json({ error: error.message || "Failed to create room" });
  }
});

// 2. List Rooms for Current User
app.get("/api/rooms", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const memberships = await prisma.roomMember.findMany({
      where: { userId, membershipStatus: "ACTIVE" },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true, headline: true }
                }
              }
            }
          }
        }
      }
    });

    const rooms = memberships.map(m => ({
      id: m.room.id,
      name: m.room.name,
      description: m.room.description,
      iconEmoji: m.room.iconEmoji,
      category: m.room.category,
      timezone: m.room.timezone,
      accessMode: m.room.accessMode,
      role: m.role,
      memberCount: m.room.members.length,
      members: m.room.members.map(rm => ({
        id: rm.user.id,
        name: rm.user.name,
        avatarUrl: rm.user.avatarUrl,
        role: rm.role,
        status: rm.membershipStatus
      }))
    }));

    if (req.user?.email === "showcase@endocore.io" && rooms.length === 0) {
      rooms.push({
        id: "demo-room-1",
        name: "Engineering Team",
        description: "High-performance team collaboration and AI-monitored focus workspace.",
        iconEmoji: "🚀",
        category: "Development",
        timezone: "America/New_York",
        accessMode: "INVITE_ONLY",
        role: "OWNER",
        memberCount: 3,
        members: []
      });
      rooms.push({
        id: "demo-room-2",
        name: "Design Guild",
        description: "UI/UX and product design discussions.",
        iconEmoji: "🎨",
        category: "Design",
        timezone: "America/New_York",
        accessMode: "OPEN",
        role: "MEMBER",
        memberCount: 2,
        members: []
      });
    }

    res.json({ success: true, rooms });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list rooms" });
  }
});

// 3. Get Room Details
app.get("/api/rooms/:id", authenticateToken, requireRoomRole(["OWNER", "ADMIN", "MANAGER", "MEMBER", "OBSERVER"]), async (req: any, res) => {
  try {
    const roomId = req.params.id;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, headline: true, username: true }
            }
          }
        },
        teamTargets: {
          where: { effectiveUntil: null },
          orderBy: { effectiveFrom: "desc" },
          take: 1
        },
        memberTargets: {
          where: { effectiveUntil: null }
        }
      }
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json({
      success: true,
      room,
      userRole: req.roomMember.role
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch room details" });
  }
});

// 4. Accept / Versioned Tracking Consent Endpoint
app.post("/api/rooms/:id/consent", authenticateToken, async (req: any, res) => {
  try {
    const roomId = req.params.id;
    const userId = req.user.id;

    const consent = await recordTrackingConsent(roomId, userId);
    res.json({ success: true, consent });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to record tracking consent" });
  }
});

// 5. Update Room Status (Close Group / Complete / Reopen) - Owner/Admin Access
app.post("/api/rooms/:id/status", authenticateToken, async (req: any, res) => {
  try {
    const roomId = req.params.id;
    const { status } = req.body;

    if (!["active", "completed", "closed", "archived"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value. Must be active, completed, closed, or archived." });
    }

    const roomObj = await prisma.room.findUnique({ where: { id: roomId } });
    if (!roomObj) return res.status(404).json({ error: "Room not found" });

    const member = await prisma.roomMember.findFirst({
      where: { roomId, userId: req.user.id }
    });

    const isOwnerOrAdmin = roomObj.ownerId === req.user.id || (member && (member.role === "OWNER" || member.role === "ADMIN"));
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: "Only Room Owner or Admin can update group status." });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { status }
    });

    res.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update room status" });
  }
});

// 6. Task Management Endpoints (Create & Complete Tasks)
app.get("/api/tasks", authenticateToken, async (req: any, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      orderBy: { createdAt: "desc" }
    });
    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks", authenticateToken, async (req: any, res) => {
  try {
    const { title, description, points, roomId } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    let activeRoomId = roomId;
    if (!activeRoomId) {
      const firstRoom = await prisma.room.findFirst();
      activeRoomId = firstRoom?.id;
    }
    if (!activeRoomId) return res.status(400).json({ error: "No active room found" });

    const newTask = await prisma.task.create({
      data: {
        roomId: activeRoomId,
        assigneeId: req.user.id,
        title,
        description: description || "",
        points: points || 1,
        status: "TODO"
      }
    });

    res.json({ success: true, task: newTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tasks/:id/complete", authenticateToken, async (req: any, res) => {
  try {
    const taskId = req.params.id;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    // Auto-update linked goal progress if goal exists
    try {
      const goals = await (prisma as any).goal?.findMany({
        where: { userId: req.user.id, goalType: "TASKS_COMPLETED" }
      });
      if (goals) {
        for (const goal of goals) {
          await (prisma as any).goal?.update({
            where: { id: goal.id },
            data: { currentProgress: { increment: 1 } }
          });
        }
      }
    } catch (gErr) {
      console.error("Goal progress error:", gErr);
    }

    res.json({ success: true, task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/user", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

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

    if (req.user?.email === "showcase@endocore.io") {
      (formatted as any).timeline = [
        { time: "09:00 – 10:20", date: "Today", app: "VS Code & Antigravity IDE", project: "EndoCore Workspace", duration: "80 mins" },
        { time: "10:20 – 10:35", date: "Today", app: "Resting", project: "Planned Break", duration: "15 mins" },
        { time: "10:35 – 12:00", date: "Today", app: "Terminal & Git", project: "Deployment Pipeline", duration: "85 mins" },
        { time: "13:00 – 14:45", date: "Today", app: "Figma", project: "UI Mockups", duration: "105 mins" }
      ];
      formatted.productivityGoal = 6;
      (formatted as any).focusScore = 78;
      (formatted as any).todayFocusTime = "4h 20m";
      formatted.activeGroup = "Engineering Team";
      formatted.deviceConnected = "WS-WORKSTATION-11";
    }

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Profile Avatar
app.post("/api/user/avatar", authenticateToken, upload.single("avatar"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const myId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    const updatedUser = await prisma.user.update({
      where: { id: myId },
      data: { avatarUrl }
    });
    
    // Broadcast activity to all peers so their UI updates
    await broadcastActivityUpdate(updatedUser.id);
    
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
app.post("/api/user/settings", authenticateToken, async (req: any, res) => {
  try {
    const { 
      name, avatarUrl, activeGroup, privacyMode, deviceConnected, productivityGoal, 
      customStatus, theme, notifications, status, username, headline,
      presenceVisibility, activityVisibility, showDailyFocusTime, showCurrentRoom,
      allowFocusInvites, allowRoomInvites, allowJoinRequests
    } = req.body;
    
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
    
    if (username !== undefined) updateData.username = username;
    if (headline !== undefined) updateData.headline = headline;
    if (presenceVisibility !== undefined) updateData.presenceVisibility = presenceVisibility;
    if (activityVisibility !== undefined) updateData.activityVisibility = activityVisibility;
    if (showDailyFocusTime !== undefined) updateData.showDailyFocusTime = showDailyFocusTime;
    if (showCurrentRoom !== undefined) updateData.showCurrentRoom = showCurrentRoom;
    if (allowFocusInvites !== undefined) updateData.allowFocusInvites = allowFocusInvites;
    if (allowRoomInvites !== undefined) updateData.allowRoomInvites = allowRoomInvites;
    if (allowJoinRequests !== undefined) updateData.allowJoinRequests = allowJoinRequests;
    
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

// ════════════════════════════════════════════════════════════
// MULTI-DEVICE IDENTITY & PAIRING SYSTEM ENDPOINTS
// ════════════════════════════════════════════════════════════

// GET /api/devices - Fetch all active devices for logged-in user
app.get("/api/devices", authenticateToken, async (req: any, res) => {
  try {
    const devices = await prisma.userDevice.findMany({
      where: {
        userId: req.user.id,
        enabled: true
      },
      orderBy: { lastSeenAt: "desc" }
    });

    const formattedDevices = devices.map(d => {
      let type: "desktop" | "laptop" | "mobile" | "tablet" | "monitor" = "desktop";
      const plt = (d.platform || "").toUpperCase();
      if (plt === "ANDROID" || plt === "IOS" || (d.deviceName || "").toLowerCase().includes("mobile") || (d.deviceName || "").toLowerCase().includes("pixel") || (d.deviceName || "").toLowerCase().includes("iphone")) {
        type = "mobile";
      } else if ((d.deviceName || "").toLowerCase().includes("ipad") || (d.deviceName || "").toLowerCase().includes("tablet")) {
        type = "tablet";
      } else if (plt === "MACOS" || (d.deviceName || "").toLowerCase().includes("macbook") || (d.deviceName || "").toLowerCase().includes("laptop")) {
        type = "laptop";
      } else if ((d.deviceName || "").toLowerCase().includes("monitor") || (d.deviceName || "").toLowerCase().includes("display")) {
        type = "monitor";
      }

      const diffSec = Math.floor((Date.now() - new Date(d.lastSeenAt).getTime()) / 1000);
      let status: "active" | "online" | "idle" | "display_active" = "online";
      let lastSync = `${diffSec}s ago`;

      if (diffSec < 30) {
        status = "active";
        lastSync = "Live (Current Session)";
      } else if (diffSec < 300) {
        status = "online";
        lastSync = `Synced ${Math.floor(diffSec / 60)}m ago`;
      } else {
        status = "idle";
        lastSync = `Last seen ${Math.floor(diffSec / 60)}m ago`;
      }

      return {
        id: d.id,
        name: d.deviceName || "Workstation Node",
        type,
        os: d.platform,
        status,
        lastSync,
        lastSeenAt: d.lastSeenAt
      };
    });

    // Provide default demo devices ONLY for showcase presentation account
    if (req.user?.email === "showcase@endocore.io" && formattedDevices.length < 2) {
      const demoDevices = [
        ...formattedDevices,
        { id: "dev-1", name: "WS-WORKSTATION-11 (Windows PC)", type: "desktop", os: "WINDOWS 11", status: "active", lastSync: "Live (Current Machine)" },
        { id: "dev-2", name: "Pixel 8 Pro (Mobile Browser)", type: "mobile", os: "ANDROID 14", status: "online", lastSync: "Synced 15s ago" },
        { id: "dev-3", name: "MacBook Pro 16\" (M3 Max)", type: "laptop", os: "MACOS Sequoia", status: "idle", lastSync: "Synced 12m ago" },
        { id: "dev-4", name: "Dell UltraSharp U2723QE (Dual Monitor)", type: "monitor", os: "3840x2160 @ 60Hz", status: "display_active", lastSync: "Monitor Active" },
        { id: "dev-5", name: "iPad Pro 12.9\" (Tablet Companion)", type: "tablet", os: "IOS 17.5", status: "online", lastSync: "Synced 2m ago" }
      ];
      return res.json({ devices: demoDevices });
    }

    res.json({ devices: formattedDevices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/devices/register - Auto-register or heartbeat device
app.post("/api/devices/register", authenticateToken, async (req: any, res) => {
  try {
    const { deviceName, platform, pushToken } = req.body;
    const tokenKey = pushToken || `token_${req.user.id}_${(deviceName || "browser").replace(/\s+/g, "_")}`;

    const device = await prisma.userDevice.upsert({
      where: { pushToken: tokenKey },
      update: {
        deviceName: deviceName || "Web Workstation Browser",
        platform: (platform || "WEB").toUpperCase() as any,
        enabled: true,
        lastSeenAt: new Date()
      },
      create: {
        userId: req.user.id,
        pushToken: tokenKey,
        deviceName: deviceName || "Web Workstation Browser",
        platform: (platform || "WEB").toUpperCase() as any,
        enabled: true,
        lastSeenAt: new Date()
      }
    });

    res.json({ success: true, device });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/devices/disconnect - Revoke or disconnect a device session
app.post("/api/devices/disconnect", authenticateToken, async (req: any, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    // Revoke device if in database
    try {
      await prisma.userDevice.update({
        where: { id: deviceId },
        data: { enabled: false, revokedAt: new Date() }
      });
    } catch (e) {
      // Device might be a fallback demo device ID
    }

    res.json({ success: true, message: "Device disconnected successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Your current activity status
app.get("/api/my-activity", authenticateToken, async (req: any, res) => {
  try {
    const activity = await getUserActiveActivity(req.user.id);
    activity.lastHeartbeat = Date.now();
    await setUserActiveActivity(req.user.id, activity);

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

        // Auto-update goals (Commented out: Goal model and goalService do not exist in current schema/imports)
        /*
        try {
          const userGoals = await (prisma as any).goal?.findMany({
            where: { userId: req.user.id, goalType: 'FOCUS_TIME' }
          });
          if (userGoals) {
            for (const goal of userGoals) {
              if (['NOT_STARTED', 'ON_TRACK', 'AT_RISK'].includes(goal.status)) {
                await (prisma as any).goal?.update({
                  where: { id: goal.id },
                  data: { currentProgress: { increment: 25 / 60 } }
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to update goal progress", e);
        }
        */
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

      // 2. Set the current activity to the new app/project
      activity.app = selectedApp !== undefined ? selectedApp : activity.app;
      activity.project = sanitizedProject !== undefined ? sanitizedProject : activity.project;
      if (resetTimer === true) {
        activity.durationSeconds = 0;
        activity.startedAt = Date.now();
      }
      activity.isPaused = isPaused !== undefined ? isPaused : (togglePause !== undefined ? togglePause : (wasOffline ? false : activity.isPaused));
      if (isPaused === false || req.body.isManual) {
        activity.isPaused = false;
        activity.isManual = true;
      }
      activity.lastHeartbeat = Date.now();

      await setUserActiveActivity(req.user.id, activity);

      broadcastActivityUpdate(req.user.id);

      if (currentUser) {
        await syncPresenceToRedis(req.user.id, activity, currentUser.status, currentUser.activeGroup);
      }

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

    if (currentUser) {
      await syncPresenceToRedis(req.user.id, activity, currentUser.status, currentUser.activeGroup);
    }

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

        const realTasksCompleted = await prisma.task.count({
          where: { assigneeId: u.id, status: "COMPLETED" }
        });
        const realFocusSessions = await prisma.focusSession.count({
          where: { userId: u.id, completed: true }
        });
        const tasksCompleted = realTasksCompleted + realFocusSessions;
        const taskTarget = u.productivityGoal || 5;

        return {
          id: u.id,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
          status: u.status,
          currentActivity: maskedActivity,
          todayFocusTime,
          focusScore,
          tasksCompleted,
          taskTarget,
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

    if (req.user?.email === "showcase@endocore.io") {
      friendList.forEach((f: any, index: number) => {
        if (index === 0) {
          f.todayFocusTime = "6h";
          f.focusScore = 91;
          f.currentActivity = { app: "Figma", project: "UI Design", startedAt: Date.now(), durationText: "1h 12m" };
        } else if (index === 1) {
          f.todayFocusTime = "5.5h";
          f.focusScore = 85;
          f.currentActivity = { app: "Slack", project: "Standup", startedAt: Date.now(), durationText: "14m" };
        } else {
          f.todayFocusTime = "3.8h";
          f.focusScore = 65;
          f.currentActivity = { app: "VS Code", project: "Backend API", startedAt: Date.now(), durationText: "45m" };
        }
      });
    }

    res.json(friendList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Analytics Data
app.get("/api/analytics", authenticateToken, async (req: any, res: any) => {
  console.log(">>> /api/analytics (V1) Hit! Path:", req.path);
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

    const payload: any = {
      appBreakdown,
      focusScoreHistory,
      comparisonStats,
      weeklyTotalHours,
      weeklyProdGoalAchieved,
      averageDailyFocus,
      dailySummaries
    };

    if (req.user?.email === "showcase@endocore.io") {
      payload.appBreakdown = [
        { name: "VS Code", value: 165, color: "#2563EB" },
        { name: "Figma", value: 105, color: "#EC4899" },
        { name: "Chrome", value: 45, color: "#10B981" },
        { name: "Terminal", value: 85, color: "#6B7280" },
        { name: "Slack", value: 20, color: "#F59E0B" }
      ];
      payload.focusScoreHistory = [
        { day: "Sun", score: 0, ideal: 80 },
        { day: "Mon", score: 85, ideal: 80 },
        { day: "Tue", score: 92, ideal: 80 },
        { day: "Wed", score: 88, ideal: 80 },
        { day: "Thu", score: 95, ideal: 80 },
        { day: "Fri", score: 78, ideal: 80 },
        { day: "Sat", score: 0, ideal: 80 }
      ];
      payload.comparisonStats = [
        { name: "Tawfeeq", hours: 4.3, score: 78 },
        { name: "Alex", hours: 6.2, score: 91 },
        { name: "Sarah", hours: 5.5, score: 85 },
        { name: "Mike", hours: 3.8, score: 65 }
      ];
      payload.weeklyTotalHours = 32.5;
      payload.weeklyProdGoalAchieved = 92;
      payload.averageDailyFocus = 6.5;

      const mockSummaries = [];
      const today = new Date();
      for (let i = 0; i < 180; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          mockSummaries.push({
            date: d.toISOString().split("T")[0],
            totalFocusSeconds: Math.floor(Math.random() * 14400) + 14400,
            productivityScore: Math.floor(Math.random() * 30) + 70
          });
        }
      }
      payload.dailySummaries = mockSummaries;
    }

    res.json(payload);
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
app.get("/api/groups", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: { members: true }
        }
      }
    });
    
    const formattedPromises = userGroups.map(async (m: any) => {
      const g = m.group;
      const memberIds = g.members.map((gm: any) => gm.userId);

      // Get real online count
      const onlineMembersCount = (await Promise.all(
        memberIds.map(async (uid: string) => {
          const presence = await getPresence(uid);
          return presence && presence.state !== "offline" ? 1 : 0;
        })
      )).reduce((a: number, b: number) => a + b, 0);

      // Get real total focus seconds from ActivityLog today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const logs = await prisma.activityLog.findMany({
        where: {
          userId: { in: memberIds },
          timestamp: { gte: todayStart }
        },
        orderBy: { timestamp: "desc" }
      });

      let totalSeconds = 0;
      logs.forEach(log => {
        totalSeconds += parseDurationText(log.durationText);
      });

      const hoursNum = parseFloat((totalSeconds / 3600).toFixed(0));
      const focusHours = `${hoursNum}h`;
      const tasksCompleted = `${logs.length} / ${Math.max(10, logs.length + 15)}`;

      // Latest activity log
      const latestLog = logs[0];
      const recentActivity = latestLog ? `${latestLog.app} active` : "Workspace created";
      const recentTime = latestLog ? "Just now" : "";

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        members: memberIds,
        createdAt: g.createdAt.toISOString(),
        onlineCount: onlineMembersCount,
        focusHours,
        tasksCompleted,
        aiStatus: g.accessType === "INVITE_ONLY" ? "COACH" : "ON",
        recentActivity,
        recentTime
      };
    });

    const formatted = await Promise.all(formattedPromises);
    
    if (req.user?.email === "showcase@endocore.io" && formatted.length === 0) {
      formatted.push({
        id: "demo-group-1",
        name: "Engineering Team",
        description: "Collaborating workspace and focus channel for the engineering team.",
        members: [userId, "mock-1", "mock-2"],
        createdAt: new Date().toISOString(),
        onlineCount: 3,
        focusHours: "42h",
        tasksCompleted: "18 / 40",
        aiStatus: "ON",
        recentActivity: "Tawfeeq started focus",
        recentTime: "4m ago"
      });
      formatted.push({
        id: "demo-group-2",
        name: "Design Guild",
        description: "UI/UX and product design discussions.",
        members: [userId, "mock-3"],
        createdAt: new Date().toISOString(),
        onlineCount: 2,
        focusHours: "31h",
        tasksCompleted: "12 / 25",
        aiStatus: "ON",
        recentActivity: "Ravi uploaded Figma file",
        recentTime: "11m ago"
      });
    }
    
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

// Get Groups Directory (Discoverable rooms the user is NOT a member of)
app.get("/api/groups/directory", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q as string || "";

    // Find all groups the user is ALREADY a member of
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const joinedGroupIds = userMemberships.map((m: any) => m.groupId);

    // Find groups they are NOT in, filtering by public/approval access types
    const availableGroups = await prisma.group.findMany({
      where: {
        id: { notIn: joinedGroupIds },
        OR: [
          { name: { contains: query } },
          { description: { contains: query } }
        ]
      },
      include: {
        _count: {
          select: { members: true }
        }
      },
      take: 20
    });

    const formatted = availableGroups.map((g: any) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
      accessType: g.accessType || "PUBLIC",
      createdAt: g.createdAt.toISOString()
    }));
    
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Join a Group from Directory
app.post("/api/groups/:id/join", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) return res.status(404).json({ error: "Group not found" });

    // Check if already member
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } }
    });

    if (existing) {
      return res.status(400).json({ error: "Already a member of this group" });
    }

    // Join Group directly (Assuming all are PUBLIC for this phase, or handle REQUIRE_APPROVAL via join requests)
    if (group.accessType === "REQUIRE_APPROVAL") {
      await prisma.groupJoinRequest.create({
        data: {
          userId,
          groupId,
          status: "PENDING"
        }
      });
      return res.json({ success: true, status: "pending", message: "Join request submitted." });
    } else {
      await prisma.groupMember.create({
        data: {
          userId,
          groupId,
          role: "member"
        }
      });
      
      // Auto-set as active group if user has none
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && (!user.activeGroup || user.activeGroup === "")) {
        await prisma.user.update({
          where: { id: userId },
          data: { activeGroup: group.name }
        });
      }

      return res.json({ success: true, status: "joined", message: "Successfully joined the group." });
    }
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

// -------------------------------------------------------------
// Connections, Blocks, and Focus Challenges API Endpoints
// -------------------------------------------------------------

// Get connections (friends, incoming, outgoing)
app.get("/api/connections", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;

    // Get block lists (exclude blocked users)
    const myBlocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: myId },
          { blockedId: myId }
        ]
      }
    });
    const blockedUserIds = new Set(
      myBlocks.map(b => b.blockerId === myId ? b.blockedId : b.blockerId)
    );

    // Get all connection records
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userAId: myId },
          { userBId: myId }
        ]
      },
      include: {
        userA: true,
        userB: true
      }
    });

    const friends: any[] = [];
    const incoming: any[] = [];
    const outgoing: any[] = [];

    const todayStr = new Date().toISOString().split("T")[0];

    for (const conn of connections) {
      const otherUser = conn.userAId === myId ? conn.userB : conn.userA;
      
      // Skip if blocked
      if (blockedUserIds.has(otherUser.id)) continue;

      if (conn.status === "ACCEPTED") {
        // Enforce presence visibility privacy preference
        const presenceVisibility = otherUser.presenceVisibility || "connections";
        let isPresenceVisible = false;

        if (presenceVisibility === "everyone" || presenceVisibility === "connections") {
          isPresenceVisible = true;
        } else if (presenceVisibility === "room_members") {
          const sharedGroupsCount = await prisma.groupMember.count({
            where: {
              userId: myId,
              groupId: {
                in: (await prisma.groupMember.findMany({
                  where: { userId: otherUser.id },
                  select: { groupId: true }
                })).map(gm => gm.groupId)
              }
            }
          });
          isPresenceVisible = sharedGroupsCount > 0;
        }

        let presence: any = { state: "offline" };
        if (isPresenceVisible) {
          const rawPresence = await getPresence(otherUser.id);
          if (rawPresence && rawPresence.state !== "offline") {
            const activityVisibility = otherUser.activityVisibility || "status_only";
            presence = {
              state: rawPresence.state,
              focusStartedAt: rawPresence.focusStartedAt,
              lastSeenAt: rawPresence.focusStartedAt
            };

            if (activityVisibility === "app_category" || activityVisibility === "app_name") {
              presence.appCategory = rawPresence.appCategory;
            }
            if (activityVisibility === "app_name") {
              presence.appName = rawPresence.appName;
            }
          }
        }

        // Enforce showDailyFocusTime
        let focusMinutesToday = undefined;
        if (otherUser.showDailyFocusTime) {
          const dailySummary = await prisma.dailySummary.findUnique({
            where: {
              userId_date: {
                userId: otherUser.id,
                date: todayStr
              }
            }
          });
          let activeSeconds = 0;
          const activeAct = await getUserActiveActivity(otherUser.id);
          if (activeAct && activeAct.app !== "Offline" && !activeAct.isPaused) {
            activeSeconds = activeAct.durationSeconds;
          }
          const totalSeconds = (dailySummary ? dailySummary.totalFocusSeconds : 0) + activeSeconds;
          focusMinutesToday = Math.round(totalSeconds / 60);
        }

        // Enforce showCurrentRoom / visibleRoom check
        let visibleRoom = undefined;
        if (otherUser.showCurrentRoom && presence.state !== "offline" && otherUser.activeGroup) {
          const group = await prisma.group.findUnique({
            where: { name: otherUser.activeGroup }
          });
          if (group && group.accessType !== "PRIVATE") {
            const isMember = await prisma.groupMember.count({
              where: { userId: myId, groupId: group.id }
            }) > 0;

            let accessAction: "open" | "join" | "request" | "ask_for_invite" = "ask_for_invite";
            if (isMember) {
              accessAction = "open";
            } else if (group.accessType === "PUBLIC") {
              accessAction = "join";
            } else if (group.accessType === "REQUIRE_APPROVAL") {
              accessAction = "request";
            } else if (group.accessType === "INVITE_ONLY") {
              accessAction = "ask_for_invite";
            }

            visibleRoom = {
              id: group.id,
              name: group.name,
              accessAction
            };
          }
        }

        friends.push({
          connectionId: conn.id,
          profile: {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username || otherUser.email.split("@")[0],
            email: otherUser.email,
            avatarUrl: otherUser.avatarUrl,
            headline: otherUser.headline
          },
          presence,
          focusMinutesToday,
          visibleRoom
        });
      } else if (conn.status === "PENDING") {
        const item = {
          requestId: conn.id,
          profile: {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username || otherUser.email.split("@")[0],
            email: otherUser.email,
            avatarUrl: otherUser.avatarUrl,
            headline: otherUser.headline
          },
          direction: conn.requestedById === myId ? "outgoing" : "incoming",
          createdAt: conn.createdAt.toISOString()
        };
        if (conn.requestedById === myId) {
          outgoing.push(item);
        } else {
          incoming.push(item);
        }
      }
    }

    res.json({ friends, incoming, outgoing });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
app.get("/api/connections/search", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const query = (req.query.q as string || "").trim().toLowerCase();
    
    if (!query) {
      return res.json([]);
    }

    // Get block lists
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: myId },
          { blockedId: myId }
        ]
      }
    });
    const blockedUserIds = new Set(
      blocks.map(b => b.blockerId === myId ? b.blockedId : b.blockerId)
    );

    // Search matches by display name, username, or email substring
    const matchingUsers = await prisma.user.findMany({
      where: {
        id: { not: myId },
        OR: [
          { name: { contains: query } },
          { username: { contains: query } },
          { email: { contains: query } }
        ]
      },
      take: 20
    });

    const searchResults: any[] = [];

    for (const u of matchingUsers) {
      if (blockedUserIds.has(u.id)) continue;

      const pairKey = [myId, u.id].sort().join(":");
      const conn = await prisma.connection.findUnique({
        where: { pairKey }
      });

      let connectionStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none";
      let requestId = undefined;

      if (conn) {
        requestId = conn.id;
        if (conn.status === "ACCEPTED") {
          connectionStatus = "friends";
        } else if (conn.status === "PENDING") {
          if (conn.requestedById === myId) {
            connectionStatus = "pending_sent";
          } else {
            connectionStatus = "pending_received";
          }
        }
      }

      searchResults.push({
        id: u.id,
        name: u.name,
        username: u.username || u.email.split("@")[0],
        email: u.email,
        avatarUrl: u.avatarUrl,
        headline: u.headline,
        connectionStatus,
        requestId
      });
    }

    res.json(searchResults);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send connection request
app.post("/api/connection-requests", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId || targetUserId === myId) {
      return res.status(400).json({ error: "Invalid target user ID" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if blocked
    const blockExists = await prisma.userBlock.count({
      where: {
        OR: [
          { blockerId: myId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: myId }
        ]
      }
    }) > 0;

    if (blockExists) {
      return res.status(403).json({ error: "Cannot send request: blocked connection" });
    }

    const pairKey = [myId, targetUserId].sort().join(":");
    const existing = await prisma.connection.findUnique({
      where: { pairKey }
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return res.status(400).json({ error: "Already connected" });
      } else if (existing.status === "PENDING") {
        return res.status(400).json({ error: "Request already pending" });
      }
    }

    const newConnection = await prisma.connection.create({
      data: {
        pairKey,
        userAId: pairKey.split(":")[0],
        userBId: pairKey.split(":")[1],
        requestedById: myId,
        status: "PENDING"
      }
    });

    // Notify target via sockets in real-time
    const myProfile = await prisma.user.findUnique({ where: { id: myId } });
    if (myProfile) {
      io.to("user:" + targetUserId).emit("connection:received", {
        requestId: newConnection.id,
        profile: {
          id: myId,
          name: myProfile.name,
          username: myProfile.username,
          avatarUrl: myProfile.avatarUrl,
          headline: myProfile.headline
        },
        direction: "incoming",
        createdAt: newConnection.createdAt.toISOString()
      });
    }

    res.json({ success: true, connection: newConnection });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept/Decline request
app.patch("/api/connection-requests/:requestId", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { requestId } = req.params;
    const { action } = req.body;

    if (action !== "accept" && action !== "decline") {
      return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
    }

    const conn = await prisma.connection.findUnique({
      where: { id: requestId }
    });

    if (!conn || conn.status !== "PENDING") {
      return res.status(404).json({ error: "Connection request not found or not pending" });
    }

    if (action === "accept" && conn.requestedById === myId) {
      return res.status(403).json({ error: "Cannot accept your own outgoing request" });
    }

    if (action === "accept") {
      const updated = await prisma.connection.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          respondedAt: new Date()
        }
      });

      io.to("user:" + conn.requestedById).emit("connection:accepted", {
        connectionId: conn.id,
        friendId: myId
      });

      return res.json({ success: true, connection: updated });
    } else {
      await prisma.connection.delete({
        where: { id: requestId }
      });

      io.to("user:" + conn.requestedById).emit("connection:declined", {
        requestId: conn.id
      });

      return res.json({ success: true, message: "Request declined" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel outgoing request
app.delete("/api/connection-requests/:requestId", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { requestId } = req.params;

    const conn = await prisma.connection.findUnique({
      where: { id: requestId }
    });

    if (!conn || conn.status !== "PENDING") {
      return res.status(404).json({ error: "Pending request not found" });
    }

    if (conn.requestedById !== myId) {
      return res.status(403).json({ error: "Unauthorized to cancel this request" });
    }

    await prisma.connection.delete({
      where: { id: requestId }
    });

    const targetUserId = conn.userAId === myId ? conn.userBId : conn.userAId;
    io.to("user:" + targetUserId).emit("connection:canceled", {
      requestId: conn.id
    });

    res.json({ success: true, message: "Request canceled successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove connection (unfriend)
app.delete("/api/connections/:connectionId", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { connectionId } = req.params;

    const conn = await prisma.connection.findUnique({
      where: { id: connectionId }
    });

    if (!conn || conn.status !== "ACCEPTED") {
      return res.status(404).json({ error: "Friend connection not found" });
    }

    if (conn.userAId !== myId && conn.userBId !== myId) {
      return res.status(403).json({ error: "Unauthorized to remove this connection" });
    }

    await prisma.connection.delete({
      where: { id: connectionId }
    });

    const targetUserId = conn.userAId === myId ? conn.userBId : conn.userAId;
    io.to("user:" + targetUserId).emit("connection:removed", {
      connectionId: conn.id,
      friendId: myId
    });

    res.json({ success: true, message: "Connection removed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Block user
app.post("/api/users/:userId/block", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const targetUserId = req.params.userId;

    if (myId === targetUserId) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: myId,
          blockedId: targetUserId
        }
      },
      create: {
        blockerId: myId,
        blockedId: targetUserId
      },
      update: {}
    });

    const pairKey = [myId, targetUserId].sort().join(":");
    await prisma.connection.deleteMany({
      where: { pairKey }
    });

    io.to("user:" + targetUserId).emit("user:blocked", { blockerId: myId });

    res.json({ success: true, message: "User blocked successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock user
app.delete("/api/users/:userId/block", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const targetUserId = req.params.userId;

    await prisma.userBlock.deleteMany({
      where: {
        blockerId: myId,
        blockedId: targetUserId
      }
    });

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Focus Challenge (Invite)
app.post("/api/focus-challenges", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { invitedUserId, durationMinutes, challengeMode, creatorObjective } = req.body;

    if (!invitedUserId || myId === invitedUserId) {
      return res.status(400).json({ error: "Invalid target user" });
    }

    const pairKey = [myId, invitedUserId].sort().join(":");
    const conn = await prisma.connection.findUnique({
      where: { pairKey }
    });

    if (!conn || conn.status !== "ACCEPTED") {
      return res.status(403).json({ error: "Must be friends to send focus challenges" });
    }

    const blockExists = await prisma.userBlock.count({
      where: { blockerId: invitedUserId, blockedId: myId }
    }) > 0;
    if (blockExists) {
      return res.status(403).json({ error: "Cannot invite this user" });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const newChallenge = await prisma.focusChallenge.create({
      data: {
        createdById: myId,
        invitedUserId,
        durationMinutes: durationMinutes || 25,
        challengeMode: challengeMode || "co_focus",
        creatorObjective: creatorObjective || "",
        status: "PENDING",
        expiresAt
      },
      include: {
        creator: true,
        invited: true
      }
    });

    const myProfile = await prisma.user.findUnique({ where: { id: myId } });

    io.to("user:" + invitedUserId).emit("challenge:received", {
      challengeId: newChallenge.id,
      creator: {
        id: myId,
        name: myProfile?.name || "Friend",
        username: myProfile?.username || "friend",
        avatarUrl: myProfile?.avatarUrl,
        headline: myProfile?.headline
      },
      durationMinutes: newChallenge.durationMinutes,
      challengeMode: newChallenge.challengeMode,
      creatorObjective: newChallenge.creatorObjective,
      expiresAt: expiresAt.toISOString()
    });

    res.json({ success: true, challenge: newChallenge });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Respond to Focus Challenge
app.patch("/api/focus-challenges/:challengeId/respond", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { challengeId } = req.params;
    const { action, invitedObjective } = req.body;

    const challenge = await prisma.focusChallenge.findUnique({
      where: { id: challengeId },
      include: { creator: true, invited: true }
    });

    if (!challenge || challenge.status !== "PENDING") {
      return res.status(404).json({ error: "Challenge not found or not pending" });
    }

    if (challenge.invitedUserId !== myId) {
      return res.status(403).json({ error: "Unauthorized to respond to this challenge" });
    }

    if (new Date() > challenge.expiresAt) {
      await prisma.focusChallenge.update({
        where: { id: challengeId },
        data: { status: "EXPIRED" }
      });
      return res.status(400).json({ error: "Challenge has expired" });
    }

    if (action === "accept") {
      const startAt = new Date();
      const endAt = new Date(Date.now() + challenge.durationMinutes * 60 * 1000);

      const updated = await prisma.focusChallenge.update({
        where: { id: challengeId },
        data: {
          status: "ACTIVE",
          respondedAt: new Date(),
          startAt,
          endAt,
          invitedObjective: invitedObjective || ""
        }
      });

      const startPayload = {
        challengeId: challenge.id,
        challengeMode: challenge.challengeMode,
        durationMinutes: challenge.durationMinutes,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        creatorObjective: challenge.creatorObjective,
        invitedObjective: updated.invitedObjective,
        creator: {
          id: challenge.creator.id,
          name: challenge.creator.name,
          username: challenge.creator.username
        },
        invited: {
          id: challenge.invited.id,
          name: challenge.invited.name,
          username: challenge.invited.username
        }
      };

      io.to("user:" + challenge.createdById).emit("challenge:started", startPayload);
      io.to("user:" + challenge.invitedUserId).emit("challenge:started", startPayload);

      res.json({ success: true, challenge: startPayload });
    } else {
      const updated = await prisma.focusChallenge.update({
        where: { id: challengeId },
        data: {
          status: "DECLINED",
          respondedAt: new Date()
        }
      });

      io.to("user:" + challenge.createdById).emit("challenge:responded", {
        challengeId: challenge.id,
        action: "decline"
      });

      res.json({ success: true, challenge: updated });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel active or pending challenge
app.post("/api/focus-challenges/:challengeId/cancel", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { challengeId } = req.params;

    const challenge = await prisma.focusChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.createdById !== myId && challenge.invitedUserId !== myId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.focusChallenge.update({
      where: { id: challengeId },
      data: { status: "CANCELED" }
    });

    const otherUserId = challenge.createdById === myId ? challenge.invitedUserId : challenge.createdById;
    io.to("user:" + otherUserId).emit("challenge:canceled", { challengeId: challenge.id });

    res.json({ success: true, challenge: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete active challenge
app.post("/api/focus-challenges/:challengeId/complete", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { challengeId } = req.params;

    const challenge = await prisma.focusChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.createdById !== myId && challenge.invitedUserId !== myId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const updated = await prisma.focusChallenge.update({
      where: { id: challengeId },
      data: { 
        status: "COMPLETED",
        completedAt: new Date()
      }
    });

    const otherUserId = challenge.createdById === myId ? challenge.invitedUserId : challenge.createdById;
    io.to("user:" + otherUserId).emit("challenge:completed", { challengeId: challenge.id, winnerId: myId });

    res.json({ success: true, challenge: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Invite connection to a private/invite-only room
app.post("/api/rooms/:roomId/invitations", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { roomId } = req.params;
    const { inviteeId } = req.body;

    const isMember = await prisma.groupMember.count({
      where: { userId: myId, groupId: roomId }
    }) > 0;
    if (!isMember) {
      return res.status(403).json({ error: "Unauthorized to invite to this room" });
    }

    const invitation = await prisma.groupInvitation.create({
      data: {
        groupId: roomId,
        inviterId: myId,
        inviteeId,
        status: "PENDING"
      },
      include: {
        group: true,
        inviter: true
      }
    });

    io.to("user:" + inviteeId).emit("room:invited", {
      invitationId: invitation.id,
      roomId,
      roomName: invitation.group.name,
      inviterName: invitation.inviter.name
    });

    res.json({ success: true, invitation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Request to join a REQUIRE_APPROVAL room
app.post("/api/rooms/:roomId/join-requests", authenticateToken, async (req: any, res) => {
  try {
    const myId = req.user.id;
    const { roomId } = req.params;

    const group = await prisma.group.findUnique({ where: { id: roomId } });
    if (!group) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (group.accessType === "PRIVATE") {
      return res.status(403).json({ error: "Cannot request to join a private room" });
    }

    const joinRequest = await prisma.groupJoinRequest.create({
      data: {
        groupId: roomId,
        userId: myId,
        status: "PENDING"
      },
      include: {
        user: true
      }
    });

    const admins = await prisma.groupMember.findMany({
      where: { groupId: roomId, role: "admin" }
    });
    for (const admin of admins) {
      io.to("user:" + admin.userId).emit("room:join-requested", {
        requestId: joinRequest.id,
        roomId,
        roomName: group.name,
        requesterName: joinRequest.user.name
      });
    }

    res.json({ success: true, joinRequest });
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

// 6. Smart Multi-Agent AI Briefing with Google Gemini 3.6 Flash!
let lastAiInsightsPersonal: string = "";
let lastAiTimestampPersonal: number = 0;
let lastAiInsightsRoom: string = "";
let lastAiTimestampRoom: number = 0;

app.get("/api/ai-insights", authenticateToken, async (req: any, res) => {
  const forceRefresh = req.query.force === "true";
  const type = req.query.type || "room"; // 'personal' or 'room'

  // Serve cache if fresh (within 2 minutes)
  if (type === "personal" && lastAiInsightsPersonal && (Date.now() - lastAiTimestampPersonal < 120_000) && !forceRefresh) {
    return res.json({ text: lastAiInsightsPersonal, cached: true });
  }
  if (type === "room" && lastAiInsightsRoom && (Date.now() - lastAiTimestampRoom < 120_000) && !forceRefresh) {
    return res.json({ text: lastAiInsightsRoom, cached: true });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { activityLogs: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const activeGroup = user.activeGroup || "Engineering Team";
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("your-gemini-api-key") || key === "MY_GEMINI_API_KEY") {
      throw new Error("Missing valid GEMINI_API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({ apiKey: key });

    // Fetch live room members activity
    const groupMembers = await prisma.user.findMany({
      where: { activeGroup },
      select: { id: true, name: true, role: true, privacyMode: true }
    });

    const memberActivities = await Promise.all(
      groupMembers.map(async (m) => {
        const act = await getUserActiveActivity(m.id);
        return {
          id: m.id,
          name: m.name,
          role: m.role || "Developer",
          app: act.app || "Offline",
          project: act.project || "Workspace Activity",
          durationSeconds: act.durationSeconds || 0,
          isPaused: act.isPaused || false,
          privacyMode: m.privacyMode || "Public"
        };
      })
    );

    let prompt = "";
    if (type === "personal") {
      const myAct = memberActivities.find(m => m.id === user.id) || { app: "Offline", project: "None", durationSeconds: 0 };
      const hours = (myAct.durationSeconds / 3600).toFixed(1);

      prompt = `You are the EndoCore AI Personal Developer Coach.
User Profile:
- Name: ${user.name} (${user.role})
- Today Focus: ${hours} hours (Goal: ${user.productivityGoal} hours)
- Active App: ${myAct.app}
- Active Project: ${myAct.project}
- Focus Streak: ${user.focusStreak} days

Generate a 100% LLM AI Personal Development Briefing.
Format your output in clean Markdown with:
1. ⚡ **PERSONAL PULSE**: Tailored analysis of performance today.
2. 🎮 **BEST FOCUS WINDOW**: Recommended deep work hours.
3. 💪 **ACTIONABLE NEXT STEP**: Specific task advice.`;
    } else {
      prompt = `You are the EndoCore AI Multi-Agent Scrum Master & Team Architect for channel "${activeGroup}".
Live Team Telemetry:
${JSON.stringify(memberActivities, null, 2)}

Analyze team alignment, active window titles, debugging blockages, and burnout risks.
Output ONLY a single, valid raw JSON object matching this exact schema:
{
  "roomSummary": {
    "status": "Short status indicator (e.g. High Focus Velocity, Extended Debugging, Optimal Sprint Alignment)",
    "productivityPercentage": number (0-100 average goal progress of active members),
    "description": "Comprehensive 2-sentence summary of team focus levels, active projects, and active vs idle counts.",
    "activeCount": number,
    "totalCount": number
  },
  "topPerformer": {
    "name": "Developer with highest focus duration or best deep work streak today",
    "focusTime": "Formatted focus time e.g. 5h 40m",
    "apps": ["VS Code", "Terminal"],
    "score": number (0-100),
    "reason": "Detailed metric-driven reason why they are top performer"
  },
  "needsAttention": {
    "name": "Developer who is idle, offline, or stuck on debugging errors",
    "idleTime": "Formatted idle duration e.g. 45m",
    "reason": "Clear explanation of blockage or context switching risk"
  },
  "recommendations": [
    "Actionable Scrum pairing advice 1",
    "Ergonomic micro-break or sprint pacing advice 2"
  ],
  "prediction": {
    "completionPercentage": number (0-100 estimated sprint task completion),
    "description": "AI estimate on whether team tasks will finish on schedule"
  },
  "summary": "Full AI synthesized Scrum master closing statement summarizing workspace momentum and recommended team pairings."
}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: type === "room" ? "application/json" : undefined
      }
    });

    const outputText = response.text || "{}";

    if (type === "personal") {
      lastAiInsightsPersonal = outputText;
      lastAiTimestampPersonal = Date.now();
    } else {
      lastAiInsightsRoom = outputText;
      lastAiTimestampRoom = Date.now();
    }

    res.json({ text: outputText, cached: false });
  } catch (error: any) {
    console.error("Gemini API Error in /api/ai-insights:", error.message || error);
    res.status(500).json({ error: "Gemini AI execution failed: " + (error.message || "Unknown error") });
  }
});

// --- NEW V2 ANALYTICS ENDPOINTS ---

app.get("/api/analytics/v2/dashboard", authenticateToken, async (req: any, res) => {
  console.log(">>> /api/analytics/v2/dashboard Hit! range=", req.query.range);
  try {
    const range = req.query.range || "30D"; // 7D, 30D, 90D, 1Y
    let days = 30;
    if (range === "7D") days = 7;
    if (range === "90D") days = 90;
    if (range === "1Y") days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0,0,0,0);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const userId = req.user.id;

    let currentLogs;
    try {
      currentLogs = await prisma.activityLog.findMany({
        where: { userId, timestamp: { gte: startDate } }
      });
    } catch (e: any) {
      console.log("Failed at currentLogs");
      throw new Error("currentLogs failed: " + e.message);
    }
    
    let prevLogs;
    try {
      prevLogs = await prisma.activityLog.findMany({
        where: { userId, timestamp: { gte: prevStartDate, lt: startDate } }
      });
    } catch (e: any) {
      console.log("Failed at prevLogs");
      throw new Error("prevLogs failed: " + e.message);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const goalHours = user?.productivityGoal || 6;
    const goalSeconds = goalHours * 3600;

    // Helper to calc KPI
    const calcKpi = (logs: any[], numDays: number) => {
      let totalFocusSeconds = 0;
      let activeDaysSet = new Set();
      let appCounts: Record<string, number> = {};
      
      logs.forEach(log => {
         const sec = parseDurationText(log.durationText);
         totalFocusSeconds += sec;
         const dStr = new Date(log.timestamp).toISOString().split("T")[0];
         if (sec > 60) activeDaysSet.add(dStr);
         
         appCounts[log.app] = (appCounts[log.app] || 0) + sec;
      });

      const activeDays = activeDaysSet.size;
      const expectedTotalSeconds = numDays * goalSeconds;
      const goalAchievement = expectedTotalSeconds > 0 ? Math.min(100, Math.round((totalFocusSeconds / expectedTotalSeconds) * 100)) : 0;
      const avgFocusSession = logs.length > 0 ? Math.round(totalFocusSeconds / logs.length) : 0;
      const productivityScore = Math.min(100, Math.round((totalFocusSeconds / (numDays * goalSeconds)) * 100)) || 0;

      return { totalFocusTime: totalFocusSeconds, activeDays, goalAchievement, avgFocusSession, productivityScore, appCounts };
    };

    let currentKpi = calcKpi(currentLogs, days);
    let prevKpi = calcKpi(prevLogs, days);

    // Heatmap & Trend (group by day)
    const dailyMap: Record<string, any> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      dailyMap[dStr] = { date: dStr, focusSeconds: 0, goalSeconds, sessions: 0 };
    }

    currentLogs.forEach(log => {
      const dStr = new Date(log.timestamp).toISOString().split("T")[0];
      if (dailyMap[dStr]) {
        dailyMap[dStr].focusSeconds += parseDurationText(log.durationText);
        dailyMap[dStr].sessions += 1;
      }
    });

    // Also include today's active tracker if valid
    const currentAct = await getUserActiveActivity(userId);
    if (currentAct && currentAct.app !== "Offline" && !currentAct.isPaused && currentAct.durationSeconds > 0) {
       currentKpi.totalFocusTime += currentAct.durationSeconds;
       const todayStr = new Date().toISOString().split("T")[0];
       if (dailyMap[todayStr]) {
         dailyMap[todayStr].focusSeconds += currentAct.durationSeconds;
         dailyMap[todayStr].sessions += 1;
       }
       currentKpi.appCounts[currentAct.app] = (currentKpi.appCounts[currentAct.app] || 0) + currentAct.durationSeconds;
    }

    let trend = Object.values(dailyMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
    
    trend.forEach((t: any) => {
       t.goalAchieved = Math.min(100, Math.round((t.focusSeconds / t.goalSeconds) * 100)) || 0;
    });

    let timeDistribution = Object.entries(currentKpi.appCounts)
      .map(([category, seconds]) => ({
         category, 
         seconds, 
         percentage: currentKpi.totalFocusTime > 0 ? Math.round(((seconds as number) / currentKpi.totalFocusTime) * 100) : 0,
         color: getCategoryColor(category)
      }))
      .sort((a: any, b: any) => (b.seconds as number) - (a.seconds as number))
      .slice(0, 7);

    // Only inject showcase analytics for the dedicated demo account
    const isShowcaseUser = req.user?.email === "showcase@endocore.io" || user?.username === "showcase";
    if (isShowcaseUser) {
      currentKpi = {
        totalFocusTime: 152280, // 42h 18m
        activeDays: 18,
        goalAchievement: 84,
        avgFocusSession: 3120, // 52m
        productivityScore: 82,
        appCounts: {
          "Antigravity IDE": 94413,
          "Chrome": 36547,
          "Terminal": 18273,
          "Other": 3047
        }
      };

      prevKpi = {
        totalFocusTime: 133345, // ~37h (growth of ~14.2%)
        activeDays: 16, // growth of 2 days
        goalAchievement: 78,
        avgFocusSession: 2700, // 45m
        productivityScore: 76, // growth of ~8%
        appCounts: {}
      };

      // Populate rich daily trend data
      trend = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Weekday: 5 to 8.5 hrs, Weekend: 0 to 2 hrs
        const focusSec = isWeekend 
          ? Math.floor(Math.random() * 7200) 
          : Math.floor(18000 + Math.random() * 12600); // 5h - 8.5h
        
        trend.push({
          date: dStr,
          focusSeconds: focusSec,
          goalSeconds: 21600, // 6h goal
          sessions: isWeekend ? Math.floor(Math.random() * 2) : Math.floor(4 + Math.random() * 4),
          goalAchieved: Math.min(100, Math.round((focusSec / 21600) * 100))
        });
      }

      timeDistribution = [
        { category: "Antigravity IDE", seconds: 94413, percentage: 62, color: "#6366f1" },
        { category: "Chrome", seconds: 36547, percentage: 24, color: "#10b981" },
        { category: "Terminal", seconds: 18273, percentage: 14, color: "#f59e0b" },
        { category: "Other", seconds: 3047, percentage: 2, color: "#94a3b8" }
      ];
    }

    // Focus Quality Mock (derive from app type)
    let devTime = 0;
    let commTime = 0;
    timeDistribution.forEach(t => {
      if (["VS Code", "Terminal", "IntelliJ", "Github"].includes(t.category)) devTime += t.seconds as number;
      if (["Slack", "Discord", "Google Meet", "Teams"].includes(t.category)) commTime += t.seconds as number;
    });
    
    const deepWorkPercent = currentKpi.totalFocusTime > 0 ? Math.round((devTime / currentKpi.totalFocusTime) * 100) : 78;
    const interruptionsPercent = currentKpi.totalFocusTime > 0 ? Math.round((commTime / currentKpi.totalFocusTime) * 100) : 12;

    const teams = [
      { id: "engineering", name: "Engineering Team" },
      { id: "design", name: "Design Guild" },
      { id: "core", name: "Core Platform" },
      { id: "devops", name: "DevOps Unit" }
    ];

    const projects = [
      { id: "p1", name: "EndoCore Platform", focusSeconds: 242200, sessions: 48, goalAchieved: 94, previousFocusSeconds: 210000 },
      { id: "p2", name: "NexusAI Gateway", focusSeconds: 135000, sessions: 28, goalAchieved: 88, previousFocusSeconds: 115000 },
      { id: "p3", name: "Design System V2", focusSeconds: 84000, sessions: 19, goalAchieved: 82, previousFocusSeconds: 72000 },
      { id: "p4", name: "DevOps Infrastructure", focusSeconds: 52000, sessions: 14, goalAchieved: 90, previousFocusSeconds: 43000 }
    ];

    res.json({
      kpi: {
        totalFocusTime: currentKpi.totalFocusTime,
        activeDays: currentKpi.activeDays,
        goalAchievement: currentKpi.goalAchievement,
        avgFocusSession: currentKpi.avgFocusSession,
        productivityScore: currentKpi.productivityScore,
        previous: {
          totalFocusTime: prevKpi.totalFocusTime,
          activeDays: prevKpi.activeDays,
          goalAchievement: prevKpi.goalAchievement,
          avgFocusSession: prevKpi.avgFocusSession,
          productivityScore: prevKpi.productivityScore
        }
      },
      trend: trend,
      heatmap: trend,
      timeDistribution,
      focusQuality: {
         score: Math.min(100, deepWorkPercent + Math.round((100 - interruptionsPercent) / 2)),
         deepWorkPercent: deepWorkPercent || 78,
         interruptionsPercent: interruptionsPercent || 12,
         avgSessionSeconds: currentKpi.avgFocusSession || 3120,
         longestSessionSeconds: 11880 // 3h 18m
      },
      bestWorkingHours: [
        { hour: 8, focusSeconds: 3600 },
        { hour: 9, focusSeconds: 7200 },
        { hour: 10, focusSeconds: 12600 },
        { hour: 11, focusSeconds: 14400 },
        { hour: 12, focusSeconds: 5400 },
        { hour: 13, focusSeconds: 8400 },
        { hour: 14, focusSeconds: 11800 },
        { hour: 15, focusSeconds: 13200 },
        { hour: 16, focusSeconds: 7200 },
        { hour: 17, focusSeconds: 3600 }
      ],
      teams,
      projects,
      insights: [
        { type: "positive", text: `Your total focus time increased by +14.2% compared to the previous period.` },
        { type: "info", text: "Your peak focus hours are consistently between 10:00 AM and 12:30 PM." },
        { type: "positive", text: "Deep work sessions (VS Code, IntelliJ) account for 78% of your overall workstation activity." },
        { type: "info", text: "Wednesdays and Thursdays are currently your most productive focus days." },
        { type: "positive", text: "Completed 73 high-performance focus sessions across 4 active workspace projects." }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function getCategoryColor(app: string) {
  const colors: Record<string, string> = {
    "VS Code": "#4f46e5", // indigo-600
    "IntelliJ": "#4f46e5",
    "Figma": "#ec4899", // pink-500
    "Chrome": "#10b981", // emerald-500
    "Terminal": "#64748b", // slate-500
    "Slack": "#f59e0b", // amber-500
    "Google Meet": "#f43f5e" // rose-500
  };
  return colors[app] || "#8b5cf6"; // violet-500
}

app.get("/api/analytics/v2/day/:date", authenticateToken, async (req: any, res) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: req.user.id,
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { timestamp: "asc" }
    });

    let events = logs.map(log => {
      const type = ["Slack", "Discord", "Teams", "Google Meet"].includes(log.app) ? "break" : "focus";
      return {
        time: new Date(log.timestamp).toISOString().substring(11, 16),
        title: log.app,
        subtitle: log.project,
        durationSeconds: parseDurationText(log.durationText),
        type
      };
    });

    if (events.length === 0 && req.user?.email === "showcase@endocore.io") {
      events = [
        { time: "09:00", title: "VS Code", subtitle: "EndoCore Platform - Core Architecture", durationSeconds: 6300, type: "focus" },
        { time: "11:00", title: "Figma", subtitle: "UI Design System V2", durationSeconds: 4500, type: "focus" },
        { time: "13:30", title: "Terminal", subtitle: "DevOps Infrastructure Deployment", durationSeconds: 2700, type: "focus" },
        { time: "14:30", title: "IntelliJ", subtitle: "NexusAI Gateway Model Router", durationSeconds: 7800, type: "focus" },
        { time: "17:00", title: "Slack", subtitle: "Engineering Standup & Code Sync", durationSeconds: 1800, type: "break" }
      ];
    }

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isDevMode = process.env.NODE_ENV === "development";

  if (hasDist && !isDevMode) {
    // Serve static built frontend when dist exists and not explicitly in dev mode
    console.log("📦 Serving built static frontend from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development Mode: Use Vite dev middleware
    console.log("⚡ Running in Vite Dev Middleware mode");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: { port: 24679 } },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("⚠️ Vite dev server middleware warning:", viteErr);
    }
  }

  function listenOnPort(p: number) {
    server.removeAllListeners("error");
    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`⚠️ Port ${p} is already in use. Trying port ${p + 1}...`);
        listenOnPort(p + 1);
      } else {
        console.error("Server error:", err);
      }
    });

    server.listen(p, "0.0.0.0", () => {
      console.log(`🚀 EndoCore Workspace express server running at http://localhost:${p}`);
    });
  }

  listenOnPort(PORT);
}

startServer();
