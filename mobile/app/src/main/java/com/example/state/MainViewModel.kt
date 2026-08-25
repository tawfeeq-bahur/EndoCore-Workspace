package com.example.state

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.ActivityLogItem
import com.example.data.model.AiInsightsData
import com.example.data.model.AuditLogEntry
import com.example.data.model.CalendarEventItem
import com.example.data.model.DeveloperApp
import com.example.data.model.DevIntegrationItem
import com.example.data.model.EndpointComplianceStatus
import com.example.data.model.FocusSessionState
import com.example.data.model.GitCommitActivity
import com.example.data.model.IssueTicket
import com.example.data.model.PrivacyMode
import com.example.data.model.RoomGroup
import com.example.data.model.RoomMember
import com.example.data.model.TimelineEntry
import com.example.data.model.TimesheetEntry
import com.example.data.model.TimesheetSummary
import com.example.data.model.UserConnection
import com.example.data.network.EndoCoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = EndoCoreRepository.initialize(application)

    val focusState: StateFlow<FocusSessionState> = repository.focusState
    val timeline: StateFlow<List<TimelineEntry>> = repository.timeline
    val activityLogs: StateFlow<List<ActivityLogItem>> = repository.activityLogs
    val connections: StateFlow<List<UserConnection>> = repository.connections
    val rooms: StateFlow<List<RoomGroup>> = repository.rooms
    val insights: StateFlow<AiInsightsData> = repository.insights
    val auditLogs: StateFlow<List<AuditLogEntry>> = repository.auditLogs
    val complianceStatus: StateFlow<EndpointComplianceStatus> = repository.complianceStatus
    val serverUrl: StateFlow<String> = repository.serverUrl
    val jwtToken: StateFlow<String> = repository.jwtToken
    val isSocketConnected: StateFlow<Boolean> = repository.isSocketConnected
    val activePeerWave: StateFlow<PeerWaveNotification?> = repository.activePeerWave

    // Integrations & Timesheets
    val integrations: StateFlow<List<DevIntegrationItem>> = repository.integrations
    val gitCommits: StateFlow<List<GitCommitActivity>> = repository.gitCommits
    val issueTickets: StateFlow<List<IssueTicket>> = repository.issueTickets
    val calendarEvents: StateFlow<List<CalendarEventItem>> = repository.calendarEvents
    val timesheets: StateFlow<List<TimesheetEntry>> = repository.timesheets
    val timesheetSummary: StateFlow<TimesheetSummary> = repository.timesheetSummary

    // Full screen Workstation Telemetry Inspector Modal expansion state
    private val _isTelemetryModalExpanded = MutableStateFlow(false)
    val isTelemetryModalExpanded: StateFlow<Boolean> = _isTelemetryModalExpanded.asStateFlow()

    // 5-Step Commission Wizard Modal State
    private val _isCommissionWizardOpen = MutableStateFlow(false)
    val isCommissionWizardOpen: StateFlow<Boolean> = _isCommissionWizardOpen.asStateFlow()

    // 1v1 Challenge Modal State
    private val _challengedPeer = MutableStateFlow<UserConnection?>(null)
    val challengedPeer: StateFlow<UserConnection?> = _challengedPeer.asStateFlow()

    // Squad detail / Peer modal
    private val _selectedRoom = MutableStateFlow<RoomGroup?>(null)
    val selectedRoom: StateFlow<RoomGroup?> = _selectedRoom.asStateFlow()

    // Active Focus Guild
    private val _selectedGuildName = MutableStateFlow("NEW ROOM")
    val selectedGuildName: StateFlow<String> = _selectedGuildName.asStateFlow()

    // Live ping / toast notification message
    private val _pingToastMessage = MutableStateFlow<String?>(null)
    val pingToastMessage: StateFlow<String?> = _pingToastMessage.asStateFlow()

    init {
        viewModelScope.launch {
            repository.peerWaves.collect { ping ->
                _pingToastMessage.value = "${ping.senderEmoji} ${ping.senderName}: ${ping.message}"
            }
        }
    }

    fun openTelemetryModal() {
        _isTelemetryModalExpanded.value = true
    }

    fun closeTelemetryModal() {
        _isTelemetryModalExpanded.value = false
    }

    fun openCommissionWizard() {
        _isCommissionWizardOpen.value = true
    }

    fun closeCommissionWizard() {
        _isCommissionWizardOpen.value = false
    }

    fun open1v1Challenge(peer: UserConnection) {
        _challengedPeer.value = peer
    }

    fun close1v1Challenge() {
        _challengedPeer.value = null
    }

    fun setSelectedGuild(guild: String) {
        _selectedGuildName.value = guild
    }

    fun toggleTracking() {
        repository.toggleTracking()
    }

    fun togglePause() {
        repository.togglePause()
    }

    fun runDiagnosticsHealthCheck() {
        repository.runDiagnosticsHealthCheck()
    }

    fun startPomodoroFocus() {
        repository.startPomodoroFocus()
    }

    fun pausePomodoroFocus() {
        repository.pausePomodoroFocus()
    }

    fun resetPomodoro(durationMinutes: Int = 25) {
        repository.resetPomodoro(durationMinutes)
    }

    fun adjustPomodoroTime(deltaMinutes: Int) {
        repository.adjustPomodoroTime(deltaMinutes)
    }

    fun setPomodoroPreset(minutes: Int) {
        repository.setPomodoroPreset(minutes)
    }

    fun setSessionMode(mode: String) {
        repository.setSessionMode(mode)
    }

    fun skipSession() {
        repository.skipSession()
    }

    fun logDistraction() {
        repository.logDistraction()
    }

    fun resetDistractions() {
        repository.resetDistractions()
    }

    fun syncTaskName(taskName: String) {
        repository.syncTaskName(taskName)
    }

    fun switchActiveApp(app: DeveloperApp, project: String? = null) {
        repository.switchActiveApp(app, project)
    }

    fun setPrivacyMode(mode: PrivacyMode) {
        repository.setPrivacyMode(mode)
    }

    fun toggleDeepWork() {
        repository.toggleDeepWorkMode()
    }

    fun togglePomodoro() {
        repository.togglePomodoro()
    }

    fun sendConnectionWave(conn: UserConnection): Boolean {
        val success = repository.sendConnectionWave(conn.id)
        if (success) {
            _pingToastMessage.value = "👋 Sent peer wave to ${conn.name} (${conn.email})"
        } else {
            _pingToastMessage.value = "Wave cooldown active for ${conn.name} (${conn.waveCooldownSec}s remaining)"
        }
        return success
    }

    fun addConnection(email: String) {
        repository.addConnection(email)
        _pingToastMessage.value = "✨ Synced connection profile for $email"
    }

    fun commissionRoom(
        name: String,
        description: String,
        category: String,
        iconEmoji: String
    ) {
        repository.commissionRoom(name, description, category, iconEmoji)
        _isCommissionWizardOpen.value = false
        _pingToastMessage.value = "🚀 Commissioned Intelligence Room: #$name"
    }

    fun sendPeerPing(member: RoomMember, room: RoomGroup, customMessage: String? = null): Boolean {
        val success = repository.sendPeerWave(member.id, room.id, customMessage)
        if (success) {
            _pingToastMessage.value = "⚡ Sent sync ping to ${member.name} (${member.role})"
        } else {
            _pingToastMessage.value = "Rate-limit active for ${member.name} (${member.waveCooldownSec}s cooldown remaining)"
        }
        return success
    }

    fun toggleRoomBroadcast(roomId: String) {
        repository.toggleRoomBroadcast(roomId)
    }

    fun togglePinRoom(roomId: String) {
        repository.togglePinRoom(roomId)
    }

    fun selectRoom(room: RoomGroup?) {
        _selectedRoom.value = room
    }

    fun clearPingToast() {
        _pingToastMessage.value = null
    }

    fun updateServerConfig(url: String, token: String) {
        repository.updateServerConfig(url, token)
        _pingToastMessage.value = "Enterprise telemetry endpoint updated & authenticated!"
    }

    // ----------------------------------------------------
    // INTEGRATION ECOSYSTEM & TIMESHEET ACTIONS
    // ----------------------------------------------------
    fun toggleIntegration(integrationId: String) {
        repository.toggleIntegrationConnection(integrationId)
        val intItem = integrations.value.find { it.id == integrationId }
        val statusStr = if (intItem?.isConnected == true) "Disconnected" else "Connected"
        _pingToastMessage.value = "⚡ ${intItem?.name ?: "Integration"} $statusStr"
    }

    fun toggleAutoPauseCalendar(integrationId: String = "int_gcal") {
        repository.toggleAutoPauseCalendar(integrationId)
        _pingToastMessage.value = "🗓️ Auto-Pause focus during meetings updated"
    }

    fun syncTicketToActiveTask(ticket: IssueTicket) {
        repository.syncTicketToActiveTask(ticket.id)
        _pingToastMessage.value = "🎯 Synced active focus task: [${ticket.key}] ${ticket.title}"
    }

    fun logCommit(message: String, repo: String, branch: String = "main") {
        repository.logCommitManually(message, repo, branch)
        _pingToastMessage.value = "🚀 Synced Git commit to remote: $message"
    }

    fun addTimesheet(client: String, project: String, hours: Float, rate: Double = 120.0) {
        repository.addTimesheetEntry(client, project, hours, rate)
        _pingToastMessage.value = "⏱️ Logged $hours billable hrs for $project"
    }

    fun exportTimesheet(format: String): String {
        val result = repository.exportTimesheet(format)
        _pingToastMessage.value = "📥 Exported $format timesheet for payroll/invoicing"
        return result
    }

    // ----------------------------------------------------
    // E. ANDROID FOREGROUND SERVICE & DYNAMIC ISLAND ACTIONS
    // ----------------------------------------------------
    fun triggerSimulated1v1Challenge(
        senderName: String = "Arun",
        senderRole: String = "Research Associate"
    ) {
        repository.trigger1v1ChallengeAlert(senderName, senderRole)
    }

    fun dismissPeerWave() {
        repository.dismissPeerWave()
    }

    fun startForegroundService() {
        val app = getApplication<Application>()
        val task = focusState.value.projectName
        val isPaused = focusState.value.isPaused
        com.example.service.FocusForegroundService.startService(app, task, isPaused)
        _pingToastMessage.value = "⚡ Android Foreground Service active with ongoing notification"
    }

    fun stopForegroundService() {
        val app = getApplication<Application>()
        com.example.service.FocusForegroundService.stopService(app)
        _pingToastMessage.value = "🛑 Android Foreground Service stopped"
    }

    fun updateWidgets() {
        val app = getApplication<Application>()
        com.example.service.FocusWidgetProvider.updateAllWidgets(app)
        _pingToastMessage.value = "📱 Home Screen Focus Bento Widget refreshed"
    }
}


