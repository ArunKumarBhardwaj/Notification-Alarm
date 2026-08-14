package expo.modules.notificationlistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

object AlarmNotificationHelper {
    const val CHANNEL_ID = "alertify_alarm_channel"
    const val NOTIFICATION_ID = 9999
    const val ACTION_DISMISS_ALARM = "com.arunbhardwaj.notificationalarm.ACTION_DISMISS_ALARM"

    fun buildDismissNotification(context: Context): Notification {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Notification Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Channel for active emergency sirens"
                setSound(null, null)
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val dismissIntent = Intent(ACTION_DISMISS_ALARM).apply {
            setPackage(context.packageName)
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            context,
            0,
            dismissIntent,
            pendingIntentFlags
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val launchPendingIntent = if (launchIntent != null) {
            PendingIntent.getActivity(context, 1, launchIntent, pendingIntentFlags)
        } else {
            null
        }

        return builder
            .setContentTitle("Notification Alarm ringing")
            .setContentText("A watched app sent a notification. Dismiss to stop the alarm.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setAutoCancel(false)
            .apply {
                if (launchPendingIntent != null) {
                    setContentIntent(launchPendingIntent)
                }
            }
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Dismiss Alarm",
                dismissPendingIntent
            )
            .build()
    }
}
