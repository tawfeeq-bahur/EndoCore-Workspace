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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * 5-Step Intelligence Room Commission Wizard (Screenshots 8 & 9).
 * Steps:
 * 1. Basics (Icon/Emoji, Name, Description, Category)
 * 2. Access & Invites (Public/Private, Passcode)
 * 3. Members & Roles (Admin, Contributor, Observer)
 * 4. Work Expectations (Daily Target Hours, Core Hours)
 * 5. AI Policy & Privacy (AI Nudge frequency, Masking)
 */
@Composable
fun CommissionRoomModal(
    onDismiss: () -> Unit,
    onCommission: (name: String, description: String, category: String, iconEmoji: String) -> Unit
) {
    var currentStep by remember { mutableIntStateOf(1) }
    var roomName by remember { mutableStateOf("") }
    var roomDesc by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("ENGINEERING") }
    var selectedEmoji by remember { mutableStateOf("⚡") }
    var targetHours by remember { mutableFloatStateOf(6f) }
    var isPrivate by remember { mutableStateOf(false) }

    val emojis = listOf("⚡", "🛡️", "📱", "🚨", "🎨", "🔬", "🚀", "💡")
    val categories = listOf("ENGINEERING", "PRODUCT & DESIGN", "DEVOPS & SEC", "RESEARCH & AI")

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .testTag("commission_room_modal")
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Commission Room",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp
                            ),
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "Step $currentStep of 5 • Intelligence Workspace",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = EnviGreenDark
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextDarkSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Progress Step Dots
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    for (i in 1..5) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(if (i <= currentStep) EnviGreenDark else Color(0xFFE5ECE8))
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Step Content
                when (currentStep) {
                    1 -> {
                        // Step 1: Basics
                        Text(
                            text = "ROOM IDENTITY & BASICS",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        // Emoji Selector
                        Text("Choose Room Icon", style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp), color = TextDarkSecondary)
                        Spacer(modifier = Modifier.height(4.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(emojis) { emoji ->
                                val isSelected = selectedEmoji == emoji
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isSelected) Color(0xFFDCFCE7) else Color(0xFFF3F4F6))
                                        .border(1.dp, if (isSelected) EnviGreenDark else Color.Transparent, RoundedCornerShape(10.dp))
                                        .clickable { selectedEmoji = emoji },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(text = emoji, fontSize = 18.sp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Room Name
                        OutlinedTextField(
                            value = roomName,
                            onValueChange = { roomName = it },
                            label = { Text("Room Name (e.g. Core Engine Fleet)") },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EnviGreenDark,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Description
                        OutlinedTextField(
                            value = roomDesc,
                            onValueChange = { roomDesc = it },
                            label = { Text("Mission & Goals Description") },
                            shape = RoundedCornerShape(12.dp),
                            maxLines = 2,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = EnviGreenDark,
                                unfocusedBorderColor = Color(0xFFE5E7EB)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    2 -> {
                        // Step 2: Access & Category
                        Text(
                            text = "ACCESS & CATEGORY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        categories.forEach { cat ->
                            val isSel = selectedCategory == cat
                            Card(
                                shape = RoundedCornerShape(10.dp),
                                colors = CardDefaults.cardColors(containerColor = if (isSel) Color(0xFFDCFCE7) else Color(0xFFF9FAFB)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 3.dp)
                                    .clickable { selectedCategory = cat }
                            ) {
                                Text(
                                    text = cat,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 11.5.sp
                                    ),
                                    color = if (isSel) EnviGreenDark else TextDarkPrimary,
                                    modifier = Modifier.padding(10.dp)
                                )
                            }
                        }
                    }
                    3 -> {
                        // Step 3: Members & Roles
                        Text(
                            text = "DEFAULT MEMBER ROLES",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("• Admin: Full room orchestration & telemetry control", fontSize = 11.sp, color = TextDarkSecondary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("• Contributor: Live IDE focus sync & peer wave participation", fontSize = 11.sp, color = TextDarkSecondary)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("• Observer: Read-only access to scrum briefs & velocity", fontSize = 11.sp, color = TextDarkSecondary)
                    }
                    4 -> {
                        // Step 4: Work Expectations
                        Text(
                            text = "DAILY FOCUS TARGET",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "${targetHours.toInt()} Hours / Day",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            ),
                            color = TextDarkPrimary
                        )
                        Slider(
                            value = targetHours,
                            onValueChange = { targetHours = it },
                            valueRange = 2f..10f,
                            steps = 7,
                            colors = SliderDefaults.colors(
                                thumbColor = EnviGreenDark,
                                activeTrackColor = EnviGreenDark
                            )
                        )
                    }
                    5 -> {
                        // Step 5: AI & Privacy Policy
                        Text(
                            text = "AI POLICY & OBSERVABILITY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF3F4F6)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("✅ Gemini 2.5 Standup Synthesis: ACTIVE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EnviGreenDark)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("✅ PII Token Sanitization: ENFORCED", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EnviGreenDark)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("✅ Peer Wave Rate-Limiting: 5 MIN COOLDOWN", fontSize = 11.sp, color = TextDarkSecondary)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons: Back / Next Step / Commission
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (currentStep > 1) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFF3F4F6))
                                .clickable { currentStep-- }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Back", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1.5f)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF131A18))
                            .clickable {
                                if (currentStep < 5) {
                                    currentStep++
                                } else {
                                    val name = roomName.ifBlank { "New Intelligence Fleet" }
                                    val desc = roomDesc.ifBlank { "High-velocity team co-working and focus pipeline." }
                                    onCommission(name, desc, selectedCategory, selectedEmoji)
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (currentStep == 5) "Commission Room" else "Next Step",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}
