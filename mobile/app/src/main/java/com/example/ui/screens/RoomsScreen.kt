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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cast
import androidx.compose.material.icons.filled.CastConnected
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.RoomGroup
import com.example.data.model.RoomMember
import com.example.ui.components.PulsingLiveDot
import com.example.ui.components.TeammateCard
import com.example.ui.theme.AmberWarning
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.BentoMidnightTeal
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoSage
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

@Composable
fun RoomsScreen(
    rooms: List<RoomGroup>,
    onSendPing: (RoomMember, RoomGroup) -> Unit,
    onToggleBroadcast: (String) -> Unit,
    onTogglePin: (String) -> Unit,
    onSelectMember: ((RoomMember) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredRooms = remember(rooms, selectedFilter) {
        when (selectedFilter) {
            "PINNED" -> rooms.filter { it.isPinned }
            "INCIDENTS" -> rooms.filter { it.incidentStatus != "NORMAL" || it.id == "g4" }
            "BACKEND" -> rooms.filter { it.category.contains("BACKEND", ignoreCase = true) || it.category.contains("DEVOPS", ignoreCase = true) }
            else -> rooms
        }
    }

    val totalDevsCount = remember(rooms) { rooms.sumOf { it.members.size } }
    val onlineDevsCount = remember(rooms) { rooms.sumOf { r -> r.members.count { it.isOnline } } }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 18.dp)
            .testTag("rooms_screen_feed")
    ) {
        item {
            Spacer(modifier = Modifier.height(14.dp))

            // Screen Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "FLEET & SQUADS",
                        style = MaterialTheme.typography.labelSmall.copy(
                            letterSpacing = 1.2.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = EnviGreenDark
                    )
                    Text(
                        text = "Squad Telemetry",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = TextDarkPrimary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.White)
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    PulsingLiveDot(
                        isOnline = true,
                        activeColor = EnviGreen,
                        dotSize = 7.dp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "$onlineDevsCount / $totalDevsCount SYNCED",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp
                        ),
                        color = EnviGreenDark
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Hero Squad Velocity Bento Card (Image 1 / Image 2 / Image 5 style)
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Collective Flow Velocity",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "4 squads broadcasting live telemetry",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextDarkMuted,
                            fontSize = 11.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF131A18))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "92% AVG",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf(
                    "ALL" to "All Squads (${rooms.size})",
                    "PINNED" to "Pinned",
                    "INCIDENTS" to "Active Focus",
                    "BACKEND" to "Backend / Ops"
                )

                items(filters) { (key, label) ->
                    val isSelected = selectedFilter == key
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isSelected) Color(0xFF131A18) else Color.White)
                            .clickable { selectedFilter = key }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                            .testTag("filter_chip_$key")
                    ) {
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.sp
                            ),
                            color = if (isSelected) Color.White else TextDarkMuted
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        // Room Groups
        items(filteredRooms) { room ->
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
                    .testTag("room_group_${room.id}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Group Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color.White),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Group,
                                    contentDescription = null,
                                    tint = EnviGreenDark,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = room.name,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "${room.category} • ${room.members.size} engineers",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextDarkMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Pin toggle
                            IconButton(
                                onClick = { onTogglePin(room.id) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = if (room.isPinned) Icons.Filled.PushPin else Icons.Outlined.PushPin,
                                    contentDescription = "Pin Room",
                                    tint = if (room.isPinned) AmberWarning else TextDarkMuted,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            // Broadcast status
                            IconButton(
                                onClick = { onToggleBroadcast(room.id) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = if (room.isBroadcasting) Icons.Default.CastConnected else Icons.Default.Cast,
                                    contentDescription = "Broadcast status",
                                    tint = if (room.isBroadcasting) EnviGreen else TextDarkMuted,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Teammate Cards in soft bento style
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        room.members.forEach { member ->
                            TeammateCard(
                                member = member,
                                onSendPing = { onSendPing(member, room) },
                                onClickCard = { onSelectMember?.invoke(member) }
                            )
                        }
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}
