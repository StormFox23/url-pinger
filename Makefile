# URL Pinger Makefile
# Provides convenient shortcuts for common development and release tasks

.PHONY: help install compile watch test lint clean release release-patch release-minor release-major package dev setup

# Default target
help:
	@echo "URL Pinger Extension - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install       - Install dependencies"
	@echo "  make compile       - Compile TypeScript"
	@echo "  make watch         - Watch and compile on changes"
	@echo "  make test          - Run tests"
	@echo "  make lint          - Run linter"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make dev           - Start development environment"
	@echo ""
	@echo "Release:"
	@echo "  make release       - Interactive release builder"
	@echo "  make release-patch - Release with patch version bump"
	@echo "  make release-minor - Release with minor version bump"
	@echo "  make release-major - Release with major version bump"
	@echo "  make package       - Package extension without version bump"
	@echo ""
	@echo "Setup:"
	@echo "  make setup         - Complete development setup"

# Development commands
install:
	@echo "📦 Installing dependencies..."
	npm install

compile:
	@echo "🔨 Compiling TypeScript..."
	npm run compile

watch:
	@echo "👁️  Starting watch mode..."
	npm run watch

test:
	@echo "🧪 Running tests..."
	npm test

lint:
	@echo "🔍 Running linter..."
	npm run lint

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf out/
	rm -f *.vsix
	rm -rf releases/

dev: install compile
	@echo "🚀 Development environment ready!"
	@echo "Run 'make watch' in another terminal to auto-compile on changes"

# Release commands
release:
	@echo "🚀 Starting interactive release builder..."
	npm run build:release

release-patch:
	@echo "🔧 Building patch release..."
	npm run build:release:patch

release-minor:
	@echo "✨ Building minor release..."
	npm run build:release:minor

release-major:
	@echo "💥 Building major release..."
	npm run build:release:major

package:
	@echo "📦 Packaging extension..."
	npm run build:release:no-bump

# Setup command for new developers
setup: install
	@echo "🔧 Setting up development environment..."
	npm install -g @vscode/vsce
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Open this folder in VS Code"
	@echo "2. Press F5 to start debugging"
	@echo "3. Run 'make release' to build a release"

# Windows compatibility
ifeq ($(OS),Windows_NT)
clean:
	@echo "🧹 Cleaning build artifacts..."
	if exist out rmdir /s /q out
	del /q *.vsix 2>nul || true
	if exist releases rmdir /s /q releases
endif
