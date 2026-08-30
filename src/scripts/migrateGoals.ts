import fs from "fs";
import path from "path";
import { prisma } from "../../db.js";

async function main() {
  console.log("Starting goals.json -> SQLite Prisma migration...");

  const goalsFilePath = path.join(process.cwd(), "goals.json");
  if (!fs.existsSync(goalsFilePath)) {
    console.log("No goals.json file found. Migration skipped.");
    return;
  }

  const rawData = fs.readFileSync(goalsFilePath, "utf-8");
  let goalsData: any[] = [];
  try {
    goalsData = JSON.parse(rawData);
  } catch (err) {
    console.error("Failed to parse goals.json:", err);
    process.exit(1);
  }

  if (!Array.isArray(goalsData) || goalsData.length === 0) {
    console.log("goals.json contains no records. Nothing to migrate.");
    return;
  }

  console.log(`Found ${goalsData.length} records in goals.json.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const item of goalsData) {
    if (!item.userId || !item.title) {
      skippedCount++;
      continue;
    }

    // Ensure the target user exists in SQLite DB before connecting relation
    const user = await prisma.user.findUnique({ where: { id: item.userId } });

    if (!user) {
      // Check if user exists by email or create standard fallback demo user if "u1"
      let existingUser = null;
      if (item.userId === "u1") {
        existingUser = await prisma.user.findFirst();
      }
      
      if (!existingUser) {
        // Create user placeholder if user id does not exist in DB
        try {
          existingUser = await prisma.user.create({
            data: {
              id: item.userId,
              name: `User ${item.userId.substring(0, 6)}`,
              email: `${item.userId}@endocore.local`,
              passwordHash: "migrated_hash_placeholder",
              username: `user_${item.userId.substring(0, 8)}`,
              role: "Software Developer"
            }
          });
        } catch (e: any) {
          // If creation fails (e.g. unique constraint), find any existing fallback user
          existingUser = await prisma.user.findFirst();
        }
      }

      if (existingUser) {
        item.userId = existingUser.id;
      }
    }

    const uniqueId = item.id && item.id.includes(item.userId) ? item.id : `${item.userId}_${item.id || Date.now()}`;

    await prisma.goal.upsert({
      where: { id: uniqueId },
      create: {
        id: uniqueId,
        userId: item.userId,
        title: item.title,
        description: item.description || "",
        category: item.category || "Development",
        targetHours: parseFloat(item.targetHours || 10),
        currentHours: parseFloat(item.currentHours || 0),
        status: item.status || "active",
        deadline: item.deadline || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
      },
      update: {
        title: item.title,
        description: item.description || "",
        category: item.category || "Development",
        targetHours: parseFloat(item.targetHours || 10),
        currentHours: parseFloat(item.currentHours || 0),
        status: item.status || "active",
        deadline: item.deadline || null
      }
    });

    migratedCount++;
  }

  const totalDbGoals = await prisma.goal.count();
  console.log(`✅ Goals migration completed.`);
  console.log(`- Total records processed: ${goalsData.length}`);
  console.log(`- Successfully migrated/upserted: ${migratedCount}`);
  console.log(`- Skipped records: ${skippedCount}`);
  console.log(`- Total Goal records now in SQLite database: ${totalDbGoals}`);
}

main()
  .catch((e) => {
    console.error("Error running goals migration script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
