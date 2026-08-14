package expo.modules.notificationlistener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationListenerService : NotificationListenerService() {
    companion object {
        private const val TAG = "NotificationListenerSvc"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val context = applicationContext
        val prefs = context.getSharedPreferences("AlertifyPrefs", android.content.Context.MODE_PRIVATE)

        val monitoringEnabled = prefs.getString("monitoring_enabled", "true") == "true"
        if (!monitoringEnabled) return

        val packageName = sbn.packageName

        if (packageName == context.packageName) return

        AppDiscoveryHelper.trackRecentApp(context, packageName)

        val selectedAppsJson = prefs.getString("selected_apps", "[]") ?: "[]"
        val selectedApps = AppDiscoveryHelper.parseJsonArray(selectedAppsJson)
        if (!selectedApps.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString(Notification.EXTRA_TITLE, "") ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT, "")?.toString() ?: ""

        Log.d(TAG, "Notification received from: $packageName, title: $title, text: $text")

        AlertHistoryStore.add(context, title, text, packageName)

        NotificationAlarmManager.listenerModule?.let { module ->
            try {
                module.sendEvent(
                    "onNotificationReceived",
                    mapOf(
                        "title" to title,
                        "text" to text,
                        "packageName" to packageName
                    )
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send event to JS", e)
            }
        }

        val soundUri = prefs.getString("alarm_sound_uri", null)
        NotificationAlarmManager.playAlarm(context, soundUri)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // No action needed when a source notification is removed.
    }
}
