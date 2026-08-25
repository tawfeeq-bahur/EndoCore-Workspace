package com.example.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.IntegrationInstructions
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AiInsightsData
import com.example.ui.components.EnviArcGauge
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.BentoMidnightTeal
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoPlum
import com.example.ui.theme.BentoSage
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

data class DevStackPillData(
    val title: String,
    val icon: ImageVector,
    val bgColor: Color,
    val textColor: Color
)

/**
 * EndoCore Engineering Reports & Telemetry Analytics Screen.
 * Retains the hybrid Bento & radial gauge visual elegance with developer productivity metrics.
 */
@Composable
fun InsightsScreen(
    insights: AiInsightsData,
    modifier: Modifier = Modifier
) {
    var selectedTimeRange by remember { mutableIntStateOf(1) } // 0: 12 hrs, 1: 24 hrs, 2: 1 week

    val devStacks = listOf(
        DevStackPillData("VS Code", Icons.Default.Code, BentoSage, Color(0xFF1E3224)),
        DevStackPillData("Terminal", Icons.Default.Terminal, BentoPeach, Color(0xFF332019)),
        DevStackPillData("Docker", Icons.Default.DataObject, BentoMidnightTeal, Color.White)
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 18.dp)
            .testTag("reports_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // Top Header: Back, "Analytics", Refresh
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TextDarkPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Text(
                    text = "Analytics",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 22.sp
                    ),
                    color = TextDarkPrimary
                )

                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .padding(8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = TextDarkPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Telemetry Velocity Header + Delta Pill
            Text(
                text = "Telemetry velocity in 24 hrs",
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                color = TextDarkSecondary
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${insights.scrum.hoursInCode} hrs",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 28.sp
                    ),
                    color = TextDarkPrimary
                )

                Spacer(modifier = Modifier.width(12.dp))

                // +18% Velocity Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(EnviCoral)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "↑ + ${insights.weeklyGrowthPercent}%",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ),
                        fontSize = 11.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Commits & PR Pipeline section
            Text(
                text = "CI/CD & Commit Pipeline",
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                color = TextDarkMuted,
                fontSize = 12.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(EnviGreen)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "12 commits indexed to main",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                    color = TextDarkPrimary,
                    fontSize = 12.sp
                )
                Text(
                    text = " · 99.8% test pass rate",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextDarkMuted,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 1. Radial Matching Arc Gauge (EndoCore Deep Flow Target Match)
            EnviArcGauge(
                percentage = 84,
                title = "flow state matched"
            )

            Spacer(modifier = Modifier.height(20.dp))

            // 2. Time Usage Selector Pills (12 hrs, 24 hrs, 1 week)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // 12 hrs usage
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (selectedTimeRange == 0) Color(0xFF161F1D) else Color.White)
                        .clickable { selectedTimeRange = 0 }
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "12 hrs span",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (selectedTimeRange == 0) Color.White else TextDarkMuted
                        ),
                        fontSize = 11.sp
                    )
                }

                // 24 hrs usage (active default)
                Box(
                    modifier = Modifier
                        .weight(1.1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (selectedTimeRange == 1) Color(0xFF161F1D) else Color.White)
                        .clickable { selectedTimeRange = 1 }
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Schedule,
                            contentDescription = null,
                            tint = if (selectedTimeRange == 1) Color.White else TextDarkMuted,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "24 hrs span",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = if (selectedTimeRange == 1) Color.White else TextDarkMuted
                            ),
                            fontSize = 11.sp
                        )
                    }
                }

                // 1 week usage
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (selectedTimeRange == 2) Color(0xFF161F1D) else Color.White)
                        .clickable { selectedTimeRange = 2 }
                        .padding(horizontal = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CalendarMonth,
                            contentDescription = null,
                            tint = if (selectedTimeRange == 2) Color.White else TextDarkMuted,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "1 week",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = if (selectedTimeRange == 2) Color.White else TextDarkMuted
                            ),
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 3. Results Velocity Timeline Stem Chart
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("results_stem_chart_card")
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Weekly Flow Score",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextDarkPrimary
                            )
                            Text(
                                text = "Nov 2026 • Core Engine",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDarkMuted,
                                fontSize = 11.sp
                            )
                        }

                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF161F1D)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Stem & Dot Canvas
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp)
                    ) {
                        // Dashed reference line
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .align(Alignment.TopCenter)
                                .padding(top = 18.dp)
                                .background(Color(0xFFE2E8F0))
                        )

                        // 5 Days (Mon 01, Tue 04, Wed 03, Thu 05, Fri 07)
                        val days = listOf("Mon\n01", "Tue\n04", "Wed\n03", "Thu\n05", "Fri\n07")

                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            days.forEachIndexed { index, day ->
                                val isSelected = index == 3 // Thu 05
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.width(44.dp)
                                ) {
                                    if (isSelected) {
                                        Text(
                                            text = "5.4h",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                            color = TextDarkPrimary,
                                            fontSize = 11.sp
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                    }

                                    // Stem Line with Dot
                                    Box(
                                        modifier = Modifier
                                            .width(2.dp)
                                            .height(55.dp)
                                            .background(Color(0xFFCBD5E1)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(if (isSelected) 10.dp else 6.dp)
                                                .clip(CircleShape)
                                                .background(if (isSelected) Color(0xFFFF9E80) else Color(0xFF161F1D))
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(6.dp))

                                    Text(
                                        text = day,
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                            fontSize = 10.sp
                                        ),
                                        color = if (isSelected) TextDarkPrimary else TextDarkMuted,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 4. Developer Tools Bento Tiles (VS Code, Terminal, Docker)
            Text(
                text = "Workstation Process Split",
                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                color = TextDarkPrimary
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                devStacks.forEach { act ->
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = act.bgColor),
                        modifier = Modifier
                            .weight(1f)
                            .height(95.dp)
                            .testTag("activity_pill_${act.title}")
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(12.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(alpha = 0.7f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = act.icon,
                                    contentDescription = act.title,
                                    tint = act.textColor,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            Text(
                                text = act.title,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = act.textColor
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 5. Workstation Telemetry Throughput Card & Action
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(BentoPlum),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = "System Telemetry Rate",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = TextDarkPrimary
                            )
                            Text(
                                text = "WebSocket streaming • 0 dropped frames",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDarkMuted,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(
                            text = "256",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp
                            ),
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = "ops/s",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextDarkMuted,
                            modifier = Modifier.padding(bottom = 3.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Export Session Report Action
            Button(
                onClick = { /* Export Telemetry */ },
                colors = ButtonDefaults.buttonColors(
                    containerColor = BentoPlum,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("btn_continue_flow")
            ) {
                Text(
                    text = "Export Engineering Report",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

