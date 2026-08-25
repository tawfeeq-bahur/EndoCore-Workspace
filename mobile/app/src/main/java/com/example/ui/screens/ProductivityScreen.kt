package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.ActivityLogItem
import com.example.data.model.DeveloperApp
import com.example.data.model.FocusSessionState
import com.example.data.model.PipelineDiagnostics
import com.example.data.model.PrivacyMode
import com.example.data.model.RoomGroup
import com.example.data.model.RoomMember
import com.example.data.model.TimelineEntry
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * My Productivity Screen - Faithfully implementing the EndoCore Workspace Pipeline UI (Screenshots 1 & 2).
 * Includes:
 * - Top Workspace Header & Guild Selector (# NEW ROOM, # Engineering Team, etc.)
 * - Pipeline Diagnostics & Microservices with Live Health Check
 * - Top Metrics (Focus Time, Productivity Score, Current Session)
 * - Activity Tracker Console with App Selector & Task Sync
 * - Team & Scrum Telemetry with JSON Scrum Coordinator Brief
 * - Activity Timeline & Recent Focus Logs
 */
@Composable
fun ProductivityScreen(
    focusState: FocusSessionState,
    timeline: List<TimelineEntry>,
    activityLogs: List<ActivityLogItem>,
    rooms: List<RoomGroup>,
    selectedGuild: String,
    onSelectGuild: (String) -> Unit,
    onTogglePause: () -> Unit,
    onRunHealthCheck: () -> Unit,
    onSwitchApp: (DeveloperApp, String?) -> Unit,
    onSyncTaskName: (String) -> Unit,
    onSetPrivacyMode: (PrivacyMode) -> Unit,
    onWaveMember: (RoomMember, RoomGroup) -> Unit,
    onOpenCommissionWizard: () -> Unit,
    onOpenTelemetryInspector: () -> Unit,
    onSelectRoom: (RoomGroup) -> Unit,
    modifier: Modifier = Modifier
) {
    var activeTaskInput by remember { mutableStateOf(focusState.projectName) }
    var showAppDropdown by remember { mutableStateOf(false) }
    var showGuildDropdown by remember { mutableStateOf(false) }
    var selectedTimelineTab by remember { mutableStateOf("TIMELINE") } // TIMELINE, ROOMS & SYNC, PERSONAL ACTIVITY

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 16.dp)
            .testTag("productivity_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // 1. Top EndoCore Branding Bar & Workspace Health
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left Brand & Version
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f, fill = false)
                ) {
                    Text(
                        text = "EndoCore",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            fontSize = 20.sp
                        ),
                        color = EnviGreenDark,
                        maxLines = 1
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(Color(0xFFE2EBE5))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "v1.0",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.5.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = EnviGreenDark,
                            maxLines = 1
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    // Pipeline Healthy Pill
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFFE0F2FE))
                            .border(1.dp, Color(0xFFBAE6FD), RoundedCornerShape(14.dp))
                            .padding(horizontal = 7.dp, vertical = 3.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(5.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0284C7))
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "HEALTHY",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = Color(0xFF0369A1),
                                maxLines = 1
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Guild / Room Selector Dropdown Pill (Safe fixed/max width with ellipsis)
                Box(modifier = Modifier.wrapContentWidth()) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF131A18))
                            .clickable { showGuildDropdown = true }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                text = "# $selectedGuild",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = "Select Guild",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = showGuildDropdown,
                        onDismissRequest = { showGuildDropdown = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("# NEW ROOM (Active)") },
                            onClick = {
                                onSelectGuild("NEW ROOM")
                                showGuildDropdown = false
                            }
                        )
                        rooms.forEach { r ->
                            DropdownMenuItem(
                                text = { Text("# ${r.name}") },
                                onClick = {
                                    onSelectGuild(r.name)
                                    onSelectRoom(r)
                                    showGuildDropdown = false
                                }
                            )
                        }
                        DropdownMenuItem(
                            text = { Text("➕ Commission New Room...", color = EnviGreenDark, fontWeight = FontWeight.Bold) },
                            onClick = {
                                showGuildDropdown = false
                                onOpenCommissionWizard()
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 2. Greeting & Real-time Workstation Subtitle
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Good Evening, Tawfeeq",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        ),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Here's your real-time workstation overview for today.",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                        color = TextDarkSecondary
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Status Actions: Agent Paused toggle + Privacy Pills
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Agent status pill toggle
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (focusState.isPaused) Color(0xFFF3F4F6) else Color(0xFFDCFCE7))
                                .border(1.dp, if (focusState.isPaused) Color(0xFFE5E7EB) else Color(0xFF86EFAC), RoundedCornerShape(14.dp))
                                .clickable { onTogglePause() }
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(if (focusState.isPaused) Color(0xFF9CA3AF) else Color(0xFF16A34A))
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (focusState.isPaused) "Agent Paused" else "Agent Active",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    ),
                                    color = if (focusState.isPaused) Color(0xFF4B5563) else Color(0xFF15803D)
                                )
                            }
                        }

                        // Privacy Pills
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            val isPrivate = focusState.privacyMode == PrivacyMode.ENCRYPTED_PRIVATE
                            val isTeam = focusState.privacyMode == PrivacyMode.SQUAD_OBSERVABILITY
                            val isAudit = focusState.privacyMode == PrivacyMode.ENTERPRISE_AUDIT

                            PrivacyPill(
                                label = "Private",
                                isSelected = isPrivate,
                                onClick = { onSetPrivacyMode(PrivacyMode.ENCRYPTED_PRIVATE) }
                            )
                            PrivacyPill(
                                label = "Team",
                                isSelected = isTeam,
                                onClick = { onSetPrivacyMode(PrivacyMode.SQUAD_OBSERVABILITY) }
                            )
                            PrivacyPill(
                                label = "Public",
                                isSelected = isAudit,
                                onClick = { onSetPrivacyMode(PrivacyMode.ENTERPRISE_AUDIT) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 3. Primary Metrics Cards (3 Bento Cards: FOCUS TIME, PRODUCTIVITY SCORE, CURRENT SESSION)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Focus Time
                val hours = (focusState.elapsedSeconds / 3600f)
                MetricBentoCard(
                    label = "FOCUS TIME",
                    value = String.format("%.1f hrs", hours),
                    subtitle = "Goal: 6 hrs",
                    modifier = Modifier.weight(1f)
                )
                // Productivity Score
                MetricBentoCard(
                    label = "PRODUCTIVITY",
                    value = "${focusState.dailyFocusScore}%",
                    subtitle = "Target achieved",
                    modifier = Modifier.weight(1f)
                )
                // Current Session
                MetricBentoCard(
                    label = "CURRENT SESSION",
                    value = if (focusState.isPaused) "Offline" else "Online",
                    subtitle = focusState.projectName.take(12) + "...",
                    isOnline = !focusState.isPaused,
                    modifier = Modifier.weight(1.05f)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 5. ACTIVITY TRACKER CONSOLE [PAUSED / ACTIVE]
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "ACTIVITY TRACKER CONSOLE",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f, fill = false)
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (focusState.isPaused) Color(0xFFFEE2E2) else Color(0xFFDCFCE7))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = if (focusState.isPaused) "PAUSED" else "ACTIVE",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.sp
                                ),
                                color = if (focusState.isPaused) Color(0xFFDC2626) else Color(0xFF16A34A),
                                maxLines = 1
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Dropdown for ACTIVE APPLICATION
                    Text(
                        text = "ACTIVE APPLICATION",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 10.sp
                        ),
                        color = TextDarkSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
                                .clickable { showAppDropdown = true }
                                .padding(horizontal = 12.dp, vertical = 10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f, fill = false)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Code,
                                        contentDescription = null,
                                        tint = EnviGreenDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = focusState.activeApp.appName,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontWeight = FontWeight.Medium,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Icon(
                                    imageVector = Icons.Default.ArrowDropDown,
                                    contentDescription = "Select App",
                                    tint = TextDarkSecondary
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = showAppDropdown,
                            onDismissRequest = { showAppDropdown = false }
                        ) {
                            DeveloperApp.values().forEach { app ->
                                DropdownMenuItem(
                                    text = { Text(app.appName) },
                                    onClick = {
                                        onSwitchApp(app, activeTaskInput)
                                        showAppDropdown = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Input for ACTIVE TASK / PROJECT
                    Text(
                        text = "ACTIVE TASK / PROJECT",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 10.sp
                        ),
                        color = TextDarkSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = activeTaskInput,
                            onValueChange = { activeTaskInput = it },
                            placeholder = { Text("e.g. EndoCore Workspace Pipeline", fontSize = 12.sp) },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedBorderColor = EnviGreenDark,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            ),
                            textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                            modifier = Modifier.weight(1f)
                        )

                        Box(
                            modifier = Modifier
                                .wrapContentWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF131A18))
                                .clickable {
                                    onSyncTaskName(activeTaskInput)
                                    onTogglePause()
                                }
                                .padding(horizontal = 14.dp, vertical = 14.dp)
                        ) {
                            Text(
                                text = if (focusState.isPaused) "Sync & Start" else "Pause",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = Color.White,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 6. TEAM & SCRUM TELEMETRY [● LIVE SYNCED]
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "TEAM & SCRUM TELEMETRY",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(EnviGreen)
                            )
                        }
                        Text(
                            text = "LIVE SYNCED",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp
                            ),
                            color = EnviGreenDark
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Guild: #$selectedGuild (1 Co-workers)",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp
                        ),
                        color = TextDarkPrimary
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Teammate Card: TAWFEEQ
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f, fill = false)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00B37E)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "TB",
                                        style = MaterialTheme.typography.labelMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                        ),
                                        color = Color.White
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "TAWFEEQ",
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "Software Developer • 0s • Offline",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = TextDarkSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Box(
                                modifier = Modifier
                                    .wrapContentWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFF3F4F6))
                                    .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(8.dp))
                                    .clickable {
                                        // Self wave
                                    }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "Wave",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    ),
                                    color = TextDarkPrimary,
                                    maxLines = 1,
                                    softWrap = false
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Clean Structured Scrum Summary Card (Replaces raw JSON debug text)
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFDCFCE7)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "SCRUM SUMMARY",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp,
                                        fontFamily = FontFamily.Monospace
                                    ),
                                    color = EnviGreenDark
                                )
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(Color(0xFFDCFCE7))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "16% Active",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.5.sp
                                        ),
                                        color = EnviGreenDark
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Low-Activity Transition Phase: 2 out of 7 members online with steady task progression.",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontSize = 11.5.sp,
                                    color = TextDarkSecondary
                                )
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 6. Activity Timeline & Work Breakdown Section (Segmented Tabs)
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Segment Tabs: TIMELINE | ROOMS & SYNC | PERSONAL ACTIVITY
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFE5ECE8))
                            .padding(3.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        SegmentPill(
                            label = "TIMELINE",
                            isSelected = selectedTimelineTab == "TIMELINE",
                            onClick = { selectedTimelineTab = "TIMELINE" },
                            modifier = Modifier.weight(1f)
                        )
                        SegmentPill(
                            label = "ROOMS & SYNC",
                            isSelected = selectedTimelineTab == "ROOMS & SYNC",
                            onClick = { selectedTimelineTab = "ROOMS & SYNC" },
                            modifier = Modifier.weight(1.2f)
                        )
                        SegmentPill(
                            label = "ACTIVITY",
                            isSelected = selectedTimelineTab == "PERSONAL ACTIVITY",
                            onClick = { selectedTimelineTab = "PERSONAL ACTIVITY" },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // TODAY'S WORK BREAKDOWN
                    Text(
                        text = "TODAY'S WORK BREAKDOWN",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    // Multi-color breakdown progress bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(10.dp)
                            .clip(RoundedCornerShape(5.dp))
                    ) {
                        Box(modifier = Modifier.weight(0.6f).fillMaxSize().background(Color(0xFF00B37E)))
                        Box(modifier = Modifier.weight(0.25f).fillMaxSize().background(Color(0xFF007ACC)))
                        Box(modifier = Modifier.weight(0.15f).fillMaxSize().background(Color(0xFFF59E0B)))
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // RECENT FOCUS SESSIONS
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "RECENT FOCUS SESSIONS",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Active Today",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.5.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Clean focused task sessions
                    FocusSessionItemCard(
                        title = "Architecture & Workspace Pipeline",
                        tool = "Antigravity IDE",
                        duration = "45 mins",
                        timeAgo = "10m ago"
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    FocusSessionItemCard(
                        title = "Code Review & PR Inspection",
                        tool = "VS Code",
                        duration = "30 mins",
                        timeAgo = "1h ago"
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    FocusSessionItemCard(
                        title = "API Contract & Telemetry Sync",
                        tool = "Chrome DevTools",
                        duration = "25 mins",
                        timeAgo = "2h ago"
                    )
                }
            }

            Spacer(modifier = Modifier.height(80.dp)) // Padding for bottom floating capsule dock
        }
    }
}

@Composable
fun PrivacyPill(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) Color(0xFF131A18) else Color.White)
            .border(1.dp, if (isSelected) Color(0xFF131A18) else Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
                fontSize = 10.sp
            ),
            color = if (isSelected) Color.White else TextDarkSecondary
        )
    }
}

@Composable
fun MicroserviceCard(
    name: String,
    status: String,
    isActive: Boolean,
    icon: ImageVector
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier.width(115.dp)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Icon(
                imageVector = icon,
                contentDescription = name,
                tint = if (isActive) EnviGreenDark else Color(0xFF9CA3AF),
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = name,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.5.sp,
                    fontFamily = FontFamily.Monospace
                ),
                color = TextDarkMuted,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(2.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(5.dp)
                        .clip(CircleShape)
                        .background(if (isActive) Color(0xFF10B981) else Color(0xFF9CA3AF))
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = status,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp
                    ),
                    color = if (isActive) Color(0xFF047857) else Color(0xFF6B7280)
                )
            }
        }
    }
}

@Composable
fun MetricBentoCard(
    label: String,
    value: String,
    subtitle: String,
    isOnline: Boolean = true,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                ),
                color = TextDarkMuted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Black,
                    fontSize = 17.sp
                ),
                color = TextDarkPrimary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.sp),
                color = TextDarkSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun SegmentPill(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) Color.White else Color.Transparent)
            .clickable { onClick() }
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 10.5.sp
            ),
            color = if (isSelected) TextDarkPrimary else TextDarkSecondary
        )
    }
}

@Composable
fun FocusSessionItemCard(
    title: String,
    tool: String,
    duration: String,
    timeAgo: String
) {
    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(EnviGreenDark)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.5.sp
                        ),
                        color = TextDarkPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "$tool • $duration",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontSize = 10.5.sp
                        ),
                        color = TextDarkSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            Text(
                text = timeAgo,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Medium,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                ),
                color = TextDarkMuted
            )
        }
    }
}

