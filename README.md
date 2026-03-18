Cricket Live Line

Overview
- Mobile app (React Native) and server (Node.js) for real-time ball-by-ball cricket updates.

Quick start
1. Server
- Copy `.env.example` to `.env` and fill secrets if needed.
- Install dependencies and run server:

```
npm install
npm run start:server
```

2. Mobile app (React Native CLI)
- From project root run (android example):

```
npx react-native run-android
```

Notes
- Replace `SERVER_URL` in `src/components/LiveScoreCard.js` with your server host when running on device.
- Configure Firebase credentials in `src/context/AuthContext.js` or via environment.
- The server consumes RabbitMQ messages from the `score_updates` queue and forwards them to connected socket.io clients.

Building an Android APK (Windows)

Prerequisites:
- Java JDK 11+
- Android SDK & platform tools, `ANDROID_HOME` / `ANDROID_SDK_ROOT` set
- React Native CLI and project `android/` folder present

To build a release APK locally (uses Gradle wrapper):

```powershell
# from project root on Windows
.\build_apk.ps1
```

If you prefer the raw gradle command (inside `android/`):

```bash
cd android
./gradlew assembleRelease   # or gradlew.bat assembleRelease on Windows
```

Signed APK steps (short):
1. Create a keystore:

```bash
keytool -genkey -v -keystore release-key.jks -alias release -keyalg RSA -keysize 2048 -validity 10000
```

2. Put signing config in `android/app/build.gradle` and `gradle.properties` (see React Native docs).
3. Run `./gradlew assembleRelease` and find APK at `android/app/build/outputs/apk/release/app-release.apk`.

Troubleshooting:
- If `android/gradlew` is missing, initialize or copy an Android project into this repo. Use `npx react-native init` to scaffold.
- Ensure Java and Android SDK versions match React Native requirements.

CI (GitHub Actions) build to produce APK

I added a workflow at `.github/workflows/android-build.yml` that runs on `push` to `main` and via manual `workflow_dispatch`. When the workflow finishes it uploads the release APK as an artifact named `app-release-apk` which you can download from the Actions run.

To trigger the workflow:

1. Push your code to the `main` branch (or change the workflow `branches` filter).

```bash
git add .
git commit -m "Add Android CI build"
git push origin main
```

2. Open the Actions tab on GitHub, select `Android Release APK`, run the workflow manually or wait for the push to finish.

3. Download the artifact `app-release-apk` from the workflow run.

Notes:
- The workflow requires a valid `android/` folder with Gradle configured. If you don't have it, scaffold a React Native project or add your `android/` folder.
- For signing builds, add your keystore to GitHub Secrets and update the workflow to inject `gradle.properties` and keystore file before building.
