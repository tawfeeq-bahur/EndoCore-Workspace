package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.EnviAmber
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenBright
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.EnviHydroBlue
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary
import kotlin.math.cos
import kotlin.math.sin

/**
 * Custom Arc Gauge matching the Envi Reports UI (Image 1 right).
 * Shows a 180-degree graduated arc (0 - 400 scale) with a glowing green progress sweep,
 * center percentage, and day/night telemetry breakdown.
 */
@Composable
fun EnviArcGauge(
    percentage: Int = 63,
    title: String = "green energy matched",
    gaugeHeight: Dp = 230.dp,
    modifier: Modifier = Modifier
) {
    val animatedProgress by animateFloatAsState(
        targetValue = percentage / 100f,
        animationSpec = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
        label = "ArcProgress"
    )

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .testTag("envi_arc_gauge_card")
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Radial Arc Canvas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(gaugeHeight),
                contentAlignment = Alignment.Center
            ) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(gaugeHeight)
                        .padding(horizontal = 24.dp, vertical = 12.dp)
                ) {
                    val w = size.width
                    val h = size.height
                    val radius = (w / 2f) - 16.dp.toPx()
                    val center = Offset(w / 2f, h * 0.78f)

                    // Draw outer dotted / tick track
                    val tickRadius = radius + 12.dp.toPx()
                    val totalTicks = 20
                    for (i in 0..totalTicks) {
                        val angleDeg = 180f + (i.toFloat() / totalTicks) * 180f
                        val angleRad = Math.toRadians(angleDeg.toDouble())
                        val start = Offset(
                            (center.x + (tickRadius - 3.dp.toPx()) * cos(angleRad)).toFloat(),
                            (center.y + (tickRadius - 3.dp.toPx()) * sin(angleRad)).toFloat()
                        )
                        val end = Offset(
                            (center.x + (tickRadius + 3.dp.toPx()) * cos(angleRad)).toFloat(),
                            (center.y + (tickRadius + 3.dp.toPx()) * sin(angleRad)).toFloat()
                        )
                        drawCircle(
                            color = Color(0xFFD5DFDB),
                            radius = 1.5.dp.toPx(),
                            center = start
                        )
                    }

                    // Background Track Arc (Grey)
                    val strokeWidth = 14.dp.toPx()
                    val arcRect = Size(radius * 2f, radius * 2f)
                    val arcTopLeft = Offset(center.x - radius, center.y - radius)

                    drawArc(
                        color = Color(0xFFE8EFEA),
                        startAngle = 180f,
                        sweepAngle = 180f,
                        useCenter = false,
                        topLeft = arcTopLeft,
                        size = arcRect,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )

                    // Gradient Active Arc (Neon Green Gradient)
                    val sweepAngle = 180f * animatedProgress
                    val activeBrush = Brush.horizontalGradient(
                        colors = listOf(
                            Color(0xFF03C966),
                            Color(0xFF86EFAC),
                            Color(0xFFA8F53B)
                        ),
                        startX = arcTopLeft.x,
                        endX = arcTopLeft.x + arcRect.width
                    )

                    drawArc(
                        brush = activeBrush,
                        startAngle = 180f,
                        sweepAngle = sweepAngle,
                        useCenter = false,
                        topLeft = arcTopLeft,
                        size = arcRect,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }

                // Center Number & Title
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(top = 36.dp)
                ) {
                    Text(
                        text = "$percentage%",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 44.sp
                        ),
                        color = TextDarkPrimary
                    )
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = EnviGreenDark,
                        fontSize = 13.sp
                    )
                }

                // Scale Labels (0, 100, 200, 300, 400)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(horizontal = 14.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("0", style = MaterialTheme.typography.labelSmall, color = TextDarkMuted, fontSize = 10.sp)
                    Text("100", style = MaterialTheme.typography.labelSmall, color = TextDarkMuted, fontSize = 10.sp)
                    Text("200", style = MaterialTheme.typography.labelSmall, color = TextDarkMuted, fontSize = 10.sp)
                    Text("300", style = MaterialTheme.typography.labelSmall, color = TextDarkMuted, fontSize = 10.sp)
                    Text("400", style = MaterialTheme.typography.labelSmall, color = TextDarkMuted, fontSize = 10.sp)
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Day / Night Telemetry Breakdown
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Day Column
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Day, kWh",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    EnergyLegendItem(color = EnviGreen, label = "138 geothermal")
                    EnergyLegendItem(color = Color(0xFF84CC16), label = "212 wind turbine")
                    EnergyLegendItem(color = Color(0xFFA3E635), label = "345 solar")
                }

                // Night Column
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Night, kWh",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    EnergyLegendItem(color = Color(0xFF0D9488), label = "155 hydro")
                    EnergyLegendItem(color = Color(0xFF94A3B8), label = "267 gas")
                }
            }
        }
    }
}

@Composable
private fun EnergyLegendItem(
    color: Color,
    label: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 3.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
            color = TextDarkSecondary,
            fontSize = 12.sp
        )
    }
}
