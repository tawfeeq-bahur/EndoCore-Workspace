-- CreateEnum
CREATE TYPE "AccessMode" AS ENUM ('OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING_APPROVAL', 'INVITED', 'REMOVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ScheduleExceptionType" AS ENUM ('LEAVE', 'HOLIDAY', 'SICK_DAY', 'MEETING', 'MANUAL_BREAK', 'OFFLINE_TIME', 'TIMEZONE_EXCEPTION');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('FOCUS_DEFICIT', 'DELIVERY_RISK', 'EXCESSIVE_CONTEXT_SWITCH', 'BURNOUT_WARNING');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('LEVEL_1_PRIVATE_NUDGE', 'LEVEL_2_OWNER_ADVISORY', 'LEVEL_3_CRITICAL_ROOM_ALERT');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('NATIVE', 'GITHUB', 'JIRA', 'LINEAR');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL DEFAULT '🚀',
    "category" TEXT NOT NULL DEFAULT 'Development',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "accessMode" "AccessMode" NOT NULL DEFAULT 'APPROVAL_REQUIRED',
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "aiPolicy" JSONB NOT NULL,
    "aiPolicyVersion" INTEGER NOT NULL DEFAULT 1,
    "privacyPolicy" JSONB NOT NULL,
    "privacyPolicyVersion" INTEGER NOT NULL DEFAULT 1,
    "allowAdminInvites" BOOLEAN NOT NULL DEFAULT true,
    "linkExpiryDays" INTEGER NOT NULL DEFAULT 7,
    "maxMemberCount" INTEGER NOT NULL DEFAULT 50,
    "requireVerifiedAccount" BOOLEAN NOT NULL DEFAULT false,
    "defaultMemberRole" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateTable
CREATE TABLE "RoomInvitation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "email" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedByUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberWorkTarget" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "focusMinutes" INTEGER NOT NULL DEFAULT 360,
    "taskTarget" INTEGER NOT NULL DEFAULT 5,
    "workingDays" TEXT NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    "workStart" TEXT NOT NULL DEFAULT '09:00',
    "workEnd" TEXT NOT NULL DEFAULT '17:00',
    "breakAllowanceMins" INTEGER NOT NULL DEFAULT 60,
    "deepWorkTargetMins" INTEGER NOT NULL DEFAULT 180,
    "minCheckinFreq" TEXT NOT NULL DEFAULT 'Daily',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,

    CONSTRAINT "MemberWorkTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamTarget" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "focusMinutes" INTEGER NOT NULL DEFAULT 2400,
    "taskPoints" INTEGER NOT NULL DEFAULT 50,
    "deadline" TIMESTAMP(3),
    "reportingPeriod" TEXT NOT NULL DEFAULT 'Weekly',
    "requiredCoverageHours" TEXT NOT NULL DEFAULT '09:00-17:00 UTC',
    "milestonesJson" JSONB NOT NULL DEFAULT '[]',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,

    CONSTRAINT "TeamTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberScheduleException" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ScheduleExceptionType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appCategory" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "activeSeconds" INTEGER NOT NULL,
    "idleSeconds" INTEGER NOT NULL DEFAULT 0,
    "contextSwitches" INTEGER NOT NULL DEFAULT 0,
    "isDeepWork" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL DEFAULT 'DESKTOP_AGENT',

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "source" "TaskSource" NOT NULL DEFAULT 'NATIVE',
    "externalId" TEXT,
    "externalUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMemberRollup" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "focusMinutes" INTEGER NOT NULL DEFAULT 0,
    "activeMinutes" INTEGER NOT NULL DEFAULT 0,
    "idleMinutes" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "storyPointsCompleted" INTEGER NOT NULL DEFAULT 0,
    "contextSwitches" INTEGER NOT NULL DEFAULT 0,
    "effortProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "focusQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formulaVersion" INTEGER NOT NULL DEFAULT 1,
    "weightDistribution" JSONB NOT NULL,
    "dataLimitations" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMemberRollup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEscalation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "currentLevel" "AlertLevel" NOT NULL DEFAULT 'LEVEL_1_PRIVATE_NUDGE',
    "firstDetectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privateNudgeSentAt" TIMESTAMP(3),
    "ownerAdvisorySentAt" TIMESTAMP(3),
    "criticalAlertSentAt" TIMESTAMP(3),
    "nextEvaluationAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "evidenceJson" JSONB NOT NULL,

    CONSTRAINT "AlertEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingConsent" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TrackingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "evidenceJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_idempotencyKey_key" ON "Room"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Room_ownerId_idx" ON "Room"("ownerId");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "RoomMember_roomId_membershipStatus_idx" ON "RoomMember"("roomId", "membershipStatus");

-- CreateIndex
CREATE INDEX "RoomMember_userId_idx" ON "RoomMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInvitation_tokenHash_key" ON "RoomInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "RoomInvitation_roomId_status_idx" ON "RoomInvitation"("roomId", "status");

-- CreateIndex
CREATE INDEX "RoomInvitation_email_idx" ON "RoomInvitation"("email");

-- CreateIndex
CREATE INDEX "RoomInvitation_invitedUserId_idx" ON "RoomInvitation"("invitedUserId");

-- CreateIndex
CREATE INDEX "MemberWorkTarget_roomId_userId_effectiveFrom_idx" ON "MemberWorkTarget"("roomId", "userId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "TeamTarget_roomId_effectiveFrom_idx" ON "TeamTarget"("roomId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "MemberScheduleException_roomId_userId_startsAt_endsAt_idx" ON "MemberScheduleException"("roomId", "userId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ActivitySession_roomId_startedAt_idx" ON "ActivitySession"("roomId", "startedAt");

-- CreateIndex
CREATE INDEX "ActivitySession_userId_startedAt_idx" ON "ActivitySession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "Task_roomId_status_idx" ON "Task"("roomId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "DailyMemberRollup_roomId_date_idx" ON "DailyMemberRollup"("roomId", "date");

-- CreateIndex
CREATE INDEX "DailyMemberRollup_userId_date_idx" ON "DailyMemberRollup"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMemberRollup_roomId_userId_date_key" ON "DailyMemberRollup"("roomId", "userId", "date");

-- CreateIndex
CREATE INDEX "AlertEscalation_roomId_userId_alertType_resolvedAt_idx" ON "AlertEscalation"("roomId", "userId", "alertType", "resolvedAt");

-- CreateIndex
CREATE INDEX "TrackingConsent_roomId_userId_policyVersion_idx" ON "TrackingConsent"("roomId", "userId", "policyVersion");

-- CreateIndex
CREATE INDEX "AiInsight_roomId_generatedAt_idx" ON "AiInsight"("roomId", "generatedAt");

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInvitation" ADD CONSTRAINT "RoomInvitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInvitation" ADD CONSTRAINT "RoomInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWorkTarget" ADD CONSTRAINT "MemberWorkTarget_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamTarget" ADD CONSTRAINT "TeamTarget_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberScheduleException" ADD CONSTRAINT "MemberScheduleException_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMemberRollup" ADD CONSTRAINT "DailyMemberRollup_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEscalation" ADD CONSTRAINT "AlertEscalation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingConsent" ADD CONSTRAINT "TrackingConsent_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
