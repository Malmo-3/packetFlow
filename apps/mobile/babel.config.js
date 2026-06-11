module.exports = function (api) {
  api.cache(true);
  return {
    // The shared @packetflow/backend-client uses `import.meta` (for Vite on web).
    // Hermes can't parse that syntax natively, so enable Expo's transform.
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
