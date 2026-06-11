import { prisma } from "./db";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("Database already seeded with users.");
    return;
  }

  console.log("Seeding database with default user and groups...");

  const hash = bcrypt.hashSync("password123", 10);

  // 1. Create default real user
  await prisma.user.create({
    data: {
      id: "u1",
      name: "Tawfeeq Bahur",
      email: "tawfeeqbahur@gmail.com",
      passwordHash: hash,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      activeGroup: "Engineering Group",
      privacyMode: "Public",
      deviceConnected: "WS-WORKSTATION-11",
      productivityGoal: 6,
      customStatus: "Coding intense dashboard features 🚀",
      theme: "endocore-dark",
      status: "online",
      role: "Lead Software Developer"
    }
  });

  // 2. Create Groups
  await prisma.group.create({
    data: {
      id: "g1",
      name: "Engineering Group",
      description: "Core dashboard engineering team. Keeping each other aligned."
    }
  });

  await prisma.group.create({
    data: {
      id: "g2",
      name: "Design & UX Crew",
      description: "Making things look beautiful, fluid, and elegant."
    }
  });

  await prisma.group.create({
    data: {
      id: "g3",
      name: "Focus Guild",
      description: "Deep study hall, quiet hours and absolute silence."
    }
  });

  // 3. Create Group Memberships for u1
  const memberships = [
    { userId: "u1", groupId: "g1", role: "admin" },
    { userId: "u1", groupId: "g2", role: "admin" },
    { userId: "u1", groupId: "g3", role: "admin" },
  ];

  for (const m of memberships) {
    await prisma.groupMember.create({ data: m });
  }

  // 4. Create initial Activity for u1
  await prisma.activity.create({
    data: {
      userId: "u1",
      app: "VS Code",
      project: "EndoCore Workspace",
      startedAt: new Date(Date.now() - 45 * 60 * 1000),
      durationSeconds: 2700,
      isPaused: false
    }
  });

  console.log("Database successfully seeded!");
}
