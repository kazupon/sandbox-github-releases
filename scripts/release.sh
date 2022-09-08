#!/bin/bash

set -e

# Restore all git changes
git restore -s@ -SW  -- packages

# Build all once to ensure things are nice
pnpm build

# Release packages
for PKG in packages/* ; do
  pushd $PKG
  TAG="latest"
  echo "⚡ Publishing $PKG with tag $TAG"
  # npx npm@8.17.0 publish --tag $TAG --access public --tolerate-republish
  popd > /dev/null
done
