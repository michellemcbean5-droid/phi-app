// Metro config — stubs native-only modules when bundling for WEB only.
// Android/iOS resolution is completely unaffected. Enables `expo start --web`
// previews and consumer testing in a browser.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Prefer classic package "main" resolution so Hermes never sees ESM builds that
// use import.meta (e.g. some zustand distributions under package exports).
config.resolver.unstable_enablePackageExports = false;

const NATIVE_ONLY = [
  'react-native-google-mobile-ads',
  'react-native-purchases',
  '@stripe/stripe-react-native',
  'react-native-iap',
  '@sentry/react-native',
];

const stubPath = path.resolve(__dirname, 'web-stubs/nativeOnly.js');
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    NATIVE_ONLY.some((m) => moduleName === m || moduleName.startsWith(m + '/'))
  ) {
    return { type: 'sourceFile', filePath: stubPath };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
