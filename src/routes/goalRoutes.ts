import express from "express";
import { prisma } from "../../db.js";
import { goalVerificationService } from "../services/goalVerificationService.js";

const router = express.Router();

// Get all goals for current user
router.get("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userGoals = await prisma.goal.findMany({
      where: { userId },
      include: {
        integrationLinks: {
          include: {
            resource: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(userGoals);
  } catch (err) {
    console.error("Error fetching goals from Prisma:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// Add a goal with optional external integration linking
router.post("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      title,
      description,
      category,
      targetHours,
      deadline,
      externalProvider,
      externalResourceId,
      externalRepository,
      verificationCriteria,
      autoVerifyEnabled
    } = req.body;

    if (!title || !category || !targetHours) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify integration resource ownership if externalResourceId is provided
    let linkedResource: any = null;
    let userIntegration: any = null;

    if (externalProvider) {
      userIntegration = await prisma.userIntegration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: externalProvider.toUpperCase()
          }
        }
      });
      if (!userIntegration || !userIntegration.isConnected) {
        return res.status(400).json({ error: `Selected provider ${externalProvider} is not connected.` });
      }
    }

    if (externalResourceId) {
      linkedResource = await prisma.integrationResource.findUnique({
        where: { id: externalResourceId }
      });
      if (!linkedResource || linkedResource.integrationId !== userIntegration?.id) {
        return res.status(400).json({ error: "Specified integration resource does not belong to the user." });
      }
    }

    const formattedCriteria = typeof verificationCriteria === "object" ? JSON.stringify(verificationCriteria) : verificationCriteria;

    const newGoal = await prisma.goal.create({
      data: {
        userId,
        title,
        description: description || "",
        category,
        targetHours: parseFloat(targetHours),
        currentHours: 0,
        status: "active",
        deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        externalProvider: externalProvider || null,
        externalResourceId: externalResourceId || linkedResource?.id || null,
        externalRepository: externalRepository || linkedResource?.identifier || linkedResource?.name || null,
        verificationCriteria: formattedCriteria || null,
        autoVerifyEnabled: autoVerifyEnabled !== undefined ? Boolean(autoVerifyEnabled) : Boolean(externalProvider)
      }
    });

    if (externalProvider || linkedResource) {
      await prisma.goalIntegrationLink.create({
        data: {
          goalId: newGoal.id,
          integrationId: userIntegration?.id || null,
          resourceId: linkedResource?.id || null,
          externalResourceType: linkedResource?.resourceType || "REPOSITORY",
          externalResourceId: linkedResource?.id || null,
          completionCriteria: formattedCriteria || null,
          verificationStatus: "PENDING"
        }
      });

      // Run immediate background verification against existing activity
      await goalVerificationService.verifyPendingGoalsForUser(userId);
    }

    const result = await prisma.goal.findUnique({
      where: { id: newGoal.id },
      include: {
        integrationLinks: {
          include: { resource: true }
        }
      }
    });

    res.status(201).json(result || newGoal);
  } catch (err) {
    console.error("Error creating goal in Prisma:", err);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

// Update a goal
router.put("/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      title,
      description,
      category,
      targetHours,
      currentHours,
      status,
      deadline,
      externalProvider,
      externalResourceId,
      externalRepository,
      verificationCriteria,
      autoVerifyEnabled
    } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const formattedCriteria = typeof verificationCriteria === "object" ? JSON.stringify(verificationCriteria) : verificationCriteria;

    const updatedGoal = await prisma.goal.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(targetHours !== undefined && { targetHours: parseFloat(targetHours) }),
        ...(currentHours !== undefined && { currentHours: parseFloat(currentHours) }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline }),
        ...(externalProvider !== undefined && { externalProvider }),
        ...(externalResourceId !== undefined && { externalResourceId }),
        ...(externalRepository !== undefined && { externalRepository }),
        ...(verificationCriteria !== undefined && { verificationCriteria: formattedCriteria }),
        ...(autoVerifyEnabled !== undefined && { autoVerifyEnabled })
      },
      include: {
        integrationLinks: {
          include: { resource: true }
        }
      }
    });

    res.json(updatedGoal);
  } catch (err) {
    console.error("Error updating goal in Prisma:", err);
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// Delete a goal
router.delete("/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.goal.delete({
      where: { id: existing.id }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting goal from Prisma:", err);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// Manual Goal Verification Endpoint: POST /api/goals/:id/verify
router.post("/:id/verify", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: { integrationLinks: true }
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const results = await goalVerificationService.verifyPendingGoalsForUser(userId);
    const targetResult = results.find((r) => r.goal.id === id);

    const reloadedGoal = await prisma.goal.findUnique({
      where: { id },
      include: {
        integrationLinks: {
          include: { resource: true }
        }
      }
    });

    res.json({
      success: true,
      goal: reloadedGoal,
      progressPercentage: targetResult?.progressPercentage ?? 0,
      verificationStatus: targetResult?.verificationStatus ?? "PENDING"
    });
  } catch (err: any) {
    console.error("Error running manual goal verification:", err);
    res.status(500).json({ error: err.message || "Failed to verify goal" });
  }
});

export default router;
