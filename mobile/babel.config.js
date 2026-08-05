module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production' || process.env.EAS_BUILD === '1';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Strip all console.* calls in production/EAS builds
      ...(isProduction ? ['transform-remove-console'] : []),
    ],
  };
};
