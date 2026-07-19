import { prisma } from "./db";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded with users.");
    return;
  }

  console.log("Seeding database with default users and rooms...");

  const hash = bcrypt.hashSync("password123", 10);

  // 1. Create Default Users with realistic data and correct status labels
  // Tawfeeq Bahur: 4.5 hrs today, status: Focused
  const tawfeeq = await prisma.user.create({
    data: {
      id: "u1",
      name: "Tawfeeq Bahur",
      email: "tawfeeqbahur@gmail.com",
      passwordHash: hash,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      activeGroup: "Engineering Team",
      privacyMode: "Public",
      deviceConnected: "WS-WORKSTATION-11",
      productivityGoal: 6,
      customStatus: "Coding backend services 🚀",
      theme: "endocore-dark",
      status: "Focused",
      role: "Lead Software Developer",
      broadcastGroups: "Engineering Team,Design Team,Research Team,Focus Guild",
      focusStreak: 3,
    }
  });

  // Ravi: 3.8 hrs today, status: Break
  const ravi = await prisma.user.create({
    data: {
      id: "u2",
      name: "Ravi",
      email: "ravi@example.com",
      passwordHash: hash,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      activeGroup: "Engineering Team",
      privacyMode: "Team",
      deviceConnected: "MACBOOK-PRO-M3",
      productivityGoal: 6,
      customStatus: "Sipping coffee ☕",
      theme: "endocore-dark",
      status: "Break",
      role: "UI/UX Designer",
      broadcastGroups: "Engineering Team,Design Team,Focus Guild",
      focusStreak: 5,
    }
  });

  // Arun: 2.9 hrs today, status: Offline
  const arun = await prisma.user.create({
    data: {
      id: "u3",
      name: "Arun",
      email: "arun@example.com",
      passwordHash: hash,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      activeGroup: "Engineering Team",
      privacyMode: "Private",
      deviceConnected: "DEV-TOWER-09",
      productivityGoal: 6,
      customStatus: "Away from desk",
      theme: "endocore-dark",
      status: "Offline",
      role: "Research Associate",
      broadcastGroups: "Engineering Team,Research Team,Focus Guild",
      focusStreak: 2,
    }
  });

  // 2. Create Groups/Rooms
  const g1 = await prisma.group.create({
    data: {
      id: "g1",
      name: "Engineering Team",
      description: "Development operations, API integrations, and scaling core infrastructure."
    }
  });

  const g2 = await prisma.group.create({
    data: {
      id: "g2",
      name: "Design Team",
      description: "UI refinement, interactive layouts, wireframes, and design specs."
    }
  });

  const g3 = await prisma.group.create({
    data: {
      id: "g3",
      name: "Research Team",
      description: "Literature reviews, machine learning modeling, and experimental metrics."
    }
  });

  const g4 = await prisma.group.create({
    data: {
      id: "g4",
      name: "Focus Guild",
      description: "Deep study hall for silent execution and Pomodoro sprints."
    }
  });

  // 3. Create Group Memberships for all three users in all rooms they belong to
  const memberships = [
    // Engineering Team
    { userId: "u1", groupId: "g1", role: "admin" },
    { userId: "u2", groupId: "g1", role: "member" },
    { userId: "u3", groupId: "g1", role: "member" },
    // Design Team
    { userId: "u1", groupId: "g2", role: "member" },
    { userId: "u2", groupId: "g2", role: "admin" },
    // Research Team
    { userId: "u1", groupId: "g3", role: "member" },
    { userId: "u3", groupId: "g3", role: "admin" },
    // Focus Guild
    { userId: "u1", groupId: "g4", role: "admin" },
    { userId: "u2", groupId: "g4", role: "member" },
    { userId: "u3", groupId: "g4", role: "member" },
  ];

  for (const m of memberships) {
    await prisma.groupMember.create({ data: m });
  }

  // 4. Create Active Activities (current session details)
  // Tawfeeq: VS Code, Farm2Bag Backend API Development
  await prisma.activity.create({
    data: {
      userId: "u1",
      app: "VS Code",
      project: "Farm2Bag Backend API Development",
      startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45m ago
      durationSeconds: 16200, // 4.5 hrs total tracked today
      isPaused: false
    }
  });

  // Ravi: Figma, UI Wireframe Design
  await prisma.activity.create({
    data: {
      userId: "u2",
      app: "Figma",
      project: "UI Wireframe Design",
      startedAt: new Date(Date.now() - 75 * 60 * 1000), // 1h 15m ago
      durationSeconds: 13680, // 3.8 hrs total tracked today
      isPaused: false
    }
  });

  // Arun: ChatGPT, System Design Learning
  await prisma.activity.create({
    data: {
      userId: "u3",
      app: "ChatGPT",
      project: "System Design Learning",
      startedAt: new Date(Date.now() - 32 * 60 * 1000), // 32m ago
      durationSeconds: 10440, // 2.9 hrs total tracked today
      isPaused: true
    }
  });

  // 5. Create Activity Logs (Timeline)
  const logs = [
    // Tawfeeq's history
    { userId: "u1", app: "VS Code", project: "Farm2Bag Backend API Development", durationText: "45m", timestamp: new Date(Date.now() - 50 * 60 * 1000) },
    { userId: "u1", app: "ChatGPT", project: "System Design Preparation", durationText: "20m", timestamp: new Date(Date.now() - 120 * 60 * 1000) },
    { userId: "u1", app: "YouTube", project: "Java HashMap Tutorial", durationText: "15m", timestamp: new Date(Date.now() - 200 * 60 * 1000) },

    // Ravi's history
    { userId: "u2", app: "Figma", project: "UI Wireframe Design", durationText: "1h 15m", timestamp: new Date(Date.now() - 80 * 60 * 1000) },
    { userId: "u2", app: "Google Chrome", project: "Dribbble Inspiration Search", durationText: "30m", timestamp: new Date(Date.now() - 150 * 60 * 1000) },

    // Arun's history
    { userId: "u3", app: "ChatGPT", project: "System Design Learning", durationText: "32m", timestamp: new Date(Date.now() - 40 * 60 * 1000) },
    { userId: "u3", app: "LeetCode", project: "Array & Hashing Practice", durationText: "1h 10m", timestamp: new Date(Date.now() - 180 * 60 * 1000) },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  // 6. Seed DailySummaries for the past 60 days to populate the contribution heatmap
  console.log("Seeding historical DailySummary metrics...");
  const users = ["u1", "u2", "u3"];
  for (const userId of users) {
    for (let i = 1; i <= 60; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD

      // Generate random daily focus hours between 1 and 8 hours (in seconds)
      const hours = 1 + Math.random() * 7;
      const totalFocusSeconds = Math.round(hours * 3600);
      const productivityScore = Math.round(40 + Math.random() * 55); // 40% to 95%

      await prisma.dailySummary.create({
        data: {
          userId,
          date: dateString,
          totalFocusSeconds,
          productivityScore
        }
      });
    }
  }

  console.log("Database successfully seeded with realistic profiles and groups!");
}
