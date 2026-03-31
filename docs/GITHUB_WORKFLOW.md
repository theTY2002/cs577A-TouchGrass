# GitHub Workflow Guide

This guide explains how to push code to GitHub and how to work with separate branches.

---

## Pushing to GitHub

Branches let you develop features or fixes in isolation without affecting the main code.

### Creating and switching to a new branch

```bash
# Create and switch to a new branch in one command
git checkout -b <my-feature-branch>
```

### Pushing to a separate branch

1. **Create and switch to your branch** (if not already on it):
   ```bash
   git checkout -b <my-feature-branch>
   ```

2. **Make your changes**, then stage and commit:
   ```bash
   git add <updated files> or git add .
   git commit -m "Add feature X"
   ```

3. **Push to the remote branch** (creates it if it doesn't exist):
   ```bash
   git push -u origin <my-feature-branch>
   ```

4. **Later pushes** to the same branch:
   ```bash
   git push
   ```

### Useful branch commands

| Command | Description |
|---------|-------------|
| `git branch` | List local branches |
| `git branch -a` | List all branches (local + remote) |
| `git checkout branch-name` | Switch to an existing branch |
| `git switch branch-name` | Switch branch (newer syntax) |
| `git push origin branch-name` | Push a specific branch to GitHub |
| `git pull origin branch-name` | Pull latest changes for a branch |

### Quick reference: Push to a new branch

```bash
git checkout -b my-new-branch    # Create and switch
git add .
git commit -m "Your message"
git push -u origin my-new-branch  # Push and set upstream
```

---

## Creating a Pull Request

After pushing to a separate branch:

1. Go to your repository on GitHub
2. You’ll see a prompt to **“Compare & pull request”** for your new branch
3. Add a title and description, then click **Create pull request**
4. Request review and merge when ready
