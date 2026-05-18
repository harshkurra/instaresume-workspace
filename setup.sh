#!/bin/bash
# Setup script for instaresume.io development workspace
# Run this after cloning instaresume-workspace to get all repos in place

set -e

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Setting up instaresume.io workspace at: $WORKSPACE_DIR"

clone_or_pull() {
  local repo_url=$1
  local dir_name=$2

  if [ -d "$WORKSPACE_DIR/$dir_name/.git" ]; then
    echo "  ✓ $dir_name already exists — pulling latest..."
    git -C "$WORKSPACE_DIR/$dir_name" pull
  else
    echo "  → Cloning $dir_name..."
    git clone "$repo_url" "$WORKSPACE_DIR/$dir_name"
  fi
}

clone_or_pull "https://github.com/harshkurra/resume-builder-frontend.git" "resume-builder-frontend"
clone_or_pull "https://github.com/harshkurra/resume-builder-service.git" "resume-builder-service"

echo ""
echo "Done! Workspace is ready."
echo ""
echo "Next steps:"
echo "  cd resume-builder-frontend && yarn install && yarn start"
echo "  cd resume-builder-service  && npm install && npm run start:dev"
