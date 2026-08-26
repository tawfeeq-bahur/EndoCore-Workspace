package com.example.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val EndoCoreColorScheme = darkColorScheme(
    primary = CyanTelemetry,
    onPrimary = EnterpriseBackground,
    primaryContainer = EnterpriseSurfaceElevated,
    onPrimaryContainer = CyanTelemetryBright,
    secondary = VioletMetric,
    onSecondary = TextPrimary,
    secondaryContainer = EnterpriseSurfaceVariant,
    onSecondaryContainer = VioletMetric,
    tertiary = EmeraldStatus,
    onTertiary = EnterpriseBackground,
    background = EnterpriseBackground,
    onBackground = TextPrimary,
    surface = EnterpriseSurface,
    onSurface = TextPrimary,
    surfaceVariant = EnterpriseSurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = EnterpriseBorderLight,
    outlineVariant = EnterpriseBorder,
    error = CrimsonAlert,
    onError = TextPrimary
)

@Composable
fun EndoCoreMobileTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = EnterpriseBackground.toArgb()
                window.navigationBarColor = EnterpriseBackground.toArgb()
                val controller = WindowCompat.getInsetsController(window, view)
                controller.isAppearanceLightStatusBars = false
                controller.isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = EndoCoreColorScheme,
        typography = Typography,
        content = content
    )
}
