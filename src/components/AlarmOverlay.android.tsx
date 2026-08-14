import { Host } from '@expo/ui';
import {
  AlertDialog,
  Button,
  Icon,
  Text,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import Warning from '@expo/material-symbols/warning.xml';
import React from 'react';
import { SEED_COLOR } from '@/constants/theme';
import { useAlarm } from '@/hooks/alarm-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

function AlarmDialog({ onDismiss }: { onDismiss: () => void }) {
  const colors = useMaterialColors();

  return (
    <AlertDialog
      onDismissRequest={() => {}}
      properties={{
        dismissOnClickOutside: false,
        dismissOnBackPress: false,
      }}
      colors={{
        iconContentColor: colors.error,
        titleContentColor: colors.onSurface,
        textContentColor: colors.onSurfaceVariant,
      }}
    >
      <AlertDialog.Icon>
        <Icon source={Warning} size={24} tint={colors.error} />
      </AlertDialog.Icon>
      <AlertDialog.Title>
        <Text>Notification alarm</Text>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Text>
          A watched app sent a notification. The siren keeps ringing until you dismiss it.
        </Text>
      </AlertDialog.Text>
      <AlertDialog.ConfirmButton>
        <Button
          onClick={onDismiss}
          colors={{
            containerColor: colors.error,
            contentColor: colors.onError,
          }}
        >
          <Text>Dismiss alarm</Text>
        </Button>
      </AlertDialog.ConfirmButton>
    </AlertDialog>
  );
}

export function AlarmOverlay() {
  const { isRinging, stopSiren } = useAlarm();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <Host
      matchContents
      seedColor={SEED_COLOR}
      colorScheme={colorScheme}
      pointerEvents="box-none"
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      {isRinging ? <AlarmDialog onDismiss={stopSiren} /> : null}
    </Host>
  );
}
