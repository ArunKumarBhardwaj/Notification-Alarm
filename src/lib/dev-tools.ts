import * as Updates from 'expo-updates';

/**
 * Developer tooling (OTA diagnostics, Sentry test, channel label) is for
 * local/dev-client and preview builds only — not closed or production Play.
 */
export function showDevTools(): boolean {
  if (__DEV__) return true;
  const channel = Updates.channel;
  return channel === 'development' || channel === 'preview';
}
