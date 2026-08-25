package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ElevatedButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.DeveloperApp
import com.example.data.model.PrivacyMode
import com.example.data.model.RoomMember
import com.example.ui.theme.BentoMidnightTeal
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoPlum
import com.example.ui.theme.BentoSage
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

@Composable
fun TeammateCard(
    member: RoomMember,
    onSendPing: (RoomMember) -> Unit,
    onClickCard: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White)
            .border(1.dp, Color(0xFFEBF0EC), RoundedCornerShape(20.dp))
            .then(
                if (onClickCard != null) Modifier.clickable { onClickCard() } else Modifier
            )
            .padding(14.dp)
            .testTag("workstation_card_${member.id}")
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            // Header Row: Avatar, Name, Role & Flow score badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar with live indicator
                Box {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Color(member.avatarColorHex).copy(alpha = 0.18f))
                            .border(1.5.dp, Color(member.avatarColorHex).copy(alpha = 0.6f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = member.avatarInitials,
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            ),
                            color = Color(member.avatarColorHex)
                        )
                    }

                    PulsingLiveDot(
                        isOnline = member.isOnline,
                        activeColor = EnviGreen,
                        dotSize = 9.dp,
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .border(2.dp, Color.White, CircleShape)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = member.name,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextDarkPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        // Focus / Velocity Pill
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFEAF8F1))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = EnviGreenDark,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "${member.focusScore}%",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp
                                ),
                                color = EnviGreenDark
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = member.role,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextDarkSecondary,
                            fontSize = 12.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "• ${member.lastHeartbeat}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDarkMuted,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Workstation Telemetry Block (Soft Bento style)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFFF5F8F6))
                    .padding(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // App & Activity Details
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE2ECE5), RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = when (member.activeApp) {
                                    DeveloperApp.TERMINAL -> Icons.Default.Terminal
                                    DeveloperApp.DOCKER -> Icons.Default.DataObject
                                    else -> Icons.Default.Code
                                },
                                contentDescription = null,
                                tint = Color(member.activeApp.brandColorHex),
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (member.privacyMode == PrivacyMode.ENCRYPTED_PRIVATE)
                                    "Encrypted Workstation Session"
                                else
                                    member.activeProject,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextDarkPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = if (member.privacyMode == PrivacyMode.ENCRYPTED_PRIVATE)
                                    "Telemetry masked by compliance"
                                else
                                    "${member.currentActivity} • branch:${member.activeBranch}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextDarkMuted,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Ping / Nudge Action Button
                    if (member.waveCooldownSec > 0) {
                        OutlinedButton(
                            onClick = {},
                            enabled = false,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .height(34.dp)
                                .testTag("ping_cooldown_${member.id}")
                        ) {
                            Text(
                                text = "${member.waveCooldownSec}s",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 11.sp
                                ),
                                color = TextDarkMuted
                            )
                        }
                    } else {
                        ElevatedButton(
                            onClick = { onSendPing(member) },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.elevatedButtonColors(
                                containerColor = EnviGreenDark,
                                contentColor = Color.White
                            ),
                            modifier = Modifier
                                .height(34.dp)
                                .testTag("send_ping_btn_${member.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ElectricBolt,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Ping",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}
