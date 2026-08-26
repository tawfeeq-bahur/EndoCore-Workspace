package com.example.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.R
import com.example.data.network.EndoCoreRepository

/**
 * Android Foreground Service for EndoCore Focus Sessions.
 * 
 * Provides an ongoing Status Bar Notification with:
 * - Live session timer countdown / chronometer
 * - Active task title & focus ratio
 * - Pause, Resume, and Quick Finish actions
 * - Background reliability to prevent OS killing during deep focus work
 */
class FocusForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "endocore_focus_session_channel"
        const val NOTIFICATION_ID = 4040

        const val ACTION_START = "com.example.service.ACTION_START"
        const val ACTION_PAUSE = "com.example.service.ACTION_PAUSE"
        const val ACTION_RESUME = "com.example.service.ACTION_RESUME"
        const val ACTION_STOP = "com.example.service.ACTION_STOP"
        const val ACTION_QUICK_SPRINT = "com.example.service.ACTION_QUICK_SPRINT"

        const val EXTRA_TASK_NAME = "extra_task_name"
        const val EXTRA_IS_PAUSED = "extra_is_paused"

        fun startService(context: Context, taskName: String = "Enterprise Architecture Pipeline", isPaused: Boolean = false) {
            val intent = Intent(context, FocusForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_TASK_NAME, taskName)
                putExtra(EXTRA_IS_PAUSED, isPaused)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, FocusForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    private var currentTaskName: String = "Enterprise Architecture Pipeline"
    private var isPaused: Boolean = false
    private var sessionStartTimeMillis: Long = System.currentTimeMillis()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        when (action) {
            ACTION_START -> {
                currentTaskName = intent?.getStringExtra(EXTRA_TASK_NAME) ?: currentTaskName
                isPaused = intent?.getBooleanExtra(EXTRA_IS_PAUSED, false) ?: false
                sessionStartTimeMillis = System.currentTimeMillis()
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            ACTION_PAUSE -> {
                isPaused = true
                EndoCoreRepository.getInstance().toggleSessionPause()
                updateNotification()
            }
            ACTION_RESUME -> {
                isPaused = false
                EndoCoreRepository.getInstance().toggleSessionPause()
                updateNotification()
            }
            ACTION_QUICK_SPRINT -> {
                isPaused = false
                EndoCoreRepository.getInstance().syncTaskName("⚡ 25m Pomodoro Focus Sprint")
                updateNotification()
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
        }

        return START_STICKY
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun buildNotification(): Notification {
        // Open app intent
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Pause Action
        val pauseIntent = Intent(this, FocusForegroundService::class.java).apply {
            action = ACTION_PAUSE
        }
        val pausePendingIntent = PendingIntent.getService(
            this, 1, pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Resume Action
        val resumeIntent = Intent(this, FocusForegroundService::class.java).apply {
            action = ACTION_RESUME
        }
        val resumePendingIntent = PendingIntent.getService(
            this, 2, resumeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Stop Action
        val stopIntent = Intent(this, FocusForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 3, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val statusPrefix = if (isPaused) "⏸️ PAUSED" else "🟢 FOCUSING"

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("$statusPrefix: $currentTaskName")
            .setContentText(if (isPaused) "Session paused • Tap to resume tracking" else "Live focus stream active • 94% telemetry efficiency")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_WORKOUT)
            .setColor(0xFF10B981.toInt())
            .setOnlyAlertOnce(true)

        if (!isPaused) {
            builder.setUsesChronometer(true)
            builder.setWhen(sessionStartTimeMillis)
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", pausePendingIntent)
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Resume", resumePendingIntent)
        }

        builder.addAction(android.R.drawable.ic_menu_close_clear_cancel, "Finish Session", stopPendingIntent)

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "EndoCore Focus Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live ongoing focus timer, active tasks, and quick pause/resume controls"
                setShowBadge(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
