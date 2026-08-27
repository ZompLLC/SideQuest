const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const reactHooks = require("eslint-plugin-react-hooks");

// 1. Strip the outdated bundled react-hooks plugin & rules out of expoConfig
const filteredExpoConfig = expoConfig.map((config) => {
  if (!config.plugins?.["react-hooks"]) {
    return config;
  }
  
  // Extract react-hooks out of plugins
  const { ["react-hooks"]: _, ...remainingPlugins } = config.plugins;
  
  // Filter out any rule starting with 'react-hooks/'
  const remainingRules = Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(([ruleName]) => !ruleName.startsWith("react-hooks/"))
  );
  
  return {
    ...config,
    plugins: remainingPlugins,
    rules: remainingRules,
  };
});

// 2. Export the final combined configuration
module.exports = defineConfig([
  ...filteredExpoConfig,
  // 3. Inject the modern flat configuration for react-hooks
  reactHooks.configs.flat.recommended,
  {
    // Apply your specific new rule adjustments here
    rules: {
      "react-hooks/set-state-in-effect": "error",
    },
  },
  {
    ignores: ["dist/**", ".expo/**", "node_modules/**"],
  },
]);
