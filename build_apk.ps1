# build_apk.ps1 - helper script to build Android APK for React Native projects on Windows
# Usage: Open PowerShell in project root and run: .\build_apk.ps1

$androidGradle = Join-Path -Path (Get-Location) -ChildPath "android\gradlew.bat"
$gradleUnix = Join-Path -Path (Get-Location) -ChildPath "android/gradlew"

function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Ok($msg){ Write-Host "[OK] $msg" -ForegroundColor Green }

if (Test-Path $androidGradle) {
    # Force JDK 17 for React Native 0.76+ compatibility
    $localJdk = "c:\livecircket\jdk17\jdk-17.0.18+8"
    if (Test-Path $localJdk) {
        $env:JAVA_HOME = $localJdk
        $env:Path = "$localJdk\bin;" + $env:Path
        Write-Ok "Setting JAVA_HOME to $localJdk"
    }

    Write-Ok "Found Android gradlew.bat. Running assembleRelease..."
    Push-Location android
    try {
        & .\gradlew.bat assembleRelease 2>&1 | Tee-Object -Variable output
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Gradle build failed. Exit code: $LASTEXITCODE"
            exit $LASTEXITCODE
        }
        Write-Ok "Gradle build finished. Locating APK..."
        $apkPath = Get-ChildItem -Path ".\app\build\outputs\apk\release\" -Filter *.apk -Recurse -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($apkPath) {
            $full = $apkPath.FullName
            Write-Ok "APK built: $full"
        } else {
            Write-Err "APK not found under android\app\build\outputs\apk\release\. Check the gradle output above." 
        }
    } finally {
        Pop-Location
    }
} elseif (Test-Path $gradleUnix) {
    Write-Ok "Found unix gradle wrapper (likely WSL). Running via WSL..."
    wsl ./android/gradlew assembleRelease
} else {
    Write-Err "No Android project found. If you don't have an android/ folder, initialize a React Native project or copy your existing android/ folder into this repo."
    Write-Host "Quick steps:" -ForegroundColor Yellow
    Write-Host "1) Install React Native CLI and Android SDK, Java 11+ and configure ANDROID_HOME/ANDROID_SDK_ROOT." -ForegroundColor Yellow
    Write-Host "2) From this repo, scaffold an app (if needed):" -ForegroundColor Yellow
    Write-Host "   npx react-native init MobileApp --directory ." -ForegroundColor Yellow
    Write-Host "3) Then run this script again: .\build_apk.ps1" -ForegroundColor Yellow
}

Write-Host "Done."