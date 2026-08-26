import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();
const GOALS_FILE = path.join(process.cwd(), "goals.json");

// Helper to read goals
function readGoals() {
  try {
    if (!fs.existsSync(GOALS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(GOALS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading goals file:", err);
    return [];
  }
}

// Helper to write goals
function writeGoals(goals: any[]) {
  try {
    fs.writeFileSync(GOALS_FILE, JSON.stringify(goals, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing goals file:", err);
  }
}

// Seed default goals if empty
function seedDefaultGoals(userId: string) {
  const defaults = [
    {
      id: "g1",
      userId,
      title: "Design System Migration",
      description: "Migrate legacy component styles to V2 Tailwind/Monochrome system",
      category: "Design",
      targetHours: 15,
      currentHours: 12.5,
      status: "active",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    },
    {
      id: "g2",
      userId,
      title: "Core API Optimization",
      description: "Improve server response times by caching heavy queries in Redis",
      category: "Development",
      targetHours: 20,
      currentHours: 8,
      status: "active",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    },
    {
      id: "g3",
      userId,
      title: "Write Architecture Docs",
      description: "Document multi-device identity pairing & WebSocket events sync flow",
      category: "Documentation",
      targetHours: 8,
      currentHours: 8,
      status: "completed",
      deadline: new Date().toISOString().split("T")[0],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  return defaults;
}

// Get all goals for current user
router.get("/", (req: any, res: any) => {
  const userId = req.user?.id || "guest";
  let allGoals = readGoals();
  let userGoals = allGoals.filter((g: any) => g.userId === userId);
  
  if (userGoals.length === 0) {
    // No auto-seed — new users start fresh with no goals
    userGoals = [];
  }
  
  res.json(userGoals);
});

// Add a goal
router.post("/", (req: any, res: any) => {
  const userId = req.user?.id || "guest";
  const { title, description, category, targetHours, deadline } = req.body;
  
  if (!title || !category || !targetHours) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const newGoal = {
    id: `g-${Date.now()}`,
    userId,
    title,
    description: description || "",
    category,
    targetHours: parseFloat(targetHours),
    currentHours: 0,
    status: "active",
    deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    createdAt: new Date().toISOString()
  };
  
  const allGoals = readGoals();
  allGoals.push(newGoal);
  writeGoals(allGoals);
  
  res.status(201).json(newGoal);
});

// Update a goal
router.put("/:id", (req: any, res: any) => {
  const userId = req.user?.id || "guest";
  const { id } = req.params;
  const { title, description, category, targetHours, currentHours, status, deadline } = req.body;
  
  const allGoals = readGoals();
  const goalIndex = allGoals.findIndex((g: any) => g.id === id && g.userId === userId);
  
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }
  
  const updatedGoal = {
    ...allGoals[goalIndex],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(category !== undefined && { category }),
    ...(targetHours !== undefined && { targetHours: parseFloat(targetHours) }),
    ...(currentHours !== undefined && { currentHours: parseFloat(currentHours) }),
    ...(status !== undefined && { status }),
    ...(deadline !== undefined && { deadline })
  };
  
  allGoals[goalIndex] = updatedGoal;
  writeGoals(allGoals);
  
  res.json(updatedGoal);
});

// Delete a goal
router.delete("/:id", (req: any, res: any) => {
  const userId = req.user?.id || "guest";
  const { id } = req.params;
  
  let allGoals = readGoals();
  const goalIndex = allGoals.findIndex((g: any) => g.id === id && g.userId === userId);
  
  if (goalIndex === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }
  
  allGoals.splice(goalIndex, 1);
  writeGoals(allGoals);
  
  res.json({ success: true });
});

export default router;
