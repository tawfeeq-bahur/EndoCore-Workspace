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
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.SportsKabaddi
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.UserConnection
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * 1v1 Synchronized Focus Duel Modal against a peer (Ravi, Arun, Sri, etc.)
 */
@Composable
fun PeerChallenge1v1Modal(
    peer: UserConnection,
    onDismiss: () -> Unit,
    onStartSprint: () -> Unit
) {
    var selectedDuration by remember { mutableIntStateOf(25) }
    var challengeStatus by remember { mutableStateOf("READY") } // READY, DISPATCHED

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .testTag("peer_challenge_1v1_modal")
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.SportsKabaddi,
                            contentDescription = null,
                            tint = Color(0xFFDC2626),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "1v1 Focus Duel",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp
                            ),
                            color = TextDarkPrimary
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextDarkSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Versus Comparison Card
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9FAFB)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        // User
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF00B37E)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("TB", fontWeight = FontWeight.Black, color = Color.White, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("YOU", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = TextDarkPrimary)
                            Text("Tawfeeq", fontSize = 10.sp, color = TextDarkSecondary)
                        }

                        // VS Badge
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color(0xFF131A18))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("VS", fontWeight = FontWeight.Black, color = Color.White, fontSize = 11.sp)
                        }

                        // Peer
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(Color(peer.avatarColorHex)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(peer.avatarInitials, fontWeight = FontWeight.Black, color = Color.White, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(peer.name, fontWeight = FontWeight.Bold, fontSize = 11.sp, color = TextDarkPrimary)
                            Text(peer.role.take(12), fontSize = 10.sp, color = TextDarkSecondary)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Sprint Duration Selector
                Text(
                    text = "SELECT SPRINT DURATION",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.5.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    color = TextDarkMuted
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(15, 25, 45).forEach { duration ->
                        val isSel = selectedDuration == duration
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isSel) Color(0xFFDCFCE7) else Color(0xFFF3F4F6))
                                .border(1.dp, if (isSel) EnviGreenDark else Color.Transparent, RoundedCornerShape(10.dp))
                                .clickable { selectedDuration = duration }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${duration}m",
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.sp,
                                color = if (isSel) EnviGreenDark else TextDarkPrimary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Both workstations will synchronize focus timers. Distraction alerts and context switches are broadcasted live to determine the duel winner!",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 15.sp),
                    color = TextDarkSecondary
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Action Button
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF131A18))
                        .clickable {
                            challengeStatus = "DISPATCHED"
                            onStartSprint()
                        }
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (challengeStatus == "DISPATCHED") "⚡ Challenge Dispatched!" else "Launch 1v1 Challenge ($selectedDuration mins)",
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        ),
                        color = Color.White
                    )
                }
            }
        }
    }
}
