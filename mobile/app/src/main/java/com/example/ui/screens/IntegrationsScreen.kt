package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.ConfirmationNumber
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.PauseCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.CalendarEventItem
import com.example.data.model.DevIntegrationItem
import com.example.data.model.GitCommitActivity
import com.example.data.model.IssueTicket
import com.example.data.model.TimesheetEntry
import com.example.data.model.TimesheetSummary
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.BentoPeach
import com.example.ui.theme.BentoSage
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviAmber
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviCoralDock
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.EnviHydroBlue
import com.example.ui.theme.EnviViolet
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

/**
 * D. INTEGRATIONS ECOSYSTEM & ENTERPRISE TIMESHEETS SCREEN
 * 
 * Features:
 * 1. Dev Tool Integrations:
 *    - GitHub / GitLab (Track commits, branches & real-time webhook push)
 *    - Jira / Linear (Sync active tickets directly into active focus session task)
 *    - Google Calendar (Auto-pause tracking during scheduled meetings & events)
 * 2. Automated Timesheets & CSV/PDF Export:
 *    - Weekly billable vs non-billable hours breakdown
 *    - Categorized by client, project, hourly rate, and approval status
 *    - One-tap Export as CSV, PDF, or Shareable Invoicing Report
 */
@Composable
fun IntegrationsScreen(
    integrations: List<DevIntegrationItem>,
    gitCommits: List<GitCommitActivity>,
    issueTickets: List<IssueTicket>,
    calendarEvents: List<CalendarEventItem>,
    timesheets: List<TimesheetEntry>,
    timesheetSummary: TimesheetSummary,
    onToggleIntegration: (String) -> Unit,
    onToggleAutoPauseCalendar: () -> Unit,
    onSyncTicketToTask: (IssueTicket) -> Unit,
    onLogCommit: (message: String, repo: String) -> Unit,
    onAddTimesheet: (client: String, project: String, hours: Float, rate: Double) -> Unit,
    onExportTimesheet: (format: String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var showExportDialog by remember { mutableStateOf(false) }
    var showAddCommitDialog by remember { mutableStateOf(false) }
    var showAddTimesheetDialog by remember { mutableStateOf(false) }
    var exportSuccessMessage by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(6.dp))
            // Screen Header Bento Banner
            IntegrationsHeaderBanner(
                totalConnected = integrations.count { it.isConnected },
                totalIntegrations = integrations.size
            )
        }

        item {
            // Segmented Tab Switcher (Dev Tools vs Timesheets & Export)
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.Transparent,
                contentColor = TextDarkPrimary,
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = Color(0xFF131A18),
                        height = 3.dp
                    )
                },
                divider = {
                    Divider(color = Color(0xFFE2E8F0), thickness = 1.dp)
                }
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Hub,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (selectedTab == 0) TextDarkPrimary else TextDarkMuted
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Dev Tool Bridges",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 13.sp
                                )
                            )
                        }
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (selectedTab == 1) TextDarkPrimary else TextDarkMuted
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Timesheets & Export",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 13.sp
                                )
                            )
                        }
                    }
                )
            }
        }

        if (selectedTab == 0) {
            // ----------------------------------------------------
            // TAB 1: DEV TOOL INTEGRATIONS (GitHub, Jira, GCal)
            // ----------------------------------------------------
            item {
                // Integrations Hub Quick Cards
                Text(
                    text = "ACTIVE CONNECTIONS & WEBHOOKS",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.5.sp
                    ),
                    color = TextDarkMuted
                )
                Spacer(modifier = Modifier.height(6.dp))
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    integrations.forEach { item ->
                        IntegrationItemCard(
                            item = item,
                            onToggle = { onToggleIntegration(item.id) },
                            onToggleAutoPause = if (item.id == "int_gcal") onToggleAutoPauseCalendar else null
                        )
                    }
                }
            }

            item {
                // Section: Jira / Linear Ticket Synchronization
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFEFF6FF)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ConfirmationNumber,
                                        contentDescription = null,
                                        tint = EnviHydroBlue,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Jira & Linear Sync",
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = "Tap any ticket to focus as current active task",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = TextDarkMuted
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            issueTickets.forEach { ticket ->
                                IssueTicketCard(
                                    ticket = ticket,
                                    onSync = { onSyncTicketToTask(ticket) }
                                )
                            }
                        }
                    }
                }
            }

            item {
                // Section: GitHub / GitLab Commit Activity Stream
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFF0FDF4)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Code,
                                        contentDescription = null,
                                        tint = EnviGreenDark,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Git Commits & PR Stream",
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = "GitHub / GitLab auto-linked telemetry",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = TextDarkMuted
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF131A18))
                                    .clickable { showAddCommitDialog = true }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Log Commit",
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Log Commit",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.5.sp
                                        ),
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            gitCommits.forEach { commit ->
                                GitCommitCard(commit = commit)
                            }
                        }
                    }
                }
            }

            item {
                // Section: Google Calendar Auto-Pause Bridge
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFFFFBEB)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CalendarMonth,
                                        contentDescription = null,
                                        tint = EnviAmber,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Google Calendar Auto-Pause",
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = "Halts timers during scheduled meetings",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = TextDarkMuted
                                    )
                                }
                            }

                            val gcalIntegration = integrations.find { it.id == "int_gcal" }
                            val isAutoPause = gcalIntegration?.autoPauseEnabled == true
                            Switch(
                                checked = isAutoPause,
                                onCheckedChange = { onToggleAutoPauseCalendar() },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = EnviGreenDark,
                                    uncheckedThumbColor = Color.White,
                                    uncheckedTrackColor = Color(0xFFCBD5E1)
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            calendarEvents.forEach { event ->
                                CalendarEventCard(event = event)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(80.dp))
            }
        } else {
            // ----------------------------------------------------
            // TAB 2: AUTOMATED TIMESHEETS & EXPORT (CSV / PDF)
            // ----------------------------------------------------
            item {
                // Timesheet KPI Bento Cards
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Card 1: Billable Hours
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "BILLABLE HOURS",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.5.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = TextDarkMuted
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "${timesheetSummary.totalBillableHours} hrs",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp
                                ),
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${timesheetSummary.billableEfficiencyRate}% Billable ratio",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = EnviGreenDark
                            )
                        }
                    }

                    // Card 2: Total Revenue
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = BentoSage),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = "TOTAL BILLED",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 9.5.sp,
                                    fontFamily = FontFamily.Monospace
                                ),
                                color = Color(0xFF234B36)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "$${String.format("%,.2f", timesheetSummary.totalRevenue)}",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp
                                ),
                                color = Color(0xFF133624)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${timesheetSummary.activeProjectsCount} Client Projects",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = Color(0xFF234B36)
                            )
                        }
                    }
                }
            }

            item {
                // One-Tap Export Action Bar
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF131A18)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "One-Tap Payroll Export",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    ),
                                    color = Color.White
                                )
                                Text(
                                    text = "Generate client invoicing & payroll records",
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(EnviGreenDark),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Download,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    onExportTimesheet("CSV")
                                    exportSuccessMessage = "CSV generated: timesheet_aug18_24.csv"
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                                modifier = Modifier.weight(1f)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Download,
                                        contentDescription = null,
                                        tint = TextDarkPrimary,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Export CSV",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        ),
                                        color = TextDarkPrimary
                                    )
                                }
                            }

                            Button(
                                onClick = {
                                    onExportTimesheet("PDF")
                                    exportSuccessMessage = "PDF invoice ready: timesheet_aug18_24.pdf"
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = EnviCoralDock),
                                modifier = Modifier.weight(1f)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Share,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Export PDF",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp
                                        ),
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        if (exportSuccessMessage != null) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF064E3B))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Color(0xFF34D399),
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = exportSuccessMessage!!,
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium
                                        ),
                                        color = Color(0xFFD1FAE5)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item {
                // Section: Timesheet Entries by Project & Client
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(30.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color(0xFFFDF2F8)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Work,
                                        contentDescription = null,
                                        tint = Color(0xFFDB2777),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = "Client & Project Entries",
                                        style = MaterialTheme.typography.titleSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        ),
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = "Categorized for payroll & client invoicing",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = TextDarkMuted
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFF131A18))
                                    .clickable { showAddTimesheetDialog = true }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Add Entry",
                                        tint = Color.White,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Add Hours",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.5.sp
                                        ),
                                        color = Color.White
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            timesheets.forEach { entry ->
                                TimesheetItemCard(entry = entry)
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    // Modal: Log Manual Commit
    if (showAddCommitDialog) {
        AddCommitDialog(
            onDismiss = { showAddCommitDialog = false },
            onConfirm = { msg, repo ->
                onLogCommit(msg, repo)
                showAddCommitDialog = false
            }
        )
    }

    // Modal: Add Timesheet Hours
    if (showAddTimesheetDialog) {
        AddTimesheetDialog(
            onDismiss = { showAddTimesheetDialog = false },
            onConfirm = { client, project, hrs, rate ->
                onAddTimesheet(client, project, hrs, rate)
                showAddTimesheetDialog = false
            }
        )
    }
}

// ----------------------------------------------------
// UI COMPONENTS & BENTO CARDS
// ----------------------------------------------------

@Composable
fun IntegrationsHeaderBanner(
    totalConnected: Int,
    totalIntegrations: Int
) {
    Card(
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = BentoPeach),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF5E2E20))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "ENTERPRISE BRIDGES",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 9.5.sp
                        ),
                        color = Color.White
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.White.copy(alpha = 0.8f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "$totalConnected / $totalIntegrations Connected",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        ),
                        color = Color(0xFF332019)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Integrations & Timesheets",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Black,
                    fontSize = 20.sp
                ),
                color = Color(0xFF2A1712)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Live telemetry sync with GitHub, Jira, Linear, and Google Calendar alongside 1-tap payroll timesheet exports.",
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 11.5.sp,
                    lineHeight = 16.sp
                ),
                color = Color(0xFF5E392F)
            )
        }
    }
}

@Composable
fun IntegrationItemCard(
    item: DevIntegrationItem,
    onToggle: () -> Unit,
    onToggleAutoPause: (() -> Unit)? = null
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BentoCardLight),
        border = BorderStroke(
            1.dp,
            if (item.isConnected) Color(0xFFDCFCE7) else Color(0xFFE2E8F0)
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            when (item.provider) {
                                "GitHub" -> Color(0xFF1E293B)
                                "GitLab" -> Color(0xFFFC6D26)
                                "Jira" -> Color(0xFF0052CC)
                                "Linear" -> Color(0xFF5E6AD2)
                                else -> Color(0xFF4285F4)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = when (item.provider) {
                            "GitHub" -> "🐙"
                            "GitLab" -> "🦊"
                            "Jira" -> "🔷"
                            "Linear" -> "📐"
                            else -> "📅"
                        },
                        fontSize = 18.sp
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = item.name,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.5.sp
                            ),
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(if (item.isConnected) EnviGreenDark else Color(0xFF94A3B8))
                        )
                    }
                    Text(
                        text = item.accountHandle ?: "Not authenticated",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.5.sp),
                        color = TextDarkSecondary
                    )
                    Text(
                        text = item.syncStatusText,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 9.5.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = if (item.isConnected) EnviGreenDark else TextDarkMuted
                    )
                }
            }

            IconButton(
                onClick = onToggle,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = if (item.isConnected) Icons.Default.Link else Icons.Default.LinkOff,
                    contentDescription = "Toggle connection",
                    tint = if (item.isConnected) EnviGreenDark else Color(0xFF94A3B8),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun IssueTicketCard(
    ticket: IssueTicket,
    onSync: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (ticket.isTrackingActive) Color(0xFFF0FDF4) else Color(0xFFF8FAFC)
        ),
        border = BorderStroke(
            1.dp,
            if (ticket.isTrackingActive) EnviGreenDark else Color(0xFFE2E8F0)
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSync() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (ticket.provider == "Jira") Color(0xFF0052CC) else Color(0xFF5E6AD2))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = ticket.key,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.5.sp,
                                fontFamily = FontFamily.Monospace
                            ),
                            color = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFE2E8F0))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = ticket.status,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Medium,
                                fontSize = 9.sp
                            ),
                            color = Color(0xFF334155)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "${ticket.loggedHours}h / ${ticket.estimatedHours}h",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 9.5.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = ticket.title,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 11.5.sp
                    ),
                    color = TextDarkPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (ticket.isTrackingActive) EnviGreenDark else Color(0xFF131A18))
                    .padding(horizontal = 8.dp, vertical = 5.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (ticket.isTrackingActive) Icons.Default.Check else Icons.Default.PlayArrow,
                        contentDescription = "Sync Task",
                        tint = Color.White,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (ticket.isTrackingActive) "Active Task" else "Focus Task",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        ),
                        color = Color.White,
                        softWrap = false
                    )
                }
            }
        }
    }
}

@Composable
fun GitCommitCard(commit: GitCommitActivity) {
    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = commit.repoName,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.5.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkPrimary
                    )
                    Text(
                        text = " : ${commit.branch}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkMuted
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFFE0E7FF))
                        .padding(horizontal = 4.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = commit.commitHash,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = Color(0xFF3730A3)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = commit.message,
                style = MaterialTheme.typography.bodySmall.copy(
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium
                ),
                color = TextDarkSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${commit.author} • ${commit.timestamp}",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 9.5.sp
                    ),
                    color = TextDarkMuted
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "+${commit.additions}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.5.sp
                        ),
                        color = EnviGreenDark
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "-${commit.deletions}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.5.sp
                        ),
                        color = Color(0xFFDC2626)
                    )
                }
            }
        }
    }
}

@Composable
fun CalendarEventCard(event: CalendarEventItem) {
    Card(
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.5.sp
                    ),
                    color = TextDarkPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${event.startTime} - ${event.endTime} (${event.durationMinutes}m) • ${event.organizer}",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontSize = 10.sp
                    ),
                    color = TextDarkMuted
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFFEF3C7))
                    .padding(horizontal = 6.dp, vertical = 3.dp)
            ) {
                Text(
                    text = "Auto-Pause Armed",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp
                    ),
                    color = Color(0xFF92400E)
                )
            }
        }
    }
}

@Composable
fun TimesheetItemCard(entry: TimesheetEntry) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = entry.projectName,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.5.sp
                        ),
                        color = TextDarkPrimary
                    )
                    Text(
                        text = entry.clientName,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.5.sp),
                        color = TextDarkSecondary
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (entry.status == "Approved") Color(0xFFDCFCE7) else Color(0xFFFEF3C7))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = entry.status,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.5.sp
                        ),
                        color = if (entry.status == "Approved") EnviGreenDark else Color(0xFF92400E)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Divider(color = Color(0xFFE2E8F0), thickness = 0.5.dp)
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${entry.billableHours} hrs",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        ),
                        color = TextDarkPrimary
                    )
                    Text(
                        text = " @ $${entry.hourlyRate.toInt()}/hr",
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp
                        ),
                        color = TextDarkMuted
                    )
                }

                Text(
                    text = "$${String.format("%,.2f", entry.totalBilled)}",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Black,
                        fontSize = 13.sp
                    ),
                    color = EnviGreenDark
                )
            }
        }
    }
}

// ----------------------------------------------------
// MODAL DIALOGS (Manual commit & add timesheet)
// ----------------------------------------------------

@Composable
fun AddCommitDialog(
    onDismiss: () -> Unit,
    onConfirm: (message: String, repo: String) -> Unit
) {
    var commitMsg by remember { mutableStateOf("") }
    var repoName by remember { mutableStateOf("endocore-platform-core") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = BentoCardLight),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "Log Git Commit Bridge",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    ),
                    color = TextDarkPrimary
                )
                Text(
                    text = "Simulate git commit hook broadcast to team pipeline",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = TextDarkMuted
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = repoName,
                    onValueChange = { repoName = it },
                    label = { Text("Repository Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EnviGreenDark,
                        unfocusedBorderColor = Color(0xFFCBD5E1)
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = commitMsg,
                    onValueChange = { commitMsg = it },
                    label = { Text("Commit Message (e.g. feat: sync telemetry)") },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EnviGreenDark,
                        unfocusedBorderColor = Color(0xFFCBD5E1)
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9))
                    ) {
                        Text("Cancel", color = TextDarkSecondary)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (commitMsg.isNotBlank()) {
                                onConfirm(commitMsg, repoName)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF131A18))
                    ) {
                        Text("Broadcast Commit", color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun AddTimesheetDialog(
    onDismiss: () -> Unit,
    onConfirm: (client: String, project: String, hours: Float, rate: Double) -> Unit
) {
    var clientName by remember { mutableStateOf("") }
    var projectName by remember { mutableStateOf("") }
    var hoursText by remember { mutableStateOf("4.5") }
    var rateText by remember { mutableStateOf("135") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = BentoCardLight),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "Add Billable Hours",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    ),
                    color = TextDarkPrimary
                )
                Text(
                    text = "Record client work for weekly timesheet payroll",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = TextDarkMuted
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = clientName,
                    onValueChange = { clientName = it },
                    label = { Text("Client Name (e.g. Acme Corp)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EnviGreenDark,
                        unfocusedBorderColor = Color(0xFFCBD5E1)
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = projectName,
                    onValueChange = { projectName = it },
                    label = { Text("Project / Deliverable Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EnviGreenDark,
                        unfocusedBorderColor = Color(0xFFCBD5E1)
                    )
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = hoursText,
                        onValueChange = { hoursText = it },
                        label = { Text("Hours") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EnviGreenDark,
                            unfocusedBorderColor = Color(0xFFCBD5E1)
                        )
                    )

                    OutlinedTextField(
                        value = rateText,
                        onValueChange = { rateText = it },
                        label = { Text("Rate ($/hr)") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = EnviGreenDark,
                            unfocusedBorderColor = Color(0xFFCBD5E1)
                        )
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF1F5F9))
                    ) {
                        Text("Cancel", color = TextDarkSecondary)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val hrs = hoursText.toFloatOrNull() ?: 1.0f
                            val rate = rateText.toDoubleOrNull() ?: 120.0
                            if (clientName.isNotBlank() && projectName.isNotBlank()) {
                                onConfirm(clientName, projectName, hrs, rate)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EnviCoralDock)
                    ) {
                        Text("Save Entry", color = Color.White)
                    }
                }
            }
        }
    }
}
