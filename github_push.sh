#!/bin/bash

echo "📦 COINAVERSE - GitHub Push Setup"
echo "=================================="
echo ""
read -p "Enter your GitHub username: " GH_USER

REPO="coinaverse"
REPO_URL="git@github.com:$GH_USER/$REPO.git"

echo ""
echo "Creating GitHub repo: $REPO_URL"
echo ""
echo "Step 1️⃣: Creating repo via API (requires personal access token)"
echo "  OR skip and create manually at: https://github.com/new"
echo ""
read -p "Enter GitHub Personal Access Token (or press Enter to skip API): " GH_TOKEN

if [ -n "$GH_TOKEN" ]; then
  curl -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO\",\"description\":\"COINAVERSE - 7 Kabria Games\",\"private\":false,\"auto_init\":true}" 2>/dev/null
  echo "✅ Repo created via API"
else
  echo "⚠️  Skipping API - create repo manually:"
  echo "   https://github.com/new?name=$REPO&description=COINAVERSE%20-%207%20Kabria%20Games"
  read -p "Press Enter once you've created the repo on GitHub..."
fi

echo ""
echo "Step 2️⃣: Configuring local git..."
cd /Users/admin/Claude/coinaverse_v25

git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git branch -M main

echo ""
echo "Step 3️⃣: Pushing code..."
git push -u origin main

echo ""
echo "✅ DONE!"
echo "📱 Your repo: https://github.com/$GH_USER/$REPO"
echo "🚀 Vercel will auto-deploy on push!"

