package com.example

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.state.MainViewModel
import com.example.ui.components.CommissionRoomModal
import com.example.ui.components.DynamicIslandBanner
import com.example.ui.components.FloatingCapsuleDock
import com.example.ui.components.PeerChallenge1v1Modal
import com.example.ui.components.RoomDetailsModal
import com.example.ui.components.WorkstationTelemetryModal
import com.example.ui.screens.AnalyticsScreen
import com.example.ui.screens.AndroidPolishHubScreen
import com.example.ui.screens.ConnectionsScreen
import com.example.ui.screens.GoalsScreen
import com.example.ui.screens.IntegrationsScreen
import com.example.ui.screens.ProductivityScreen
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EndoCoreMobileTheme
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            EndoCoreMobileTheme {
                EndoCoreEnterpriseApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun EndoCoreEnterpriseApp(viewModel: MainViewModel) {
    val context = LocalContext.current
    var currentRoute by remember { mutableStateOf("productivity") }

    val focusState by viewModel.focusState.collectAsStateWithLifecycle()
    val timeline by viewModel.timeline.collectAsStateWithLifecycle()
    val activityLogs by viewModel.activityLogs.collectAsStateWithLifecycle()
    val connections by viewModel.connections.collectAsStateWithLifecycle()
    val rooms by viewModel.rooms.collectAsStateWithLifecycle()
    val insights by viewModel.insights.collectAsStateWithLifecycle()
    val selectedGuild by viewModel.selectedGuildName.collectAsStateWithLifecycle()
    val selectedRoom by viewModel.selectedRoom.collectAsStateWithLifecycle()
    val isCommissionWizardOpen by viewModel.isCommissionWizardOpen.collectAsStateWithLifecycle()
    val challengedPeer by viewModel.challengedPeer.collectAsStateWithLifecycle()
    val isTelemetryModalExpanded by viewModel.isTelemetryModalExpanded.collectAsStateWithLifecycle()
    val pingToastMessage by viewModel.pingToastMessage.collectAsStateWithLifecycle()
    val activePeerWave by viewModel.activePeerWave.collectAsStateWithLifecycle()

    // Integrations & Timesheets State
    val integrations by viewModel.integrations.collectAsStateWithLifecycle()
    val gitCommits by viewModel.gitCommits.collectAsStateWithLifecycle()
    val issueTickets by viewModel.issueTickets.collectAsStateWithLifecycle()
    val calendarEvents by viewModel.calendarEvents.collectAsStateWithLifecycle()
    val timesheets by viewModel.timesheets.collectAsStateWithLifecycle()
    val timesheetSummary by viewModel.timesheetSummary.collectAsStateWithLifecycle()

    // Handle back button
    BackHandler(enabled = isTelemetryModalExpanded || isCommissionWizardOpen || challengedPeer != null || selectedRoom != null) {
        if (isTelemetryModalExpanded) {
            viewModel.closeTelemetryModal()
        } else if (isCommissionWizardOpen) {
            viewModel.closeCommissionWizard()
        } else if (challengedPeer != null) {
            viewModel.close1v1Challenge()
        } else if (selectedRoom != null) {
            viewModel.selectRoom(null)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasLight)
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            containerColor = CanvasLight,
            bottomBar = {
                FloatingCapsuleDock(
                    currentRoute = currentRoute,
                    onTabSelected = { currentRoute = it }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when (currentRoute) {
                    "productivity" -> ProductivityScreen(
                        focusState = focusState,
                        timeline = timeline,
                        activityLogs = activityLogs,
                        rooms = rooms,
                        selectedGuild = selectedGuild,
                        onSelectGuild = { viewModel.setSelectedGuild(it) },
                        onTogglePause = { viewModel.togglePause() },
                        onRunHealthCheck = { viewModel.runDiagnosticsHealthCheck() },
                        onSwitchApp = { app, proj -> viewModel.switchActiveApp(app, proj) },
                        onSyncTaskName = { viewModel.syncTaskName(it) },
                        onSetPrivacyMode = { viewModel.setPrivacyMode(it) },
                        onWaveMember = { member, room -> viewModel.sendPeerPing(member, room) },
                        onOpenCommissionWizard = { viewModel.openCommissionWizard() },
                        onOpenTelemetryInspector = { viewModel.openTelemetryModal() },
                        onSelectRoom = { r -> viewModel.selectRoom(r) }
                    )

                    "analytics" -> AnalyticsScreen(
                        focusState = focusState,
                        insights = insights
                    )

                    "goals" -> GoalsScreen(
                        focusState = focusState,
                        onStartPomodoro = { viewModel.startPomodoroFocus() },
                        onPausePomodoro = { viewModel.pausePomodoroFocus() },
                        onResetPomodoro = { viewModel.resetPomodoro() },
                        onAdjustPomodoroTime = { viewModel.adjustPomodoroTime(it) },
                        onSetPreset = { viewModel.setPomodoroPreset(it) },
                        onSetSessionMode = { viewModel.setSessionMode(it) },
                        onSkipSession = { viewModel.skipSession() },
                        onLogDistraction = { viewModel.logDistraction() },
                        onResetDistractions = { viewModel.resetDistractions() },
                        onSyncTaskName = { viewModel.syncTaskName(it) }
                    )

                    "integrations" -> IntegrationsScreen(
                        integrations = integrations,
                        gitCommits = gitCommits,
                        issueTickets = issueTickets,
                        calendarEvents = calendarEvents,
                        timesheets = timesheets,
                        timesheetSummary = timesheetSummary,
                        onToggleIntegration = { viewModel.toggleIntegration(it) },
                        onToggleAutoPauseCalendar = { viewModel.toggleAutoPauseCalendar() },
                        onSyncTicketToTask = { viewModel.syncTicketToActiveTask(it) },
                        onLogCommit = { msg, repo -> viewModel.logCommit(msg, repo) },
                        onAddTimesheet = { client, proj, hrs, rate -> viewModel.addTimesheet(client, proj, hrs, rate) },
                        onExportTimesheet = { viewModel.exportTimesheet(it) }
                    )

                    "polish" -> AndroidPolishHubScreen(
                        focusState = focusState,
                        onStartForegroundService = { viewModel.startForegroundService() },
                        onStopForegroundService = { viewModel.stopForegroundService() },
                        onTriggerSimulated1v1Challenge = { name, role ->
                            viewModel.triggerSimulated1v1Challenge(name, role)
                        },
                        onUpdateWidgets = { viewModel.updateWidgets() },
                        onStartPomodoro = { viewModel.startPomodoroFocus() },
                        onTogglePause = { viewModel.togglePause() }
                    )

                    "connections" -> ConnectionsScreen(
                        connections = connections,
                        onSendWave = { conn -> viewModel.sendConnectionWave(conn) },
                        onChallenge1v1 = { conn -> viewModel.open1v1Challenge(conn) },
                        onAddConnection = { email -> viewModel.addConnection(email) }
                    )
                }
            }
        }

        // Full Screen Workstation Telemetry Inspector Modal
        AnimatedVisibility(
            visible = isTelemetryModalExpanded,
            enter = slideInVertically(
                initialOffsetY = { it },
                animationSpec = spring(dampingRatio = 0.85f, stiffness = 400f)
            ) + fadeIn(animationSpec = tween(200)),
            exit = slideOutVertically(
                targetOffsetY = { it },
                animationSpec = spring(dampingRatio = 0.85f, stiffness = 400f)
            ) + fadeOut(animationSpec = tween(200)),
            modifier = Modifier.fillMaxSize()
        ) {
            WorkstationTelemetryModal(
                focusState = focusState,
                onClose = { viewModel.closeTelemetryModal() },
                onTogglePause = { viewModel.togglePause() },
                onSwitchApp = { app -> viewModel.switchActiveApp(app) },
                onSetPrivacyMode = { mode -> viewModel.setPrivacyMode(mode) },
                onToggleDeepWork = { viewModel.toggleDeepWork() },
                onTogglePomodoro = { viewModel.togglePomodoro() }
            )
        }

        // 5-Step Commission Intelligence Room Modal
        if (isCommissionWizardOpen) {
            CommissionRoomModal(
                onDismiss = { viewModel.closeCommissionWizard() },
                onCommission = { name, desc, cat, emoji ->
                    viewModel.commissionRoom(name, desc, cat, emoji)
                }
            )
        }

        // 1v1 Peer Challenge Modal
        if (challengedPeer != null) {
            PeerChallenge1v1Modal(
                peer = challengedPeer!!,
                onDismiss = { viewModel.close1v1Challenge() },
                onStartSprint = {
                    viewModel.startPomodoroFocus()
                    currentRoute = "goals"
                    viewModel.close1v1Challenge()
                }
            )
        }

        // Room Details Modal
        if (selectedRoom != null) {
            RoomDetailsModal(
                room = selectedRoom!!,
                onDismiss = { viewModel.selectRoom(null) },
                onWaveMember = { member ->
                    viewModel.sendPeerPing(member, selectedRoom!!)
                }
            )
        }

        // Dynamic Island Floating Capsule Pill (Status bar 1v1 challenge alerts & ongoing focus live chronometer)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.statusBars)
                .align(Alignment.TopCenter)
        ) {
            DynamicIslandBanner(
                peerWave = activePeerWave,
                isSessionActive = focusState.isTracking,
                isSessionPaused = focusState.isPaused,
                activeTaskName = focusState.projectName,
                onDismissWave = { viewModel.dismissPeerWave() },
                onAcceptChallenge = { wave ->
                    viewModel.dismissPeerWave()
                    viewModel.startPomodoroFocus()
                    currentRoute = "goals"
                },
                onTogglePauseSession = { viewModel.togglePause() }
            )
        }

        // Floating Peer Ping Notification Banner at Top (Bento styled pill)
        AnimatedVisibility(
            visible = pingToastMessage != null,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(horizontal = 18.dp, vertical = 8.dp)
                .align(Alignment.TopCenter)
        ) {
            if (pingToastMessage != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .shadow(12.dp, RoundedCornerShape(20.dp), spotColor = Color(0x33000000))
                        .clip(RoundedCornerShape(20.dp)),
                    color = Color(0xFF131A18),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(EnviGreen),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ElectricBolt,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = pingToastMessage!!,
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White
                            ),
                            modifier = Modifier
                                .padding(horizontal = 10.dp)
                                .weight(1f)
                        )
                        IconButton(
                            onClick = { viewModel.clearPingToast() },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = Color(0xFF9EABA4),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
