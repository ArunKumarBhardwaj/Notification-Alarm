package expo.modules.notificationlistener

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import java.io.File

object NotificationAlarmManager {
    private const val TAG = "NotificationAlarm"
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    @Volatile
    var isPlaying = false
        private set

    @Volatile
    var listenerModule: NotificationListenerModule? = null

    fun playAlarm(context: Context, soundUriString: String?) {
        if (isPlaying) return
        isPlaying = true
        Log.d(TAG, "Requesting alarm playback. Sound URI: $soundUriString")
        try {
            AlarmForegroundService.start(context, soundUriString)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start alarm foreground service", e)
            onStartFailed()
        }
    }

    fun startPlayback(context: Context, soundUriString: String?) {
        Log.d(TAG, "Starting native alarm playback. Sound URI: $soundUriString")
        stopAudioAndVibration()
        isPlaying = true
        startVibration(context)
        startAudio(context, soundUriString)
        emitAlarmState(true)
    }

    fun onStartFailed() {
        isPlaying = false
        stopAudioAndVibration()
        emitAlarmState(false)
    }

    private fun startVibration(context: Context) {
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager =
                context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        val pattern = longArrayOf(0, 500, 500, 500)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 1))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(pattern, 1)
        }
    }

    private fun startAudio(context: Context, soundUriString: String?) {
        try {
            val player = MediaPlayer()
            applyAlarmAttributes(player)

            var activePlayer = player
            if (!loadCustomSound(context, player, soundUriString)) {
                try {
                    player.release()
                } catch (_: Exception) {
                    // Ignore and rebuild.
                }
                activePlayer = MediaPlayer()
                applyAlarmAttributes(activePlayer)
                val defaultUri = defaultAlarmUri()
                if (defaultUri == null) {
                    Log.d(TAG, "No alarm sound available — vibrating only")
                    activePlayer.release()
                    return
                }
                activePlayer.setDataSource(context, defaultUri)
            }

            activePlayer.isLooping = true
            activePlayer.prepare()
            activePlayer.start()
            mediaPlayer = activePlayer
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start native audio playback", e)
        }
    }

    private fun loadCustomSound(context: Context, player: MediaPlayer, soundUriString: String?): Boolean {
        val resolvedPath = resolveSoundPath(context, soundUriString)
        if (resolvedPath.isNullOrEmpty()) return false

        return try {
            val file = File(resolvedPath)
            if (file.exists()) {
                player.setDataSource(file.absolutePath)
            } else {
                player.setDataSource(context, Uri.parse(resolvedPath))
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Custom alarm sound failed, falling back to default", e)
            try {
                player.reset()
            } catch (_: Exception) {
                // Player will be rebuilt by caller if needed.
            }
            false
        }
    }

    private fun applyAlarmAttributes(player: MediaPlayer) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
        } else {
            @Suppress("DEPRECATION")
            player.setAudioStreamType(android.media.AudioManager.STREAM_ALARM)
        }
    }

    private fun defaultAlarmUri(): Uri? {
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    }

    private fun resolveSoundPath(context: Context, soundUriString: String?): String? {
        if (!soundUriString.isNullOrEmpty()) {
            val file = File(soundUriString)
            if (file.exists()) return file.absolutePath
            if (soundUriString.startsWith("file://") || soundUriString.startsWith("content://")) {
                return soundUriString
            }
            return soundUriString
        }

        return AlarmSoundStorage.getStoredPath(context)
    }

    fun stopAlarm(context: Context) {
        isPlaying = false
        Log.d(TAG, "Stopping native alarm")
        stopAudioAndVibration()
        emitAlarmState(false)
        AlarmForegroundService.stop(context)
    }

    fun onServiceStopped() {
        val wasPlaying = isPlaying
        isPlaying = false
        stopAudioAndVibration()
        if (wasPlaying) {
            emitAlarmState(false)
        }
    }

    fun stopAudioAndVibration() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping media player", e)
        }

        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling vibrator", e)
        }
    }

    private fun emitAlarmState(playing: Boolean) {
        try {
            listenerModule?.sendEvent("onAlarmStateChanged", mapOf("playing" to playing))
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit alarm state", e)
        }
    }
}
