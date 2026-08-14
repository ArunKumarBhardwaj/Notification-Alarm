package expo.modules.notificationlistener

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import org.json.JSONArray
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Callable
import java.util.concurrent.Executors

object AppDiscoveryHelper {
    private const val PREFS = "AlertifyPrefs"
    private const val RECENT_KEY = "recent_notification_apps"
    private const val MAX_RECENT = 30
    private const val ICON_SIZE = 96

    fun trackRecentApp(context: Context, packageName: String) {
        if (packageName == context.packageName) return

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val recent = parseJsonArray(prefs.getString(RECENT_KEY, "[]") ?: "[]").toMutableList()
        recent.remove(packageName)
        recent.add(0, packageName)
        while (recent.size > MAX_RECENT) {
            recent.removeAt(recent.lastIndex)
        }
        prefs.edit().putString(RECENT_KEY, toJsonArray(recent)).apply()
    }

    fun getAllSelectableApps(context: Context): List<Map<String, Any>> {
        val pm = context.packageManager
        val result = mutableListOf<Map<String, Any>>()
        val seenPackages = mutableSetOf<String>()

        val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfos = pm.queryIntentActivities(launcherIntent, 0)
        for (resolveInfo in resolveInfos) {
            val appInfo = resolveInfo.activityInfo?.applicationInfo ?: continue
            addApp(context, pm, appInfo.packageName, seenPackages, result)
        }

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val recentPackages = parseJsonArray(prefs.getString(RECENT_KEY, "[]") ?: "[]")
        for (packageName in recentPackages) {
            addApp(context, pm, packageName, seenPackages, result)
        }

        result.sortBy { (it["name"] as? String)?.lowercase() ?: "" }
        return result
    }

    fun getAppIconPath(context: Context, packageName: String): String? {
        val file = iconFile(context, packageName) ?: return null
        if (file.exists() && file.length() > 0L) {
            return "file://${file.absolutePath}"
        }

        return try {
            val icon = context.packageManager.getApplicationIcon(packageName)
            val bitmap = drawableToBitmap(icon, ICON_SIZE)
            // Write to a temp file first so a killed process can never leave a
            // half-written PNG that later reads would treat as cached.
            val temp = File(file.parentFile, "${file.name}.tmp")
            FileOutputStream(temp).use { output ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 80, output)
            }
            if (bitmap != (icon as? BitmapDrawable)?.bitmap) {
                bitmap.recycle()
            }
            if (!temp.renameTo(file)) {
                temp.delete()
                return null
            }
            "file://${file.absolutePath}"
        } catch (_: Exception) {
            null
        }
    }

    /** Resolves many icons in one call so the list does not make a bridge call per row. */
    fun getAppIconPaths(context: Context, packageNames: List<String>): Map<String, String> {
        val packages = packageNames.distinct().filter { it.isNotEmpty() }
        if (packages.isEmpty()) return emptyMap()

        val threads = Runtime.getRuntime().availableProcessors().coerceIn(1, 4)
        val pool = Executors.newFixedThreadPool(threads)
        return try {
            val tasks = packages.map { packageName ->
                Callable { packageName to (getAppIconPath(context, packageName) ?: "") }
            }
            pool.invokeAll(tasks)
                .mapNotNull { future -> runCatching { future.get() }.getOrNull() }
                .filter { (_, path) -> path.isNotEmpty() }
                .toMap()
        } catch (_: Exception) {
            emptyMap()
        } finally {
            pool.shutdown()
        }
    }

    private fun iconFile(context: Context, packageName: String): File? {
        val dir = File(context.cacheDir, "app_icons")
        if (!dir.exists() && !dir.mkdirs()) return null
        return File(dir, packageName.replace('.', '_') + ".png")
    }

    private fun cachedIconPath(context: Context, packageName: String): String? {
        val file = iconFile(context, packageName) ?: return null
        return if (file.exists() && file.length() > 0L) "file://${file.absolutePath}" else null
    }

    private fun addApp(
        context: Context,
        pm: PackageManager,
        packageName: String,
        seenPackages: MutableSet<String>,
        result: MutableList<Map<String, Any>>
    ) {
        if (seenPackages.contains(packageName)) return
        if (packageName == context.packageName) return

        try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            seenPackages.add(packageName)
            val entry = mutableMapOf<String, Any>(
                "packageName" to packageName,
                "name" to appInfo.loadLabel(pm).toString()
            )
            cachedIconPath(context, packageName)?.let { entry["icon"] = it }
            result.add(entry)
        } catch (_: PackageManager.NameNotFoundException) {
            // Package no longer installed or not visible to the app.
        }
    }

    private fun drawableToBitmap(icon: Drawable, size: Int): Bitmap {
        if (icon is BitmapDrawable && icon.bitmap != null) {
            return Bitmap.createScaledBitmap(icon.bitmap, size, size, true)
        }
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        icon.setBounds(0, 0, size, size)
        icon.draw(canvas)
        return bmp
    }

    fun parseJsonArray(json: String): List<String> {
        return try {
            val array = JSONArray(json)
            List(array.length()) { i -> array.optString(i) }.filter { it.isNotEmpty() }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun toJsonArray(items: List<String>): String {
        val array = JSONArray()
        items.forEach { array.put(it) }
        return array.toString()
    }
}
