import { prisma } from "./db";

async function run() {
  const showcase = await prisma.user.findUnique({ where: { email: "showcase@endocore.io" } });
  if (!showcase) return;

  // Clear existing to avoid duplicates
  await prisma.activityLog.deleteMany({ where: { userId: showcase.id } });
  await prisma.activity.deleteMany({ where: { userId: showcase.id } });
  await prisma.dailySummary.deleteMany({ where: { userId: showcase.id } });

  // 1. Current Activity
  await prisma.activity.create({
    data: {
      userId: showcase.id,
      app: "Figma",
      project: "UI Design Mockups",
      startedAt: new Date(Date.now() - 72 * 60 * 1000), // 1h 12m ago
      durationSeconds: 4320,
      isPaused: false
    }
  });

  // 2. Timeline Logs
  const logs = [
    { userId: showcase.id, app: "VS Code & Antigravity IDE", project: "EndoCore Workspace", durationText: "80m", timestamp: new Date(Date.now() - 5 * 3600 * 1000) },
    { userId: showcase.id, app: "Resting", project: "Planned Break", durationText: "15m", timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
    { userId: showcase.id, app: "Terminal & Git", project: "Deployment Pipeline", durationText: "85m", timestamp: new Date(Date.now() - 2.5 * 3600 * 1000) }
  ];
  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  // 3. Heatmap Data (DailySummaries)
  const mockSummaries = [];
  const today = new Date();
  for (let i = 0; i < 180; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      mockSummaries.push({
        userId: showcase.id,
        date: d.toISOString().split("T")[0],
        totalFocusSeconds: Math.floor(Math.random() * 14400) + 14400,
        productivityScore: Math.floor(Math.random() * 30) + 70
      });
    }
  }
  await prisma.dailySummary.createMany({ data: mockSummaries });

  console.log("Showcase data (activity, logs, heatmap) seeded successfully!");
}
run().catch(console.error).finally(() => prisma.$disconnect());
