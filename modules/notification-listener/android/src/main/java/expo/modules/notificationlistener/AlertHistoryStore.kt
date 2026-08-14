package expo.modules.notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object AlertHistoryStore {
    private const val PREFS = "AlertifyPrefs"
    private const val KEY = "alert_history"
    private const val MAX_ITEMS = 50

    @Synchronized
    fun add(context: Context, title: String, text: String, packageName: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = parseArray(prefs.getString(KEY, "[]"))
        val item = JSONObject().apply {
            put("id", "${System.currentTimeMillis()}-${(Math.random() * 1_000_000).toInt()}")
            put("title", title)
            put("text", text)
            put("packageName", packageName)
            put("timestamp", System.currentTimeMillis())
        }
        val next = JSONArray()
        next.put(item)
        val limit = minOf(existing.length(), MAX_ITEMS - 1)
        for (i in 0 until limit) {
            existing.optJSONObject(i)?.let { next.put(it) }
        }
        prefs.edit().putString(KEY, next.toString()).apply()
    }

    @Synchronized
    fun getAll(context: Context): List<Map<String, Any>> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val array = parseArray(prefs.getString(KEY, "[]"))
        return List(array.length()) { i ->
            val obj = array.optJSONObject(i) ?: JSONObject()
            mapOf(
                "id" to obj.optString("id"),
                "title" to obj.optString("title"),
                "text" to obj.optString("text"),
                "packageName" to obj.optString("packageName"),
                "timestamp" to obj.optLong("timestamp")
            )
        }
    }

    @Synchronized
    fun seedIfEmpty(context: Context, itemsJson: String) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val existing = prefs.getString(KEY, "[]") ?: "[]"
        if (existing.isNotBlank() && existing != "[]") return
        val parsed = parseArray(itemsJson)
        if (parsed.length() == 0) return
        prefs.edit().putString(KEY, parsed.toString()).apply()
    }

    private fun parseArray(raw: String?): JSONArray {
        return try {
            JSONArray(raw?.ifBlank { "[]" } ?: "[]")
        } catch (_: Exception) {
            JSONArray()
        }
    }
}
