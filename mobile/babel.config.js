module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Reanimated to work with the new JSX transform
      'react-native-reanimated/plugin',
      // Required for @react-navigation/native
      ['react-native-paper/babel'],
    ],
  };
};
