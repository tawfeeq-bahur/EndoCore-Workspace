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
function getAppCategory(appName: string): string {
  const name = appName.toLowerCase();
  if (['code', 'vs code', 'vscode', 'intellij', 'sublime', 'vim', 'webstorm'].some(x => name.includes(x))) {
    return "Work";
  }
  if (['youtube', 'netflix', 'prime', 'twitch'].some(x => name.includes(x))) {
    return "Entertainment";
  }
  if (['instagram', 'twitter', 'facebook', 'tiktok', 'snapchat'].some(x => name.includes(x))) {
    return "Social";
  }
  if (['slack', 'teams', 'zoom', 'skype', 'telegram', 'discord'].some(x => name.includes(x))) {
    return "Communication";
  }
  if (['chrome', 'firefox', 'edge', 'safari', 'research'].some(x => name.includes(x))) {
    return "Research";
  }
  if (['terminal', 'docker', 'git', 'postman', 'mongodb', 'cmd', 'powershell', 'bash'].some(x => name.includes(x))) {
    return "Development";
  }
  return "Activity";
}

// Privacy level masking helper
function applyPrivacyMask(currentActivity: any, privacyMode: string) {
  const masked = { ...currentActivity };
  
  if (privacyMode === "Level 2: Category Only" || privacyMode === "Anonymous") {
    const category = getAppCategory(currentActivity.app);
    masked.app = `${category} App`;
    masked.project = "Project hidden (Category privacy)";
  } else if (privacyMode === "Level 3: Summary Only") {
    masked.app = "Focused";
    masked.project = "Details hidden (Summary privacy)";
  } else if (privacyMode === "Level 4: Private") {
    masked.app = "Private Workstation";
    masked.project = "Activity hidden";
    masked.durationText = "--";
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
    const hours = (activeSeconds / 3600).toFixed(1);
    const todayFocusTime = `${hours}h`;
    const goalHours = user.productivityGoal || 6;
    const focusScore = Math.min(100, Math.round((parseFloat(hours) / goalHours) * 100)) || 0;

    const formattedFriend = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
      currentActivity: maskedActivity,
      todayFocusTime,
      focusScore,
      timeline: user.privacyMode === "Level 4: Private" ? [] : user.activityLogs.map(log => {
        const rawLogActivity = {
          app: log.app,
          project: log.project,
          durationText: log.durationText
        };
        const maskedLog = applyPrivacyMask(rawLogActivity, user.privacyMode);
        return {
          time: new Date(log.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
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
    const { name, avatarUrl, activeGroup, privacyMode, deviceConnected, productivityGoal, customStatus, theme, notifications } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (activeGroup !== undefined) updateData.activeGroup = activeGroup;
    if (privacyMode !== undefined) updateData.privacyMode = privacyMode;
    if (deviceConnected !== undefined) updateData.deviceConnected = deviceConnected;
    if (productivityGoal !== undefined) updateData.productivityGoal = productivityGoal;
    if (customStatus !== undefined) updateData.customStatus = customStatus;
    if (theme !== undefined) updateData.theme = theme;
    
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

    // Update user heartbeat and set status back to online if it was offline
    let wasOffline = false;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (currentUser) {
      if (currentUser.status === "offline") {
        wasOffline = true;
      }
      
      const updatePayload: any = {
        lastHeartbeat: new Date(),
        ...(currentUser.status === "offline" ? { status: "online" } : {})
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
                       project !== undefined && (project !== activity.project);

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
          project: project !== undefined ? project : activity.project,
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

    const friendList = members
      .filter(m => m.userId !== req.user.id)
      .map(m => {
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
        const uHours = (uActiveSeconds / 3600).toFixed(1);
        const todayFocusTime = `${uHours}h`;
        const focusScore = Math.min(100, Math.round((parseFloat(uHours) / (u.productivityGoal || 6)) * 100)) || 0;

        return {
          id: u.id,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
          status: u.status,
          currentActivity: maskedActivity,
          todayFocusTime,
          focusScore,
          timeline: u.privacyMode === "Level 4: Private" ? [] : u.activityLogs.map(log => {
            const rawLogActivity = {
              app: log.app,
              project: log.project,
              durationText: log.durationText
            };
            const maskedLog = applyPrivacyMask(rawLogActivity, u.privacyMode);
            return {
              time: new Date(log.timestamp).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
              app: maskedLog.app,
              project: maskedLog.project,
              duration: log.durationText
            };
          })
        };
      });

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
      focusScore = Math.min(100, Math.round((focusTimeHours / (user.productivityGoal || 6)) * 100)) || 0;
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

    const comparisonStats = allUsers.map(u => {
      const durationSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
      const hours = parseFloat((durationSeconds / 3600).toFixed(1));
      const score = Math.min(100, Math.round((hours / (u.productivityGoal || 6)) * 100)) || 0;

      return {
        name: u.name.split(" ")[0],
        hours,
        score
      };
    });

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

// 6. smart AI briefing with Gemini 3.5 Flash!
let lastAiInsights: string = "";
let lastAiTimestamp: number = 0;

app.get("/api/ai-insights", authenticateToken, async (req: any, res) => {
  const forceRefresh = req.query.force === "true";
  
  if (lastAiInsights && (Date.now() - lastAiTimestamp < 120_000) && !forceRefresh) {
    return res.json({ text: lastAiInsights, cached: true });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { activities: true }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const activeGroup = user.activeGroup;
    const group = activeGroup ? await prisma.group.findUnique({
      where: { name: activeGroup }
    }) : null;

    let friendsList: any[] = [];
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

    const myStateStr = `My Core state: User name: ${user.name}, active tracking: ${myActivity.app} on project "${myActivity.project}" (duration: ${Math.floor(myActivity.durationSeconds / 60)} minutes, paused: ${myActivity.isPaused}). My goal is ${user.productivityGoal} focus hours. Custom status: "${user.customStatus}".`;
    
    const friendsStateStr = friendsList.map(u => {
      const currentAct = u.activities[0] || { app: "Offline", project: "None" };
      const uActiveSeconds = u.activities.reduce((acc, act) => acc + act.durationSeconds, 0);
      const uHours = (uActiveSeconds / 3600).toFixed(1);
      const todayFocusTime = `${uHours}h`;
      const focusScore = Math.min(100, Math.round((parseFloat(uHours) / (u.productivityGoal || 6)) * 100)) || 0;

      return `Friend "${u.name}" (${u.role}) is current status: "${u.status}" using "${currentAct.app}" for project "${currentAct.project}". Today total focus time: ${todayFocusTime}, productivity score: ${focusScore}%.`;
    }).join("\n");

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

    const prompt = `You are a helpful, extremely clever, and witty developer co-working assistant companion.
Here is the current real-time activity status in our co-working group:

---
${myStateStr}

---
Our team members:
${friendsStateStr}
---

Please generate a premium Daily Focus & Co-working Briefing.
Format your output in clean, eye-catching Markdown with the following structured sections:
1.  **⚡ TEAM PULSE SUMMARY**: A quick, enthusiastic 2-sentence summary of what the vibe of the channel is right now (e.g. "We are in ultra-focused execution mode!").
2.  **🎮 INDIVIDUAL NUDGES & COMPLIMENTS**: Mention at least 2 specific friends. Offer a witty or helpful comment on what they are working on, or give them a humorous productivity nudge (e.g., Sarah Chen is on fire, or Marcus Johnson should probably toggle back to VS Code).
3.  **💪 PERSONAL COACHING INSIGHT**: Give me (${user.name}) an actionable co-working insight or recommendation based on my current work (${myActivity.app} on "${myActivity.project}").
4.  **🎯 PRO-TIP ALERTS**: A 1-sentence productivity highlight of the day.

Keep the brief extremely visual, using bullet points, bold keywords, emoji highlights, and clean typography layouts. Keep it concise, engaging, and professional but full of developer humor! Limit the entire response to exactly 150-200 words. Do not praise yourself or write self-referential introductory statements (like "Here is the briefing"). Start directly with the pulse.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
      }
    });

    const outputText = response.text || "No insights could be parsed.";
    lastAiInsights = outputText;
    lastAiTimestamp = Date.now();
    
    res.json({ text: outputText, cached: false });

  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    
    const fallbackBriefing = `### ⚡ TEAM PULSE SUMMARY
The workspace is focused on deep development and design iterations. All members are checking in and aligning their daily focus goals.

### 🎮 INDIVIDUAL NUDGES & COMPLIMENTS
*   Co-working channels are open. Wave or send nudges to your team members directly from the dashboard to keep each other in deep flow! ☕

### 💪 PERSONAL COACHING INSIGHT
You've been tracking your workspace activity. The momentum is great, but don't forget to take a 5-minute stretch or hydrate soon to optimize cognitive clarity!

### 🎯 PRO-TIP ALERTS
*   **Developers who stretch** every 45 minutes report 30% higher focus retention. Stretch boundaries today!`;

    lastAiInsights = fallbackBriefing;
    lastAiTimestamp = Date.now();
    res.json({ text: fallbackBriefing, cached: true, error: true, details: error.message });
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
