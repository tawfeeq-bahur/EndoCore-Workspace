package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BentoCardDark
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.TextLightMuted
import com.example.ui.theme.TextLightPrimary
import com.example.ui.theme.TextLightSecondary

data class BarDayData(
    val day: String,
    val valueRatio: Float, // 0.0 to 1.0
    val isOverconsumed: Boolean = false,
    val overconsumeRatio: Float = 0f
)

/**
 * Green usage bar chart with overconsumption indicator (from Image 1 left).
 */
@Composable
fun EnviTelemetryBarChart(
    kwhTotal: String = "842 kWh",
    subtitle: String = "Green usage",
    overconsumptionCount: Int = 3,
    height: Dp = 260.dp,
    modifier: Modifier = Modifier
) {
    val sampleDays = listOf(
        BarDayData("M", 0.45f),
        BarDayData("T", 0.85f, isOverconsumed = true, overconsumeRatio = 0.12f),
        BarDayData("W", 0.92f, isOverconsumed = true, overconsumeRatio = 0.18f),
        BarDayData("T", 0.65f),
        BarDayData("F", 0.80f, isOverconsumed = true, overconsumeRatio = 0.10f),
        BarDayData("S", 0.50f),
        BarDayData("S", 0.40f)
    )

    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardDark),
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .border(1.dp, Color(0xFF23302D), RoundedCornerShape(24.dp))
            .testTag("envi_telemetry_bar_chart")
    ) {
        Column(
            modifier = Modifier
                .padding(18.dp)
                .fillMaxHeight(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Header: Title, Value & Alert
            Column {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextLightSecondary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = kwhTotal,
                    style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                    color = TextLightPrimary
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Overconsumption badge
                if (overconsumptionCount > 0) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(EnviCoral)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "$overconsumptionCount overconsumption",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = EnviCoral
                            ),
                            fontSize = 11.sp
                        )
                    }
                }
            }

            // Vertical Multi-Colored Bars
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
            ) {
                // Dashed baseline / threshold line
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .align(Alignment.Center)
                        .background(Color(0xFF2C3C38))
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .fillMaxHeight(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    sampleDays.forEach { item ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Bottom,
                            modifier = Modifier.width(28.dp)
                        ) {
                            // Stacked Bar
                            Box(
                                modifier = Modifier
                                    .width(10.dp)
                                    .height((110 * item.valueRatio).dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFF0F3634))
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxHeight(),
                                    verticalArrangement = Arrangement.Bottom
                                ) {
                                    if (item.isOverconsumed) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height((110 * item.overconsumeRatio).dp)
                                                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                                                .background(EnviCoral)
                                        )
                                    }
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .weight(1f)
                                            .clip(RoundedCornerShape(bottomStart = 6.dp, bottomEnd = 6.dp))
                                            .background(EnviGreen)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = item.day,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 10.sp
                                ),
                                color = TextLightMuted
                            )
                        }
                    }
                }
            }
        }
    }
}
