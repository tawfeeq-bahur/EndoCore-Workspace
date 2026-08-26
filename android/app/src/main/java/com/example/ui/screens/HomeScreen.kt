package com.example.ui.screens

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Commit
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.IntegrationInstructions
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import com.example.data.model.DeveloperApp
import com.example.data.model.FocusSessionState
import com.example.data.model.TimelineEntry
import com.example.ui.components.BentoGridTelemetrySection
import com.example.ui.components.EnviGradientLineChart
import com.example.ui.components.OnboardingHudModal
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenBright
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

data class TelemetryEventItem(
    val title: String,
    val subtitle: String,
    val isPositive: Boolean,
    val value: String,
    val icon: ImageVector
)

/**
 * EndoCore Hybrid Bento & Telemetry Dashboard Screen.
 * Exact visual structure of the clean bento design with genuine EndoCore developer telemetry.
 */
@Composable
fun HomeScreen(
    focusState: FocusSessionState,
    timeline: List<TimelineEntry>,
    onOpenTelemetryInspector: () -> Unit,
    onTogglePause: () -> Unit,
    onToggleDeepWork: () -> Unit,
    onSwitchApp: (DeveloperApp) -> Unit,
    modifier: Modifier = Modifier
) {
    var showOnboardingHud by remember { mutableStateOf(false) }

    val recentTelemetryFeed = listOf(
        TelemetryEventItem("IDE Active Session", "Visual Studio Code • ${focusState.projectName}", true, "3h 43m", Icons.Default.Code),
        TelemetryEventItem("Automated CI Pipeline", "k8s-cluster build & regression suite", true, "14.8s", Icons.Default.Build),
        TelemetryEventItem("Context Switches", "3 window transitions in past hour", false, "3 / hr", Icons.Default.Memory)
    )

    if (showOnboardingHud) {
        OnboardingHudModal(onClose = { showOnboardingHud = false })
    } else {
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .background(CanvasLight)
                .padding(horizontal = 18.dp)
                .testTag("home_screen_feed")
        ) {
            item {
                Spacer(modifier = Modifier.height(14.dp))

                // Top Header: EndoCore Brand Logo + User Avatar + Quick HUD Switcher + Telemetry Inspector
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // EndoCore Brand Logo
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "endocore",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 24.sp
                            ),
                            color = EnviGreenDark
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(EnviGreen)
                        )
                    }

                    // Avatar & Actions Row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // User Avatar
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFFB4A2))
                                .clickable { showOnboardingHud = true }
                                .testTag("btn_user_avatar"),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "TB",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF5D2E24)
                            )
                        }

                        // Growth / Telemetry Matrix HUD button
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .clickable { showOnboardingHud = true }
                                .padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.TrendingUp,
                                contentDescription = "View Telemetry Matrix",
                                tint = TextDarkPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        // Workstation Inspector Icon
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .clickable { onOpenTelemetryInspector() }
                                .padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ChatBubbleOutline,
                                contentDescription = "Open Telemetry Inspector",
                                tint = TextDarkPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Greeting & Workstation Status
                Column {
                    Text(
                        text = "Hello, Tawfeeq",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 28.sp
                        ),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Your workstation velocity looks so good",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextDarkSecondary
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Workstation Metric Bar (Daily Focus Hours / Velocity + Target Remaining)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = "3.7",
                                style = MaterialTheme.typography.headlineSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp
                                ),
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "hrs in flow",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDarkMuted,
                                modifier = Modifier.padding(bottom = 3.dp)
                            )
                        }
                        Text(
                            text = "Daily focus session",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDarkMuted,
                            fontSize = 11.sp
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text(
                                text = "1.3",
                                style = MaterialTheme.typography.headlineSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp
                                ),
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "hrs left",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDarkMuted,
                                modifier = Modifier.padding(bottom = 3.dp)
                            )
                        }
                        Text(
                            text = "Goal: 5.0 hrs",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDarkMuted,
                            fontSize = 11.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))
            }

            // 1. Bento Grid 2x2 Telemetry Section
            item {
                BentoGridTelemetrySection(
                    velocityScore = "${focusState.dailyFocusScore}%",
                    caloriesOrKwh = "${focusState.dailyFocusScore}%",
                    activeNodesCount = "18 Nodes",
                    isFlowActive = focusState.isTracking && !focusState.isPaused,
                    memberCountBonus = "+18",
                    onStartClick = onTogglePause,
                    onMembersClick = onOpenTelemetryInspector
                )

                Spacer(modifier = Modifier.height(20.dp))
            }

            // 2. Hero Workstation Telemetry Throughput Chart
            item {
                EnviGradientLineChart(
                    title = "Workstation throughput",
                    totalValue = "124,186 ops/s",
                    daysCount = "147 active days",
                    savedAmount = "99.2% uptime"
                )

                Spacer(modifier = Modifier.height(20.dp))
            }

            // 3. Main Workstation Resource Allocations (IDE, Backend JVM, Containers)
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("energy_sources_card")
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Main developer process distribution",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextDarkPrimary
                            )
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = "View Details",
                                tint = TextDarkPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // IDE Process (58%)
                            Column {
                                Text(
                                    text = "58%",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "VS Code / IDE",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextDarkMuted
                                )
                            }

                            // Build & Tests (27%)
                            Column {
                                Text(
                                    text = "27%",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "JVM / Docker",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextDarkMuted
                                )
                            }

                            // Comms & PR Review (15%)
                            Column {
                                Text(
                                    text = "15%",
                                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "GitHub / Slack",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextDarkMuted
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
            }

            // 4. Live Telemetry Activity Stream
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Real-time telemetry stream",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextDarkPrimary
                    )
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "View All",
                        tint = TextDarkPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))
            }

            items(recentTelemetryFeed) { item ->
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .testTag("spending_item_${item.title}")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F5F3)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = null,
                                    tint = TextDarkPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(7.dp)
                                            .clip(CircleShape)
                                            .background(if (item.isPositive) EnviGreen else EnviCoral)
                                    )
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text(
                                        text = item.subtitle,
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = if (item.isPositive) EnviGreenDark else EnviCoral,
                                            fontWeight = FontWeight.Medium
                                        ),
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Text(
                            text = item.value,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = if (item.isPositive) TextDarkPrimary else EnviCoral
                            )
                        )
                    }
                }
            }

            // Bottom space for floating capsule dock
            item {
                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }
}

