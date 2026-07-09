// Bright, saturated cartoon theme inspired by Candy Crush, Duolingo, and Pokemon GO.
// NOT dark corporate — this is playful, gamified, and engaging.

export const CARTOON_COLORS = {
  // Primary vibrant palette
  electricBlue: '#4A90FF',
  royalBlue: '#0057FF',
  bubblegumPink: '#FF6B9D',
  hotPink: '#FF1493',
  tangerine: '#FF8C42',
  sunsetOrange: '#FF6B35',
  limeGreen: '#6BCF7F',
  moneyGreen: '#00C853',
  electricPurple: '#9B59B6',
  neonCyan: '#00FFFF',

  // Gradients
  gradientSunset: ['#FF6B35', '#FF8C42', '#FFD93D'] as const,
  gradientOcean: ['#0EA5E9', '#3B82F6', '#6366F1'] as const,
  gradientCandy: ['#FF6B9D', '#8B5CF6', '#3B82F6'] as const,
  gradientForest: ['#84CC16', '#10B981', '#0EA5E9'] as const,
  gradientRoyal: ['#FFD700', '#FF8C42', '#FF6B35'] as const,

  // Backgrounds
  skyDay: '#E0F2FE',
  skyTwilight: '#1E1B4B',
  cloudWhite: '#F8FAFC',
  surface: '#0A1628',
  card: '#0D1F3C',

  // Text
  charcoal: '#1A1A1A',
  slate: '#475569',
  white: '#FFFFFF',

  // Shadows with colored tints
  shadowBlue: 'rgba(74,144,255,0.35)',
  shadowPink: 'rgba(255,107,157,0.35)',
  shadowOrange: 'rgba(255,107,53,0.35)',
  shadowGreen: 'rgba(0,200,83,0.35)',
  shadowPurple: 'rgba(155,89,182,0.35)',

  // Status
  success: '#00C853',
  warning: '#FFD93D',
  error: '#FF5252',
  info: '#4A90FF',
} as const;

export type CartoonColorName = keyof typeof CARTOON_COLORS;

/** Playful shadow presets with colored tints. */
export const CARTOON_SHADOWS = {
  sm: {
    shadowColor: CARTOON_COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: CARTOON_COLORS.shadowPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  lg: {
    shadowColor: CARTOON_COLORS.shadowOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
  xl: {
    shadowColor: CARTOON_COLORS.shadowPink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

/** Playful rounded corner presets. */
export const CARTOON_RADIUS = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

/** Bold, playful typography scale. */
export const CARTOON_TYPOGRAPHY = {
  hero: { fontSize: 40, fontWeight: '900' as const, letterSpacing: -0.5 },
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.3 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.2 },
  h3: { fontSize: 20, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
  button: { fontSize: 16, fontWeight: '900' as const },
} as const;

/** Animated gradient shift colors for hero backgrounds. */
export const ANIMATED_GRADIENTS = {
  shift1: ['#FF6B35', '#FF8C42', '#FFD93D', '#FF6B35'] as const,
  shift2: ['#4A90FF', '#9B59B6', '#FF6B9D', '#4A90FF'] as const,
  shift3: ['#00C853', '#6BCF7F', '#0EA5E9', '#00C853'] as const,
} as const;

/** Game-like XP and currency colors. */
export const GAME_COLORS = {
  xpBar: '#FFD93D',
  xpBarBg: '#1E3A62',
  coin: '#FFD700',
  gem: '#00FFFF',
  heart: '#FF5252',
  star: '#FFD93D',
  flame: '#FF6B35',
  streak: '#FF8C42',
} as const;

/** Helper to get a bright background color for cards. */
export const getCardBackground = (index: number = 0): string => {
  const colors = [
    '#4A90FF',
    '#FF6B9D',
    '#FFD93D',
    '#6BCF7F',
    '#9B59B6',
    '#FF8C42',
    '#00FFFF',
    '#FF5252',
  ];
  return colors[index % colors.length];
};

/** Helper to get a pastel tint for backgrounds. */
export const getPastelTint = (color: string, opacity: number = 0.15): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
