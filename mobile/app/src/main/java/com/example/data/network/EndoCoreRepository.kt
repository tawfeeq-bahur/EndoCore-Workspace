package com.example.data.network

import android.content.Context
import androidx.room.Room
import com.example.data.local.AppDatabase
import com.example.data.local.FocusSessionEntity
import com.example.data.model.ActivityLogItem
import com.example.data.model.AiInsightsData
import com.example.data.model.AnalyticsPoint
import com.example.data.model.AuditLogEntry
import com.example.data.model.AuditSeverity
import com.example.data.model.CalendarEventItem
import com.example.data.model.DeveloperApp
import com.example.data.model.DevIntegrationItem
import com.example.data.model.DistractionStats
import com.example.data.model.EndpointComplianceStatus
import com.example.data.model.FocusSessionState
import com.example.data.model.GitCommitActivity
import com.example.data.model.IntegrationCategory
import com.example.data.model.IssueTicket
import com.example.data.model.PeerWaveNotification
import com.example.data.model.PipelineDiagnostics
import com.example.data.model.PrivacyMode
import com.example.data.model.RoomGroup
import com.example.data.model.RoomMember
import com.example.data.model.ScrumBriefing
import com.example.data.model.TimelineEntry
import com.example.data.model.TimesheetEntry
import com.example.data.model.TimesheetSummary
import com.example.data.model.UserConnection
import com.example.data.model.WellnessBriefing
import com.example.data.model.WorkstationTelemetry
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlin.random.Random

class EndoCoreRepository(context: Context) {
    private val db = Room.databaseBuilder(
        context.applicationContext,
        AppDatabase::class.java,
        "endocore_db"
    ).fallbackToDestructiveMigration().build()

    private val scope = CoroutineScope(Dispatchers.Default)

    // Current Workstation Telemetry & Focus State
    private val _focusState = MutableStateFlow(
        FocusSessionState(
            isTracking = false,
            isPaused = true,
            activeApp = DeveloperApp.ANTIGRAVITY_IDE,
            projectName = "EndoCore Workspace",
            windowTitle = "EndoCore Workstation Pipeline - Live",
            elapsedSeconds = 0L,
            targetGoalSeconds = 21600L, // 6h goal
            privacyMode = PrivacyMode.SQUAD_OBSERVABILITY,
            isDeepWorkMode = false,
            isPomodoroActive = false,
            pomodoroMinutesRemaining = 25,
            pomodoroSecondsLeft = 25 * 60,
            sessionMode = "Focus (25m)",
            dailyFocusScore = 0,
            diagnostics = PipelineDiagnostics(
                restApi = "ONLINE",
                websockets = "CONNECTED",
                supabaseDb = "CONNECTED",
                desktopAgent = "OFFLINE",
                geminiAi = "ACTIVE",
                isHealthy = true,
                lastHealthCheckTime = "21:47:08 UTC"
            ),
            distractionStats = DistractionStats(
                agentFlags = 0,
                manualFlags = 0,
                streakDays = 3,
                daysRemainingForReward = 4
            ),
            telemetry = WorkstationTelemetry(
                cpuLoadPercent = 18,
                memoryUsageMb = 6420L,
                contextSwitchesPerHour = 0,
                agentLatencyMs = 12,
                activeBranch = "main",
                lastCommitHash = "9d3e41b",
                openPrCount = 1,
                pipelineStatus = "PIPELINE HEALTHY",
                buildTimeSec = 12.4f
            )
        )
    )
    val focusState: StateFlow<FocusSessionState> = _focusState.asStateFlow()

    // Activity Logs matching website Screenshot 2
    private val _activityLogs = MutableStateFlow<List<ActivityLogItem>>(
        listOf(
            ActivityLogItem("act_1", "06:51 AM", "AUG 14", "LockApp.exe", "Windows Default Lock Screen"),
            ActivityLogItem("act_2", "06:44 AM", "AUG 14", "Windows Explorer", "UnlockingWindow"),
            ActivityLogItem("act_3", "06:37 AM", "AUG 14", "Task Manager", "Task Manager"),
            ActivityLogItem("act_4", "06:37 AM", "AUG 14", "Electron", "EndoCore Workstation Pipeline"),
            ActivityLogItem("act_5", "06:37 AM", "AUG 14", "Electron", "EndoCore Workstation Pipeline")
        )
    )
    val activityLogs: StateFlow<List<ActivityLogItem>> = _activityLogs.asStateFlow()

    // Connections matching website Screenshots 6 & 7
    private val _connections = MutableStateFlow<List<UserConnection>>(
        listOf(
            UserConnection("c1", "Ravi", "ravi@example.com", "UI/UX Designer", "RA", 0xFF6366F1, isOnline = false, currentRoom = "NO VISIBLE ROOM WORKSPACE", focusTimeToday = "0m Focused Today"),
            UserConnection("c2", "Arun", "arun@example.com", "Research Associate", "AR", 0xFF10B981, isOnline = false, currentRoom = "NO VISIBLE ROOM WORKSPACE", focusTimeToday = "0m Focused Today"),
            UserConnection("c3", "TAWFEEQ", "tawfeeqb.23aid@kongu.edu", "Software Developer", "TB", 0xFF00B37E, isOnline = false, currentRoom = "NO VISIBLE ROOM WORKSPACE", focusTimeToday = "0m Focused Today"),
            UserConnection("c4", "Sri", "sriramknr63@gmail.com", "Software Developer", "SR", 0xFFEC4899, isOnline = false, currentRoom = "NO VISIBLE ROOM WORKSPACE", focusTimeToday = "0m Focused Today"),
            UserConnection("c5", "vicky", "vwar142@gmail.com", "Software Developer", "VI", 0xFFF59E0B, isOnline = false, currentRoom = "NO VISIBLE ROOM WORKSPACE", focusTimeToday = "0m Focused Today")
        )
    )
    val connections: StateFlow<List<UserConnection>> = _connections.asStateFlow()

    // Activity Timeline History
    private val _timeline = MutableStateFlow<List<TimelineEntry>>(
        listOf(
            TimelineEntry("t1", "09:00 - 10:15", "1h 15m", DeveloperApp.ANTIGRAVITY_IDE, "EndoCore Workspace", "auth/jwt-strategy.ts (1,240 LOC)", 11, "COMPILED"),
            TimelineEntry("t2", "10:15 - 10:35", "20m", DeveloperApp.CHROME, "GitHub PR Review", "PR #142: Realtime telemetry stream sync", 14, "APPROVED"),
            TimelineEntry("t3", "10:35 - 11:20", "45m", DeveloperApp.DOCKER, "k8s-local-cluster", "docker-compose up redis & supabase", 9, "RUNNING"),
            TimelineEntry("t4", "11:20 - 11:55", "35m", DeveloperApp.TERMINAL, "DevOps / Zsh", "cargo test --release / integration-tests", 12, "PASSED"),
            TimelineEntry("t5", "11:55 - 12:45", "50m", DeveloperApp.POSTMAN, "v2-auth-endpoints", "OAuth2 & JWT Token Introspection Test", 16, "VERIFIED"),
            TimelineEntry("t6", "13:00 - NOW", "43m", DeveloperApp.ANTIGRAVITY_IDE, "EndoCore Workspace", "Heartbeat & peer telemetry broadcast", 10, "ACTIVE")
        )
    )
    val timeline: StateFlow<List<TimelineEntry>> = _timeline.asStateFlow()

    // Enterprise Squads & Fleet Clusters
    private val _rooms = MutableStateFlow<List<RoomGroup>>(getInitialRooms())
    val rooms: StateFlow<List<RoomGroup>> = _rooms.asStateFlow()

    // AI Observability & Executive Analytics
    private val _insights = MutableStateFlow(getInitialInsights())
    val insights: StateFlow<AiInsightsData> = _insights.asStateFlow()

    // Security & Telemetry Audit Stream
    private val _auditLogs = MutableStateFlow<List<AuditLogEntry>>(getInitialAuditLogs())
    val auditLogs: StateFlow<List<AuditLogEntry>> = _auditLogs.asStateFlow()

    // Endpoint Compliance Status
    private val _complianceStatus = MutableStateFlow(EndpointComplianceStatus())
    val complianceStatus: StateFlow<EndpointComplianceStatus> = _complianceStatus.asStateFlow()

    // ----------------------------------------------------
    // D. INTEGRATIONS ECOSYSTEM & TIMESHEET EXPORT STATE
    // ----------------------------------------------------
    private val _integrations = MutableStateFlow<List<DevIntegrationItem>>(getInitialIntegrations())
    val integrations: StateFlow<List<DevIntegrationItem>> = _integrations.asStateFlow()

    private val _gitCommits = MutableStateFlow<List<GitCommitActivity>>(getInitialGitCommits())
    val gitCommits: StateFlow<List<GitCommitActivity>> = _gitCommits.asStateFlow()

    private val _issueTickets = MutableStateFlow<List<IssueTicket>>(getInitialIssueTickets())
    val issueTickets: StateFlow<List<IssueTicket>> = _issueTickets.asStateFlow()

    private val _calendarEvents = MutableStateFlow<List<CalendarEventItem>>(getInitialCalendarEvents())
    val calendarEvents: StateFlow<List<CalendarEventItem>> = _calendarEvents.asStateFlow()

    private val _timesheets = MutableStateFlow<List<TimesheetEntry>>(getInitialTimesheets())
    val timesheets: StateFlow<List<TimesheetEntry>> = _timesheets.asStateFlow()

    private val _timesheetSummary = MutableStateFlow(calculateTimesheetSummary())
    val timesheetSummary: StateFlow<TimesheetSummary> = _timesheetSummary.asStateFlow()

    // Peer Workstation Ping Notification Stream
    private val _peerWaves = MutableSharedFlow<PeerWaveNotification>(extraBufferCapacity = 5)
    val peerWaves: SharedFlow<PeerWaveNotification> = _peerWaves.asSharedFlow()

    private val _activePeerWave = MutableStateFlow<PeerWaveNotification?>(null)
    val activePeerWave: StateFlow<PeerWaveNotification?> = _activePeerWave.asStateFlow()

    // Enterprise Endpoint Configuration
    private val _serverUrl = MutableStateFlow("https://telemetry.endocore.enterprise.internal")
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _jwtToken = MutableStateFlow("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.endocore_enterprise_agent_token")
    val jwtToken: StateFlow<String> = _jwtToken.asStateFlow()

    private val _isSocketConnected = MutableStateFlow(true)
    val isSocketConnected: StateFlow<Boolean> = _isSocketConnected.asStateFlow()

    init {
        startTelemetryHeartbeat()
        startLiveAuditStream()
        startPeerPingSimulation()
        startPomodoroTimerLoop()
    }

    private fun startPomodoroTimerLoop() {
        scope.launch {
            while (isActive) {
                delay(1000)
                _focusState.update { current ->
                    if (current.isPomodoroActive && current.pomodoroSecondsLeft > 0) {
                        val newSeconds = current.pomodoroSecondsLeft - 1
                        val newMinutes = newSeconds / 60
                        current.copy(
                            pomodoroSecondsLeft = newSeconds,
                            pomodoroMinutesRemaining = newMinutes
                        )
                    } else if (current.isPomodoroActive && current.pomodoroSecondsLeft == 0) {
                        // Switch session mode automatically when timer completes
                        val nextMode = if (current.sessionMode.startsWith("Focus")) "Break (5m)" else "Focus (25m)"
                        val nextSeconds = if (nextMode.startsWith("Focus")) 25 * 60 else 5 * 60
                        current.copy(
                            sessionMode = nextMode,
                            pomodoroSecondsLeft = nextSeconds,
                            pomodoroMinutesRemaining = nextSeconds / 60,
                            isPomodoroActive = false
                        )
                    } else {
                        current
                    }
                }
            }
        }
    }

    private fun startTelemetryHeartbeat() {
        scope.launch {
            while (isActive) {
                delay(1000)
                _focusState.update { current ->
                    val newElapsed = if (current.isTracking && !current.isPaused) current.elapsedSeconds + 1 else current.elapsedSeconds
                    // Calculate productivity score based on elapsed focus time vs target
                    val score = if (current.targetGoalSeconds > 0) {
                        ((newElapsed.toFloat() / current.targetGoalSeconds.toFloat()) * 100f).toInt().coerceIn(0, 100)
                    } else 0
                    
                    // Simulate minor CPU & latency telemetry jitter for realistic observability
                    val jitterCpu = (24 + (Random.nextInt(10) - 4)).coerceIn(12, 65)
                    val jitterLatency = (12 + (Random.nextInt(6) - 3)).coerceIn(7, 28)
                    current.copy(
                        elapsedSeconds = newElapsed,
                        dailyFocusScore = score,
                        telemetry = current.telemetry.copy(
                            cpuLoadPercent = jitterCpu,
                            agentLatencyMs = jitterLatency
                        )
                    )
                }
            }
        }

        // Decrement peer ping cooldowns
        scope.launch {
            while (isActive) {
                delay(1000)
                _rooms.update { roomList ->
                    roomList.map { room ->
                        room.copy(
                            members = room.members.map { member ->
                                if (member.waveCooldownSec > 0) {
                                    member.copy(waveCooldownSec = member.waveCooldownSec - 1)
                                } else member
                            }
                        )
                    }
                }
                _connections.update { connList ->
                    connList.map { conn ->
                        if (conn.waveCooldownSec > 0) {
                            conn.copy(waveCooldownSec = conn.waveCooldownSec - 1)
                        } else conn
                    }
                }
            }
        }
    }

    private fun startLiveAuditStream() {
        scope.launch {
            delay(12000)
            val actions = listOf(
                Pair("TELEMETRY_SYNC", "Encrypted metrics heartbeat dispatched to telemetry gateway"),
                Pair("BRANCH_INDEX", "Git index diff checked: 0 unstaged conflicts detected"),
                Pair("POLICY_VERIFY", "Agent PII filter verified: 100% tokens masked in log output"),
                Pair("CLUSTER_PULSE", "Fleet cluster health check: 24/24 active nodes reachable (99.98% SLA)")
            )
            while (isActive) {
                val (action, detail) = actions.random()
                val newLog = AuditLogEntry(
                    id = "aud_${System.currentTimeMillis()}",
                    timestamp = "Just now",
                    category = "SYSTEM_OBSERVABILITY",
                    action = action,
                    detail = detail,
                    severity = AuditSeverity.SUCCESS,
                    latencyMs = Random.nextInt(8, 20)
                )
                _auditLogs.update { current ->
                    listOf(newLog) + current.take(29)
                }
                delay(25000)
            }
        }
    }

    private fun startPeerPingSimulation() {
        scope.launch {
            delay(16000)
            while (isActive) {
                val senders = listOf("Ravi (UI/UX Designer)", "Sri (Software Developer)", "Arun (Research Associate)", "vicky (Software Developer)")
                val messages = listOf(
                    "sent a peer sync wave from #Engineering Team",
                    "acknowledged active focus block in EndoCore Workspace",
                    "sent 1v1 Pomodoro focus sprint challenge",
                    "synced workstation telemetry status"
                )
                val randomSender = senders.random()
                val randomMsg = messages.random()
                _peerWaves.tryEmit(
                    PeerWaveNotification(
                        id = System.currentTimeMillis().toString(),
                        senderName = randomSender,
                        senderEmoji = "⚡",
                        message = randomMsg
                    )
                )
                delay(40000)
            }
        }
    }

    fun toggleTracking() {
        _focusState.update { it.copy(isTracking = !it.isTracking, isPaused = false) }
    }

    fun togglePause() {
        _focusState.update { 
            val newPaused = !it.isPaused
            it.copy(
                isPaused = newPaused,
                isTracking = if (newPaused) it.isTracking else true,
                diagnostics = it.diagnostics.copy(
                    desktopAgent = if (newPaused) "OFFLINE" else "ACTIVE"
                )
            )
        }
    }

    fun startPomodoroFocus() {
        _focusState.update { 
            it.copy(
                isPomodoroActive = true,
                isTracking = true,
                isPaused = false
            )
        }
    }

    fun pausePomodoroFocus() {
        _focusState.update { it.copy(isPomodoroActive = false) }
    }

    fun resetPomodoro(durationMinutes: Int = 25) {
        _focusState.update {
            it.copy(
                isPomodoroActive = false,
                pomodoroMinutesRemaining = durationMinutes,
                pomodoroSecondsLeft = durationMinutes * 60
            )
        }
    }

    fun adjustPomodoroTime(deltaMinutes: Int) {
        _focusState.update { current ->
            val newSeconds = (current.pomodoroSecondsLeft + deltaMinutes * 60).coerceIn(60, 180 * 60)
            current.copy(
                pomodoroSecondsLeft = newSeconds,
                pomodoroMinutesRemaining = newSeconds / 60
            )
        }
    }

    fun setPomodoroPreset(minutes: Int) {
        _focusState.update {
            it.copy(
                isPomodoroActive = false,
                pomodoroMinutesRemaining = minutes,
                pomodoroSecondsLeft = minutes * 60
            )
        }
    }

    fun setSessionMode(mode: String) {
        val minutes = if (mode.startsWith("Break")) 5 else 25
        _focusState.update {
            it.copy(
                sessionMode = mode,
                isPomodoroActive = false,
                pomodoroMinutesRemaining = minutes,
                pomodoroSecondsLeft = minutes * 60
            )
        }
    }

    fun skipSession() {
        _focusState.update { current ->
            val nextMode = if (current.sessionMode.startsWith("Focus")) "Break (5m)" else "Focus (25m)"
            val nextMinutes = if (nextMode.startsWith("Focus")) 25 else 5
            current.copy(
                sessionMode = nextMode,
                isPomodoroActive = false,
                pomodoroMinutesRemaining = nextMinutes,
                pomodoroSecondsLeft = nextMinutes * 60
            )
        }
    }

    fun logDistraction() {
        _focusState.update { current ->
            current.copy(
                distractionStats = current.distractionStats.copy(
                    manualFlags = current.distractionStats.manualFlags + 1
                )
            )
        }
    }

    fun resetDistractions() {
        _focusState.update { current ->
            current.copy(
                distractionStats = current.distractionStats.copy(
                    agentFlags = 0,
                    manualFlags = 0
                )
            )
        }
    }

    fun syncTaskName(taskName: String) {
        _focusState.update { current ->
            current.copy(
                projectName = taskName.ifBlank { "EndoCore Workspace" }
            )
        }
    }

    fun runDiagnosticsHealthCheck() {
        scope.launch {
            _focusState.update {
                it.copy(
                    diagnostics = it.diagnostics.copy(
                        restApi = "TESTING...",
                        websockets = "TESTING...",
                        supabaseDb = "TESTING...",
                        geminiAi = "TESTING..."
                    )
                )
            }
            delay(1200)
            _focusState.update {
                it.copy(
                    diagnostics = PipelineDiagnostics(
                        restApi = "ONLINE",
                        websockets = "CONNECTED",
                        supabaseDb = "CONNECTED",
                        desktopAgent = if (it.isPaused) "OFFLINE" else "ACTIVE",
                        geminiAi = "ACTIVE",
                        isHealthy = true,
                        lastHealthCheckTime = "Just now"
                    )
                )
            }
        }
    }

    fun switchActiveApp(app: DeveloperApp, project: String? = null) {
        _focusState.update { current ->
            val proj = project ?: app.defaultProject
            val title = when (app) {
                DeveloperApp.ANTIGRAVITY_IDE -> "EndoCore Workspace Pipeline - Live"
                DeveloperApp.VS_CODE -> "src/auth/jwt-strategy.ts - EndoCore"
                DeveloperApp.CURSOR -> "prompt: refactor workstation telemetry hook"
                DeveloperApp.ANDROID_STUDIO -> "MainActivity.kt [EndoCore Enterprise]"
                DeveloperApp.INTELLIJ -> "GatewayRouter.kt [microservices-gateway]"
                DeveloperApp.DOCKER -> "Containers: 8 running | Supabase, PostgreSQL, Redis"
                DeveloperApp.POSTMAN -> "POST /api/v2/telemetry/heartbeat (200 OK)"
                DeveloperApp.CHROME -> "GitHub PR #142: Realtime telemetry stream sync"
                DeveloperApp.FIGMA -> "EndoCore Enterprise Observability Design System"
                DeveloperApp.TERMINAL -> "cargo test --release (32/32 passed)"
                DeveloperApp.SLACK -> "#incident-war-room [Scrum Updates]"
                DeveloperApp.GITKRAKEN -> "commit 9d3e41b on feat/telemetry-vault-sync"
            }
            current.copy(
                activeApp = app,
                projectName = proj,
                windowTitle = title
            )
        }
    }

    fun setPrivacyMode(mode: PrivacyMode) {
        _focusState.update { it.copy(privacyMode = mode) }
    }

    fun toggleDeepWorkMode() {
        _focusState.update { it.copy(isDeepWorkMode = !it.isDeepWorkMode) }
    }

    fun togglePomodoro() {
        _focusState.update { it.copy(isPomodoroActive = !it.isPomodoroActive) }
    }

    fun sendConnectionWave(connectionId: String): Boolean {
        var sent = false
        _connections.update { list ->
            list.map { conn ->
                if (conn.id == connectionId && conn.waveCooldownSec <= 0) {
                    sent = true
                    conn.copy(waveCooldownSec = 60)
                } else conn
            }
        }
        return sent
    }

    fun addConnection(email: String) {
        val name = email.substringBefore("@").replaceFirstChar { it.uppercase() }
        val initials = name.take(2).uppercase()
        val newConn = UserConnection(
            id = "c_${System.currentTimeMillis()}",
            name = name,
            email = email,
            role = "Software Engineer",
            avatarInitials = initials,
            avatarColorHex = 0xFF10B981,
            isOnline = true,
            currentRoom = "NO VISIBLE ROOM WORKSPACE",
            focusTimeToday = "0m Focused Today"
        )
        _connections.update { listOf(newConn) + it }
    }

    fun commissionRoom(
        name: String,
        description: String,
        category: String,
        iconEmoji: String
    ) {
        val newRoom = RoomGroup(
            id = "g_${System.currentTimeMillis()}",
            name = name,
            category = category.uppercase(),
            description = description,
            iconEmoji = iconEmoji,
            memberCount = 1,
            activeCount = 1,
            isBroadcasting = true,
            isPinned = true,
            healthScore = 100,
            incidentStatus = "NORMAL",
            members = listOf(
                RoomMember("m_self", "TAWFEEQ", "Software Developer", "TB", 0xFF00B37E, "Active in $name", true, DeveloperApp.ANTIGRAVITY_IDE, name, "main", 100, PrivacyMode.SQUAD_OBSERVABILITY, "Just now", 0, 11)
            )
        )
        _rooms.update { listOf(newRoom) + it }
    }

    fun sendPeerWave(memberId: String, roomId: String, messageText: String? = null): Boolean {
        var sent = false
        _rooms.update { roomList ->
            roomList.map { room ->
                if (room.id == roomId) {
                    val updatedMembers = room.members.map { member ->
                        if (member.id == memberId && member.waveCooldownSec <= 0) {
                            sent = true
                            member.copy(waveCooldownSec = 300) // 5 min cooldown as per specification
                        } else member
                    }
                    room.copy(members = updatedMembers)
                } else room
            }
        }
        return sent
    }

    fun toggleRoomBroadcast(roomId: String) {
        _rooms.update { roomList ->
            roomList.map { room ->
                if (room.id == roomId) {
                    room.copy(isBroadcasting = !room.isBroadcasting)
                } else room
            }
        }
    }

    fun togglePinRoom(roomId: String) {
        _rooms.update { roomList ->
            roomList.map { room ->
                if (room.id == roomId) {
                    room.copy(isPinned = !room.isPinned)
                } else room
            }
        }
    }

    fun updateServerConfig(url: String, token: String) {
        _serverUrl.value = url
        _jwtToken.value = token
    }

    private fun getInitialRooms(): List<RoomGroup> {
        val membersEngine = listOf(
            RoomMember("m1", "Tawfeeq Bahur", "Lead Systems Architect", "TB", 0xFF00E5FF, "Deep Work: JWT Auth", true, DeveloperApp.VS_CODE, "endocore-core-engine", "feat/vault-sync", 93, PrivacyMode.SQUAD_OBSERVABILITY, "Just now", 0, 11),
            RoomMember("m2", "Sarah Lin", "Staff Backend Eng", "SL", 0xFF9D4EDD, "Deep Work: Sync Gateway", true, DeveloperApp.VS_CODE, "auth-service-v2", "main", 95, PrivacyMode.ENTERPRISE_AUDIT, "2m ago", 0, 14),
            RoomMember("m3", "Alex Chen", "Senior Systems Eng", "AC", 0xFF10B981, "Code Reviewing PR #189", true, DeveloperApp.CHROME, "pr-engine-review", "pr-189", 88, PrivacyMode.SQUAD_OBSERVABILITY, "4m ago", 0, 9),
            RoomMember("m4", "Elena Rostova", "AI Platform Lead", "ER", 0xFFF59E0B, "Telemetry Model Benchmarking", true, DeveloperApp.TERMINAL, "gemini-telemetry-engine", "master", 97, PrivacyMode.ENTERPRISE_AUDIT, "1m ago", 0, 12),
            RoomMember("m5", "Devon Vance", "Cloud DevOps Eng", "DV", 0xFFEC4899, "Cluster Deployment Sync", true, DeveloperApp.DOCKER, "k8s-us-east-1", "infra/prod", 76, PrivacyMode.ENCRYPTED_PRIVATE, "12m ago", 0, 18)
        )

        val membersInfra = listOf(
            RoomMember("m1", "Tawfeeq Bahur", "Lead Systems Architect", "TB", 0xFF00E5FF, "Active Telemetry Sync", true, DeveloperApp.VS_CODE, "endocore-core-engine", "feat/vault-sync", 93, PrivacyMode.SQUAD_OBSERVABILITY, "Just now", 0, 11),
            RoomMember("m8", "Marcus Brody", "SecOps Principal", "MB", 0xFF8B5CF6, "Audit Log Stream Guard", true, DeveloperApp.POSTMAN, "vault-crypto-service", "security-audit", 96, PrivacyMode.ENTERPRISE_AUDIT, "3m ago", 0, 8),
            RoomMember("m9", "Zack Knight", "Kernel & eBPF Specialist", "ZK", 0xFF10B981, "eBPF Probe Profiling", true, DeveloperApp.TERMINAL, "ebpf-telemetry-probes", "kernel-opt", 94, PrivacyMode.ENCRYPTED_PRIVATE, "5m ago", 0, 15)
        )

        val membersMobile = listOf(
            RoomMember("m1", "Tawfeeq Bahur", "Lead Systems Architect", "TB", 0xFF00E5FF, "Compose Telemetry UI", true, DeveloperApp.ANDROID_STUDIO, "endocore-mobile-app", "feature/m3-enterprise-ui", 93, PrivacyMode.SQUAD_OBSERVABILITY, "Just now", 0, 11),
            RoomMember("m10", "Chloe Dubois", "Mobile Platform Eng", "CD", 0xFFEAB308, "Instrumented Profiling", true, DeveloperApp.ANDROID_STUDIO, "endocore-mobile-app", "fix/telemetry-memory", 89, PrivacyMode.ENTERPRISE_AUDIT, "6m ago", 0, 13)
        )

        val membersDesign = listOf(
            RoomMember("m6", "Maya Patel", "Principal UX Architect", "MP", 0xFFF97316, "High-Density HUD System", true, DeveloperApp.FIGMA, "EndoCore Design System v3", "v3-components", 91, PrivacyMode.ENTERPRISE_AUDIT, "2m ago", 0, 16),
            RoomMember("m7", "Lucas Silva", "Staff Product Manager", "LS", 0xFF06B6D4, "Roadmap & SLA Targets", true, DeveloperApp.SLACK, "q3-enterprise-deliverables", "planning", 82, PrivacyMode.SQUAD_OBSERVABILITY, "9m ago", 0, 22)
        )

        return listOf(
            RoomGroup("g1", "Core Engine Cluster", "BACKEND & SYNC", "Mission-critical real-time synchronization, telemetry pipeline & server architecture cluster.", "⚡", 5, 5, true, true, 99, "NORMAL", membersEngine),
            RoomGroup("g2", "Cloud Infrastructure & SecOps", "DEVOPS & K8S", "Zero-trust encryption layer, container orchestration, eBPF probes & security monitoring.", "🛡️", 3, 3, true, true, 98, "NORMAL", membersInfra),
            RoomGroup("g3", "Mobile & Client Fleet", "ANDROID & COMPOSE", "High-performance native companion engineering & real-time telemetry rendering.", "📱", 2, 2, false, true, 96, "NORMAL", membersMobile),
            RoomGroup("g4", "Incident Triage & War Room", "P0 / P1 RESPONSE", "Rapid response fleet for microservice SLA monitoring & immediate swarm collaboration.", "🚨", 7, 6, true, false, 94, "NORMAL", membersEngine + membersInfra),
            RoomGroup("g5", "Design Systems & Product Guild", "UX & TELEMETRY UI", "High-density dark mode dashboards, telemetry sparklines & developer ergonomics.", "🎨", 2, 2, false, false, 95, "NORMAL", membersDesign)
        )
    }

    private fun getInitialInsights(): AiInsightsData {
        return AiInsightsData(
            dateLabel = "Today's Briefing (Gemini 2.5 Flash Enterprise)",
            scrum = ScrumBriefing(
                title = "Executive Telemetry & Standup Briefing",
                summary = "Workstation velocity is sustained at peak efficiency (93/100). Zero context thrashing or memory leaks observed during the 3h 43m session.",
                highlights = listOf(
                    "4.2h logged in IDE across auth/jwt-strategy & telemetry handlers",
                    "2 Pull Requests reviewed with average latency of 18m (#142 & #139)",
                    "Focus ratio is 92% (Enterprise target > 80%), 0 distraction spikes",
                    "CI/CD build pipeline passed in 14.8s with 99.4% test success rate"
                ),
                suggestedNextAction = "Push final token refresh unit test suite to feat/telemetry-vault-sync before the 15:00 UTC staging deployment.",
                blockersCount = 0,
                hoursInCode = 4.2f,
                pullRequestsReviewed = 2,
                buildSuccessRate = "99.4%",
                contextSwitchScore = "Low (3/hr)"
            ),
            wellness = WellnessBriefing(
                hydrationStatus = "Optimal (4 / 5 checkpoints logged)",
                hydrationPercentage = 80,
                stretchRecommendation = "4 consecutive deep focus blocks logged. Stand up for 3 minutes to maintain optimal cognitive ergonomics.",
                pomodorosCompleted = 4,
                eyeStrainAlert = "Display exposure elevated: Recommend 20-20-20 visual rest.",
                wellnessScore = 91
            ),
            weeklyFocusAvg = 89,
            weeklyGrowthPercent = 16,
            peakFocusWindow = "09:30 AM – 01:00 PM",
            hourlyDistribution = listOf(
                AnalyticsPoint("09:00", 82, 0.85f),
                AnalyticsPoint("10:00", 96, 1.0f),
                AnalyticsPoint("11:00", 98, 1.0f),
                AnalyticsPoint("12:00", 90, 0.9f),
                AnalyticsPoint("13:00", 94, 0.95f),
                AnalyticsPoint("14:00", 86, 0.75f)
            ),
            categoryPercentages = mapOf(
                "Active Coding" to 0.65f,
                "Code Review" to 0.18f,
                "DevOps & Containers" to 0.11f,
                "API Testing" to 0.06f
            ),
            teamVelocityIndex = 94,
            contextSwitchAlert = "Context switching remains under 3 events/hour (Top 3% Engineering Velocity benchmark)."
        )
    }

    private fun getInitialAuditLogs(): List<AuditLogEntry> {
        return listOf(
            AuditLogEntry("aud_1", "13:42:10", "TELEMETRY", "HEARTBEAT_DISPATCHED", "CPU: 26%, RAM: 7.1GB, Latency: 12ms to gateway", AuditSeverity.SUCCESS, "local-agent-daemon", 12),
            AuditLogEntry("aud_2", "13:30:05", "SECURITY", "MTLS_VERIFIED", "Certificate valid (SHA256: 4a8e...d29f), expires in 88 days", AuditSeverity.SECURITY, "tls-handshake-guard", 9),
            AuditLogEntry("aud_3", "13:15:22", "GIT_SYNC", "BRANCH_COMMIT_AUDITED", "Commit 7f9b2a1 on feat/telemetry-vault-sync synced to remote", AuditSeverity.INFO, "git-telemetry-hook", 18),
            AuditLogEntry("aud_4", "12:45:01", "POLICY", "PII_MASK_VERIFIED", "Active window sanitized: file paths masked according to Squad policy", AuditSeverity.SUCCESS, "privacy-filter-v2", 6),
            AuditLogEntry("aud_5", "12:10:44", "PIPELINE", "BUILD_STATUS_SYNC", "Remote pipeline #891 completed: 184 tests passed in 14.8s", AuditSeverity.SUCCESS, "ci-telemetry-bridge", 24),
            AuditLogEntry("aud_6", "11:20:19", "CONTAINER", "CLUSTER_POD_SCAN", "Docker daemon: 8 containers running, 0 vulnerability alerts", AuditSeverity.INFO, "docker-telemetry-agent", 15),
            AuditLogEntry("aud_7", "10:35:08", "AUTH", "SSO_TOKEN_REFRESH", "Enterprise OIDC token renewed via internal Okta IdP", AuditSeverity.SECURITY, "auth-token-service", 31)
        )
    }

    // ----------------------------------------------------
    // INTEGRATION ACTIONS & METHODS
    // ----------------------------------------------------
    fun toggleIntegrationConnection(integrationId: String) {
        _integrations.update { list ->
            list.map { item ->
                if (item.id == integrationId) {
                    val newConnected = !item.isConnected
                    item.copy(
                        isConnected = newConnected,
                        syncStatusText = if (newConnected) "Live Telemetry Sync Active" else "Disconnected",
                        lastSyncTime = if (newConnected) "Just now" else item.lastSyncTime
                    )
                } else item
            }
        }
    }

    fun toggleAutoPauseCalendar(integrationId: String = "int_gcal") {
        _integrations.update { list ->
            list.map { item ->
                if (item.id == integrationId) {
                    item.copy(autoPauseEnabled = !item.autoPauseEnabled)
                } else item
            }
        }
    }

    fun syncTicketToActiveTask(ticketId: String) {
        val ticket = _issueTickets.value.find { it.id == ticketId } ?: return
        _issueTickets.update { list ->
            list.map {
                it.copy(isTrackingActive = it.id == ticketId)
            }
        }
        _focusState.update { current ->
            current.copy(
                projectName = "${ticket.key}: ${ticket.title}",
                windowTitle = "[${ticket.provider}] ${ticket.key} - Active Engineering Focus"
            )
        }
    }

    fun logCommitManually(message: String, repo: String, branch: String = "main") {
        val newCommit = GitCommitActivity(
            id = "c_${System.currentTimeMillis()}",
            repoName = repo,
            branch = branch,
            commitHash = (1000000..9999999).random().toString(16),
            message = message,
            author = "Tawfeeq Bahur",
            timestamp = "Just now",
            additions = Random.nextInt(15, 140),
            deletions = Random.nextInt(2, 45)
        )
        _gitCommits.update { listOf(newCommit) + it }
    }

    fun addTimesheetEntry(client: String, project: String, billableHours: Float, rate: Double = 120.0) {
        val entry = TimesheetEntry(
            id = "ts_${System.currentTimeMillis()}",
            clientName = client,
            projectName = project,
            teamMember = "Tawfeeq Bahur",
            billableHours = billableHours,
            nonBillableHours = 0.5f,
            hourlyRate = rate,
            totalBilled = billableHours * rate,
            period = "Current Week (Aug 18 - 24)",
            status = "Approved"
        )
        _timesheets.update { listOf(entry) + it }
        _timesheetSummary.value = calculateTimesheetSummary()
    }

    fun exportTimesheet(format: String): String {
        val summary = calculateTimesheetSummary()
        return "Timesheet exported successfully as $format!\nPeriod: Aug 18 - Aug 24\nTotal Billed: $${summary.totalRevenue} (${summary.totalBillableHours} hrs)"
    }

    private fun calculateTimesheetSummary(): TimesheetSummary {
        val list = _timesheets.value
        val billable = list.sumOf { it.billableHours.toDouble() }.toFloat()
        val nonBillable = list.sumOf { it.nonBillableHours.toDouble() }.toFloat()
        val revenue = list.sumOf { it.totalBilled }
        val totalHours = billable + nonBillable
        val efficiency = if (totalHours > 0) ((billable / totalHours) * 100).toInt() else 0
        val projects = list.map { it.projectName }.distinct().size

        return TimesheetSummary(
            totalBillableHours = billable,
            totalNonBillableHours = nonBillable,
            totalRevenue = revenue,
            billableEfficiencyRate = efficiency,
            activeProjectsCount = projects
        )
    }

    private fun getInitialIntegrations(): List<DevIntegrationItem> {
        return listOf(
            DevIntegrationItem(
                id = "int_github",
                name = "GitHub Enterprise",
                provider = "GitHub",
                category = IntegrationCategory.DEV_OPS,
                isConnected = true,
                accountHandle = "@tawfeeq-bahur",
                lastSyncTime = "2m ago",
                syncStatusText = "Webhook Live • 12 Repos Synced",
                activeEntityCount = 14,
                primaryEntityLabel = "Commits & PRs Synced Today",
                syncCommitsEnabled = true
            ),
            DevIntegrationItem(
                id = "int_gitlab",
                name = "GitLab CI/CD",
                provider = "GitLab",
                category = IntegrationCategory.DEV_OPS,
                isConnected = true,
                accountHandle = "@endocore-fleet",
                lastSyncTime = "14m ago",
                syncStatusText = "Pipeline Bridge Connected",
                activeEntityCount = 6,
                primaryEntityLabel = "Pipelines Active",
                syncCommitsEnabled = true
            ),
            DevIntegrationItem(
                id = "int_jira",
                name = "Jira Software",
                provider = "Jira",
                category = IntegrationCategory.ISSUE_TRACKER,
                isConnected = true,
                accountHandle = "tawfeeq@enterprise.atlassian.net",
                lastSyncTime = "5m ago",
                syncStatusText = "Sprint 24 Board Synced",
                activeEntityCount = 8,
                primaryEntityLabel = "Active Assigned Tickets",
                syncIssuesEnabled = true
            ),
            DevIntegrationItem(
                id = "int_linear",
                name = "Linear App",
                provider = "Linear",
                category = IntegrationCategory.ISSUE_TRACKER,
                isConnected = true,
                accountHandle = "tawfeeq@endocore.linear.app",
                lastSyncTime = "1m ago",
                syncStatusText = "Cycles & Roadmap Connected",
                activeEntityCount = 5,
                primaryEntityLabel = "Current Cycle Issues",
                syncIssuesEnabled = true
            ),
            DevIntegrationItem(
                id = "int_gcal",
                name = "Google Calendar",
                provider = "Google Workspace",
                category = IntegrationCategory.CALENDAR_MEETINGS,
                isConnected = true,
                accountHandle = "tawfeeqbahur@gmail.com",
                lastSyncTime = "Just now",
                syncStatusText = "Auto-Pause Active During Events",
                activeEntityCount = 3,
                primaryEntityLabel = "Meetings Scheduled Today",
                autoPauseEnabled = true
            )
        )
    }

    private fun getInitialGitCommits(): List<GitCommitActivity> {
        return listOf(
            GitCommitActivity(
                id = "gc_1",
                repoName = "endocore-platform-core",
                branch = "main",
                commitHash = "8f3b92a",
                message = "feat(telemetry): stream high-frequency CPU & ram memory telemetry",
                author = "Tawfeeq Bahur",
                timestamp = "12m ago",
                additions = 184,
                deletions = 22
            ),
            GitCommitActivity(
                id = "gc_2",
                repoName = "endocore-mobile-app",
                branch = "feature/integrations-ecosystem",
                commitHash = "e2c91b4",
                message = "feat(integrations): add GitHub, Jira, and Google Calendar sync bridge",
                author = "Tawfeeq Bahur",
                timestamp = "45m ago",
                additions = 340,
                deletions = 15
            ),
            GitCommitActivity(
                id = "gc_3",
                repoName = "endocore-auth-service",
                branch = "fix/token-introspection",
                commitHash = "71d054f",
                message = "fix(security): resolve OAuth2 PKCE state validation edge case",
                author = "Tawfeeq Bahur",
                timestamp = "2h ago",
                additions = 68,
                deletions = 31
            ),
            GitCommitActivity(
                id = "gc_4",
                repoName = "endocore-telemetry-gateway",
                branch = "main",
                commitHash = "a417c8f",
                message = "perf(timesheet): optimize aggregation query for client billable hours",
                author = "Tawfeeq Bahur",
                timestamp = "4h ago",
                additions = 95,
                deletions = 12
            )
        )
    }

    private fun getInitialIssueTickets(): List<IssueTicket> {
        return listOf(
            IssueTicket(
                id = "iss_1",
                key = "EC-408",
                title = "Implement Automated Timesheet & CSV/PDF Export Pipeline",
                provider = "Jira",
                status = "In Progress",
                priority = "High",
                estimatedHours = 6.0f,
                loggedHours = 3.5f,
                isTrackingActive = true
            ),
            IssueTicket(
                id = "iss_2",
                key = "LIN-92",
                title = "Auto-Pause Focus Session on Google Calendar Meeting Start",
                provider = "Linear",
                status = "In Progress",
                priority = "Urgent",
                estimatedHours = 4.0f,
                loggedHours = 2.0f,
                isTrackingActive = false
            ),
            IssueTicket(
                id = "iss_3",
                key = "EC-412",
                title = "Real-time Webhook Bridge for GitHub Commit & PR Observability",
                provider = "Jira",
                status = "Review",
                priority = "Medium",
                estimatedHours = 8.0f,
                loggedHours = 7.5f,
                isTrackingActive = false
            ),
            IssueTicket(
                id = "iss_4",
                key = "LIN-104",
                title = "Enterprise Zero-Trust Token Rotation & SSO Provisioning",
                provider = "Linear",
                status = "Todo",
                priority = "High",
                estimatedHours = 10.0f,
                loggedHours = 0.0f,
                isTrackingActive = false
            )
        )
    }

    private fun getInitialCalendarEvents(): List<CalendarEventItem> {
        return listOf(
            CalendarEventItem(
                id = "ev_1",
                title = "Daily Engineering Standup & Sprint Sync",
                startTime = "09:30 AM",
                endTime = "10:00 AM",
                durationMinutes = 30,
                organizer = "Lucas Silva (Staff PM)",
                isMeetingActiveNow = false,
                autoPauseTriggered = false
            ),
            CalendarEventItem(
                id = "ev_2",
                title = "Architecture Review: Integrations Ecosystem & Timesheets",
                startTime = "02:00 PM",
                endTime = "02:45 PM",
                durationMinutes = 45,
                organizer = "Tawfeeq Bahur (Lead Architect)",
                isMeetingActiveNow = false,
                autoPauseTriggered = false
            ),
            CalendarEventItem(
                id = "ev_3",
                title = "Client Demo: Q3 Enterprise Telemetry Deliverables",
                startTime = "04:30 PM",
                endTime = "05:15 PM",
                durationMinutes = 45,
                organizer = "Sarah Jenkins (Acct Exec)",
                isMeetingActiveNow = false,
                autoPauseTriggered = false
            )
        )
    }

    private fun getInitialTimesheets(): List<TimesheetEntry> {
        return listOf(
            TimesheetEntry(
                id = "ts_1",
                clientName = "Acme Corp Enterprise",
                projectName = "EndoCore Platform Core",
                teamMember = "Tawfeeq Bahur",
                billableHours = 18.5f,
                nonBillableHours = 2.0f,
                hourlyRate = 135.0,
                totalBilled = 2497.50,
                period = "Current Week (Aug 18 - 24)",
                status = "Approved"
            ),
            TimesheetEntry(
                id = "ts_2",
                clientName = "Starlight Fintech Ltd",
                projectName = "Real-time Telemetry Gateway",
                teamMember = "Tawfeeq Bahur",
                billableHours = 12.0f,
                nonBillableHours = 1.5f,
                hourlyRate = 140.0,
                totalBilled = 1680.00,
                period = "Current Week (Aug 18 - 24)",
                status = "Approved"
            ),
            TimesheetEntry(
                id = "ts_3",
                clientName = "Nexus Health Systems",
                projectName = "Zero-Trust Encryption Layer",
                teamMember = "Tawfeeq Bahur",
                billableHours = 8.5f,
                nonBillableHours = 1.0f,
                hourlyRate = 150.0,
                totalBilled = 1275.00,
                period = "Current Week (Aug 18 - 24)",
                status = "Pending Review"
            ),
            TimesheetEntry(
                id = "ts_4",
                clientName = "Internal Fleet Labs",
                projectName = "Integrations & Export Pipeline",
                teamMember = "Tawfeeq Bahur",
                billableHours = 6.0f,
                nonBillableHours = 3.0f,
                hourlyRate = 125.0,
                totalBilled = 750.00,
                period = "Current Week (Aug 18 - 24)",
                status = "Approved"
            )
        )
    }

    fun dismissPeerWave() {
        _activePeerWave.value = null
    }

    fun trigger1v1ChallengeAlert(
        senderName: String = "Arun",
        senderRole: String = "Research Associate"
    ) {
        val wave = PeerWaveNotification(
            id = "wave_${System.currentTimeMillis()}",
            senderName = senderName,
            senderRole = senderRole,
            senderEmoji = "⚡",
            message = "sent 1v1 Pomodoro focus sprint challenge",
            isChallenge1v1 = true
        )
        _activePeerWave.value = wave
        _peerWaves.tryEmit(wave)
    }

    fun toggleSessionPause() {
        togglePause()
    }

    companion object {
        @Volatile
        private var instance: EndoCoreRepository? = null

        fun getInstance(context: Context? = null): EndoCoreRepository {
            return instance ?: synchronized(this) {
                instance ?: EndoCoreRepository(context ?: throw IllegalStateException("Context required for initialization")).also {
                    instance = it
                }
            }
        }

        fun initialize(context: Context): EndoCoreRepository {
            return getInstance(context)
        }
    }
}

