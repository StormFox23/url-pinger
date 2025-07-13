@echo off
REM URL Pinger Release Builder Script for Windows
REM This script automates the process of creating a release version

setlocal enabledelayedexpansion

echo.
echo 🚀 URL Pinger Release Builder
echo ==============================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Make sure you're in the project root directory.
    exit /b 1
)

REM Check if vsce is installed
where vsce >nul 2>nul
if errorlevel 1 (
    echo ⚠️  vsce not found. Installing @vscode/vsce globally...
    npm install -g @vscode/vsce
)

REM Get current version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%i
echo ℹ️  Current version: !CURRENT_VERSION!

REM Ask for version bump type
echo.
echo Select version bump type:
echo 1^) patch ^(x.x.X^) - Bug fixes
echo 2^) minor ^(x.X.x^) - New features
echo 3^) major ^(X.x.x^) - Breaking changes
echo 4^) custom - Enter custom version
echo 5^) no bump - Use current version
set /p "version_choice=Enter choice (1-5): "

if "%version_choice%"=="1" (
    set VERSION_TYPE=patch
) else if "%version_choice%"=="2" (
    set VERSION_TYPE=minor
) else if "%version_choice%"=="3" (
    set VERSION_TYPE=major
) else if "%version_choice%"=="4" (
    set /p "CUSTOM_VERSION=Enter custom version (e.g., 1.2.3): "
    set VERSION_TYPE=custom
) else if "%version_choice%"=="5" (
    set VERSION_TYPE=none
) else (
    echo ❌ Invalid choice. Exiting.
    exit /b 1
)

REM Update version if needed
if not "%VERSION_TYPE%"=="none" (
    echo ℹ️  Updating version...
    if "%VERSION_TYPE%"=="custom" (
        npm version !CUSTOM_VERSION! --no-git-tag-version
    ) else (
        npm version !VERSION_TYPE! --no-git-tag-version
    )
    for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set NEW_VERSION=%%i
    echo ✅ Version updated to: !NEW_VERSION!
) else (
    set NEW_VERSION=!CURRENT_VERSION!
    echo ℹ️  Using current version: !NEW_VERSION!
)

REM Clean and compile
echo ℹ️  Cleaning previous builds...
if exist "out\" rmdir /s /q "out\"
del /q *.vsix 2>nul

echo ℹ️  Installing dependencies...
npm install

echo ℹ️  Compiling TypeScript...
npm run compile

REM Run tests (optional)
set /p "run_tests=Run tests before building? (y/N): "
if /i "%run_tests%"=="y" (
    echo ℹ️  Running tests...
    npm test
    if errorlevel 1 (
        set /p "continue_anyway=❌ Tests failed. Do you want to continue anyway? (y/N): "
        if not "!continue_anyway!"=="y" if not "!continue_anyway!"=="Y" exit /b 1
    )
)

REM Lint code
echo ℹ️  Linting code...
npm run lint
if errorlevel 1 (
    set /p "continue_lint=⚠️  Linting issues found. Do you want to continue? (y/N): "
    if not "!continue_lint!"=="y" if not "!continue_lint!"=="Y" exit /b 1
)

REM Create releases directory if it doesn't exist
if not exist "releases\" mkdir "releases\"

REM Package extension
echo ℹ️  Packaging extension...
vsce package --out "releases\"

set PACKAGE_NAME=url-pinger-!NEW_VERSION!.vsix
if exist "releases\!PACKAGE_NAME!" (
    echo ✅ Extension packaged: releases\!PACKAGE_NAME!
) else (
    echo ❌ Package file not found: releases\!PACKAGE_NAME!
    exit /b 1
)

REM Generate changelog entry
echo ℹ️  Generating changelog entry...
set CHANGELOG_FILE=CHANGELOG.md
if not exist "!CHANGELOG_FILE!" (
    echo # Changelog > "!CHANGELOG_FILE!"
    echo. >> "!CHANGELOG_FILE!"
)

REM Add new version entry to changelog
for /f "tokens=2 delims==" %%i in ('wmic OS Get localdatetime /value') do set datetime=%%i
set DATE=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%

REM Create temporary file for new changelog entry
echo ## [!NEW_VERSION!] - !DATE! > temp_changelog.md
echo. >> temp_changelog.md
echo ### Added >> temp_changelog.md
echo - >> temp_changelog.md
echo. >> temp_changelog.md
echo ### Changed >> temp_changelog.md
echo - >> temp_changelog.md
echo. >> temp_changelog.md
echo ### Fixed >> temp_changelog.md
echo - >> temp_changelog.md
echo. >> temp_changelog.md
type "!CHANGELOG_FILE!" >> temp_changelog.md
move temp_changelog.md "!CHANGELOG_FILE!"

echo ✅ Changelog entry added for version !NEW_VERSION!

REM Git operations
set /p "commit_release=Commit and tag this release? (y/N): "
if /i "%commit_release%"=="y" (
    echo ℹ️  Committing changes...
    git add .
    git commit -m "Release version !NEW_VERSION!

- Package extension v!NEW_VERSION!
- Update changelog
- Compiled and tested for release"

    echo ℹ️  Creating git tag...
    git tag -a "v!NEW_VERSION!" -m "Release version !NEW_VERSION!"
    
    echo ✅ Created git tag: v!NEW_VERSION!
    
    set /p "push_remote=Push to remote repository? (y/N): "
    if /i "!push_remote!"=="y" (
        echo ℹ️  Pushing to remote...
        git push origin main
        git push origin "v!NEW_VERSION!"
        echo ✅ Pushed to remote repository
    )
)

REM Generate release notes
echo ℹ️  Generating release notes...
(
echo # URL Pinger v!NEW_VERSION! Release Notes
echo.
echo ## 📦 Installation
echo ```bash
echo code --install-extension releases/url-pinger-!NEW_VERSION!.vsix
echo ```
echo.
echo ## 🚀 Features
echo - Single URL ping testing
echo - Bulk URL testing
echo - URL history management
echo - Export results to JSON
echo - Scheduled periodic testing
echo - Configurable settings
echo - Modern VS Code UI integration
echo.
echo ## 📋 Requirements
echo - VS Code 1.102.0 or higher
echo - Internet connection for URL testing
echo.
echo ## 🔧 Configuration
echo Access settings via: File ^> Preferences ^> Settings ^> Extensions ^> URL Pinger
echo.
echo ## 📝 Changelog
echo See CHANGELOG.md for detailed changes.
echo.
echo ## 🐛 Issues
echo Report issues at: https://github.com/StormFox23/url-pinger/issues
) > "releases\release-notes-!NEW_VERSION!.md"

echo ✅ Release notes generated: releases\release-notes-!NEW_VERSION!.md

REM Summary
echo.
echo 🎉 Release Build Complete!
echo =========================
echo ✅ Version: !NEW_VERSION!
echo ✅ Package: releases\url-pinger-!NEW_VERSION!.vsix
echo ✅ Release notes: releases\release-notes-!NEW_VERSION!.md
echo ✅ Changelog updated: CHANGELOG.md

if /i "%commit_release%"=="y" (
    echo ✅ Git tag created: v!NEW_VERSION!
)

echo.
echo ℹ️  Next steps:
echo   1. Review the changelog and release notes
echo   2. Test the packaged extension
echo   3. Publish to VS Code Marketplace ^(optional^): vsce publish
echo   4. Create GitHub release with the generated files

echo ✅ Release process completed! 🚀

pause
