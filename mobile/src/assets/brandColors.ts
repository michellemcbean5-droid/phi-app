export const PHI_COLORS = {
  // Primary colors
  royalBlue: '#0057FF',
  sunshineYellow: '#FFD93D',
  charcoalBlack: '#1A1A1A',
  moneyGreen: '#00C853',
  
  // Background colors
  background: '#0f3460',
  surface: '#ffffff',
  surfaceDark: '#16213e',
  surfaceDarker: '#0a192f',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#D7E3FF',
  textTertiary: '#aaa',
  textDark: '#1A1A1A',
  
  // Status colors
  success: '#00C853',
  warning: '#FFD93D',
  error: '#e94560',
  info: '#0057FF',
  
  // Border colors
  borderLight: '#1B4BCC',
  borderDark: '#0a192f',
  
  // Gradient colors
  gradientStart: '#0057FF',
  gradientEnd: '#1B4BCC',
  
  // Utility colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Opacity variants
  royalBlue80: 'rgba(0, 87, 255, 0.8)',
  royalBlue60: 'rgba(0, 87, 255, 0.6)',
  royalBlue40: 'rgba(0, 87, 255, 0.4)',
  royalBlue20: 'rgba(0, 87, 255, 0.2)',
  
  // Navy colors for web
  navy: '#0a1428',
  navyLight: '#1a1f3a',
  navyMid: '#16213e',
  
  // Gold colors
  gold: '#d4a017',
  goldLight: '#f4c430',
  
  // Foreground colors
  foreground: '#e8e8e8',
  foregroundMuted: '#a0a0a0',
} as const;

export type PHIColorKey = keyof typeof PHI_COLORS;

export const getColor = (key: PHIColorKey): string => PHI_COLORS[key];
