// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo SDK 54 enables package "exports" resolution by default. Some deps
// (e.g. zustand) expose an ESM build via the "import" condition that relies on
// `import.meta`, which the Hermes compiler cannot parse — this fails the
// production Android/iOS bundle. Disabling package-exports resolution makes
// Metro fall back to the classic `react-native`/`main` fields, which point to
// Hermes-compatible builds.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
