package com.example.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.FocusSessionState
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * My Goals Screen - Faithfully implementing the EndoCore Pomodoro Focus Timer & Goal Streaks (Screenshot 5).
 * Includes:
 * - Active Task Name header
 * - Circular Animated Pomodoro Progress Ring & Controls (-5m, Play/Pause, Reset, Skip, +5m)
 * - Session Mode Selector: Focus (25m) vs Break (5m)
 * - Quick Duration Presets: [15m] [25m] [35m] [45m] [60m] [90m]
 * - Custom Minutes Input & Task Name Sync
 * - Streak Card (🔥 3 Day Streak & 4 days remaining for weekly reward)
 * - Distraction Log with Zen State indicator & Manual Flag logging
 */
@Composable
fun GoalsScreen(
    focusState: FocusSessionState,
    onStartPomodoro: () -> Unit,
    onPausePomodoro: () -> Unit,
    onResetPomodoro: () -> Unit,
    onAdjustPomodoroTime: (Int) -> Unit,
    onSetPreset: (Int) -> Unit,
    onSetSessionMode: (String) -> Unit,
    onSkipSession: () -> Unit,
    onLogDistraction: () -> Unit,
    onResetDistractions: () -> Unit,
    onSyncTaskName: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var taskInputText by remember { mutableStateOf(focusState.projectName) }
    var customMinutesInput by remember { mutableStateOf("25") }

    val isRunning = focusState.isPomodoroActive
    val totalSeconds = if (focusState.sessionMode.startsWith("Break")) 5 * 60 else 25 * 60
    val secondsLeft = focusState.pomodoroSecondsLeft
    val progress = (secondsLeft.toFloat() / totalSeconds.toFloat()).coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(targetValue = progress, label = "PomodoroProgress")

    val minutes = secondsLeft / 60
    val seconds = secondsLeft % 60
    val timeFormatted = String.format("%02d:%02d", minutes, seconds)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 16.dp)
            .testTag("goals_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // 1. Header: Active Task
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Active Task: ",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Normal,
                                fontSize = 16.sp
                            ),
                            color = TextDarkSecondary
                        )
                        Text(
                            text = focusState.projectName,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            ),
                            color = TextDarkPrimary
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFE2EBE5))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "GOAL: 6.0 HRS",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = EnviGreenDark
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Primary Pomodoro Focus Timer Dial Card
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Status Badge Capsule (FOCUSING (25M) or BREAK (5M))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (focusState.sessionMode.startsWith("Break")) Color(0xFFFEF3C7) else Color(0xFFDCFCE7))
                            .border(1.dp, if (focusState.sessionMode.startsWith("Break")) Color(0xFFFDE68A) else Color(0xFF86EFAC), RoundedCornerShape(16.dp))
                            .padding(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(if (focusState.sessionMode.startsWith("Break")) Color(0xFFD97706) else Color(0xFF16A34A))
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (focusState.sessionMode.startsWith("Break")) "BREAK (5M)" else "FOCUSING (25M)",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = if (focusState.sessionMode.startsWith("Break")) Color(0xFFB45309) else Color(0xFF15803D)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Circular Progress Dial
                    Box(
                        modifier = Modifier
                            .size(190.dp)
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val strokeWidth = 12.dp.toPx()
                            val diameter = size.minDimension - strokeWidth
                            val topLeft = Offset((size.width - diameter) / 2, (size.height - diameter) / 2)
                            val arcSize = Size(diameter, diameter)

                            // Background Track
                            drawArc(
                                color = Color(0xFFE2EBE5),
                                startAngle = -90f,
                                sweepAngle = 360f,
                                useCenter = false,
                                topLeft = topLeft,
                                size = arcSize,
                                style = Stroke(width = strokeWidth)
                            )

                            // Active Countdown Arc
                            drawArc(
                                color = if (focusState.sessionMode.startsWith("Break")) Color(0xFFF59E0B) else Color(0xFF00B37E),
                                startAngle = -90f,
                                sweepAngle = 360f * animatedProgress,
                                useCenter = false,
                                topLeft = topLeft,
                                size = arcSize,
                                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                            )
                        }

                        // Time Text
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = timeFormatted,
                                style = MaterialTheme.typography.headlineLarge.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 38.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkPrimary
                            )
                            Text(
                                text = if (isRunning) "Deep Focus Active" else "Ready to Focus",
                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                color = TextDarkSecondary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Control Buttons Row: [-5m] [Start/Pause Focus] [Reset] [Skip] [+5m]
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // -5m
                        SmallTimerActionBtn(label = "-5m", onClick = { onAdjustPomodoroTime(-5) })

                        // Primary Action Button (Start Focus / Pause)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(20.dp))
                                .background(Color(0xFF131A18))
                                .clickable {
                                    if (isRunning) onPausePomodoro() else onStartPomodoro()
                                }
                                .padding(horizontal = 22.dp, vertical = 12.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = if (isRunning) "Pause Focus" else "Start Focus",
                                    style = MaterialTheme.typography.labelMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    ),
                                    color = Color.White
                                )
                            }
                        }

                        // Reset
                        SmallTimerActionBtn(
                            icon = Icons.Default.Replay,
                            onClick = { onResetPomodoro() }
                        )

                        // Skip
                        SmallTimerActionBtn(
                            icon = Icons.Default.SkipNext,
                            onClick = { onSkipSession() }
                        )

                        // +5m
                        SmallTimerActionBtn(label = "+5m", onClick = { onAdjustPomodoroTime(5) })
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // SESSION MODE: [Focus (25m)] vs [Break (5m)]
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFFE5ECE8))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        val isFocusMode = focusState.sessionMode.startsWith("Focus")
                        ModePill(
                            label = "Focus (25m)",
                            isSelected = isFocusMode,
                            onClick = { onSetSessionMode("Focus (25m)") },
                            modifier = Modifier.weight(1f)
                        )
                        ModePill(
                            label = "Break (5m)",
                            isSelected = !isFocusMode,
                            onClick = { onSetSessionMode("Break (5m)") },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Quick Duration Presets (Focus): [15m] [25m] [35m] [45m] [60m] [90m]
                    Text(
                        text = "QUICK DURATION PRESETS (FOCUS)",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(listOf(15, 25, 35, 45, 60, 90)) { mins ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color.White)
                                    .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                                    .clickable { onSetPreset(mins) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = "${mins}m",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    ),
                                    color = TextDarkPrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Custom Minutes Input
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = customMinutesInput,
                            onValueChange = { customMinutesInput = it },
                            placeholder = { Text("Custom mins", fontSize = 12.sp) },
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
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF131A18))
                                .clickable {
                                    val mins = customMinutesInput.toIntOrNull() ?: 25
                                    onSetPreset(mins)
                                }
                                .padding(horizontal = 14.dp, vertical = 14.dp)
                        ) {
                            Text(
                                text = "Set Mins",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 3. Sync Active Task Name Section
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "SYNC ACTIVE TASK NAME",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = taskInputText,
                            onValueChange = { taskInputText = it },
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
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF131A18))
                                .clickable { onSyncTaskName(taskInputText) }
                                .padding(horizontal = 14.dp, vertical = 14.dp)
                        ) {
                            Text(
                                text = "Sync Task",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 4. Streak Card (🔥 3 Day Streak)
            val stats = focusState.distractionStats
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
                                text = "🔥",
                                fontSize = 20.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${stats.streakDays} Day Streak",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp
                                ),
                                color = TextDarkPrimary
                            )
                        }
                        Text(
                            text = "// ${stats.daysRemainingForReward} days remaining for weekly reward",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Medium,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Maintain your streak by meeting your daily goal of 6 hours.",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.5.sp),
                        color = TextDarkSecondary
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    // Streak Progress Bar (3 of 7 days)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFE5ECE8))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(fraction = (stats.streakDays / 7f).coerceIn(0f, 1f))
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFFF59E0B))
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 5. DISTRACTION LOG Card [ZEN STATE badge]
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
                            text = "DISTRACTION LOG",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.5.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFDCFCE7))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "ZEN STATE",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.sp
                                ),
                                color = Color(0xFF16A34A)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("AGENT FLAGS", style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontFamily = FontFamily.Monospace), color = TextDarkMuted)
                                Text("${stats.agentFlags}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, fontSize = 18.sp), color = TextDarkPrimary)
                            }
                        }

                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("MANUAL LOG", style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontFamily = FontFamily.Monospace), color = TextDarkMuted)
                                Text("${stats.manualFlags}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Black, fontSize = 18.sp), color = TextDarkPrimary)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF3F4F6))
                                .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
                                .clickable { onLogDistraction() }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Log Distraction",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = TextDarkPrimary
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(12.dp))
                                .clickable { onResetDistractions() }
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Reset",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                ),
                                color = TextDarkSecondary
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp)) // Bottom dock padding
        }
    }
}

@Composable
fun SmallTimerActionBtn(
    label: String? = null,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(38.dp)
            .clip(CircleShape)
            .background(Color.White)
            .border(1.dp, Color(0xFFE5E7EB), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = TextDarkPrimary,
                modifier = Modifier.size(16.dp)
            )
        } else if (label != null) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                ),
                color = TextDarkPrimary
            )
        }
    }
}

@Composable
fun ModePill(
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
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 11.sp
            ),
            color = if (isSelected) TextDarkPrimary else TextDarkSecondary
        )
    }
}
