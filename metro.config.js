const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ignorer les modules Node.js
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  ws: require.resolve('react-native-websocket'),
};

module.exports = config;
