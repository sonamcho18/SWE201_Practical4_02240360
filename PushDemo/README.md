## PushDemo

This README covers the steps completed up to updating App.tsx for Expo push notifications.

### Prerequisites

- Node.js 20 LTS or newer
- npm (bundled with Node.js)
- Expo account (free)
- Android phone + USB cable (for testing push notifications)

### Step 1 - Install system tools

Explanation:

- `node -v` and `npm -v` confirm Node.js and npm are installed and working.
- `npm install -g eas-cli` installs the EAS CLI, which is required to register the project and generate the projectId.
- `eas --version` verifies the EAS CLI is available on your PATH.

### Step 2 - Create the Expo project

Explanation:

- `npx create-expo-app@latest PushDemo --template` scaffolds a new Expo app.
- Selecting "Blank (TypeScript)" gives a minimal project with TypeScript setup.
- `cd PushDemo` moves into the project folder.
- `npx expo start` starts the Metro bundler to confirm the project runs locally.

### Step 3 - Install required packages

npx expo install expo-notifications expo-device expo-constants


Explanation:

- `expo-notifications` provides the push notification API.
- `expo-device` checks whether the app is running on a real device.
- `expo-constants` reads the projectId from app.json at runtime.

### Step 4 - Create Expo account and initialize EAS


eas login
eas init


This adds `extra.eas.projectId` in app.json.

Explanation:

- `eas login` authenticates your Expo account so EAS can manage the project.
- `eas init` creates an EAS project and writes the `projectId` into app.json.
- The `projectId` is required to request an Expo push token at runtime.

### Step 6 - Update App.tsx

Replace App.tsx with the push notification demo code (registration, token display, local notification button, and listeners).

Explanation:

- The global notification handler controls how notifications display in foreground.
- Registration requests permission, sets Android channels, and fetches the Expo token.
- Listeners handle notifications received while open and taps on notifications.
- A local notification button verifies the notification UI without a backend.

### Screenshot

![Screenshot](image/screenshot2.jpeg)
