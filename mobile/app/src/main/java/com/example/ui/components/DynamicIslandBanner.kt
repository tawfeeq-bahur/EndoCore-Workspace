package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Done
import androidx.compose.material.icons.filled.OpenInFull
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.PeerWaveNotification
import com.example.ui.theme.EnviCoralDock
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import kotlinx.coroutines.delay

/**
 * Dynamic Island / Status Bar Floating Activity Pill
 * 
 * Accurately matches the attached design:
 * - High-contrast tactile dark capsule (#0F1715)
 * - Neon green circle badge with lightning bolt
 * - Title line: "⚡ Arun (Research Associate): sent 1v1"
 * - Subtitle line: "Pomodoro focus sprint challenge"
 * - Dismiss 'x' button
 * - Expands on tap to accept peer duels or control ongoing session timer!
 */
@Composable
fun DynamicIslandBanner(
    peerWave: PeerWaveNotification?,
    isSessionActive: Boolean,
    isSessionPaused: Boolean,
    activeTaskName: String,
    onDismissWave: () -> Unit,
    onAcceptChallenge: (PeerWaveNotification) -> Unit,
    onTogglePauseSession: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }

    // Auto-dismiss peer alerts after 9 seconds if not expanded
    LaunchedEffect(peerWave?.id) {
        if (peerWave != null) {
            isExpanded = false
            delay(9000)
            if (!isExpanded) {
                onDismissWave()
            }
        }
    }

    val isVisible = peerWave != null || isSessionActive

    AnimatedVisibility(
        visible = isVisible,
        enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
        exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(elevation = 12.dp, shape = RoundedCornerShape(28.dp), spotColor = Color.Black)
                .clip(RoundedCornerShape(28.dp))
                .background(Color(0xFF0F1715))
                .border(1.dp, Color(0xFF1E2E2A), RoundedCornerShape(28.dp))
                .animateContentSize(animationSpec = spring(dampingRatio = Spring.DampingRatioLowBouncy))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    isExpanded = !isExpanded
                }
                .padding(horizontal = 14.dp, vertical = 10.dp)
                .testTag("dynamic_island_pill")
        ) {
            Column {
                // Collapsed Compact Pill Row (Exact Match to Screenshot)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Left Circle Icon Badge
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(EnviGreenDark),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = "Activity Icon",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    // Text Content (2 Lines)
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        if (peerWave != null) {
                            // 1v1 Peer Challenge Alert
                            Text(
                                text = "⚡ ${peerWave.senderName} (${peerWave.senderRole}): sent 1v1",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.5.sp
                                ),
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Pomodoro focus sprint challenge",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontSize = 11.sp
                                ),
                                color = Color(0xFFD1D5DB),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        } else {
                            // Ongoing Focus Session Live Activity
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = if (isSessionPaused) "⏸️ Focus Session Paused" else "🟢 EndoCore Live Focus",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.5.sp
                                    ),
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "24:38",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
                                    ),
                                    color = EnviGreen
                                )
                            }
                            Text(
                                text = activeTaskName,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontSize = 11.sp
                                ),
                                color = Color(0xFF9CA3AF),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    // Right Actions (Quick Pause / Dismiss)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (peerWave == null && isSessionActive) {
                            IconButton(
                                onClick = onTogglePauseSession,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = if (isSessionPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                                    contentDescription = "Toggle Pause",
                                    tint = Color.White,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        IconButton(
                            onClick = {
                                if (peerWave != null) onDismissWave() else isExpanded = !isExpanded
                            },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = Color(0xFF9CA3AF),
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }

                // Expanded Drawer (When Tapped)
                if (isExpanded) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(Color(0xFF1F2E2A))
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    if (peerWave != null) {
                        // Accept 1v1 Challenge Modal Actions
                        Text(
                            text = "Challenge: 25-minute synchronous deep focus sprint against ${peerWave.senderName}. Score updates live on leaderboard.",
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontSize = 11.sp,
                                lineHeight = 15.sp
                            ),
                            color = Color(0xFFE5E7EB)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    onDismissWave()
                                    isExpanded = false
                                },
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Decline", color = Color(0xFFD1D5DB), fontSize = 11.sp)
                            }
                            Button(
                                onClick = {
                                    onAcceptChallenge(peerWave)
                                    isExpanded = false
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EnviGreenDark),
                                modifier = Modifier.weight(1.3f)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Bolt,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Accept 1v1 Sprint", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        // Ongoing Session Expansion Actions
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Target: 8.0 hrs Daily Goal (80% achieved)",
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                    color = Color(0xFF9CA3AF)
                                )
                                Text(
                                    text = "Foreground Service Active • Auto-Syncing",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontSize = 10.sp,
                                        fontFamily = FontFamily.Monospace
                                    ),
                                    color = EnviGreen
                                )
                            }
                            Button(
                                onClick = onTogglePauseSession,
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isSessionPaused) EnviGreenDark else EnviCoralDock
                                )
                            ) {
                                Text(
                                    text = if (isSessionPaused) "Resume 25m" else "Pause Session",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
