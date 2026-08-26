package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AmberWarning
import com.example.ui.theme.CyanTelemetry
import com.example.ui.theme.CyanTelemetryBright
import com.example.ui.theme.EmeraldStatus
import com.example.ui.theme.EnterpriseSurfaceElevated
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.VioletMetric

@Composable
fun PulsingLiveDot(
    isOnline: Boolean,
    modifier: Modifier = Modifier,
    activeColor: Color = EmeraldStatus,
    dotSize: Dp = 8.dp
) {
    if (isOnline) {
        val infiniteTransition = rememberInfiniteTransition(label = "pulse")
        val alpha by infiniteTransition.animateFloat(
            initialValue = 0.35f,
            targetValue = 1.0f,
            animationSpec = infiniteRepeatable(
                animation = tween(900),
                repeatMode = RepeatMode.Reverse
            ),
            label = "alpha"
        )
        Box(
            modifier = modifier
                .size(dotSize)
                .clip(CircleShape)
                .background(activeColor.copy(alpha = alpha))
        )
    } else {
        Box(
            modifier = modifier
                .size(dotSize)
                .clip(CircleShape)
                .background(TextMuted)
        )
    }
}

@Composable
fun CircularFocusProgress(
    elapsedSeconds: Long,
    targetSeconds: Long,
    isTracking: Boolean,
    isPaused: Boolean,
    modifier: Modifier = Modifier,
    size: Dp = 230.dp,
    strokeWidth: Dp = 12.dp
) {
    val progress = (elapsedSeconds.toFloat() / targetSeconds.coerceAtLeast(1L).toFloat()).coerceIn(0f, 1f)
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "progress"
    )

    val hours = elapsedSeconds / 3600
    val minutes = (elapsedSeconds % 3600) / 60
    val seconds = elapsedSeconds % 60
    val formattedTime = String.format("%02d:%02d:%02d", hours, minutes, seconds)
    val percentText = (progress * 100).toInt()

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            val radius = (this.size.minDimension - strokePx) / 2

            // Track background
            drawCircle(
                color = EnterpriseSurfaceElevated,
                radius = radius,
                style = Stroke(width = strokePx)
            )

            // Telemetry Gradient Arc
            val gradient = Brush.sweepGradient(
                listOf(
                    CyanTelemetry,
                    VioletMetric,
                    EmeraldStatus,
                    CyanTelemetryBright,
                    CyanTelemetry
                )
            )

            drawArc(
                brush = gradient,
                startAngle = -90f,
                sweepAngle = animatedProgress * 360f,
                useCenter = false,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
        }

        // Center HUD
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Live status badge
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                        when {
                            isPaused -> AmberWarning.copy(alpha = 0.15f)
                            isTracking -> EmeraldStatus.copy(alpha = 0.15f)
                            else -> TextMuted.copy(alpha = 0.15f)
                        }
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                PulsingLiveDot(
                    isOnline = isTracking && !isPaused,
                    activeColor = if (isPaused) AmberWarning else EmeraldStatus,
                    dotSize = 6.dp
                )
                Text(
                    text = when {
                        isPaused -> "SESSION PAUSED"
                        isTracking -> "TELEMETRY ACTIVE"
                        else -> "WORKSTATION IDLE"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = when {
                        isPaused -> AmberWarning
                        isTracking -> EmeraldStatus
                        else -> TextMuted
                    },
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(start = 6.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Time digits (Enterprise monospaced feel)
            Text(
                text = formattedTime,
                style = MaterialTheme.typography.displayMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 32.sp,
                    letterSpacing = (-0.5).sp
                ),
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Target quota percentage
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Speed,
                    contentDescription = null,
                    tint = CyanTelemetry,
                    modifier = Modifier.size(13.dp)
                )
                Text(
                    text = "$percentText% of ${(targetSeconds / 3600)}h quota",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
        }
    }
}
