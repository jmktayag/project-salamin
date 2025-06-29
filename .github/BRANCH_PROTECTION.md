# Branch Protection Rules

This repository has both **local Git hooks** and **GitHub branch protection rules** to prevent direct commits to protected branches.

## Protected Branches
- `develop` (main development branch)
- `master` (production branch)
- `main` (alternative production branch)

## Protection Mechanisms

### 1. Local Git Hooks 🔨

Two Git hooks are configured to provide immediate feedback:

#### Pre-commit Hook (`.git/hooks/pre-commit`)
- **Prevents**: Direct commits to protected branches
- **Triggers**: When you run `git commit`
- **Message**: Shows clear instructions for creating feature branches

#### Pre-push Hook (`.git/hooks/pre-push`)  
- **Prevents**: Direct pushes to protected branches
- **Triggers**: When you run `git push`
- **Message**: Provides early feedback before hitting GitHub's protection

### 2. GitHub Branch Protection Rules 🛡️

GitHub repository settings enforce:
- **Pull Request Required**: All changes must go through PRs
- **Direct Push Blocked**: Remote repository rejects direct pushes
- **Review Required**: PRs may require approvals before merging

## Correct Workflow ✅

### For New Features:
```bash
# 1. Create and switch to feature branch
git checkout -b feature/your-feature-name

# 2. Make your changes
# ... edit files ...

# 3. Stage and commit changes
git add .
git commit -m "feat: Add your feature description"

# 4. Push feature branch
git push -u origin feature/your-feature-name

# 5. Create Pull Request on GitHub
# Visit GitHub and create PR from feature branch to develop
```

### For Bug Fixes:
```bash
# 1. Create fix branch
git checkout -b fix/bug-description

# 2. Make fixes and commit
git add .
git commit -m "fix: Resolve bug description"

# 3. Push and create PR
git push -u origin fix/bug-description
```

## Error Messages You Might See

### Local Pre-commit Block:
```
🚫 BLOCKED: Direct commit to 'develop' branch is not allowed!
```

### Local Pre-push Block:
```
🚫 BLOCKED: Direct push to 'develop' branch is not allowed!
```

### GitHub Remote Block:
```
remote: error: GH006: Protected branch update failed
remote: - Changes must be made through a pull request.
```

## Benefits

1. **Early Feedback**: Local hooks catch issues before network operations
2. **Consistent Process**: Enforces PR-based workflow for all contributors  
3. **Code Quality**: Ensures all changes go through review process
4. **Branch Stability**: Keeps protected branches stable and deployable

## Troubleshooting

### Hook Not Working?
```bash
# Check if hooks are executable
ls -la .git/hooks/pre-*

# Make executable if needed
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
```

### Need to Bypass Hook? (Emergency Only)
```bash
# Skip pre-commit hook (not recommended)
git commit --no-verify -m "emergency fix"

# Skip pre-push hook (not recommended)  
git push --no-verify
```

> ⚠️ **Warning**: Bypassing hooks defeats the protection purpose. Use only in true emergencies and ensure proper PR process follows immediately.

## Hook Installation

The Git hooks are automatically active when you clone this repository. If hooks are missing, they can be recreated manually or restored from backup.

For questions about branch protection rules, contact the repository maintainers.