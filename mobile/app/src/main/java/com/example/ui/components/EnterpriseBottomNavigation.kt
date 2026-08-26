package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.QueryStats
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Hub
import androidx.compose.material.icons.outlined.QueryStats
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Settings
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
import com.example.ui.theme.CyanTelemetry
import com.example.ui.theme.EnterpriseBackground
import com.example.ui.theme.EnterpriseBorder
import com.example.ui.theme.EnterpriseSurface
import com.example.ui.theme.TextMuted
import com.example.ui.theme.TextSecondary

sealed class NavItem(
    val route: String,
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
) {
    object Telemetry : NavItem("dashboard", "Telemetry", Icons.Filled.QueryStats, Icons.Outlined.QueryStats, "nav_telemetry")
    object Squads : NavItem("squads", "Fleet", Icons.Filled.Hub, Icons.Outlined.Hub, "nav_squads")
    object Analytics : NavItem("analytics", "AI Intel", Icons.Filled.AutoAwesome, Icons.Outlined.AutoAwesome, "nav_analytics")
    object Audit : NavItem("audit", "Audit", Icons.Filled.Security, Icons.Outlined.Security, "nav_audit")
    object Settings : NavItem("settings", "Config", Icons.Filled.Settings, Icons.Outlined.Settings, "nav_config")
}

val bottomNavItems = listOf(
    NavItem.Telemetry,
    NavItem.Squads,
    NavItem.Analytics,
    NavItem.Audit,
    NavItem.Settings
)

@Composable
fun EnterpriseBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(EnterpriseBackground)
            .border(width = 1.dp, color = EnterpriseBorder)
            .navigationBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp, horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            bottomNavItems.forEach { item ->
                val isSelected = currentRoute == item.route

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            if (isSelected) EnterpriseSurface else Color.Transparent
                        )
                        .selectable(
                            selected = isSelected,
                            onClick = { onNavigate(item.route) }
                        )
                        .padding(vertical = 6.dp)
                        .testTag(item.testTag)
                ) {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.title,
                        tint = if (isSelected) CyanTelemetry else TextMuted,
                        modifier = Modifier.size(22.dp)
                    )
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 11.sp
                        ),
                        color = if (isSelected) CyanTelemetry else TextSecondary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
        }
    }
}
