import crypto from "crypto";

interface StatePayload {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const memoryStateStore = new Map<string, StatePayload>();

// Periodically clean expired states from memory store
setInterval(() => {
  const now = Date.now();
  for (const [state, payload] of memoryStateStore.entries()) {
    if (payload.expiresAt <= now) {
      memoryStateStore.delete(state);
    }
  }
}, 60 * 1000);

export async function createOAuthState(userId: string): Promise<string> {
  const state = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL
  const payload: StatePayload = { userId, createdAt: Date.now(), expiresAt };

  memoryStateStore.set(state, payload);
  return state;
}

export async function validateAndConsumeOAuthState(state: string): Promise<{ userId: string } | null> {
  if (!state) return null;

  const payload = memoryStateStore.get(state);
  if (!payload) return null;

  // Single-use: delete immediately upon lookup
  memoryStateStore.delete(state);

  // Check expiration
  if (Date.now() > payload.expiresAt) {
    return null;
  }

  return { userId: payload.userId };
}
