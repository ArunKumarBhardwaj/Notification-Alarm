/**
 * Ember alarm palette. Compose screens also seed Material 3 from SEED_COLOR
 * so native widgets match this RN chrome.
 */
export const SEED_COLOR = '#C2410C';

export const Colors = {
  light: {
    text: '#2B160C',
    background: '#FFF8F5',
    surface: '#FFF1EB',
    surfaceContainer: '#FFE4D6',
    border: '#E8C4B0',
    tint: '#C2410C',
    icon: '#8B5A42',
    tabIconDefault: '#8B5A42',
    tabIconSelected: '#C2410C',
    danger: '#B42318',
    success: '#3B6D11',
  },
  dark: {
    text: '#F4E6DF',
    background: '#14100E',
    surface: '#1F1815',
    surfaceContainer: '#2A201C',
    border: '#3D2E28',
    tint: '#FF8A4C',
    icon: '#C9A794',
    tabIconDefault: '#C9A794',
    tabIconSelected: '#FF8A4C',
    danger: '#FF8A80',
    success: '#A6D578',
  },
};

export type ThemeColors = typeof Colors.light;
