import { useEffect } from 'react';
import { Alert } from 'react-native';

export type DialogAction = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogConfig = {
  title: string;
  message?: string;
  actions?: DialogAction[];
};

export function AppAlertDialog({
  config,
  onDismiss,
}: {
  config: DialogConfig | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!config) return;

    const buttons = config.actions?.map((action) => ({
      text: action.text,
      style: action.style,
      onPress: () => {
        onDismiss();
        action.onPress?.();
      },
    })) || [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ];

    Alert.alert(config.title, config.message, buttons, {
      onDismiss,
    });
  }, [config, onDismiss]);

  return null;
}
