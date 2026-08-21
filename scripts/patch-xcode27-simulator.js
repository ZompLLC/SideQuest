#!/usr/bin/env node
// Xcode 27 renamed Simulator.app to DeviceHub.app (bundle id com.apple.dt.Devices).
// @expo/cli hardcodes lookups for the old name in a few places; this patches the
// installed copy after every `npm install` so `expo start` / `expo run:ios` work.
// Safe to remove once @expo/cli ships official support for the new app name.
const fs = require('fs');
const path = require('path');

const cliDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src'
);

function patch(relPath, replacements) {
  const file = path.join(cliDir, relPath);
  if (!fs.existsSync(file)) {
    console.warn(`[patch-xcode27-simulator] skip (not found): ${relPath}`);
    return;
  }
  let contents = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const { find, replace, alreadyAppliedIf } of replacements) {
    if (contents.includes(alreadyAppliedIf)) continue;
    if (!contents.includes(find)) {
      console.warn(`[patch-xcode27-simulator] pattern not found in ${relPath}, skipping (upstream may have changed)`);
      continue;
    }
    contents = contents.replace(find, replace);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(file, contents);
    console.log(`[patch-xcode27-simulator] patched ${relPath}`);
  }
}

patch('start/doctor/apple/SimulatorAppPrerequisite.js', [
  {
    find: `if (result !== 'com.apple.iphonesimulator' && result !== 'com.apple.CoreSimulator.SimulatorTrampoline') {`,
    replace: `if (result !== 'com.apple.iphonesimulator' && result !== 'com.apple.CoreSimulator.SimulatorTrampoline' && result !== 'com.apple.dt.Devices') {`,
    alreadyAppliedIf: `com.apple.dt.Devices`,
  },
]);

patch('start/platforms/ios/ensureSimulatorAppRunning.js', [
  {
    find: `const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "Simulator"')).trim();`,
    replace: `const zeroMeansNo = (await _osascript().execAsync('tell app "System Events" to count processes whose name is "Simulator" or name is "DeviceHub"')).trim();`,
    alreadyAppliedIf: `or name is "DeviceHub"`,
  },
  {
    find: `    await (0, _spawnasync().default)('open', args);
}`,
    replace: `    try {
        await (0, _spawnasync().default)('open', args);
    } catch (error) {
        // Xcode 27 renamed Simulator.app to DeviceHub.app; fall back to opening it by path.
        await (0, _spawnasync().default)('open', [
            '/Applications/Xcode.app/Contents/Applications/DeviceHub.app',
            ...args.slice(2)
        ]);
    }
}`,
    alreadyAppliedIf: `DeviceHub.app`,
  },
]);

patch('start/platforms/ios/AppleDeviceManager.js', [
  {
    find: `        await _osascript().execAsync(\`tell application "Simulator" to activate\`);
    }`,
    replace: `        try {
            await _osascript().execAsync(\`tell application "Simulator" to activate\`);
        } catch (error) {
            // Xcode 27 renamed Simulator.app to DeviceHub.app.
            await _osascript().execAsync(\`tell application "DeviceHub" to activate\`);
        }
    }`,
    alreadyAppliedIf: `tell application "DeviceHub" to activate`,
  },
]);
