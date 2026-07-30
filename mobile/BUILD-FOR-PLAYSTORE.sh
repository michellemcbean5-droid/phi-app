#!/usr/bin/env bash
# ============================================================
#  Prince Haul Intelligence - One-Command Play Store Build
#  Run: bash BUILD-FOR-PLAYSTORE.sh
#  Builds your store-ready .aab in the cloud and prints a link.
# ============================================================
set -e

cd "$(dirname "$0")"

echo ""
echo "=== Prince Haul Intelligence - Play Store Build ==="
echo ""

# Check Node
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed."
  echo "Download it from https://nodejs.org (LTS version), install, then run this again."
  exit 1
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing app dependencies... (first time only, a few minutes)"
  npm install
fi

# Safety check: typecheck + tests before building
echo "Running quick code check..."
npx tsc --noEmit
npx vitest run
echo "Code check passed."
echo ""

# Login if needed
if ! npx eas-cli whoami >/dev/null 2>&1; then
  echo "Logging into Expo..."
  npx eas-cli login
fi

# Build the production AAB in the cloud
echo "Starting cloud build (15-25 minutes)..."
echo 'If asked "Generate a new Android Keystore?" press Y'
echo ""
npx eas-cli build --platform android --profile production

echo ""
echo "=== DONE ==="
echo "Open the link printed above and download your .aab file."
echo "Then follow PHI-PLAY-STORE-GUIDE.md Part 3 to upload it."
