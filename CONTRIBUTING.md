# Contributing

Thanks for helping improve zomp-zomp-zomp! This guide covers setting up your dev environment and the workflow for submitting changes.

## Table of Contents

1. [Prerequisites](#prerequisites)
    - [Downloads](#downloads)
    - [Project Setup](#project-setup)
        - [Running on iOS Simulator](#running-on-the-ios-simulator-mac--xcode-26)
2. [Contribution Workflow](#contribution-workflow)
    - [Pushing Changes](#pushing-changes)
    - [Open Pull Request](#open-a-pull-request)

## Prerequisites

### Downloads

- [Node.js](https://nodejs.org/) at least version 20.0.0
- [Expo Go](https://expo.dev/go) installed on your phone (or an iOS Simulator / Android Emulator)

### Project Setup

[FINISH SETUP ONCE WE GET FULLY OPERATIONAL FRONTEND AND BACKEND]


Install dependencies:

```
cd frontend
npm install
```

Start the expo server:

```
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` / `w` to open the iOS simulator, Android emulator, or web.

### Running on iOS Simulator (Mac + Xcode 26)

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

## Contribution Workflow

### Pushing Changes
Before starting new work, make sure your local `main` branch is up to date:

```bash
git checkout main
git pull origin main
```

Create a feature branch off `main` for your change.

```bash
git checkout -b feature/short-description
```

Edit, add, or remove files as needed. Check what's changed at any point with either:

```bash
git status
git diff
```

Stage your changes and commit them with a clear, descriptive message:

```bash
git add .
git commit -m "Add short, descriptive summary of the change"
```

Push your branch to the remote repository.
- If it's the first push of this branch, Git may show a suggested command with `-u` — use it so future pushes are simpler:
- If new changes have been added to 'main' since you started your feature branh, you will need to _rebaes_ your changes. (you may have to resolve merge conflicts).

```bash
git pull --rebase origin main
git push origin feature/short-description
```

### Open a Pull Request

1. Go to the repository on GitHub.
2. You should see a prompt to open a pull request for your recently pushed branch — click **Compare & pull request**. If not, go to the **Pull requests** tab and click **New pull request**.
3. Set the base branch to `main` and the compare branch to your feature branch.
4. Fill in:
   - **Title**: a concise summary of the change.
   - **Description**: what the change does, why it's needed, and any context reviewers should know (linked issues, screenshots, testing notes, etc.).
5. Click **Create pull request**.
6. If any changes need to be made, you can commit to the feature branch and the pull request will update directly.

### Cleaning Up

After the pull request is merged into main, clean up your changes and delete your local branch.

```bash
git checkout main
git pull origin main
git branch -d feature/short-description
```

---

If you run into any issues or have questions, feel free to open an issue or ask in the project's discussion channel.