import { Host } from '@expo/ui';
import {
  AlertDialog,
  Button,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { SEED_COLOR } from '@/constants/theme';
import { useAppDialog, type DialogConfig } from '@/hooks/dialog-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

function ComposeDialog({
  config,
  onDismiss,
}: {
  config: DialogConfig;
  onDismiss: () => void;
}) {
  const colors = useMaterialColors();

  const actions =
    config.actions && config.actions.length > 0
      ? config.actions
      : [{ text: 'OK', onPress: onDismiss }];

  const confirmAction = actions.find((a) => a.style !== 'cancel') || actions[0];
  const cancelAction = actions.find((a) => a.style === 'cancel');
  const isDestructive = confirmAction.style === 'destructive';

  return (
    <AlertDialog
      onDismissRequest={onDismiss}
      properties={{
        dismissOnClickOutside: true,
        dismissOnBackPress: true,
      }}
      colors={{
        titleContentColor: colors.onSurface,
        textContentColor: colors.onSurfaceVariant,
      }}
    >
      <AlertDialog.Title>
        <Text>{config.title}</Text>
      </AlertDialog.Title>
      {config.message ? (
        <AlertDialog.Text>
          <Text>{config.message}</Text>
        </AlertDialog.Text>
      ) : null}
      <AlertDialog.ConfirmButton>
        <Button
          onClick={() => {
            onDismiss();
            confirmAction.onPress?.();
          }}
          colors={
            isDestructive
              ? {
                  containerColor: colors.error,
                  contentColor: colors.onError,
                }
              : undefined
          }
        >
          <Text>{confirmAction.text}</Text>
        </Button>
      </AlertDialog.ConfirmButton>
      {cancelAction ? (
        <AlertDialog.DismissButton>
          <Button
            onClick={() => {
              onDismiss();
              cancelAction.onPress?.();
            }}
          >
            <Text>{cancelAction.text}</Text>
          </Button>
        </AlertDialog.DismissButton>
      ) : null}
    </AlertDialog>
  );
}

export function AppDialogOverlay() {
  const { dialogConfig, hideDialog } = useAppDialog();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <Host
      matchContents
      seedColor={SEED_COLOR}
      colorScheme={colorScheme}
      pointerEvents="box-none"
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      {dialogConfig ? (
        <ComposeDialog config={dialogConfig} onDismiss={hideDialog} />
      ) : null}
    </Host>
  );
}
