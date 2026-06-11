// Metro config for an Expo app inside an npm-workspaces monorepo.
// Dependencies are split between this app's node_modules and the hoisted
// root node_modules, and the workspace packages (@packetflow/*) live outside
// this folder — so Metro must watch the repo root and resolve from both
// node_modules trees. See https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (so changes in @packetflow/* are picked up).
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from the app first, then the hoisted root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. The workspace packages export raw .ts source via package "exports".
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
