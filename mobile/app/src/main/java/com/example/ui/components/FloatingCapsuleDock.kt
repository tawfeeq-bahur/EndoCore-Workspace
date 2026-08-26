package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Android
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.example.ui.theme.EnviCoralDock

sealed class DockTab(val route: String, val title: String, val icon: ImageVector, val contentDesc: String) {
    object Productivity : DockTab("productivity", "Productivity", Icons.Default.Home, "My Productivity")
    object Analytics : DockTab("analytics", "Analytics", Icons.Default.Assessment, "My Analytics")
    object Goals : DockTab("goals", "Goals", Icons.Default.TrackChanges, "My Goals")
    object Integrations : DockTab("integrations", "Integrations", Icons.Default.Hub, "Dev Integrations & Timesheets")
    object Polish : DockTab("polish", "Polish", Icons.Default.Android, "Android Polish & Widgets")
    object Connections : DockTab("connections", "Connections", Icons.Default.Group, "My Connections")
}

/**
 * Floating Capsule Bottom Navigation Dock styled with tactile Bento capsules.
 * Covers the core sections: Productivity, Analytics, Goals, Integrations, Polish, Connections.
 */
@Composable
fun FloatingCapsuleDock(
    currentRoute: String,
    onTabSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf(
        DockTab.Productivity,
        DockTab.Analytics,
        DockTab.Goals,
        DockTab.Integrations,
        DockTab.Polish,
        DockTab.Connections
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            shape = RoundedCornerShape(36.dp),
            color = EnviCoralDock,
            shadowElevation = 12.dp,
            modifier = Modifier
                .height(60.dp)
                .clip(RoundedCornerShape(36.dp))
                .testTag("floating_capsule_dock")
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 6.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                tabs.forEach { tab ->
                    val isSelected = currentRoute == tab.route
                    val buttonBg by animateColorAsState(
                        targetValue = if (isSelected) Color(0xFF131A18) else Color.Transparent,
                        label = "DockButtonBg"
                    )
                    val iconTint by animateColorAsState(
                        targetValue = if (isSelected) Color.White else Color(0xFF241512),
                        label = "DockIconTint"
                    )

                    Box(
                        modifier = Modifier
                            .height(46.dp)
                            .clip(RoundedCornerShape(23.dp))
                            .background(buttonBg)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { onTabSelected(tab.route) }
                            .padding(horizontal = if (isSelected) 12.dp else 8.dp)
                            .testTag("dock_tab_${tab.route}"),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.contentDesc,
                                tint = iconTint,
                                modifier = Modifier.size(19.dp)
                            )
                            if (isSelected) {
                                Spacer(modifier = Modifier.size(5.dp))
                                Text(
                                    text = tab.title,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 11.sp
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
    }
}

