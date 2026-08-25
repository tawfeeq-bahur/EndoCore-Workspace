package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SportsKabaddi
import androidx.compose.material.icons.filled.WavingHand
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.UserConnection
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * My Connections Screen - Faithfully implementing the EndoCore Peer Presence & Co-working Lobby (Screenshots 6 & 7).
 * Includes:
 * - Header: My Connections • Co-work and challenge peers in real-time Pomodoro sessions.
 * - Tabs: [LOBBY] [DISCOVER] [REQUESTS (0)]
 * - Search & Add Connection input with [Find & Connect]
 * - Presence Lobby list with teammate cards (Ravi, Arun, TAWFEEQ, Sri, vicky)
 * - Action buttons on each card: [WAVE] (with cooldown) & [CHALLENGE 1V1]
 */
@Composable
fun ConnectionsScreen(
    connections: List<UserConnection>,
    onSendWave: (UserConnection) -> Unit,
    onChallenge1v1: (UserConnection) -> Unit,
    onAddConnection: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchEmailText by remember { mutableStateOf("") }
    var selectedTab by remember { mutableStateOf("LOBBY") } // LOBBY, DISCOVER, REQUESTS (0)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 16.dp)
            .testTag("connections_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // 1. Header Section
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "My Connections",
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
                    text = "Co-work and challenge peers in real-time Pomodoro sessions.",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp, lineHeight = 16.sp),
                    color = TextDarkSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 2. Tab Switcher: [LOBBY] [DISCOVER] [REQUESTS (0)]
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xFFE5ECE8))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf("LOBBY", "DISCOVER", "REQUESTS (0)").forEach { tab ->
                    val isSelected = selectedTab == tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color.White else Color.Transparent)
                            .clickable { selectedTab = tab }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 11.sp
                            ),
                            color = if (isSelected) TextDarkPrimary else TextDarkSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 3. ADD CONNECTION — SEARCH USER PROFILE
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "ADD CONNECTION — SEARCH USER PROFILE",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = searchEmailText,
                            onValueChange = { searchEmailText = it },
                            placeholder = { Text("Enter user email (e.g. ravi@example.com)...", fontSize = 11.sp) },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Color.White,
                                focusedBorderColor = EnviGreenDark,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            ),
                            textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                            modifier = Modifier.weight(1f)
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF131A18))
                                .clickable {
                                    if (searchEmailText.isNotBlank()) {
                                        onAddConnection(searchEmailText.trim())
                                        searchEmailText = ""
                                    }
                                }
                                .padding(horizontal = 12.dp, vertical = 14.dp)
                        ) {
                            Text(
                                text = "Find & Connect",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp
                                ),
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 4. PRESENCE LOBBY Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "PRESENCE LOBBY",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    color = TextDarkMuted
                )
                Text(
                    text = "${connections.size} connections synced",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    color = TextDarkSecondary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
        }

        // 5. Connection Teammate Cards (Ravi, Arun, TAWFEEQ, Sri, vicky)
        items(connections) { conn ->
            UserConnectionCard(
                connection = conn,
                onWave = { onSendWave(conn) },
                onChallenge = { onChallenge1v1(conn) }
            )
            Spacer(modifier = Modifier.height(10.dp))
        }

        item {
            Spacer(modifier = Modifier.height(80.dp)) // Bottom dock padding
        }
    }
}

@Composable
fun UserConnectionCard(
    connection: UserConnection,
    onWave: () -> Unit,
    onChallenge: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Member Info Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    // Avatar Circle
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Color(connection.avatarColorHex)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = connection.avatarInitials,
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp
                            ),
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = connection.name,
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 14.sp
                                ),
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "• ${connection.role}",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontSize = 11.sp
                                ),
                                color = TextDarkSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Spacer(modifier = Modifier.height(2.dp))

                        Text(
                            text = connection.email,
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontSize = 10.5.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                // Status Badge [OFFLINE] / [LIVE]
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (connection.isOnline) Color(0xFFDCFCE7) else Color(0xFFF3F4F6))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (connection.isOnline) "LIVE" else "OFFLINE",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp
                        ),
                        color = if (connection.isOnline) Color(0xFF16A34A) else Color(0xFF6B7280)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Room / Focus text
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = connection.currentRoom,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    color = TextDarkMuted
                )
                Text(
                    text = connection.focusTimeToday,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    ),
                    color = TextDarkSecondary
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons: [WAVE] & [CHALLENGE 1V1]
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Wave Button
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color.White)
                        .border(1.dp, Color(0xFFE5E7EB), RoundedCornerShape(10.dp))
                        .clickable { onWave() }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "👋",
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (connection.waveCooldownSec > 0) "${connection.waveCooldownSec}s" else "WAVE",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            ),
                            color = TextDarkPrimary,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }

                // Challenge 1v1 Button
                Box(
                    modifier = Modifier
                        .weight(1.3f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFF131A18))
                        .clickable { onChallenge() }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.SportsKabaddi,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "CHALLENGE 1V1",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.5.sp
                            ),
                            color = Color.White,
                            maxLines = 1,
                            softWrap = false
                        )
                    }
                }
            }
        }
    }
}
