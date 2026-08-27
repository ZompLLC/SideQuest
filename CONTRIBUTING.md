# Contributing

Thanks for helping to improve SideQuest! This guide covers setting up your dev environment and the workflow for submitting changes.

## Table of Contents

1. [Downloads](#downloads)
2. [Setup](#setup)
3. [Running the App](#running-the-app)
   - [Run Locally](#run-locally)
   - [Run with Docker](#run-with-docker)
   - [Helpful Commands](#helpful-commands)
4. [Contribution Workflow](#contribution-workflow)
   - [Pushing Changes](#pushing-changes)
   - [Open a Pull Request](#open-a-pull-request)
   - [Cleaning Up](#cleaning-up)

## Downloads

- [Node.js](https://nodejs.org/) v20.0.0 or up
- [Expo Go](https://expo.dev/go) v54.0.0 (App Store) — or an iOS Simulator / Android Emulator
- [Postgres](#setting-up-postgres) / [Docker](https://www.docker.com/products/docker-desktop/) — for running the backend locally or in a container
- [Postman](https://www.postman.com/downloads/) — or any other platform to test APIs

## Setup

### Depedencies

Run `npm run install:all` in the main directory to download dependencies for both the backend and frontend.

### Environment Files

Copy the example .env files for both the backend and frontend and fill in your connection details.

```bash
cp .env.example .env
```

(on Windows Command Prompt, use `copy .env.example .env` instead — `cp` works as-is in PowerShell, WSL, or Git Bash)

### iOS Simulator Setup (Mac Only)

1. Install Xcode from the App Store (Xcode 26 or later), open it once, and let it finish installing components.
2. Point the command line tools at it:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app
   ```
3. Open Xcode → **Settings → Platforms** and install an iOS Simulator runtime if none is listed.
4. From the project folder:

   ```bash
   npm run install:all
   npm run sidequest
   ```

   then press `i`. Expo will download the Expo Go client into the simulator on first run and launch the app automatically.

   Equivalently, `npm run ios` does the same thing directly.

   **[TODO (needs verifying from an iOS simulator user): pressing `i` may not work with `npm run sidequest` since it hijacks keyboard input — may need a dedicated `ios` script in the root package.json instead.]**

## Running the App

### Run Locally

Postgres (pgAdmin 4) needs to be running before you run the app locally.

#### Setting Up Postgres

Pick whichever you're most comfortable with. If you don't have a password (common case on Mac with Postgres.app/Homebrew), leave `DATABASE_PASSWORD` blank and remove the `:<DATABASE_PASSWORD>` part of `DATABASE_URL` in your env files.

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

Once your server is running, create a database for the project (skip this if you're using Postgres.app's default database, which is named after your username):

```bash
createdb sidequest
```

(on Windows with the native installer, run this from a terminal where `psql`'s `bin` directory is on `PATH`, or use pgAdmin's GUI to create a database instead)

#### Running the App

Run the database migrations to create the schema (this only needs to be re-run when new migrations are added):

```bash
npm run migrate
```

Then start whichever piece you need:

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run backend`   | Starts the backend API server only       |
| `npm run frontend`  | Starts the Expo dev server only          |
| `npm run sidequest` | Starts the backend and frontend together |

### Run with Docker

The project can be run fully containerized using Docker Compose, orchestrated through npm scripts defined in the root `package.json`. Ensure that Docker Desktop is installed and running.

**Commands**

| Command                   | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `npm run up`              | Builds (if needed) and starts all services in the foreground          |
| `npm run down`            | Stops and removes all running containers                              |
| `npm run attach:backend`  | Attaches to the running backend container's shell/logs for debugging  |
| `npm run attach:frontend` | Attaches to the running frontend container's shell/logs for debugging |

### Helpful Commands

Commands below work whether you're running locally or with Docker, unless noted.

| Command           | Description                               |
| ----------------- | ----------------------------------------- |
| `npm run migrate` | Applies pending database migrations       |
| `npm run test`    | Runs unit and integration tests           |
| `npm run lint`    | Runs linter for both backend and frontend |

## Contribution Workflow

### Pushing Changes

Before starting new work, make sure your local `main` branch is up to date:

```bash
git checkout main
git pull origin main
```

Create a feature branch off `main` for your change:

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

Push your branch to the remote repository:

```bash
git push origin feature/short-description
```

- If it's the first push of this branch, Git will show a suggested command with `-u` in the output — use that instead so future pushes are simpler (`git push -u origin feature/short-description`).
- If new commits have landed on `main` since you started your feature branch, rebase before pushing so your branch stays current:
  ```bash
  git pull --rebase origin main
  ```
  You may need to resolve merge conflicts during the rebase.

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

After the pull request is merged into main, clean up your changes and delete your local branch:

```bash
git checkout main
git pull origin main
git branch -d feature/short-description
```

---

If you run into any issues or have questions, feel free to open an issue or ask in the project's discussion channel.
