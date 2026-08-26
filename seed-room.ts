import { prisma } from "./db";

async function run() {
  const showcase = await prisma.user.findUnique({ where: { email: "showcase@endocore.io" } });
  const tawfeeq = await prisma.user.findUnique({ where: { email: "tawfeeqbahur@gmail.com" } });
  
  if (!showcase) return;

  let r1 = await prisma.room.findFirst({ where: { name: "Engineering Team" }});
  if (!r1) {
    r1 = await prisma.room.create({
      data: {
        name: "Engineering Team",
        description: "Development operations, API integrations, and scaling core infrastructure.",
        category: "Development",
        iconEmoji: "🚀",
        accessMode: "INVITE_ONLY",
        ownerId: showcase.id,
        aiPolicy: "{}",
        privacyPolicy: "{}"
      }
    });
  }

  await prisma.roomMember.upsert({
    where: { roomId_userId: { userId: showcase.id, roomId: r1.id } },
    update: {},
    create: { userId: showcase.id, roomId: r1.id, role: "OWNER", membershipStatus: "ACTIVE" }
  });
  
  if (tawfeeq) {
    await prisma.roomMember.upsert({
      where: { roomId_userId: { userId: tawfeeq.id, roomId: r1.id } },
      update: {},
      create: { userId: tawfeeq.id, roomId: r1.id, role: "MEMBER", membershipStatus: "ACTIVE" }
    });
  }

  console.log("Room Engineering Team verified/created with members!");
}
run().catch(console.error).finally(() => prisma.$disconnect());
