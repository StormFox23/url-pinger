#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const semver = require('semver');

class ReleaseBuilder {
    constructor() {
        // Determine project root - if running from project root, use current dir
        // If running from build/ directory, go up one level
        const currentDir = process.cwd();
        const buildDir = path.resolve(__dirname);
        
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
            this.projectRoot = currentDir;
        } else if (fs.existsSync(path.join(buildDir, '..', 'package.json'))) {
            this.projectRoot = path.resolve(buildDir, '..');
        } else {
            this.projectRoot = currentDir;
        }
        
        this.packagePath = path.join(this.projectRoot, 'package.json');
        this.changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
        this.releasesDir = path.join(this.projectRoot, 'releases');
        
        // Ensure we're in the right directory
        if (!fs.existsSync(this.packagePath)) {
            this.error('package.json not found. Make sure you\'re in the project root directory.');
            process.exit(1);
        }
        
        this.package = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
        this.currentVersion = this.package.version;
    }

    // Utility methods for colored output
    info(message) {
        console.log(chalk.blue(`ℹ️  ${message}`));
    }

    success(message) {
        console.log(chalk.green(`✅ ${message}`));
    }

    warning(message) {
        console.log(chalk.yellow(`⚠️  ${message}`));
    }

    error(message) {
        console.log(chalk.red(`❌ ${message}`));
    }

    // Execute shell command
    exec(command, options = {}) {
        try {
            const result = execSync(command, { 
                cwd: this.projectRoot, 
                stdio: options.silent ? 'pipe' : 'inherit',
                encoding: 'utf8',
                ...options 
            });
            return result;
        } catch (error) {
            if (!options.ignoreError) {
                this.error(`Command failed: ${command}`);
                throw error;
            }
            return null;
        }
    }

    // Check if vsce is installed
    checkVsce() {
        try {
            this.exec('vsce --version', { silent: true });
        } catch {
            this.warning('vsce not found. Installing @vscode/vsce globally...');
            this.exec('npm install -g @vscode/vsce');
            this.success('@vscode/vsce installed globally');
        }
    }

    // Get version bump options
    async getVersionBump() {
        const args = process.argv.slice(2);
        const versionFlag = args.find(arg => arg.startsWith('--version='));
        
        if (versionFlag) {
            const versionType = versionFlag.split('=')[1];
            if (['patch', 'minor', 'major', 'none'].includes(versionType)) {
                return { type: versionType };
            } else if (versionType === 'custom') {
                const { customVersion } = await inquirer.prompt([{
                    type: 'input',
                    name: 'customVersion',
                    message: 'Enter custom version (e.g., 1.2.3):',
                    validate: (input) => semver.valid(input) ? true : 'Please enter a valid semver version'
                }]);
                return { type: 'custom', version: customVersion };
            }
        }

        // Interactive mode
        const { versionType } = await inquirer.prompt([{
            type: 'list',
            name: 'versionType',
            message: 'Select version bump type:',
            choices: [
                { name: 'patch (x.x.X) - Bug fixes', value: 'patch' },
                { name: 'minor (x.X.x) - New features', value: 'minor' },
                { name: 'major (X.x.x) - Breaking changes', value: 'major' },
                { name: 'custom - Enter custom version', value: 'custom' },
                { name: 'no bump - Use current version', value: 'none' }
            ]
        }]);

        if (versionType === 'custom') {
            const { customVersion } = await inquirer.prompt([{
                type: 'input',
                name: 'customVersion',
                message: 'Enter custom version (e.g., 1.2.3):',
                validate: (input) => semver.valid(input) ? true : 'Please enter a valid semver version'
            }]);
            return { type: 'custom', version: customVersion };
        }

        return { type: versionType };
    }

    // Update package version
    updateVersion(versionBump) {
        if (versionBump.type === 'none') {
            this.info(`Using current version: ${this.currentVersion}`);
            return this.currentVersion;
        }

        this.info('Updating version...');
        
        let newVersion;
        if (versionBump.type === 'custom') {
            newVersion = versionBump.version;
            this.exec(`npm version ${newVersion} --no-git-tag-version`);
        } else {
            this.exec(`npm version ${versionBump.type} --no-git-tag-version`);
            newVersion = JSON.parse(fs.readFileSync(this.packagePath, 'utf8')).version;
        }

        this.success(`Version updated to: ${newVersion}`);
        return newVersion;
    }

    // Clean and compile
    async cleanAndCompile() {
        this.info('Cleaning previous builds...');
        if (fs.existsSync(path.join(this.projectRoot, 'out'))) {
            fs.rmSync(path.join(this.projectRoot, 'out'), { recursive: true, force: true });
        }
        
        // Remove old .vsix files
        const files = fs.readdirSync(this.projectRoot);
        files.forEach(file => {
            if (file.endsWith('.vsix')) {
                fs.unlinkSync(path.join(this.projectRoot, file));
            }
        });

        this.info('Installing dependencies...');
        this.exec('npm install');

        this.info('Compiling TypeScript...');
        this.exec('npm run compile');
    }

    // Run tests
    async runTests() {
        if (process.argv.includes('--skip-tests')) {
            return;
        }

        const { runTests } = await inquirer.prompt([{
            type: 'confirm',
            name: 'runTests',
            message: 'Run tests before building?',
            default: false
        }]);

        if (runTests) {
            this.info('Running tests...');
            try {
                this.exec('npm test');
                this.success('Tests passed');
            } catch {
                const { continueAnyway } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'continueAnyway',
                    message: 'Tests failed. Do you want to continue anyway?',
                    default: false
                }]);
                
                if (!continueAnyway) {
                    process.exit(1);
                }
            }
        }
    }

    // Lint code
    async lintCode() {
        if (process.argv.includes('--skip-lint')) {
            return;
        }

        this.info('Linting code...');
        try {
            this.exec('npm run lint');
            this.success('Linting passed');
        } catch {
            const { continueLint } = await inquirer.prompt([{
                type: 'confirm',
                name: 'continueLint',
                message: 'Linting issues found. Do you want to continue?',
                default: false
            }]);
            
            if (!continueLint) {
                process.exit(1);
            }
        }
    }

    // Package extension
    packageExtension(version) {
        // Create releases directory
        if (!fs.existsSync(this.releasesDir)) {
            fs.mkdirSync(this.releasesDir, { recursive: true });
        }

        this.info('Packaging extension...');
        this.exec('vsce package --out releases/');

        const packageName = `url-pinger-${version}.vsix`;
        const packagePath = path.join(this.releasesDir, packageName);
        
        if (fs.existsSync(packagePath)) {
            this.success(`Extension packaged: releases/${packageName}`);
            return packageName;
        } else {
            this.error(`Package file not found: ${packageName}`);
            process.exit(1);
        }
    }

    // Update changelog
    updateChangelog(version) {
        this.info('Generating changelog entry...');
        
        if (!fs.existsSync(this.changelogPath)) {
            fs.writeFileSync(this.changelogPath, '# Changelog\n\n');
        }

        const date = new Date().toISOString().split('T')[0];
        const newEntry = `## [${version}] - ${date}

### Added
- 

### Changed
- 

### Fixed
- 

`;

        const existingChangelog = fs.readFileSync(this.changelogPath, 'utf8');
        const updatedChangelog = newEntry + existingChangelog;
        fs.writeFileSync(this.changelogPath, updatedChangelog);

        this.success(`Changelog entry added for version ${version}`);
    }

    // Git operations
    async gitOperations(version) {
        if (process.argv.includes('--no-git')) {
            return;
        }

        const { commitRelease } = await inquirer.prompt([{
            type: 'confirm',
            name: 'commitRelease',
            message: 'Commit and tag this release?',
            default: true
        }]);

        if (commitRelease) {
            this.info('Committing changes...');
            this.exec('git add .');
            this.exec(`git commit -m "Release version ${version}

- Package extension v${version}
- Update changelog
- Compiled and tested for release"`);

            this.info('Creating git tag...');
            this.exec(`git tag -a "v${version}" -m "Release version ${version}"`);
            this.success(`Created git tag: v${version}`);

            const { pushRemote } = await inquirer.prompt([{
                type: 'confirm',
                name: 'pushRemote',
                message: 'Push to remote repository?',
                default: true
            }]);

            if (pushRemote) {
                this.info('Pushing to remote...');
                this.exec('git push origin main');
                this.exec(`git push origin "v${version}"`);
                this.success('Pushed to remote repository');
            }
        }
    }

    // Generate release notes
    generateReleaseNotes(version) {
        this.info('Generating release notes...');
        
        const releaseNotes = `# URL Pinger v${version} Release Notes

## 📦 Installation
\`\`\`bash
code --install-extension releases/url-pinger-${version}.vsix
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
`;

        const releaseNotesPath = path.join(this.releasesDir, `release-notes-${version}.md`);
        fs.writeFileSync(releaseNotesPath, releaseNotes);
        this.success(`Release notes generated: releases/release-notes-${version}.md`);
    }

    // Main build process
    async build() {
        console.log(chalk.cyan('\n🚀 URL Pinger Release Builder'));
        console.log(chalk.cyan('==============================\n'));

        this.info(`Current version: ${this.currentVersion}`);

        // Check dependencies
        this.checkVsce();

        // Get version bump
        const versionBump = await this.getVersionBump();
        const newVersion = this.updateVersion(versionBump);

        // Clean and compile
        await this.cleanAndCompile();

        // Run tests and linting
        await this.runTests();
        await this.lintCode();

        // Package extension
        const packageName = this.packageExtension(newVersion);

        // Update changelog
        this.updateChangelog(newVersion);

        // Git operations
        await this.gitOperations(newVersion);

        // Generate release notes
        this.generateReleaseNotes(newVersion);

        // Summary
        console.log(chalk.cyan('\n🎉 Release Build Complete!'));
        console.log(chalk.cyan('========================='));
        this.success(`Version: ${newVersion}`);
        this.success(`Package: releases/${packageName}`);
        this.success(`Release notes: releases/release-notes-${newVersion}.md`);
        this.success(`Changelog updated: CHANGELOG.md`);

        console.log(chalk.blue('\nℹ️  Next steps:'));
        console.log('  1. Review the changelog and release notes');
        console.log('  2. Test the packaged extension');
        console.log('  3. Publish to VS Code Marketplace (optional): vsce publish');
        console.log('  4. Create GitHub release with the generated files');

        this.success('Release process completed! 🚀');
    }
}

// Run the release builder
if (require.main === module) {
    const builder = new ReleaseBuilder();
    builder.build().catch(error => {
        console.error(chalk.red('❌ Release build failed:'), error);
        process.exit(1);
    });
}

module.exports = ReleaseBuilder;
