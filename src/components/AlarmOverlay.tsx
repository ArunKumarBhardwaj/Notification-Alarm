import { Colors } from '@/constants/theme';
import { useAlarm } from '@/hooks/alarm-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { IconSymbol } from './ui/icon-symbol';

export function AlarmOverlay() {
  const { isRinging, stopSiren } = useAlarm();
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  if (!isRinging) return null;

  return (
    <Animated.View entering={FadeIn} style={styles.overlay}>
      <Animated.View entering={SlideInUp} style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.danger + '20' }]}>
          <IconSymbol name="warning" size={40} color={colors.danger} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>NOTIFICATION ALARM</Text>
        <Text style={[styles.desc, { color: colors.icon }]}>
          A watched app sent a notification. The alarm will keep ringing until you dismiss it.
        </Text>

        <Pressable 
          style={[styles.dismissBtn, { backgroundColor: colors.danger }]} 
          onPress={stopSiren}
        >
          <Text style={styles.dismissText}>DISMISS ALARM</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
  },
  desc: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '500',
  },
  dismissBtn: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
