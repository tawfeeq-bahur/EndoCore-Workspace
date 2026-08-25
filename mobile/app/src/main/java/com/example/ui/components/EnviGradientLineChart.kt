package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenBright
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

data class LineDataPoint(
    val month: String,
    val valueRatio: Float // 0.0 to 1.0
)

/**
 * Total Power Input / Telemetry Hero Card with smooth Bezier Line & Gradient Area (Image 1 center).
 */
@Composable
fun EnviGradientLineChart(
    title: String = "Total power input",
    totalValue: String = "124,186 kWh",
    daysCount: String = "147 days",
    savedAmount: String = "\$2.7K saved",
    chartHeight: Dp = 190.dp,
    modifier: Modifier = Modifier
) {
    val points = listOf(
        LineDataPoint("Jun", 0.70f),
        LineDataPoint("Jul", 0.40f),
        LineDataPoint("Aug", 0.50f),
        LineDataPoint("Sep", 0.45f),
        LineDataPoint("Oct", 0.65f),
        LineDataPoint("Nov", 0.55f)
    )

    var selectedIndex by remember { mutableIntStateOf(4) } // October by default

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .testTag("envi_gradient_line_chart_card")
    ) {
        Column(
            modifier = Modifier.padding(18.dp)
        ) {
            // Header Row: Title & Total Value Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "$daysCount · ",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextDarkMuted,
                            fontSize = 12.sp
                        )
                        Text(
                            text = savedAmount,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = EnviGreenDark,
                            fontSize = 12.sp
                        )
                    }
                }

                // Value Pill
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFF101817))
                        .padding(horizontal = 14.dp, vertical = 7.dp)
                ) {
                    Text(
                        text = totalValue,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ),
                        fontSize = 13.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Canvas Line & Gradient Area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(chartHeight - 70.dp)
            ) {
                Canvas(
                    modifier = Modifier.fillMaxSize()
                ) {
                    val w = size.width
                    val h = size.height
                    val stepX = w / (points.size - 1)

                    val coords = points.mapIndexed { index, item ->
                        val x = index * stepX
                        val y = h - (item.valueRatio * h * 0.75f) - (h * 0.12f)
                        Offset(x, y)
                    }

                    // Build smooth cubic Bezier path
                    val fillPath = Path().apply {
                        moveTo(0f, h)
                        lineTo(coords[0].x, coords[0].y)
                        for (i in 0 until coords.size - 1) {
                            val p0 = coords[i]
                            val p1 = coords[i + 1]
                            val controlX1 = (p0.x + p1.x) / 2f
                            val controlY1 = p0.y
                            val controlX2 = (p0.x + p1.x) / 2f
                            val controlY2 = p1.y
                            cubicTo(controlX1, controlY1, controlX2, controlY2, p1.x, p1.y)
                        }
                        lineTo(w, h)
                        close()
                    }

                    val strokePath = Path().apply {
                        moveTo(coords[0].x, coords[0].y)
                        for (i in 0 until coords.size - 1) {
                            val p0 = coords[i]
                            val p1 = coords[i + 1]
                            val controlX1 = (p0.x + p1.x) / 2f
                            val controlY1 = p0.y
                            val controlX2 = (p0.x + p1.x) / 2f
                            val controlY2 = p1.y
                            cubicTo(controlX1, controlY1, controlX2, controlY2, p1.x, p1.y)
                        }
                    }

                    // Draw Gradient Fill
                    drawPath(
                        path = fillPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(
                                Color(0xFFD3F5E1),
                                Color(0xFFFFFFFF).copy(alpha = 0.05f)
                            )
                        )
                    )

                    // Draw Line Stroke
                    drawPath(
                        path = strokePath,
                        color = Color(0xFF03C966),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )

                    // Draw Node Dots
                    coords.forEachIndexed { index, offset ->
                        if (index == selectedIndex) {
                            // Selected node with larger halo
                            drawCircle(
                                color = Color(0xFF03C966).copy(alpha = 0.25f),
                                radius = 9.dp.toPx(),
                                center = offset
                            )
                            drawCircle(
                                color = Color(0xFF03C966),
                                radius = 4.5.dp.toPx(),
                                center = offset
                            )
                        } else {
                            drawCircle(
                                color = Color(0xFF03C966),
                                radius = 3.dp.toPx(),
                                center = offset
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Month Labels Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                points.forEachIndexed { index, item ->
                    val isSelected = index == selectedIndex
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) Color(0xFF101817) else Color.Transparent)
                            .clickable { selectedIndex = index }
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = item.month,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 11.sp
                            ),
                            color = if (isSelected) Color.White else TextDarkMuted
                        )
                    }
                }
            }
        }
    }
}
