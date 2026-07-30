// Test-only stand-in for the `react-native` package.
// The real package ships Flow-typed ESM sources that Node/Vitest cannot parse.
// Only the surface used by modules under test is provided.

export const Platform = {
  OS: 'android' as 'ios' | 'android',
  select<T>(spec: { ios?: T; android?: T; default: T }): T {
    return spec.android ?? spec.default;
  },
};

export const Alert = {
  alert: (_title: string, _message?: string, _buttons?: unknown[]): void => {},
};

export const StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    return styles;
  },
};

export const Dimensions = {
  get: (_dim: 'window' | 'screen') => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
};
