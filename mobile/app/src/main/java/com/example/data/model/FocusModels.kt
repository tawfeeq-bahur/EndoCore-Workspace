package com.example.data.model

enum class PrivacyMode(val title: String, val description: String, val badgeColor: Long) {
    ENTERPRISE_AUDIT("Enterprise Full Audit", "Broadcasts active IDE, workspace repository, and active branch telemetry", 0xFF10B981),
    SQUAD_OBSERVABILITY("Squad Telemetry", "Broadcasts app name & project, masks internal file paths", 0xFF06B6D4),
    ENCRYPTED_PRIVATE("Encrypted Private", "Masks all telemetry except active status (Enterprise compliance safe)", 0xFF8B5CF6)
}

enum class DeveloperApp(
    val appName: String,
    val defaultProject: String,
    val category: String,
    val iconName: String,
    val brandColorHex: Long
) {
    ANTIGRAVITY_IDE("Antigravity IDE", "EndoCore Workspace Pipeline", "Primary IDE", "code", 0xFF00B37E),
    VS_CODE("Visual Studio Code", "endocore-core-engine", "IDE / Code", "code", 0xFF007ACC),
    CURSOR("Cursor AI Editor", "endocore-engine", "AI Editor", "code", 0xFF8B5CF6),
    ANDROID_STUDIO("Android Studio", "endocore-mobile-app", "Mobile IDE", "android", 0xFF3DDC84),
    INTELLIJ("IntelliJ IDEA", "gateway-microservice", "JVM Backend", "code", 0xFFFE315D),
    DOCKER("Docker Desktop", "k8s-local-cluster", "Containers", "container", 0xFF2496ED),
    POSTMAN("Postman / Insomnia", "v2-auth-endpoints", "API Testing", "api", 0xFFFF6C37),
    TERMINAL("Ghostty / Zsh", "docker-compose & tests", "DevOps / CLI", "terminal", 0xFFF59E0B),
    CHROME("Google Chrome DevTools", "Pull Requests & Docs", "Web / Docs", "web", 0xFF4285F4),
    FIGMA("Figma Enterprise", "Design System v3", "Design Systems", "design", 0xFFF24E1E),
    SLACK("Slack Enterprise", "#incident-war-room", "Team Comms", "chat", 0xFF4A154B),
    GITKRAKEN("GitKraken / GitHub", "release-2.5-rc", "Version Control", "git", 0xFF179287)
}

data class WorkstationTelemetry(
    val cpuLoadPercent: Int = 24,
    val memoryUsageMb: Long = 7120L,
    val contextSwitchesPerHour: Int = 3,
    val agentLatencyMs: Int = 12,
    val activeBranch: String = "feat/telemetry-vault-sync",
    val lastCommitHash: String = "7f9b2a1",
    val openPrCount: Int = 2,
    val pipelineStatus: String = "SUCCESS (99.2%)",
    val buildTimeSec: Float = 14.8f
)

data class PipelineDiagnostics(
    val restApi: String = "ONLINE",
    val websockets: String = "CONNECTED",
    val supabaseDb: String = "CONNECTED",
    val desktopAgent: String = "OFFLINE",
    val geminiAi: String = "ACTIVE",
    val isHealthy: Boolean = true,
    val lastHealthCheckTime: String = "21:47:08 UTC"
)

data class ActivityLogItem(
    val id: String,
    val timestamp: String,
    val dateTag: String = "AUG 14",
    val processName: String,
    val windowName: String,
    val durationText: String = "Active",
    val isOnline: Boolean = true
)

data class DistractionStats(
    val agentFlags: Int = 0,
    val manualFlags: Int = 0,
    val streakDays: Int = 3,
    val daysRemainingForReward: Int = 4
)

data class UserConnection(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val avatarInitials: String,
    val avatarColorHex: Long,
    val isOnline: Boolean = false,
    val currentRoom: String = "NO VISIBLE ROOM WORKSPACE",
    val focusTimeToday: String = "0m Focused Today",
    val waveCooldownSec: Int = 0
)

data class FocusSessionState(
    val isTracking: Boolean = false,
    val isPaused: Boolean = true,
    val activeApp: DeveloperApp = DeveloperApp.ANTIGRAVITY_IDE,
    val projectName: String = "EndoCore Workspace Pipeline",
    val windowTitle: String = "endocore-workspace.onrender.com - Live",
    val elapsedSeconds: Long = 0L,
    val targetGoalSeconds: Long = 21600L, // 6h goal
    val privacyMode: PrivacyMode = PrivacyMode.SQUAD_OBSERVABILITY,
    val isDeepWorkMode: Boolean = false,
    val isPomodoroActive: Boolean = false,
    val pomodoroMinutesRemaining: Int = 25,
    val pomodoroSecondsLeft: Int = 25 * 60,
    val sessionMode: String = "Focus (25m)", // "Focus (25m)" or "Break (5m)"
    val dailyFocusScore: Int = 0,
    val diagnostics: PipelineDiagnostics = PipelineDiagnostics(),
    val distractionStats: DistractionStats = DistractionStats(),
    val telemetry: WorkstationTelemetry = WorkstationTelemetry()
)

data class TimelineEntry(
    val id: String,
    val timeLabel: String,
    val durationText: String,
    val app: DeveloperApp,
    val projectName: String,
    val titleSanitized: String,
    val latencyMs: Int = 14,
    val statusTag: String = "SUCCESS"
)

