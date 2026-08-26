package com.example.service

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.example.MainActivity
import com.example.R
import com.example.data.network.EndoCoreRepository

/**
 * Android Home Screen Widget Provider.
 * Displays glanceable M3 Bento layout with daily focus goal progress
 * and 1-tap Pomodoro trigger directly from the user's home screen.
 */
class FocusWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_QUICK_POMODORO = "com.example.service.ACTION_QUICK_POMODORO"

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisAppWidget = ComponentName(context.packageName, FocusWidgetProvider::class.java.name)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidget)
            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val repo = EndoCoreRepository.getInstance()
            val focusState = repo.focusState.value
            val currentHours = 6.4f
            val targetHours = 8.0f
            val percentage = ((currentHours / targetHours) * 100).toInt()

            val views = RemoteViews(context.packageName, R.layout.widget_focus_bento).apply {
                setTextViewText(R.id.widget_title, "DAILY FOCUS GOAL")
                setTextViewText(R.id.widget_status_badge, "$percentage% ACHIEVED")
                setTextViewText(R.id.widget_current_hours, String.format("%.1f", currentHours))
                setTextViewText(R.id.widget_target_hours, "/ ${String.format("%.1f", targetHours)} hrs")
                setTextViewText(R.id.widget_active_task, "Active: ${focusState.projectName}")

                // Open App on root click
                val openIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val openPendingIntent = PendingIntent.getActivity(
                    context, 0, openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                setOnClickPendingIntent(R.id.widget_root, openPendingIntent)

                // 1-Tap Pomodoro Sprint Click
                val pomodoroIntent = Intent(context, FocusWidgetProvider::class.java).apply {
                    action = ACTION_QUICK_POMODORO
                }
                val pomodoroPendingIntent = PendingIntent.getBroadcast(
                    context, 1, pomodoroIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                setOnClickPendingIntent(R.id.widget_btn_pomodoro, pomodoroPendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_QUICK_POMODORO) {
            val repo = EndoCoreRepository.getInstance()
            repo.syncTaskName("⚡ 25m Home Screen Pomodoro Sprint")
            if (repo.focusState.value.isPaused) {
                repo.toggleSessionPause()
            }
            updateAllWidgets(context)

            // Also launch app or foreground service
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("triggered_sprint", true)
            }
            context.startActivity(openAppIntent)
        }
    }
}
