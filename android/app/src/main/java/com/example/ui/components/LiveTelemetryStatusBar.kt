package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DeveloperApp
import com.example.data.model.FocusSessionState
import com.example.ui.theme.AmberWarning
import com.example.ui.theme.CyanTelemetry
import com.example.ui.theme.EmeraldStatus
import com.example.ui.theme.EnterpriseBorderLight
import com.example.ui.theme.EnterpriseSurfaceElevated
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary

@Composable
fun LiveTelemetryStatusBar(
    focusState: FocusSessionState,
    onExpand: () -> Unit,
    onTogglePause: () -> Unit,
    modifier: Modifier = Modifier
) {
    val hours = focusState.elapsedSeconds / 3600
    val minutes = (focusState.elapsedSeconds % 3600) / 60
    val seconds = focusState.elapsedSeconds % 60
    val timeFormatted = String.format("%02d:%02d:%02d", hours, minutes, seconds)

    AnimatedVisibility(
        visible = focusState.isTracking,
        enter = slideInVertically(initialOffsetY = { it }),
        exit = slideOutVertically(targetOffsetY = { it }),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(EnterpriseSurfaceElevated)
                .border(1.dp, EnterpriseBorderLight, RoundedCornerShape(12.dp))
                .clickable { onExpand() }
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .testTag("telemetry_status_bar")
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left: App Icon & Project/Window info
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(focusState.activeApp.brandColorHex).copy(alpha = 0.2f))
                            .border(1.dp, Color(focusState.activeApp.brandColorHex).copy(alpha = 0.5f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = when (focusState.activeApp) {
                                DeveloperApp.TERMINAL -> Icons.Default.Terminal
                                else -> Icons.Default.Code
                            },
                            contentDescription = focusState.activeApp.appName,
                            tint = Color(focusState.activeApp.brandColorHex),
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            PulsingLiveDot(
                                isOnline = !focusState.isPaused,
                                activeColor = if (focusState.isPaused) AmberWarning else EmeraldStatus,
                                dotSize = 6.dp
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = focusState.projectName,
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.3.sp
                                ),
                                color = TextPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "• ${focusState.telemetry.agentLatencyMs}ms",
                                style = MaterialTheme.typography.labelSmall,
                                color = CyanTelemetry,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp
                            )
                        }

                        Text(
                            text = focusState.windowTitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontSize = 11.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Right: Session Time & Quick Action Buttons
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.End
                ) {
                    Column(
                        horizontalAlignment = Alignment.End,
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Text(
                            text = timeFormatted,
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = if (focusState.isPaused) AmberWarning else CyanTelemetry
                        )
                        Text(
                            text = if (focusState.isPaused) "PAUSED" else "ACTIVE",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    IconButton(
                        onClick = onTogglePause,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(
                                if (focusState.isPaused) AmberWarning.copy(alpha = 0.2f)
                                else CyanTelemetry.copy(alpha = 0.15f)
                            )
                            .testTag("telemetry_bar_toggle_pause")
                    ) {
                        Icon(
                            imageVector = if (focusState.isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                            contentDescription = if (focusState.isPaused) "Resume" else "Pause",
                            tint = if (focusState.isPaused) AmberWarning else CyanTelemetry,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    IconButton(
                        onClick = onExpand,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("telemetry_bar_expand")
                    ) {
                        Icon(
                            imageVector = Icons.Default.ExpandLess,
                            contentDescription = "Inspect Telemetry",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}
