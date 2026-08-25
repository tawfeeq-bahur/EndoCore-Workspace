package com.example.ui.components

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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DeveloperApp
import com.example.data.model.FocusSessionState
import com.example.data.model.PrivacyMode
import com.example.ui.theme.AmberWarning
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.BentoMidnightTeal
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoPlum
import com.example.ui.theme.BentoSage
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

@Composable
fun WorkstationTelemetryModal(
    focusState: FocusSessionState,
    onClose: () -> Unit,
    onTogglePause: () -> Unit,
    onSwitchApp: (DeveloperApp) -> Unit,
    onSetPrivacyMode: (PrivacyMode) -> Unit,
    onToggleDeepWork: () -> Unit,
    onTogglePomodoro: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .statusBarsPadding()
            .navigationBarsPadding()
            .testTag("workstation_telemetry_modal")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp)
                .verticalScroll(scrollState)
        ) {
            // Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .clickable { onClose() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close Inspector",
                        tint = TextDarkPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "WORKSTATION INSPECTOR",
                        style = MaterialTheme.typography.labelSmall.copy(
                            letterSpacing = 1.2.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = EnviGreenDark
                    )
                    Text(
                        text = "NODE: US-EAST-CORE-01",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        ),
                        color = TextDarkMuted
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    PulsingLiveDot(isOnline = true, activeColor = EnviGreen, dotSize = 6.dp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${focusState.telemetry.agentLatencyMs}ms",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp
                        ),
                        color = EnviGreenDark
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Main Bento Radial Focus Card
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularFocusProgress(
                        elapsedSeconds = focusState.elapsedSeconds,
                        targetSeconds = focusState.targetGoalSeconds,
                        isTracking = focusState.isTracking,
                        isPaused = focusState.isPaused,
                        size = 200.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Real-Time Waveform Sparkline Card
            Card(
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "LIVE TELEMETRY STREAM",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp
                            ),
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "CPU ${focusState.telemetry.cpuLoadPercent}% • RAM ${(focusState.telemetry.memoryUsageMb / 1024f).let { "%.1f".format(it) }}GB",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp
                            ),
                            color = EnviGreenDark
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    LiveMetricPulseGraph(
                        isActive = focusState.isTracking && !focusState.isPaused,
                        height = 40.dp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Primary Session Actions (Plum / Mint Bento style)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = onTogglePause,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (focusState.isPaused) EnviGreenDark else BentoPlum,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("modal_toggle_pause_btn")
                ) {
                    Icon(
                        imageVector = if (focusState.isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (focusState.isPaused) "Resume Flow" else "Pause Telemetry",
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = onToggleDeepWork,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (focusState.isDeepWorkMode) Color(0xFF131A18) else BentoPeach,
                        contentColor = if (focusState.isDeepWorkMode) Color.White else Color(0xFF332019)
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("modal_toggle_deep_work_btn")
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (focusState.isDeepWorkMode) "Deep Flow ON" else "Deep Flow OFF",
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Active Developer Process Selector
            Text(
                text = "ACTIVE WORKSTATION PROCESS",
                style = MaterialTheme.typography.labelSmall.copy(
                    letterSpacing = 1.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = EnviGreenDark
            )

            Spacer(modifier = Modifier.height(10.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DeveloperApp.values().forEach { app ->
                    val isSelected = focusState.activeApp == app
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Color.White else BentoCardLight
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                1.5.dp,
                                if (isSelected) EnviGreenDark else Color.Transparent,
                                RoundedCornerShape(20.dp)
                            )
                            .clickable { onSwitchApp(app) }
                            .testTag("select_app_${app.name}")
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.White)
                                        .border(1.dp, Color(0xFFE2ECE5), RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = when (app) {
                                            DeveloperApp.TERMINAL -> Icons.Default.Terminal
                                            DeveloperApp.DOCKER -> Icons.Default.DataObject
                                            else -> Icons.Default.Code
                                        },
                                        contentDescription = null,
                                        tint = Color(app.brandColorHex),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = app.appName,
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = "${app.category} • default: ${app.defaultProject}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextDarkMuted,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            if (isSelected) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFFEAF8F1))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(
                                        text = "ACTIVE",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 10.sp
                                        ),
                                        color = EnviGreenDark
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Privacy & Compliance Control
            Text(
                text = "ENTERPRISE PRIVACY ENCLAVE",
                style = MaterialTheme.typography.labelSmall.copy(
                    letterSpacing = 1.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = EnviGreenDark
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                PrivacyMode.values().forEach { mode ->
                    val isSelected = focusState.privacyMode == mode
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Color(0xFF131A18) else BentoCardLight
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onSetPrivacyMode(mode) }
                            .testTag("privacy_mode_${mode.name}")
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = when (mode) {
                                    PrivacyMode.ENTERPRISE_AUDIT -> Icons.Default.Speed
                                    PrivacyMode.SQUAD_OBSERVABILITY -> Icons.Default.Fingerprint
                                    PrivacyMode.ENCRYPTED_PRIVATE -> Icons.Default.Security
                                },
                                contentDescription = null,
                                tint = if (isSelected) Color.White else TextDarkMuted,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = mode.title.split(" ").firstOrNull() ?: mode.name,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 10.sp
                                ),
                                color = if (isSelected) Color.White else TextDarkPrimary,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}
