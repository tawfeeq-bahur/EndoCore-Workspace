package com.example.data.model

data class RoomMember(
    val id: String,
    val name: String,
    val role: String,
    val avatarInitials: String,
    val avatarColorHex: Long,
    val currentActivity: String,
    val isOnline: Boolean,
    val activeApp: DeveloperApp,
    val activeProject: String,
    val activeBranch: String = "main",
    val focusScore: Int,
    val privacyMode: PrivacyMode,
    val lastHeartbeat: String,
    val waveCooldownSec: Int = 0,
    val agentLatencyMs: Int = 12
)

data class RoomGroup(
    val id: String,
    val name: String,
    val category: String,
    val description: String,
    val iconEmoji: String,
    val memberCount: Int,
    val activeCount: Int,
    val isBroadcasting: Boolean,
    val isPinned: Boolean,
    val healthScore: Int = 98,
    val incidentStatus: String = "NORMAL", // NORMAL, P1_ALERT, DEGRADED
    val members: List<RoomMember>
)

data class PeerWaveNotification(
    val id: String,
    val senderName: String,
    val senderRole: String = "Research Associate",
    val senderEmoji: String = "⚡",
    val message: String = "sent 1v1 Pomodoro focus sprint challenge",
    val isChallenge1v1: Boolean = true,
    val timestamp: Long = System.currentTimeMillis()
)
