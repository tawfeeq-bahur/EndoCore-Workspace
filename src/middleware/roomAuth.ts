import { Response, NextFunction } from "express";
import { prisma } from "../../db";

export type RoomRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "OBSERVER";

export function requireRoomRole(allowedRoles: RoomRole[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const roomId = req.params.id || req.body.roomId || req.query.roomId;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!roomId) {
        return res.status(400).json({ error: "Room ID is required" });
      }

      const membership = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId: String(roomId),
            userId: String(userId)
          }
        }
      });

      if (!membership || membership.membershipStatus !== "ACTIVE") {
        return res.status(403).json({ error: "You are not an active member of this room" });
      }

      if (!allowedRoles.includes(membership.role as RoomRole)) {
        return res.status(403).json({
          error: `Insufficient permissions. Action requires one of roles: ${allowedRoles.join(", ")}`
        });
      }

      req.roomMember = membership;
      next();
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to check room authorization" });
    }
  };
}

export function requireRoomPermission(permission: "MANAGE_ROOM" | "MANAGE_MEMBERS" | "MANAGE_TARGETS" | "VIEW_REPORTS") {
  const permissionRoleMap: Record<string, RoomRole[]> = {
    MANAGE_ROOM: ["OWNER"],
    MANAGE_MEMBERS: ["OWNER", "ADMIN"],
    MANAGE_TARGETS: ["OWNER", "ADMIN", "MANAGER"],
    VIEW_REPORTS: ["OWNER", "ADMIN", "MANAGER", "MEMBER", "OBSERVER"]
  };

  return requireRoomRole(permissionRoleMap[permission] || ["OWNER"]);
}
