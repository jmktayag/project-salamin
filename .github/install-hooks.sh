#!/bin/bash

# Git Hooks Installation Script
# This script installs branch protection hooks for the Salamin repository

echo "🔨 Installing Git branch protection hooks..."

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a Git repository root directory"
    echo "   Please run this script from the repository root"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-commit hook
echo "📝 Installing pre-commit hook..."
cp .github/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Install pre-push hook  
echo "📤 Installing pre-push hook..."
cp .github/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push

# Verify installation
echo ""
echo "✅ Verification:"

if [ -x ".git/hooks/pre-commit" ]; then
    echo "   ✓ pre-commit hook installed and executable"
else
    echo "   ❌ pre-commit hook installation failed"
    exit 1
fi

if [ -x ".git/hooks/pre-push" ]; then
    echo "   ✓ pre-push hook installed and executable"
else
    echo "   ❌ pre-push hook installation failed"
    exit 1
fi

echo ""
echo "🛡️ Branch protection hooks successfully installed!"
echo ""
echo "Protected branches: develop, master, main"
echo "These hooks will prevent direct commits and pushes to protected branches."
echo ""
echo "📚 For more information, see: .github/BRANCH_PROTECTION.md"
echo ""
echo "🔄 Use feature branches for all development work:"
echo "   git checkout -b feature/your-feature-name"
echo ""