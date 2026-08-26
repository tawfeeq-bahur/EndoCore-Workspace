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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.DataObject
import androidx.compose.material.icons.filled.IntegrationInstructions
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.BentoCardDark
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.TextLightMuted
import com.example.ui.theme.TextLightSecondary

data class SourceItem(val id: String, val icon: ImageVector, val label: String)

/**
 * 6-Tile Developer Telemetry Source Grid with active process states.
 */
@Composable
fun EnviSourceMatrix(
    onConnectClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val sources = listOf(
        SourceItem("ide", Icons.Default.Code, "VS Code"),
        SourceItem("terminal", Icons.Default.Terminal, "Zsh / Terminal"),
        SourceItem("docker", Icons.Default.DataObject, "Docker Engine"),
        SourceItem("ci", Icons.Default.Build, "CI Build Node"),
        SourceItem("k8s", Icons.Default.Layers, "Kubernetes"),
        SourceItem("telemetry", Icons.Default.IntegrationInstructions, "EndoCore Agent")
    )

    val activeStates = remember {
        mutableStateMapOf(
            "ide" to true,
            "terminal" to true,
            "docker" to true,
            "ci" to true,
            "k8s" to false,
            "telemetry" to true
        )
    }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // 6 Source Matrix in 2 columns
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // 2x3 Grid on Left Side
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardDark),
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, Color(0xFF23302D), RoundedCornerShape(24.dp))
                    .padding(4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    for (row in 0..2) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            for (col in 0..1) {
                                val item = sources[row * 2 + col]
                                val isActive = activeStates[item.id] == true

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(
                                            if (isActive) Color(0xFF22312E) else Color(0xFF161F1D)
                                        )
                                        .clickable { activeStates[item.id] = !isActive }
                                        .testTag("source_toggle_${item.id}"),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = item.icon,
                                        contentDescription = item.label,
                                        tint = if (isActive) EnviGreen else TextLightMuted,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Developer Gateway Node & Connect Action Card on Right Side
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardDark),
                modifier = Modifier
                    .weight(1f)
                    .border(1.dp, Color(0xFF23302D), RoundedCornerShape(24.dp))
                    .testTag("solar_system_connect_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.SpaceBetween,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Telemetry Ingest",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextLightSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "2.4k ops",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFDE047)
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = onConnectClick,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.White,
                            contentColor = Color(0xFF111817)
                        ),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(40.dp)
                            .testTag("btn_connect_solar")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Attach",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                }
            }
        }
    }
}

