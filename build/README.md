# Release Builder Instructions

This directory contains automated release building tools for the URL Pinger VS Code extension.

## Available Build Scripts

### 1. Cross-Platform Node.js Builder (Recommended)

**File:** `build-release.js`

- Modern, interactive Node.js script
- Cross-platform compatibility
- Colored output and user prompts
- Automated dependency management

#### Installation

```bash
cd build
npm install
```

#### Usage Options

```bash
# Interactive mode (recommended)
npm run build:release

# Command line options
npm run build:release:patch    # Bump patch version
npm run build:release:minor    # Bump minor version
npm run build:release:major    # Bump major version
npm run build:release:no-bump  # Use current version

# Advanced usage
node ../build-release.js --version=patch --skip-tests --no-git
```

### 2. Windows Batch Script

**File:** `build-release.bat`

- Native Windows batch script
- No additional dependencies required
- Interactive prompts

#### Windows Usage

```cmd
build-release.bat
```

### 3. Unix/Linux/macOS Shell Script

**File:** `build-release.sh`

- Bash shell script for Unix-like systems
- No additional dependencies required
- Interactive prompts

#### Unix Usage

```bash
chmod +x build-release.sh
./build-release.sh
```

## What the Release Builder Does

1. **Version Management**
   - Prompts for version bump type (patch/minor/major/custom/none)
   - Updates `package.json` version
   - Creates git tags

2. **Code Quality Checks**
   - Runs TypeScript compilation
   - Optional testing
   - Optional linting

3. **Packaging**
   - Creates `.vsix` extension package
   - Stores in `releases/` directory

4. **Documentation**
   - Updates `CHANGELOG.md`
   - Generates release notes
   - Creates installation instructions

5. **Git Integration**
   - Commits changes
   - Creates version tags
   - Pushes to remote repository

## Release Artifacts

After running the release builder, you'll find:

```text
releases/
├── url-pinger-X.X.X.vsix           # Extension package
└── release-notes-X.X.X.md          # Release documentation
```

## Publishing to VS Code Marketplace

After building a release:

1. **Test the extension locally:**

   ```bash
   code --install-extension releases/url-pinger-X.X.X.vsix
   ```

2. **Publish to marketplace:**

   ```bash
   vsce publish
   ```

3. **Create GitHub release:**
   - Go to your repository on GitHub
   - Create a new release using the generated tag
   - Upload the `.vsix` file and release notes

## Configuration Options

The Node.js builder supports command-line flags:

- `--version=<type>`: Version bump type (patch/minor/major/custom/none)
- `--skip-tests`: Skip running tests
- `--skip-lint`: Skip linting
- `--no-git`: Skip git operations
- `--interactive`: Force interactive mode

## Troubleshooting

### Common Issues

1. **vsce not found**
   - The script will automatically install `@vscode/vsce` globally

2. **Git not configured**
   - Ensure git is installed and configured
   - Set up your git user name and email

3. **Tests failing**
   - The script will prompt to continue anyway
   - Fix tests or use `--skip-tests` flag

4. **Permission denied (Unix/Linux/macOS)**

   ```bash
   chmod +x build-release.sh
   ```

### Requirements

- Node.js (for the JavaScript builder)
- npm
- Git
- VS Code (for testing)

## Example Workflow

```bash
# 1. Install dependencies (first time only)
cd build
npm install

# 2. Run release builder
npm run build:release

# 3. Follow the interactive prompts
# - Select version bump type
# - Choose whether to run tests
# - Decide on git operations

# 4. Test the generated package
code --install-extension releases/url-pinger-X.X.X.vsix

# 5. Publish if everything looks good
vsce publish
```

## Customization

You can modify the release builder scripts to:

- Add custom build steps
- Integrate with CI/CD systems
- Add additional quality checks
- Customize release notes format
- Integrate with different version control systems

The Node.js version (`build-release.js`) is the most flexible and easiest to customize.
