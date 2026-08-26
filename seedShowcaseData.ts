import { prisma } from "./db";
import bcrypt from "bcryptjs";

async function seedShowcase() {
  console.log("Seeding data for showcase@endocore.io...");

  try {
    // 1. Create or find the user
    let user = await prisma.user.findFirst({
      where: { email: "showcase@endocore.io" }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "showcase@endocore.io",
          username: "showcase",
          passwordHash: bcrypt.hashSync("123", 10),
          name: "Alex Mercer",
          role: "Lead Systems Architect & Core Developer",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          status: "online",
          productivityGoal: 8
        }
      });
      console.log("Created new showcase user.");
    } else {
      console.log("Showcase user already exists.");
    }

    // 2. Clear existing activity logs and summaries to avoid duplication if run multiple times
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.dailySummary.deleteMany({ where: { userId: user.id } });
    await prisma.focusSession.deleteMany({ where: { userId: user.id } });

    console.log("Cleared old data for showcase user.");

    // 3. Generate 30 days of data
    const daysToGenerate = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const apps = [
      { name: "VS Code", project: "EndoCore Platform", prob: 0.4 },
      { name: "IntelliJ", project: "NexusAI Gateway", prob: 0.2 },
      { name: "Chrome", project: "Documentation", prob: 0.15 },
      { name: "Slack", project: "Team Comm", prob: 0.1 },
      { name: "Figma", project: "UI Design", prob: 0.1 },
      { name: "Terminal", project: "DevOps", prob: 0.05 },
    ];

    let totalLogsCreated = 0;
    let totalSessionsCreated = 0;

    for (let i = 0; i < daysToGenerate; i++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() - i);
      
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
      
      // Determine how much focus they had this day
      // Weekday: 4-9 hours, Weekend: 0-3 hours
      const targetHours = isWeekend 
        ? Math.random() * 3 
        : 4 + Math.random() * 5;
      
      const targetSeconds = Math.floor(targetHours * 3600);
      let accumulatedSeconds = 0;
      
      // Generate sessions for the day starting from 9 AM
      let currentTime = new Date(currentDay);
      currentTime.setHours(9, 0, 0, 0);

      const logsToCreate = [];
      const sessionsToCreate = [];

      while (accumulatedSeconds < targetSeconds) {
        // Pick an app based on probability
        const rand = Math.random();
        let app = apps[0];
        let pSum = 0;
        for (const a of apps) {
          pSum += a.prob;
          if (rand <= pSum) {
            app = a;
            break;
          }
        }

        // Session duration: 15 mins to 2 hours
        const sessionSeconds = Math.floor(900 + Math.random() * 6300);
        
        if (accumulatedSeconds + sessionSeconds > targetSeconds) {
          break; // Stop if we exceed the day's target
        }

        // Format duration text for ActivityLog (e.g., "1h 30m" or "45m")
        const h = Math.floor(sessionSeconds / 3600);
        const m = Math.floor((sessionSeconds % 3600) / 60);
        const durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;

        logsToCreate.push({
          userId: user.id,
          app: app.name,
          project: app.project,
          durationText: durationText,
          timestamp: new Date(currentTime)
        });

        // Only save long sessions as explicit FocusSessions if it's a dev app
        if (sessionSeconds > 1800 && ["VS Code", "IntelliJ", "Terminal"].includes(app.name)) {
           sessionsToCreate.push({
              userId: user.id,
              taskName: `Deep work on ${app.project}`,
              durationMinutes: Math.floor(sessionSeconds / 60),
              completed: true,
              timestamp: new Date(currentTime)
           });
        }

        accumulatedSeconds += sessionSeconds;
        
        // Advance current time by the session duration + break time (5-20 mins)
        currentTime = new Date(currentTime.getTime() + sessionSeconds * 1000 + (300 + Math.random() * 900) * 1000);
      }

      if (logsToCreate.length > 0) {
         await prisma.activityLog.createMany({ data: logsToCreate });
         totalLogsCreated += logsToCreate.length;
      }
      
      if (sessionsToCreate.length > 0) {
         await prisma.focusSession.createMany({ data: sessionsToCreate });
         totalSessionsCreated += sessionsToCreate.length;
      }
      
      // Create DailySummary
      const score = isWeekend ? Math.floor(40 + Math.random() * 20) : Math.floor(70 + Math.random() * 28); // 70-98 for weekdays
      await prisma.dailySummary.create({
        data: {
          userId: user.id,
          date: currentDay.toISOString().split("T")[0],
          totalFocusSeconds: accumulatedSeconds,
          productivityScore: score
        }
      });
    }

    console.log(`✅ Successfully seeded database with realistic data!`);
    console.log(`Created ${totalLogsCreated} activity logs and ${totalSessionsCreated} focus sessions across ${daysToGenerate} days.`);

  } catch (err) {
    console.error("Error seeding showcase data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedShowcase();
