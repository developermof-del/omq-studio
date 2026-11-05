#!/usr/bin/env bash
# For a fresh extraction only. No force pushes, secret handling, or existing remotes.
set -euo pipefail

if [ "$#" -ne 2 ] || [ "$1" != "--public" ]; then
  echo 'Usage: bash scripts/publish-github.sh --public NEW_REPOSITORY_NAME' >&2
  echo 'Creates a NEW PUBLIC GitHub repository under your signed-in account.' >&2
  exit 64
fi
repo=$2
if ! [[ "$repo" =~ ^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$ ]]; then
  echo 'Choose a new short repository name with letters, digits, hyphens or underscores.' >&2; exit 64
fi
for tool in git gh; do command -v "$tool" >/dev/null || { echo "Required: $tool" >&2; exit 1; }; done
project_root="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$project_root"
for item in site/index.html .github/workflows/pages.yml site/assets/site-config.js; do
  [ -f "$item" ] || { echo "Missing package file: $item" >&2; exit 1; }
done
if [ -e .git ] || git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo 'Use this first-publish command only in a newly extracted folder outside an existing Git repository. For later updates use the connected checkout.' >&2
  exit 1
fi
export GH_HOST=github.com GH_PROMPT_DISABLED=1 GIT_TERMINAL_PROMPT=0
gh auth status --hostname github.com >/dev/null 2>&1 || { echo 'Sign in first: gh auth login --hostname github.com' >&2; exit 1; }
owner="$(gh api --hostname github.com user --jq '.login')"
full="$owner/$repo"
if gh repo view "$full" --json name >/dev/null 2>&1; then
  echo "Already exists: $full. Choose a new name; nothing was changed." >&2; exit 1
fi
# Validate local commit identity before creating anything on GitHub.
git var GIT_AUTHOR_IDENT >/dev/null || { echo 'Set your Git commit name and email, then retry.' >&2; exit 1; }
git var GIT_COMMITTER_IDENT >/dev/null
echo "Creating a new PUBLIC repository: https://github.com/$full"
# Creation is authoritative; GitHub rejects collisions, so no existing repo can be reused.
gh repo create "$full" --public --description 'عُمق | استوديو أعمال فنية وقطع بالطباعة ثلاثية الأبعاد'
git init -q && git symbolic-ref HEAD refs/heads/main
git add -- site .github/workflows/pages.yml README.md scripts/publish-github.sh
for extra in .gitignore scripts/check.py scripts/shell.py; do
  if [ -f "$extra" ]; then git add -- "$extra"; fi
done
git commit -q -m "Publish the OMQ studio and identity website"
git remote add origin "https://github.com/$full.git"
# Use the existing gh session for this push only; no persisted token or global Git setting.
git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push --set-upstream origin main
pages_ready=false
for attempt in 1 2 3; do
  if gh api --hostname github.com --method POST "repos/$full/pages" -f build_type=workflow --silent 2>/dev/null ||
     [ "$(gh api --hostname github.com "repos/$full/pages" --jq '.build_type' 2>/dev/null || true)" = workflow ]; then
     pages_ready=true; break
  fi
  [ "$attempt" = 3 ] || sleep 3
done
if [ "$pages_ready" != true ]; then
  echo "Source pushed. Open https://github.com/$full/settings/pages and set Source to GitHub Actions, then dispatch the Pages workflow." >&2
  exit 2
fi
dispatched=false
for attempt in 1 2 3; do
  if gh workflow run pages.yml --repo "$full" --ref main >/dev/null 2>&1; then dispatched=true; break; fi
  [ "$attempt" = 3 ] || sleep 3
done
echo "Repository: https://github.com/$full"
echo "Deployment status and the final Pages URL: https://github.com/$full/actions/workflows/pages.yml"
if [ "$dispatched" != true ]; then
  echo 'Source pushed and Pages enabled. Choose Run workflow in the Actions tab if no run succeeded.' >&2; exit 2
fi
echo 'Deployment requested. Open the successful deploy job or Settings > Pages for the published address.'
