const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports for modern library compatibility (like copy-anything)
config.resolver.unstable_enablePackageExports = true;

// Add extra resolver aliases if needed
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "copy-anything": __dirname + "/node_modules/copy-anything/dist/index.js",
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
