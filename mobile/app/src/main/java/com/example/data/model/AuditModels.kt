package com.example.data.model

enum class AuditSeverity(val label: String, val colorHex: Long) {
    INFO("INFO", 0xFF06B6D4),
    SUCCESS("PASS", 0xFF10B981),
    WARNING("WARN", 0xFFF59E0B),
    SECURITY("AUDIT", 0xFF8B5CF6),
    ERROR("CRIT", 0xFFEF4444)
}

data class AuditLogEntry(
    val id: String,
    val timestamp: String,
    val category: String,
    val action: String,
    val detail: String,
    val severity: AuditSeverity,
    val actor: String = "local-agent-daemon",
    val latencyMs: Int = 12
)

data class EndpointComplianceStatus(
    val diskEncryption: Boolean = true,
    val tlsVersion: String = "TLS 1.3 / mTLS Enforced",
    val agentVersion: String = "v2.5.4-enterprise",
    val auditLoggingEnabled: Boolean = true,
    val piiMaskingActive: Boolean = true,
    val sessionTtlMinutes: Int = 480
)
