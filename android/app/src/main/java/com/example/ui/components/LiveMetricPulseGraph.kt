package com.example.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.CyanTelemetry
import com.example.ui.theme.VioletMetric
import kotlin.math.sin

@Composable
fun LiveMetricPulseGraph(
    isActive: Boolean,
    modifier: Modifier = Modifier,
    height: Dp = 48.dp,
    lineColor: Color = CyanTelemetry
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse_graph")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.28f, // 2 * PI
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase"
    )

    Box(modifier = modifier.height(height)) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val h = size.height
            val midY = h / 2f

            if (!isActive) {
                // Flat idle line
                drawLine(
                    color = lineColor.copy(alpha = 0.3f),
                    start = Offset(0f, midY),
                    end = Offset(width, midY),
                    strokeWidth = 2.dp.toPx()
                )
                return@Canvas
            }

            val path = Path()
            val steps = 30
            val stepX = width / steps

            for (i in 0..steps) {
                val x = i * stepX
                val normalizedX = (x / width) * 4 * Math.PI.toFloat()
                val yOffset = (sin(normalizedX + phase) * (h * 0.32f)).toFloat() +
                        (sin(normalizedX * 2.2f + phase * 1.5f) * (h * 0.12f)).toFloat()
                val y = (midY + yOffset).coerceIn(4f, h - 4f)

                if (i == 0) {
                    path.moveTo(x, y)
                } else {
                    path.lineTo(x, y)
                }
            }

            // Draw line
            drawPath(
                path = path,
                brush = Brush.horizontalGradient(
                    colors = listOf(CyanTelemetry, VioletMetric, CyanTelemetry)
                ),
                style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
            )
        }
    }
}
