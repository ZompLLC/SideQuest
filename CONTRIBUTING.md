# Contributing

Thanks for helping improve zomp-zomp-zomp! This guide covers setting up your dev environment and the workflow for submitting changes.

## Table of Contents

1. [Prerequisites](#prerequisites)
   - [Downloads](#downloads)
   - [Project Setup](#project-setup)
     - [Running on iOS Simulator](#running-on-the-ios-simulator-mac--xcode-26)
   - [Backend Setup](#backend-setup)
     - [Setting Up Postgres Locally](#setting-up-postgres-locally)
     - [Running the Backend Server](#running-the-backend-server)
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

### Backend Setup

The backend lives in `backend/` and talks to a local Postgres database, so that needs to be running before you start the server.

#### Setting Up Postgres Locally

Pick whichever you're most comfortable with:

**Mac**

- **[Postgres.app](https://postgresapp.com/)** (easiest to get going): download it, open it, and click **Initialize** to create a default server. It listens on port `5432` and auto-creates a role + database matching your Mac username, no password required.

  To use `psql` and other CLI tools from the terminal, click the elephant icon in the menu bar → **Command Line Tools...** and follow the prompt. This adds Postgres.app's `bin` directory to your `PATH`.

  Once installed, you can start/stop/check the server from the terminal instead of the app window:

  ```bash
  pg_ctl start -D "$HOME/Library/Application Support/Postgres/var-<version>" -l "$HOME/Library/Application Support/Postgres/var-<version>/server.log"
  pg_ctl stop -D "$HOME/Library/Application Support/Postgres/var-<version>"
  pg_ctl status -D "$HOME/Library/Application Support/Postgres/var-<version>"
  ```

  (replace `<version>` with whatever's under `~/Library/Application Support/Postgres/`, e.g. `var-18`)

- **[Homebrew](https://brew.sh/)**: fully CLI-managed, runs in the background via `launchd`, no app required at all.

  ```bash
  brew install postgresql@16
  brew services start postgresql@16
  ```

**Windows**

- **[Native installer](https://www.postgresql.org/download/windows/)** (the EDB installer, easiest if you don't want WSL): download and run it. It installs Postgres as a Windows Service (starts automatically on boot/login — check **Services** in the Start menu if you need to start/stop/restart it manually) and includes `psql`/`createdb` plus the pgAdmin GUI. During setup you'll set a password for the default `postgres` user — remember it, you'll need it for `.env.development` below.

  Add `psql` to your PATH if the installer didn't (Command Prompt/PowerShell):

  ```powershell
  setx PATH "%PATH%;C:\Program Files\PostgreSQL\<version>\bin"
  ```

  (open a new terminal window afterward for it to take effect)

- **[WSL2](https://learn.microsoft.com/windows/wsl/install)**, if you'd rather work in a Linux environment: once inside your WSL2 distro, follow the Linux instructions for your distro's package manager, e.g. on Ubuntu/Debian:

  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo service postgresql start
  ```

**Any OS — Docker**

- If you'd rather not install Postgres directly on your machine (works the same on Mac, Windows, and Linux — requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Mac/Windows):

  ```bash
  docker run --name sidequest-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
  ```

Once your server is running, create a database for the project (skip this if you're using Postgres.app's default database, which is named after your username):

```bash
createdb sidequest
```

(on Windows with the native installer, run this from a terminal where `psql`'s `bin` directory is on `PATH`, or use pgAdmin's GUI to create a database instead)

#### Running the Backend Server

Install dependencies:

```bash
cd backend
npm install
```

Copy the example environment file and fill in your local Postgres connection details:

```bash
cp .env.development.example .env.development
```

(on Windows Command Prompt, use `copy .env.development.example .env.development` instead — `cp` works as-is in PowerShell, WSL, or Git Bash)

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=<your database name>
DATABASE_USER=<your postgres user>
DATABASE_PASSWORD=<your postgres password, blank if none>
```

Run the database migrations to create the schema (this only needs to be re-run when new migrations are added):

```bash
npm run migrate -- up
```

Start the dev server:

```bash
npm run dev
```

You should see `Server listening at http://localhost:3000`. Verify it's up:

```bash
curl http://localhost:3000/status
```

If the server fails to start with a database connection error, double check your `.env.development` values match your local Postgres setup and that the server is actually running (`pg_isready`).

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
