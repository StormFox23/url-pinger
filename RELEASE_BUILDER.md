# URL Pinger Release Builder

Automated release building system for the URL Pinger VS Code extension. This toolset provides multiple ways to create, package, and publish releases of your extension.

## Quick Start

### Option 1: Node.js Builder (Recommended)

```bash
# Install dependencies (one time)
npm install

# Interactive release builder
npm run build:release

# Or use specific version bumps
npm run build:release:patch    # 0.1.0 → 0.1.1
npm run build:release:minor    # 0.1.0 → 0.2.0
npm run build:release:major    # 0.1.0 → 1.0.0
```

### Option 2: Platform-Specific Scripts

**Windows:**

```cmd
build-release.bat
```

**Unix/Linux/macOS:**

```bash
chmod +x build-release.sh
./build-release.sh
```

### Option 3: Makefile (if you have make installed)

```bash
make release         # Interactive release
make release-patch   # Patch version bump
make release-minor   # Minor version bump
make release-major   # Major version bump
make package         # Package without version bump
```

### Option 4: GitHub Actions (Automated Cloud Builds)

**Automatic Release on Tag Push:**

```bash
git tag v0.2.0 && git push origin v0.2.0
```

**Manual Release via GitHub UI:**

1. Go to GitHub → Actions → Release workflow
2. Click "Run workflow"
3. Select version type and run
4. Download the built .vsix from the release page

## What Gets Created

After running the release builder:

```text
releases/
├── url-pinger-X.X.X.vsix           # Extension package
└── release-notes-X.X.X.md          # Release documentation

CHANGELOG.md                        # Updated with new version
package.json                        # Version updated
```

## Features

- **🔄 Automated Versioning**: Supports semantic versioning (patch/minor/major/custom)
- **🧪 Quality Checks**: Optional testing and linting before release
- **📦 Packaging**: Creates VS Code extension (.vsix) packages
- **📝 Documentation**: Auto-generates release notes and changelog entries
- **🔧 Git Integration**: Creates commits and tags for releases
- **🚀 Publishing**: Optional VS Code Marketplace publishing
- **⚡ Multiple Interfaces**: Node.js script, batch file, shell script, or makefile

## GitHub Actions Integration

### Automated Release Workflow

The project includes a comprehensive GitHub Actions workflow (`.github/workflows/release.yml`) that provides **downloadable releases** with multiple trigger options:

#### **Method 1: Tag-Based Releases (Automatic)**

```bash
# Create and push a version tag to trigger automatic release
git tag v0.2.0
git push origin v0.2.0
```

#### **Method 2: Manual Workflow Dispatch**

1. Go to your GitHub repository → **Actions** tab
2. Select **"Release"** workflow
3. Click **"Run workflow"** button
4. Choose version bump type: `patch` | `minor` | `major` | `custom`
5. Click **"Run workflow"** to start the build

### What the GitHub Action Creates

The workflow automatically generates **downloadable release assets**:

📦 **Release Artifacts**:

- `url-pinger-X.X.X.vsix` - Ready-to-install VS Code extension
- `release-notes-X.X.X.md` - Detailed release documentation
- Updated `CHANGELOG.md` - Version history

🔗 **Download Locations**:

- **GitHub Releases**: `https://github.com/StormFox23/url-pinger/releases`
- **Direct Download**: Each release includes the .vsix file as a downloadable asset
- **Workflow Artifacts**: Available in Actions tab (90-day retention)

### Workflow Features

- ✅ **Automatic Building**: Compiles TypeScript and packages extension
- ✅ **Version Management**: Handles semantic versioning automatically
- ✅ **GitHub Release Creation**: Creates public release with download links
- ✅ **Asset Upload**: Attaches .vsix file for direct download
- ✅ **Release Notes**: Auto-generates installation and usage instructions
- ✅ **Marketplace Publishing**: Optional automatic VS Code Marketplace deployment
- ✅ **Git Integration**: Creates tags and commits automatically

### Installation from GitHub Release

Users can install directly from GitHub releases:

```bash
# Download the .vsix file from GitHub releases, then:
code --install-extension path/to/url-pinger-X.X.X.vsix
```

### Marketplace Publishing Setup

To enable automatic VS Code Marketplace publishing:

1. Get a **Personal Access Token** from [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. Add it as a GitHub secret named `VSCE_PAT` in your repository settings
3. The workflow will automatically publish to the marketplace on releases

## Configuration

The release builder reads from `package.json` and respects:

- Current version number
- Extension metadata
- Dependencies and scripts

## Requirements

- Node.js (for the JavaScript builder)
- npm
- Git
- VS Code (for testing)
- `@vscode/vsce` (installed automatically)

## Advanced Usage

### Command Line Options (Node.js builder)

```bash
node build-release.js [options]

Options:
  --version=<type>     Version bump: patch|minor|major|custom|none
  --skip-tests         Skip running tests
  --skip-lint          Skip linting
  --no-git             Skip git operations
  --interactive        Force interactive mode
```

### Custom Version

```bash
# Using npm script
npm run build:release:custom

# Or directly
node build-release.js --version=custom
# Then enter your custom version when prompted
```

### CI/CD Integration

For automated releases in CI/CD:

```bash
# Non-interactive release
node build-release.js --version=patch --skip-tests --no-git
```

## Troubleshooting

### vsce not found

The script automatically installs `@vscode/vsce` globally.

### Permission errors on Unix/Linux/macOS

```bash
chmod +x build-release.sh
```

### Tests failing

The builder will prompt whether to continue or you can use `--skip-tests`.

### Git not configured

Ensure git is properly configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Publishing to VS Code Marketplace

1. **Get a Publisher Account**: Visit [VS Code Marketplace](https://marketplace.visualstudio.com/manage)
2. **Generate Personal Access Token**: Create a PAT with Marketplace scope
3. **Login to vsce**: `vsce login <publisher-name>`
4. **Publish**: `vsce publish` or let the builder do it automatically

For GitHub Actions publishing, add your PAT as a secret named `VSCE_PAT`.

## Next Steps

After creating a release:

1. 📝 Review and edit the generated changelog
2. 🧪 Test the packaged extension locally
3. 📋 Update release notes if needed
4. 🚀 Publish to VS Code Marketplace
5. 📱 Create GitHub release page
6. 📢 Announce the release

## Support

If you encounter issues with the release builder, check:

1. All dependencies are installed
2. You're in the project root directory
3. `package.json` exists and is valid
4. Git is properly configured
5. You have necessary permissions

The Node.js builder provides the most detailed error messages and is recommended for troubleshooting.
