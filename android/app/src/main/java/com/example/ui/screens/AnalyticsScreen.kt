package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import com.example.data.model.AiInsightsData
import com.example.data.model.FocusSessionState
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * My Analytics Screen - Faithfully implementing the EndoCore Analytics dashboard (Screenshots 3 & 4).
 * Includes:
 * - Header: My Analytics (Analyzing app distribution, focus history, deep work)
 * - Focus Contribution Heatmap (52 Weeks x 7 Days 365-day grid + Scrub Slider + Legend)
 * - 3 KPI Cards: Average Daily Focus, Daily Focus Goal, Weekly Goal Achievement
 * - App Distribution Share (Donut chart & telemetry percentage bars)
 * - Weekly Focus Retention Score with 80% Ideal Baseline indicator
 */
@Composable
fun AnalyticsScreen(
    focusState: FocusSessionState,
    insights: AiInsightsData,
    modifier: Modifier = Modifier
) {
    var heatmapScrubPosition by remember { mutableFloatStateOf(0.85f) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 16.dp)
            .testTag("analytics_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // 1. Header Section
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "My Analytics",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Black,
                            fontSize = 24.sp
                        ),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(EnviGreen)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Analyzing application distribution, focus history charts, and deep work contribution logs.",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp, lineHeight = 16.sp),
                    color = TextDarkSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. FOCUS CONTRIBUTION HEATMAP (Last 365 Days)
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
                            Icon(
                                imageVector = Icons.Default.CalendarToday,
                                contentDescription = null,
                                tint = EnviGreenDark,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "FOCUS CONTRIBUTION HEATMAP",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                        }
                        Text(
                            text = "Last 365 Days",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkSecondary
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Month Headers
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 28.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        listOf("Jan", "Mar", "May", "Jul", "Sep", "Nov").forEach { month ->
                            Text(
                                text = month,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // Heatmap Matrix with Day Labels (Mon, Wed, Fri)
                    Row(modifier = Modifier.fillMaxWidth()) {
                        // Day Labels Column
                        Column(
                            verticalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.padding(end = 6.dp)
                        ) {
                            Text("Mon", style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp), color = TextDarkMuted)
                            Spacer(modifier = Modifier.height(3.dp))
                            Text("Wed", style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp), color = TextDarkMuted)
                            Spacer(modifier = Modifier.height(3.dp))
                            Text("Fri", style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp), color = TextDarkMuted)
                        }

                        // 36-column heatmap grid (scrollable/fitted)
                        val scrollState = rememberScrollState()
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(3.dp),
                            modifier = Modifier
                                .weight(1f)
                                .horizontalScroll(scrollState)
                        ) {
                            val seedPattern = listOf(0, 1, 3, 2, 4, 1, 0, 2, 3, 4, 4, 3, 2, 1, 0, 4, 3, 2, 0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 3, 1, 2, 3, 4, 2, 1)
                            for (col in 0 until 36) {
                                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                    for (row in 0 until 7) {
                                        val intensity = (seedPattern[(col + row) % seedPattern.size])
                                        val cellColor = when (intensity) {
                                            0 -> Color(0xFFE5ECE8)
                                            1 -> Color(0xFFA7F3D0)
                                            2 -> Color(0xFF34D399)
                                            3 -> Color(0xFF059669)
                                            else -> Color(0xFF064E3B)
                                        }
                                        Box(
                                            modifier = Modifier
                                                .size(9.dp)
                                                .clip(RoundedCornerShape(2.dp))
                                                .background(cellColor)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Scrub Slider
                    Slider(
                        value = heatmapScrubPosition,
                        onValueChange = { heatmapScrubPosition = it },
                        colors = SliderDefaults.colors(
                            thumbColor = EnviGreenDark,
                            activeTrackColor = EnviGreenDark,
                            inactiveTrackColor = Color(0xFFE2EBE5)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Legend: Less [][][][][] More
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Less",
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        listOf(
                            Color(0xFFE5ECE8),
                            Color(0xFFA7F3D0),
                            Color(0xFF34D399),
                            Color(0xFF059669),
                            Color(0xFF064E3B)
                        ).forEach { color ->
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(color)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                        }
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = "More",
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                            color = TextDarkMuted
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 3. Top 3 KPI Bento Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AnalyticsKpiCard(
                    title = "AVERAGE DAILY FOCUS",
                    value = "0 hrs",
                    description = "Calculated on active window durations",
                    modifier = Modifier.weight(1f)
                )
                AnalyticsKpiCard(
                    title = "DAILY FOCUS GOAL",
                    value = "6 hrs",
                    description = "Configured target parameters",
                    modifier = Modifier.weight(1f)
                )
                AnalyticsKpiCard(
                    title = "WEEKLY GOAL ACHIEVEMENT",
                    value = "0%",
                    description = "Goal compliance indicator",
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 4. APP DISTRIBUTION SHARE [LIVE TELEMETRY]
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
                            Icon(
                                imageVector = Icons.Default.PieChart,
                                contentDescription = null,
                                tint = EnviGreenDark,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "APP DISTRIBUTION SHARE",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                        }
                        Text(
                            text = "LIVE TELEMETRY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp
                            ),
                            color = EnviGreenDark
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Donut Chart
                        Box(
                            modifier = Modifier
                                .size(96.dp)
                                .padding(4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            DonutDistributionChart()
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = "100%",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Black,
                                        fontSize = 13.sp
                                    ),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "Total",
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.5.sp),
                                    color = TextDarkMuted
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        // App share bars
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            AppShareItem("Antigravity IDE", "48%", Color(0xFF00B37E))
                            AppShareItem("VS Code", "24%", Color(0xFF007ACC))
                            AppShareItem("Chrome DevTools", "14%", Color(0xFF4285F4))
                            AppShareItem("Ghostty / Zsh", "8%", Color(0xFFF59E0B))
                            AppShareItem("Figma / Others", "6%", Color(0xFFEC4899))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 5. WEEKLY FOCUS RETENTION SCORE [IDEAL BASELINE]
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
                            Icon(
                                imageVector = Icons.Default.TrendingUp,
                                contentDescription = null,
                                tint = EnviGreenDark,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "WEEKLY FOCUS RETENTION SCORE",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                        }
                        Text(
                            text = "IDEAL BASELINE: 80%",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.5.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = Color(0xFFDC2626)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Days: Sun, Mon, Tue, Wed, Thu, Fri, Sat with 80% baseline indicator
                    val weekDays = listOf(
                        Triple("Sun", 0, "score: 0% / ideal 80%"),
                        Triple("Mon", 75, "score: 75% / ideal 80%"),
                        Triple("Tue", 88, "score: 88% / ideal 80%"),
                        Triple("Wed", 92, "score: 92% / ideal 80%"),
                        Triple("Thu", 80, "score: 80% / ideal 80%"),
                        Triple("Fri", 65, "score: 65% / ideal 80%"),
                        Triple("Sat", 0, "score: 0% / ideal 80%")
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        weekDays.forEach { (day, score, label) ->
                            DayRetentionBar(day = day, score = score, label = label)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp)) // Dock padding
        }
    }
}

@Composable
fun AnalyticsKpiCard(
    title: String,
    value: String,
    description: String,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 8.5.sp,
                    fontFamily = FontFamily.Monospace
                ),
                color = TextDarkMuted,
                lineHeight = 11.sp,
                maxLines = 2
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Black,
                    fontSize = 18.sp
                ),
                color = TextDarkPrimary
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 9.sp,
                    lineHeight = 11.sp
                ),
                color = TextDarkSecondary,
                maxLines = 2
            )
        }
    }
}

@Composable
fun DonutDistributionChart() {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val strokeWidth = 14.dp.toPx()
        val diameter = size.minDimension - strokeWidth
        val topLeft = Offset((size.width - diameter) / 2, (size.height - diameter) / 2)
        val arcSize = Size(diameter, diameter)

        // 48% Antigravity IDE (Emerald)
        drawArc(
            color = Color(0xFF00B37E),
            startAngle = -90f,
            sweepAngle = 360f * 0.48f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth)
        )
        // 24% VS Code (Blue)
        drawArc(
            color = Color(0xFF007ACC),
            startAngle = -90f + (360f * 0.48f),
            sweepAngle = 360f * 0.24f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth)
        )
        // 14% Chrome (Light Blue)
        drawArc(
            color = Color(0xFF4285F4),
            startAngle = -90f + (360f * 0.72f),
            sweepAngle = 360f * 0.14f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth)
        )
        // 8% Terminal (Amber)
        drawArc(
            color = Color(0xFFF59E0B),
            startAngle = -90f + (360f * 0.86f),
            sweepAngle = 360f * 0.08f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth)
        )
        // 6% Others (Pink)
        drawArc(
            color = Color(0xFFEC4899),
            startAngle = -90f + (360f * 0.94f),
            sweepAngle = 360f * 0.06f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = strokeWidth)
        )
    }
}

@Composable
fun AppShareItem(name: String, percentage: String, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(color)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = name,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontWeight = FontWeight.Medium,
                    fontSize = 11.sp
                ),
                color = TextDarkPrimary
            )
        }
        Text(
            text = percentage,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            ),
            color = TextDarkSecondary
        )
    }
}

@Composable
fun DayRetentionBar(day: String, score: Int, label: String) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = day,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                ),
                color = TextDarkPrimary
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontSize = 9.5.sp,
                    fontFamily = FontFamily.Monospace
                ),
                color = TextDarkMuted
            )
        }
        Spacer(modifier = Modifier.height(3.dp))
        // Progress Track with 80% vertical red marker
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color(0xFFE5ECE8))
        ) {
            // Fill Bar
            if (score > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction = (score / 100f).coerceIn(0f, 1f))
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (score >= 80) Color(0xFF00B37E) else Color(0xFFF59E0B))
                )
            }
            // 80% Baseline indicator line
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.8f)
                    .align(Alignment.CenterStart)
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 2.dp, height = 8.dp)
                        .background(Color(0xFFDC2626))
                        .align(Alignment.CenterEnd)
                )
            }
        }
    }
}
