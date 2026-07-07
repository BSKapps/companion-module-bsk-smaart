#!/bin/bash
set -e
MODULES="$HOME/Library/Application Support/companion/modules"
VERSION=$(node -p "require('./package.json').version")
NAME="bsk-smaart-$VERSION"

yarn build
rm -rf "$MODULES"/bsk-smaart-*
cp -r pkg "$MODULES/$NAME"
echo "Deployed $NAME to Companion. Restart Companion fully to pick up changes."
