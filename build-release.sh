#!/bin/bash

# URL Pinger Release Builder Script
# This script automates the process of creating a release version

set -e  # Exit on any error

echo "🚀 URL Pinger Release Builder"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    print_warning "vsce not found. Installing @vscode/vsce globally..."
    npm install -g @vscode/vsce
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Ask for version bump type
echo ""
echo "Select version bump type:"
echo "1) patch (x.x.X) - Bug fixes"
echo "2) minor (x.X.x) - New features"
echo "3) major (X.x.x) - Breaking changes"
echo "4) custom - Enter custom version"
echo "5) no bump - Use current version"
read -p "Enter choice (1-5): " version_choice

case $version_choice in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        read -p "Enter custom version (e.g., 1.2.3): " CUSTOM_VERSION
        VERSION_TYPE="custom"
        ;;
    5)
        VERSION_TYPE="none"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Update version if needed
if [ "$VERSION_TYPE" != "none" ]; then
    print_info "Updating version..."
    if [ "$VERSION_TYPE" = "custom" ]; then
        npm version $CUSTOM_VERSION --no-git-tag-version
    else
        npm version $VERSION_TYPE --no-git-tag-version
    fi
    NEW_VERSION=$(node -p "require('./package.json').version")
    print_success "Version updated to: $NEW_VERSION"
else
    NEW_VERSION=$CURRENT_VERSION
    print_info "Using current version: $NEW_VERSION"
fi

# Clean and compile
print_info "Cleaning previous builds..."
rm -rf out/
rm -f *.vsix

print_info "Installing dependencies..."
npm install

print_info "Compiling TypeScript..."
npm run compile

# Run tests (optional)
read -p "Run tests before building? (y/N): " run_tests
if [[ $run_tests =~ ^[Yy]$ ]]; then
    print_info "Running tests..."
    npm test || {
        print_error "Tests failed. Do you want to continue anyway? (y/N)"
        read continue_anyway
        if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
fi

# Lint code
print_info "Linting code..."
npm run lint || {
    print_warning "Linting issues found. Do you want to continue? (y/N)"
    read continue_lint
    if [[ ! $continue_lint =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

# Package extension
print_info "Packaging extension..."
vsce package --out "releases/"

# Create releases directory if it doesn't exist
mkdir -p releases

# Move the .vsix file to releases directory
PACKAGE_NAME="url-pinger-${NEW_VERSION}.vsix"
if [ -f "$PACKAGE_NAME" ]; then
    mv "$PACKAGE_NAME" "releases/"
    print_success "Extension packaged: releases/$PACKAGE_NAME"
else
    print_error "Package file not found: $PACKAGE_NAME"
    exit 1
fi

# Generate changelog entry
print_info "Generating changelog entry..."
CHANGELOG_FILE="CHANGELOG.md"
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "# Changelog" > $CHANGELOG_FILE
    echo "" >> $CHANGELOG_FILE
fi

# Add new version entry to changelog
DATE=$(date +"%Y-%m-%d")
TEMP_CHANGELOG=$(mktemp)
echo "## [$NEW_VERSION] - $DATE" > $TEMP_CHANGELOG
echo "" >> $TEMP_CHANGELOG
echo "### Added" >> $TEMP_CHANGELOG
echo "- " >> $TEMP_CHANGELOG
echo "" >> $TEMP_CHANGELOG
echo "### Changed" >> $TEMP_CHANGELOG
echo "- " >> $TEMP_CHANGELOG
echo "" >> $TEMP_CHANGELOG
echo "### Fixed" >> $TEMP_CHANGELOG
echo "- " >> $TEMP_CHANGELOG
echo "" >> $TEMP_CHANGELOG
cat $CHANGELOG_FILE >> $TEMP_CHANGELOG
mv $TEMP_CHANGELOG $CHANGELOG_FILE

print_success "Changelog entry added for version $NEW_VERSION"

# Git operations
read -p "Commit and tag this release? (y/N): " commit_release
if [[ $commit_release =~ ^[Yy]$ ]]; then
    print_info "Committing changes..."
    git add .
    git commit -m "Release version $NEW_VERSION

- Package extension v$NEW_VERSION
- Update changelog
- Compiled and tested for release"

    print_info "Creating git tag..."
    git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
    
    print_success "Created git tag: v$NEW_VERSION"
    
    read -p "Push to remote repository? (y/N): " push_remote
    if [[ $push_remote =~ ^[Yy]$ ]]; then
        print_info "Pushing to remote..."
        git push origin main
        git push origin "v$NEW_VERSION"
        print_success "Pushed to remote repository"
    fi
fi

# Generate release notes
print_info "Generating release notes..."
cat > "releases/release-notes-$NEW_VERSION.md" << EOF
# URL Pinger v$NEW_VERSION Release Notes

## 📦 Installation
\`\`\`bash
code --install-extension releases/url-pinger-$NEW_VERSION.vsix
\`\`\`

## 🚀 Features
- Single URL ping testing
- Bulk URL testing
- URL history management
- Export results to JSON
- Scheduled periodic testing
- Configurable settings
- Modern VS Code UI integration

## 📋 Requirements
- VS Code 1.102.0 or higher
- Internet connection for URL testing

## 🔧 Configuration
Access settings via: File > Preferences > Settings > Extensions > URL Pinger

## 📝 Changelog
See CHANGELOG.md for detailed changes.

## 🐛 Issues
Report issues at: https://github.com/StormFox23/url-pinger/issues
EOF

print_success "Release notes generated: releases/release-notes-$NEW_VERSION.md"

# Summary
echo ""
echo "🎉 Release Build Complete!"
echo "========================="
print_success "Version: $NEW_VERSION"
print_success "Package: releases/url-pinger-$NEW_VERSION.vsix"
print_success "Release notes: releases/release-notes-$NEW_VERSION.md"
print_success "Changelog updated: CHANGELOG.md"

if [[ $commit_release =~ ^[Yy]$ ]]; then
    print_success "Git tag created: v$NEW_VERSION"
fi

echo ""
print_info "Next steps:"
echo "  1. Review the changelog and release notes"
echo "  2. Test the packaged extension"
echo "  3. Publish to VS Code Marketplace (optional): vsce publish"
echo "  4. Create GitHub release with the generated files"

print_success "Release process completed! 🚀"
