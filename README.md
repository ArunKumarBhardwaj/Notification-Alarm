# Notification Alarm

Notification Alarm is an Android pager: when a notification arrives from an app you choose, it rings a loud alarm so you don’t miss it — even if the app is killed.

## Key Features

- **Killed-mode reliability**: A native Android `NotificationListenerService` starts the siren even if the Expo process is closed.
- **Native siren engine**: Kotlin `MediaPlayer` on the alarm stream. Defaults to the phone’s alarm ringtone; a custom file is optional.
- **Persistent alarms**: Loops with vibration until dismissed from the in-app overlay or the system notification.
- **Custom sound picker**: Select any audio file from the device.
- **App filtering**: Choose which apps (WhatsApp, PagerDuty, Slack, etc.) can trigger the alarm.
- **Alert history**: Recorded in native SharedPreferences so killed-mode alerts still show up in Engine.

## Technical Stack

- **Framework**: Expo SDK 57 / React Native 0.86
- **Updates**: EAS Update (`expo-updates`) for JS/asset pushes to internal testers
- **Native logic**: Kotlin (`NotificationListenerService`, foreground service, BroadcastReceiver)
- **Audio**: `MediaPlayer` with `USAGE_ALARM` (no `expo-audio`)
- **State**: `react-native-mmkv` synced to native `SharedPreferences`
- **Styling**: StyleSheet with light/dark theme

## Installation & Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/ArunKumarBhardwaj/Alertify.git
   cd Alertify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build and run (custom native modules require a native build):
   ```bash
   npx expo run:android
   ```

## Important Permissions

- **Notification access**: Detect incoming notifications from selected apps.
- **Post notifications** (Android 13+): Show the dismiss-alarm system notification.
- **Battery unrestricted**: Keep the listener alive after the app is killed. Use **Allow Unrestricted** on the Engine screen, or set battery usage to Unrestricted in system settings.

---
Built for reliability.
