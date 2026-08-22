import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useAppDialog } from '@/hooks/dialog-provider';

export function AppDialogOverlay() {
  const { dialogConfig, hideDialog } = useAppDialog();

  useEffect(() => {
    if (!dialogConfig) return;

    const buttons = dialogConfig.actions?.map((action) => ({
      text: action.text,
      style: action.style,
      onPress: () => {
        hideDialog();
        action.onPress?.();
      },
    })) || [
      {
        text: 'OK',
        onPress: hideDialog,
      },
    ];

    Alert.alert(dialogConfig.title, dialogConfig.message, buttons, {
      onDismiss: hideDialog,
    });
  }, [dialogConfig, hideDialog]);

  return null;
}
