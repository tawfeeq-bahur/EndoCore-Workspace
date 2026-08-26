package com.example.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ==========================================
// HYBRID ENDOCORE: BENTO & ENVI PALETTE
// ==========================================

// Core Canvas Backgrounds
val CanvasLight = Color(0xFFF7FAF7)
val CanvasWarmCream = Color(0xFFF4EFE6)
val CanvasDark = Color(0xFF0F1514)
val CanvasDeepCharcoal = Color(0xFF141C1A)

// Bento Card Colors (From Reference Images)
val BentoPeach = Color(0xFFFFDCCF)
val BentoPeachDark = Color(0xFF332019)
val BentoSage = Color(0xFFD6E5D3)
val BentoSageDark = Color(0xFF1D2E22)
val BentoMidnightTeal = Color(0xFF0F3634)
val BentoPlum = Color(0xFF672D4D)
val BentoPlumLight = Color(0xFFF8E9F1)
val BentoCardLight = Color(0xFFFFFFFF)
val BentoCardDark = Color(0xFF1A2422)

// Envi Green & Neon Highlights
val EnviGreen = Color(0xFF04C968)
val EnviGreenBright = Color(0xFF34E88E)
val EnviGreenGlow = Color(0xFF86EFAC)
val EnviGreenDark = Color(0xFF094D33)
val EnviGreenMuted = Color(0xFFE8F8EE)

// Envi Coral / Orange & Status Highlights
val EnviCoral = Color(0xFFFA6A5D)
val EnviCoralBright = Color(0xFFFF8276)
val EnviCoralDock = Color(0xFFFA7268)
val EnviCoralMuted = Color(0xFFFFEFEF)
val EnviAmber = Color(0xFFF59E0B)
val EnviHydroBlue = Color(0xFF3B82F6)
val EnviViolet = Color(0xFF8B5CF6)
val CrimsonAlert = Color(0xFFEF4444)
val EnviPeach = BentoPeach
val EnviSage = BentoSage

// Text Hierarchy
val TextDarkPrimary = Color(0xFF111817)
val TextDarkSecondary = Color(0xFF4A5553)
val TextDarkMuted = Color(0xFF8B9B97)
val TextLightPrimary = Color(0xFFF9FBFA)
val TextLightSecondary = Color(0xFFA6B8B3)
val TextLightMuted = Color(0xFF6E807C)

// Legacy compatibility aliases
val EnterpriseBackground = CanvasDark
val EnterpriseSurface = BentoCardDark
val EnterpriseSurfaceElevated = Color(0xFF22302D)
val EnterpriseSurfaceVariant = Color(0xFF2E3F3B)
val EnterpriseBorder = Color(0xFF263633)
val EnterpriseBorderLight = Color(0xFF364C48)
val CyanTelemetry = EnviGreen
val CyanTelemetryBright = EnviGreenBright
val EmeraldStatus = EnviGreen
val EmeraldStatusBright = EnviGreenBright
val VioletMetric = EnviViolet
val AmberWarning = EnviAmber
val TextPrimary = TextLightPrimary
val TextSecondary = TextLightSecondary
val TextMuted = TextLightMuted

// Gradients
val EnviGreenGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF04C968).copy(alpha = 0.35f), Color(0xFF04C968).copy(alpha = 0.0f))
)

val EnviLineChartGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFFE6F9EE), Color(0xFFFFFFFF).copy(alpha = 0.2f))
)

val BentoPeachGradient = Brush.linearGradient(
    colors = listOf(Color(0xFFFFDFD3), Color(0xFFFFCBB9))
)

val BentoSageGradient = Brush.linearGradient(
    colors = listOf(Color(0xFFDAE8D8), Color(0xFFC7DEC4))
)

val BentoPlumGradient = Brush.linearGradient(
    colors = listOf(Color(0xFF703254), Color(0xFF56233F))
)

val EnterpriseCardGradient = Brush.verticalGradient(
    colors = listOf(Color(0xFF202C29), Color(0xFF151F1D))
)
