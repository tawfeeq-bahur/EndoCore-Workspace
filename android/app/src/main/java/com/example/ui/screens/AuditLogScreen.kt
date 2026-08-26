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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import com.example.data.model.AuditLogEntry
import com.example.data.model.AuditSeverity
import com.example.data.model.EndpointComplianceStatus
import com.example.ui.theme.BentoCardLight
import com.example.ui.theme.CanvasLight
import com.example.ui.theme.EnviCoral
import com.example.ui.theme.EnviGreen
import com.example.ui.theme.EnviGreenDark
import com.example.ui.theme.TextDarkMuted
import com.example.ui.theme.TextDarkPrimary
import com.example.ui.theme.TextDarkSecondary

@Composable
fun AuditLogScreen(
    auditLogs: List<AuditLogEntry>,
    complianceStatus: EndpointComplianceStatus,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredLogs = remember(auditLogs, selectedFilter) {
        when (selectedFilter) {
            "SECURITY" -> auditLogs.filter { it.severity == AuditSeverity.SECURITY || it.action.contains("TOKEN") || it.action.contains("TLS") || it.action.contains("KEY") }
            "TELEMETRY" -> auditLogs.filter { it.action.contains("TELEMETRY") || it.action.contains("FLOW") || it.action.contains("BRANCH") }
            "WARNINGS" -> auditLogs.filter { it.severity == AuditSeverity.WARNING || it.severity == AuditSeverity.ERROR }
            else -> auditLogs
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(CanvasLight)
            .padding(horizontal = 18.dp)
            .testTag("audit_log_screen_feed")
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
                        text = "SECURITY & AUDIT",
                        style = MaterialTheme.typography.labelSmall.copy(
                            letterSpacing = 1.2.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = EnviGreenDark
                    )
                    Text(
                        text = "Compliance Ledger",
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
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        tint = EnviGreenDark,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = "COMPLIANT",
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
        }

        // Endpoint Compliance Summary Bento Card
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = BentoCardLight),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("compliance_card")
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
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
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = EnviGreenDark,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Workstation Security Posture",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = complianceStatus.agentVersion,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextDarkMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        ComplianceItemRow("Transport Security", complianceStatus.tlsVersion, true)
                        ComplianceItemRow("PII & Secrets Masking", "Active on branch & window titles", complianceStatus.piiMaskingActive)
                        ComplianceItemRow("Audit Integrity", "SHA-256 verified event logging", complianceStatus.auditLoggingEnabled)
                        ComplianceItemRow("Session Token TTL", "${complianceStatus.sessionTtlMinutes}m (OIDC Auto-Renew)", true)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf(
                    "ALL" to "All Events (${auditLogs.size})",
                    "SECURITY" to "Security & Auth",
                    "TELEMETRY" to "Telemetry",
                    "WARNINGS" to "Warnings"
                )

                items(filters) { (key, label) ->
                    val isSelected = selectedFilter == key
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isSelected) Color(0xFF131A18) else Color.White)
                            .clickable { selectedFilter = key }
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                            .testTag("filter_audit_$key")
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

            Spacer(modifier = Modifier.height(14.dp))
        }

        // Audit Events Feed
        items(filteredLogs) { entry ->
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .border(1.dp, Color(0xFFEBF0EC), RoundedCornerShape(20.dp))
                    .testTag("audit_entry_${entry.id}")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (entry.severity) {
                                            AuditSeverity.ERROR, AuditSeverity.WARNING -> EnviCoral.copy(alpha = 0.15f)
                                            else -> Color(0xFFEAF8F1)
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = when (entry.severity) {
                                        AuditSeverity.ERROR, AuditSeverity.WARNING -> Icons.Default.Warning
                                        else -> Icons.Default.ReceiptLong
                                    },
                                    contentDescription = null,
                                    tint = when (entry.severity) {
                                        AuditSeverity.ERROR, AuditSeverity.WARNING -> EnviCoral
                                        else -> EnviGreenDark
                                    },
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = entry.action,
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = TextDarkPrimary
                            )
                        }

                        Text(
                            text = entry.timestamp,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp
                            ),
                            color = TextDarkMuted
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = entry.detail,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextDarkSecondary,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFF5F8F6))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Actor: ${entry.actor}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextDarkMuted,
                            fontSize = 10.sp
                        )
                        Text(
                            text = "${entry.latencyMs}ms ingest",
                            style = MaterialTheme.typography.labelSmall.copy(fontFamily = FontFamily.Monospace),
                            color = EnviGreenDark,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
private fun ComplianceItemRow(
    title: String,
    value: String,
    isPassed: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = TextDarkPrimary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                color = TextDarkMuted,
                fontSize = 11.sp
            )
        }

        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = "Passed",
            tint = EnviGreen,
            modifier = Modifier.size(18.dp)
        )
    }
}
