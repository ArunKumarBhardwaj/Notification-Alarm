/**
 * Ember-on-stone palette. Surfaces are neutral warm stone so the single ember
 * accent carries the brand, and the tab bar sits on a dark "chrome" surface in
 * both schemes.
 *
 * `background` is the app's window color: it must stay in sync with the
 * expo-splash-screen `backgroundColor` in app.json (light and dark), otherwise
 * the splash hand-off shows a color step instead of a clean fade.
 *
 * Roles: tint for identity and selection, surfaces for content, chrome for the
 * floating tab bar, success for monitoring, attention for incomplete setup,
 * danger only for alarm/error.
 */
export const SEED_COLOR = '#C2410C';

export const Colors = {
  light: {
    text: '#1C1714',
    muted: '#6D625B',
    background: '#F6F2EE',
    surface: '#FFFFFF',
    surfaceContainer: '#EDE6E0',
    primarySoft: '#FBE4D5',
    border: '#E0D7CF',
    borderStrong: '#CFC2B8',
    tint: '#C2410C',
    onPrimary: '#FFFFFF',
    chrome: '#231C18',
    onChrome: '#F6F2EE',
    chromeMuted: '#A9998F',
    icon: '#6D625B',
    tabIconDefault: '#A9998F',
    tabIconSelected: '#FFFFFF',
    danger: '#B3261E',
    success: '#2C6E3F',
    attention: '#8A5A00',
  },
  dark: {
    text: '#F5EFEB',
    muted: '#A79C95',
    background: '#100D0C',
    surface: '#1A1614',
    surfaceContainer: '#231E1B',
    primarySoft: '#3A2117',
    border: '#332B27',
    borderStrong: '#4A3F39',
    tint: '#FF8A50',
    onPrimary: '#3A1200',
    chrome: '#1C1817',
    onChrome: '#F5EFEB',
    chromeMuted: '#8E8279',
    icon: '#A79C95',
    tabIconDefault: '#8E8279',
    tabIconSelected: '#3A1200',
    danger: '#FF8A80',
    success: '#A6D578',
    attention: '#F5C518',
  },
};

/**
 * Plus Jakarta Sans, loaded at runtime in the root layout. Android does not
 * synthesize weights for custom families, so every weight is its own family and
 * text styles set `fontFamily` instead of `fontWeight`.
 */
export const Font = {
  regular: 'Jakarta',
  medium: 'JakartaMedium',
  semibold: 'JakartaSemiBold',
  bold: 'JakartaBold',
  extrabold: 'JakartaExtraBold',
};

export const Type = {
  display: {
    fontFamily: Font.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  onboardingTitle: {
    fontFamily: Font.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  screenTitle: {
    fontFamily: Font.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  rowTitle: {
    fontFamily: Font.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  supporting: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  kicker: {
    fontFamily: Font.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  cta: {
    fontFamily: Font.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  metric: {
    fontFamily: Font.extrabold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
  },
};

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const Motion = {
  fast: 160,
  interaction: 220,
  onboarding: 400,
};

/**
 * Floating tab bar metrics. Scrollable content pads its bottom by
 * `TabBar.clearance` so the last row never hides behind the bar.
 */
export const TabBar = {
  height: 62,
  inset: 6,
  clearance: 62 + Space.xl * 2,
};

export type ThemeColors = typeof Colors.light;
