export const PHI_COLORS = {
  royalBlue: '#0057FF',
  sunshineYellow: '#FFD93D',
  charcoalBlack: '#1A1A1A',
  moneyGreen: '#00C853',
  white: '#FFFFFF',
  surface: '#0A1628',
  card: '#0D1F3C',
} as const;

export type PHIColorName = keyof typeof PHI_COLORS;

/** Gamified "tycoon" palette layered on top of PHI_COLORS for splash/marketing-style screens. */
export const TYCOON_COLORS = {
  skyTop: '#0B1B3D',
  skyBottom: '#1A4FFF',
  skyDaylight: '#3D7CFF',
  gold: '#FFD700',
  goldDeep: '#FFA500',
  goldShadow: '#B8780A',
  goldHighlight: '#FFF3B0',
  moneyGreen: '#3CCB6A',
  moneyGreenDeep: '#1F9E4E',
  moneyGreenShadow: '#127A3A',
  blueButton: '#2F6BFF',
  blueButtonShadow: '#163C99',
  neonPink: '#FF1493',
  neonCyan: '#00FFFF',
  nightTop: '#05030F',
  nightMid: '#140A30',
  nightBottom: '#1E0B3D',
  ribbonNavy: '#0E2466',
  ribbonTrim: '#FFD700',
  ribbonShadow: '#081636',
} as const;

export type TycoonColorName = keyof typeof TYCOON_COLORS;
