# SideQuest

A mobile app built with React Native + Expo (JavaScript), targeting iOS and Android.

## Prerequisites

- [Node.js](https://nodejs.org/) at least version 20.0.0
- [Expo Go](https://expo.dev/go) installed on your phone (or an iOS Simulator / Android Emulator)

## Getting started

Install dependencies:

```
npm install
```

Start the development server:

```
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` / `w` to open the iOS simulator, Android emulator, or web.

## Running on the iOS Simulator (Mac + Xcode 26)

1. Install Xcode from the App Store (Xcode 26 or later), open it once, and let it finish installing components.
2. Make sure the command line tools point at it:
   ```
   sudo xcode-select -s /Applications/Xcode.app
   ```
3. Open Xcode → **Settings → Platforms** and install an iOS Simulator runtime if none is listed.
4. From the project folder:

   ```
   npm install
   npx expo start
   ```

   then press `i`. Expo will download the Expo Go client into the simulator on first run and launch the app automatically.

   Equivalently, `npm run ios` does the same thing directly.

## Notes

This project targets Expo SDK 54, which matches the current App Store/Play Store release of Expo Go.
