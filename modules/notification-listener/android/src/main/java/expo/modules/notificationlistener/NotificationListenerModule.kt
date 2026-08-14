package expo.modules.notificationlistener

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NotificationListener")

    OnCreate {
      NotificationAlarmManager.listenerModule = this@NotificationListenerModule
    }

    OnDestroy {
      NotificationAlarmManager.listenerModule = null
    }

    Events("onNotificationReceived", "onAlarmStateChanged")

    Function("hasPermission") {
      val context = appContext.reactContext ?: return@Function false
      val packageName = context.packageName
      val listeners = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      listeners != null && listeners.contains(packageName)
    }

    Function("requestPermission") {
      launch(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
      true
    }

    Function("canPostNotifications") {
      val context = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT < 33) return@Function true
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED
    }

    Function("requestPostNotifications") {
      if (Build.VERSION.SDK_INT < 33) return@Function true
      val activity = appContext.currentActivity ?: return@Function false
      activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 9911)
      true
    }

    Function("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function false
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    Function("requestIgnoreBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function false
      val packageUri = Uri.parse("package:${context.packageName}")
      try {
        launch(
          Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = packageUri
          }
        )
      } catch (_: Exception) {
        launch(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = packageUri
          }
        )
      }
      true
    }

    Function("syncPref") { key: String, value: String ->
      val context = appContext.reactContext ?: return@Function false
      val prefs = context.getSharedPreferences("AlertifyPrefs", Context.MODE_PRIVATE)
      prefs.edit().putString(key, value).apply()
      true
    }

    Function("stopNativeAlarm") {
      val context = appContext.reactContext ?: return@Function false
      NotificationAlarmManager.stopAlarm(context)
      true
    }

    Function("isNativeAlarmPlaying") {
      NotificationAlarmManager.isPlaying
    }

    Function("testAlarm") {
      val context = appContext.reactContext ?: return@Function false
      val prefs = context.getSharedPreferences("AlertifyPrefs", Context.MODE_PRIVATE)
      val soundUri = prefs.getString("alarm_sound_uri", null)
      NotificationAlarmManager.playAlarm(context, soundUri)
      true
    }

    Function("copyAlarmSound") { sourceUri: String ->
      val context = appContext.reactContext ?: return@Function ""
      val storedPath = AlarmSoundStorage.copyFromUri(context, sourceUri)
      storedPath ?: ""
    }

    Function("clearAlarmSound") {
      val context = appContext.reactContext ?: return@Function false
      AlarmSoundStorage.clear(context)
      true
    }

    Function("getNativeHistory") {
      val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
      AlertHistoryStore.getAll(context)
    }

    Function("seedNativeHistory") { itemsJson: String ->
      val context = appContext.reactContext ?: return@Function false
      AlertHistoryStore.seedIfEmpty(context, itemsJson)
      true
    }

    AsyncFunction("getInstalledApps") {
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
      AppDiscoveryHelper.getAllSelectableApps(context)
    }

    AsyncFunction("getAppIcon") { packageName: String ->
      val context = appContext.reactContext ?: return@AsyncFunction ""
      AppDiscoveryHelper.getAppIconPath(context, packageName) ?: ""
    }

    AsyncFunction("getAppIcons") { packageNames: List<String> ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyMap<String, String>()
      AppDiscoveryHelper.getAppIconPaths(context, packageNames)
    }
  }

  private fun launch(intent: Intent) {
    val activity = appContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      val context = appContext.reactContext ?: return
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }
}
