import { prisma } from "./db";
import bcrypt from "bcryptjs";

async function run() {
  const hash = bcrypt.hashSync("password123", 10);
  
  // Create or update showcase user
  const showcase = await prisma.user.upsert({
    where: { email: "showcase@endocore.io" },
    update: {},
    create: {
      name: "Showcase User",
      email: "showcase@endocore.io",
      passwordHash: hash,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
      activeGroup: "Engineering Team",
      privacyMode: "Public",
      deviceConnected: "WS-WORKSTATION-11",
      productivityGoal: 6,
      customStatus: "Demoing EndoCore!",
      theme: "endocore-dark",
      status: "Focused",
      role: "Product Manager",
      broadcastGroups: "Engineering Team,Design Team",
      username: "showcase",
      headline: "Product Manager",
    }
  });

  const g1 = await prisma.group.findFirst({ where: { name: "Engineering Team" }});
  if (g1) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: showcase.id, groupId: g1.id } },
      update: {},
      create: { userId: showcase.id, groupId: g1.id, role: "admin" }
    });
  }

  const r1 = await prisma.room.findFirst({ where: { name: "Engineering Team" }});
  if (r1) {
    const existingRoomMember = await prisma.roomMember.findFirst({ where: { userId: showcase.id, roomId: r1.id } });
    if (!existingRoomMember) {
      await prisma.roomMember.create({
        data: { userId: showcase.id, roomId: r1.id, role: "OWNER", membershipStatus: "ACTIVE" }
      });
    }
  }

  console.log("Showcase user seeded successfully!");
}
run().catch(console.error).finally(() => prisma.$disconnect());
