// Test-only stand-in for expo-constants.
// expo-constants -> expo-modules-core resolves to raw TypeScript sources
// that Node/Vitest cannot execute. Tests rely on process.env fallbacks,
// so `extra` is empty and `version` matches app.json.

const Constants = {
  expoConfig: {
    extra: {} as Record<string, unknown>,
    version: '1.0.0',
  },
};

export default Constants;
