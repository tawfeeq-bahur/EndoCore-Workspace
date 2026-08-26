package com.example.data.model

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

/**
 * Supported Developer Ecosystem Platforms
 */
enum class IntegrationCategory(val displayName: String) {
    DEV_OPS("DevOps & Repos"),
    ISSUE_TRACKER("Issue Tracking"),
    CALENDAR_MEETINGS("Calendar & Meetings"),
    COMMUNICATION("Team Comms")
}

data class DevIntegrationItem(
    val id: String,
    val name: String,
    val provider: String,
    val category: IntegrationCategory,
    val isConnected: Boolean,
    val accountHandle: String?,
    val lastSyncTime: String,
    val syncStatusText: String,
    val activeEntityCount: Int,
    val primaryEntityLabel: String,
    val autoPauseEnabled: Boolean = false,
    val syncCommitsEnabled: Boolean = true,
    val syncIssuesEnabled: Boolean = true
)

data class GitCommitActivity(
    val id: String,
    val repoName: String,
    val branch: String,
    val commitHash: String,
    val message: String,
    val author: String,
    val timestamp: String,
    val additions: Int,
    val deletions: Int
)

data class IssueTicket(
    val id: String,
    val key: String, // e.g. "EC-408" or "LIN-92"
    val title: String,
    val provider: String, // "Jira" or "Linear"
    val status: String, // "In Progress", "In Review", "Todo"
    val priority: String, // "High", "Urgent", "Medium"
    val estimatedHours: Float,
    val loggedHours: Float,
    val isTrackingActive: Boolean = false
)

data class CalendarEventItem(
    val id: String,
    val title: String,
    val startTime: String,
    val endTime: String,
    val durationMinutes: Int,
    val organizer: String,
    val isMeetingActiveNow: Boolean,
    val autoPauseTriggered: Boolean = false
)

data class TimesheetEntry(
    val id: String,
    val clientName: String,
    val projectName: String,
    val teamMember: String,
    val billableHours: Float,
    val nonBillableHours: Float,
    val hourlyRate: Double,
    val totalBilled: Double,
    val period: String,
    val status: String // "Approved", "Pending Review", "Exported"
)

data class TimesheetSummary(
    val totalBillableHours: Float,
    val totalNonBillableHours: Float,
    val totalRevenue: Double,
    val billableEfficiencyRate: Int, // e.g. 84%
    val activeProjectsCount: Int,
    val currency: String = "USD"
)
