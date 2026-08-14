export type NotificationReceivedPayload = {
  title: string;
  text: string;
  packageName: string;
};

export type AlarmStatePayload = {
  playing: boolean;
};

export type NativeHistoryItem = {
  id: string;
  title: string;
  text: string;
  packageName: string;
  timestamp: number;
};

export type NotificationListenerModuleEvents = {
  onNotificationReceived: (params: NotificationReceivedPayload) => void;
  onAlarmStateChanged: (params: AlarmStatePayload) => void;
};
