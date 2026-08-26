package com.example.ui.components

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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Speed
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BentoMidnightTeal
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoPlum
import com.example.ui.theme.BentoSage
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.TextDarkPrimary

/**
 * 2x2 Bento Grid Layout inspired by Image 2 (Amit Board Dashboard).
 * Composed of 4 distinct colored cards:
 * 1. Peach Bento (Calorie / Velocity Metric)
 * 2. Midnight Teal Bento (Activity / Process Metric)
 * 3. Plum Bento (Start / Deep Flow trigger)
 * 4. Sage Green Bento (Team Members Stack '+9')
 */
@Composable
fun BentoGridTelemetrySection(
    velocityScore: String = "92%",
    caloriesOrKwh: String = "3.693",
    activeNodesCount: String = "6.984",
    isFlowActive: Boolean = true,
    memberCountBonus: String = "+9",
    onStartClick: () -> Unit = {},
    onMembersClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Row 1: Peach Bento & Midnight Teal Bento
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 1. Peach Bento Tile
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoPeach),
                modifier = Modifier
                    .weight(1f)
                    .height(115.dp)
                    .testTag("bento_peach_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.6f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocalFireDepartment,
                                contentDescription = null,
                                tint = Color(0xFFC85A32),
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "64% ↓",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF4A342D),
                                fontSize = 11.sp
                            )
                        }
                    }

                    Column {
                        Text(
                            text = caloriesOrKwh,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp
                            ),
                            color = Color(0xFF2E1C15)
                        )
                        Text(
                            text = "Telemetry / Flow",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFF6B4D42),
                            fontSize = 11.sp
                        )
                    }
                }
            }

            // 2. Midnight Teal Bento Tile
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoMidnightTeal),
                modifier = Modifier
                    .weight(1f)
                    .height(115.dp)
                    .testTag("bento_midnight_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.DirectionsWalk,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Column {
                        Text(
                            text = activeNodesCount,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp
                            ),
                            color = Color.White
                        )
                        Text(
                            text = "Active Telemetry",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFA5C9C4),
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Row 2: Plum Start Card & Sage Green Members Card
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // 3. Plum Bento Button Tile
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoPlum),
                modifier = Modifier
                    .weight(1f)
                    .height(115.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .clickable { onStartClick() }
                    .testTag("bento_plum_start_card")
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isFlowActive) Icons.Default.Check else Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (isFlowActive) "In Flow" else "Start",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }
                }
            }

            // 4. Sage Green Bento Members Tile
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoSage),
                modifier = Modifier
                    .weight(1f)
                    .height(115.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .clickable { onMembersClick() }
                    .testTag("bento_sage_members_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Members",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF1E3224)
                    )

                    // Stacked Avatar Row (+9 badge)
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Avatar 1
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE08D79)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("TB", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        // Avatar 2 (overlapping)
                        Box(
                            modifier = Modifier
                                .offset(x = (-8).dp)
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF818CF8)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("MP", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }

                        // +9 Badge (overlapping)
                        Box(
                            modifier = Modifier
                                .offset(x = (-16).dp)
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = memberCountBonus,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color(0xFF1E3224)
                            )
                        }
                    }
                }
            }
        }
    }
}
