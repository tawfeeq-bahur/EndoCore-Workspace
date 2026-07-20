import { prisma } from "../../db";
import { validateAiPolicy, validatePrivacyPolicy, DEFAULT_AI_POLICY, DEFAULT_PRIVACY_POLICY } from "../schemas/roomPolicies";
import crypto from "crypto";

export interface CreateRoomInput {
  ownerId: string;
  name: string;
  description: string;
  iconEmoji?: string;
  category?: string;
  timezone?: string;
  deadline?: string | null;
  idempotencyKey?: string;

  // Access settings
  accessMode?: "OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY";
  allowAdminInvites?: boolean;
  linkExpiryDays?: number;
  maxMemberCount?: number;
  requireVerifiedAccount?: boolean;
  defaultMemberRole?: "ADMIN" | "MANAGER" | "MEMBER" | "OBSERVER";

  // Invitations & Roles
  invitedMembers?: Array<{ userId?: string; email?: string; role: "ADMIN" | "MANAGER" | "MEMBER" | "OBSERVER" }>;

  // Individual & Team targets
  memberWorkTargets?: Array<{
    userId: string;
    focusMinutes?: number;
    taskTarget?: number;
    workingDays?: string;
    workStart?: string;
    workEnd?: string;
    breakAllowanceMins?: number;
    deepWorkTargetMins?: number;
  }>;
  teamTarget?: {
    focusMinutes?: number;
    taskPoints?: number;
    deadline?: string | null;
    reportingPeriod?: string;
    requiredCoverageHours?: string;
    milestonesJson?: any[];
  };

  // Policies
  aiPolicy?: any;
  privacyPolicy?: any;
}

function safeDate(d?: string | null): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) return parsed;
  // Handle DD-MM-YYYY format
  const parts = d.split("-");
  if (parts.length === 3 && parts[2].length === 4) {
    const year = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[0], 10);
    const alt = new Date(year, month, day);
    if (!isNaN(alt.getTime())) return alt;
  }
  return null;
}

export async function createRoomTransactional(input: CreateRoomInput) {
  const {
    ownerId,
    name,
    description,
    iconEmoji = "🚀",
    category = "Development",
    timezone = "UTC",
    deadline,
    idempotencyKey,
    accessMode = "APPROVAL_REQUIRED",
    allowAdminInvites = true,
    linkExpiryDays = 7,
    maxMemberCount = 50,
    requireVerifiedAccount = false,
    defaultMemberRole = "MEMBER",
    invitedMembers = [],
    memberWorkTargets = [],
    teamTarget,
    aiPolicy: rawAiPolicy,
    privacyPolicy: rawPrivacyPolicy
  } = input;

  // Validate policies using schema validators
  const { policy: aiPolicy } = validateAiPolicy(rawAiPolicy || DEFAULT_AI_POLICY);
  const { policy: privacyPolicy } = validatePrivacyPolicy(rawPrivacyPolicy || DEFAULT_PRIVACY_POLICY);

  const parsedDeadline = safeDate(deadline);
  const parsedTeamDeadline = safeDate(teamTarget?.deadline) || parsedDeadline;

  // Use Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await tx.room.findUnique({
        where: { idempotencyKey }
      });
      if (existing) {
        return existing;
      }
    }

    // Check name uniqueness
    const nameConflict = await tx.room.findUnique({
      where: { name }
    });
    if (nameConflict) {
      throw new Error(`Room with name "${name}" already exists.`);
    }

    // 2. Create Room
    const room = await tx.room.create({
      data: {
        ownerId,
        name,
        description,
        iconEmoji,
        category,
        timezone,
        accessMode: accessMode as any,
        deadline: parsedDeadline,
        aiPolicy: aiPolicy as any,
        aiPolicyVersion: aiPolicy.version || 1,
        privacyPolicy: privacyPolicy as any,
        privacyPolicyVersion: privacyPolicy.version || 1,
        allowAdminInvites,
        linkExpiryDays,
        maxMemberCount,
        requireVerifiedAccount,
        defaultMemberRole: defaultMemberRole as any,
        idempotencyKey: idempotencyKey || null
      }
    });

    // 3. Add Owner as RoomMember with OWNER role
    await tx.roomMember.create({
      data: {
        roomId: room.id,
        userId: ownerId,
        role: "OWNER",
        membershipStatus: "ACTIVE"
      }
    });

    // 3.1. Sync to legacy Group & GroupMember for backward compatibility
    const legacyGroup = await tx.group.upsert({
      where: { name },
      create: {
        name,
        description,
        accessType: accessMode === "OPEN" ? "PUBLIC" : accessMode === "INVITE_ONLY" ? "INVITE_ONLY" : "REQUIRE_APPROVAL"
      },
      update: {
        description
      }
    });

    await tx.groupMember.upsert({
      where: {
        userId_groupId: {
          userId: ownerId,
          groupId: legacyGroup.id
        }
      },
      create: {
        userId: ownerId,
        groupId: legacyGroup.id,
        role: "admin"
      },
      update: {}
    });

    // 4. Record Owner's Initial Consent
    await tx.trackingConsent.create({
      data: {
        roomId: room.id,
        userId: ownerId,
        policyVersion: privacyPolicy.version || 1
      }
    });

    // 5. Create Default Team Target
    await tx.teamTarget.create({
      data: {
        roomId: room.id,
        focusMinutes: teamTarget?.focusMinutes ?? 2400,
        taskPoints: teamTarget?.taskPoints ?? 50,
        deadline: parsedTeamDeadline,
        reportingPeriod: teamTarget?.reportingPeriod ?? "Weekly",
        requiredCoverageHours: teamTarget?.requiredCoverageHours ?? "09:00-17:00 UTC",
        milestonesJson: teamTarget?.milestonesJson ?? [],
        createdById: ownerId
      }
    });

    // 6. Create Member Work Targets (Owner + specific members)
    const ownerTargetInput = memberWorkTargets.find(t => t.userId === ownerId);
    await tx.memberWorkTarget.create({
      data: {
        roomId: room.id,
        userId: ownerId,
        focusMinutes: ownerTargetInput?.focusMinutes ?? 360,
        taskTarget: ownerTargetInput?.taskTarget ?? 5,
        workingDays: ownerTargetInput?.workingDays ?? "Mon,Tue,Wed,Thu,Fri",
        workStart: ownerTargetInput?.workStart ?? "09:00",
        workEnd: ownerTargetInput?.workEnd ?? "09:17:00",
        breakAllowanceMins: ownerTargetInput?.breakAllowanceMins ?? 60,
        deepWorkTargetMins: ownerTargetInput?.deepWorkTargetMins ?? 180,
        createdById: ownerId
      }
    });

    // 7. Process Invited Members & Connection Invitations
    for (const inv of invitedMembers) {
      if (inv.userId && inv.userId !== ownerId) {
        // Create RoomMember as INVITED
        await tx.roomMember.create({
          data: {
            roomId: room.id,
            userId: inv.userId,
            role: inv.role as any,
            membershipStatus: "INVITED"
          }
        });

        // Add initial target for invited member
        const memberTarget = memberWorkTargets.find(t => t.userId === inv.userId);
        await tx.memberWorkTarget.create({
          data: {
            roomId: room.id,
            userId: inv.userId,
            focusMinutes: memberTarget?.focusMinutes ?? 360,
            taskTarget: memberTarget?.taskTarget ?? 5,
            workingDays: memberTarget?.workingDays ?? "Mon,Tue,Wed,Thu,Fri",
            workStart: memberTarget?.workStart ?? "09:00",
            workEnd: memberTarget?.workEnd ?? "17:00",
            createdById: ownerId
          }
        });

        // Create Invitation record with token hash
        const rawToken = crypto.randomBytes(24).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + linkExpiryDays * 24 * 60 * 60 * 1000);

        await tx.roomInvitation.create({
          data: {
            roomId: room.id,
            invitedById: ownerId,
            invitedUserId: inv.userId,
            email: inv.email || null,
            tokenHash,
            status: "PENDING",
            expiresAt
          }
        });
      }
    }

    return room;
  });
}

export async function recordTrackingConsent(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error("Room not found");

  const policyVersion = room.privacyPolicyVersion || 1;

  // Revoke previous consents for older versions
  await prisma.trackingConsent.updateMany({
    where: { roomId, userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });

  // Create new active consent record
  return await prisma.trackingConsent.create({
    data: {
      roomId,
      userId,
      policyVersion
    }
  });
}
