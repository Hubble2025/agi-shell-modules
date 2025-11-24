#!/bin/bash
#
# AGI Shell CMS Module Installer v1.0 (MVP)
# Basic module installation script following Option A model
#
# Usage: ./install-module.sh <MODULE_FOLDER_NAME>
# Example: ./install-module.sh AGI_Shell_CMS_RefreshRate_CoreModule_v3.2
#

set -e

MODULE_NAME="$1"
MODULE_PATH="modules/${MODULE_NAME}"
PROJECT_ROOT="."

echo "=============================================="
echo "AGI Shell CMS Module Installer v1.0 (MVP)"
echo "=============================================="
echo ""

if [ -z "$MODULE_NAME" ]; then
  echo "ERROR: Module name required"
  echo "Usage: $0 <MODULE_FOLDER_NAME>"
  echo ""
  echo "Available modules:"
  ls -1 modules/ | grep -v "dummy.txt" | grep -v "\.md$"
  exit 1
fi

if [ ! -d "$MODULE_PATH" ]; then
  echo "ERROR: Module not found at $MODULE_PATH"
  exit 1
fi

if [ ! -f "$MODULE_PATH/manifest.json" ]; then
  echo "ERROR: manifest.json not found in $MODULE_PATH"
  exit 1
fi

echo "Installing module: $MODULE_NAME"
echo "Source: $MODULE_PATH"
echo "Target: $PROJECT_ROOT"
echo ""

echo "[1/6] Validating module structure..."
REQUIRED_FILES=("manifest.json")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$MODULE_PATH/$file" ]; then
    echo "ERROR: Required file missing: $file"
    exit 1
  fi
done
echo "✓ Module structure valid"
echo ""

echo "[2/6] Copying Supabase migrations..."
if [ -d "$MODULE_PATH/supabase/migrations" ]; then
  mkdir -p "${PROJECT_ROOT}/supabase/migrations"
  cp -v "$MODULE_PATH/supabase/migrations/"* "${PROJECT_ROOT}/supabase/migrations/" 2>/dev/null || true
  echo "✓ Migrations copied"
else
  echo "⊘ No migrations found"
fi
echo ""

echo "[3/6] Copying Supabase Edge Functions..."
if [ -d "$MODULE_PATH/supabase/functions" ]; then
  mkdir -p "${PROJECT_ROOT}/supabase/functions"
  cp -rv "$MODULE_PATH/supabase/functions/"* "${PROJECT_ROOT}/supabase/functions/" 2>/dev/null || true
  echo "✓ Edge Functions copied"
else
  echo "⊘ No Edge Functions found"
fi
echo ""

echo "[4/6] Copying source code..."
if [ -d "$MODULE_PATH/src" ]; then
  mkdir -p "${PROJECT_ROOT}/src"
  cp -rv "$MODULE_PATH/src/"* "${PROJECT_ROOT}/src/" 2>/dev/null || true
  echo "✓ Source code copied"
else
  echo "⊘ No source code found"
fi
echo ""

echo "[5/6] Checking .env configuration..."
if [ -f "$MODULE_PATH/env/.env.example" ]; then
  if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    echo "WARNING: .env not found in project root"
    echo "Please copy env/.env.example from module and configure:"
    echo "  cp $MODULE_PATH/env/.env.example ${PROJECT_ROOT}/.env"
    echo "  # Then edit .env with your credentials"
  else
    echo "✓ .env exists (please verify it contains required variables)"
  fi
else
  echo "⊘ No .env.example found"
fi
echo ""

echo "[6/6] Installation summary..."
MODULE_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$MODULE_PATH/manifest.json" | sed 's/.*"\([^"]*\)".*/\1/')
MODULE_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$MODULE_PATH/manifest.json" | sed 's/.*"\([^"]*\)".*/\1/')

echo "Module ID: $MODULE_ID"
echo "Version: $MODULE_VERSION"
echo ""

echo "=============================================="
echo "✓ Module installation complete!"
echo "=============================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Run migrations:"
echo "   supabase db push"
echo ""
echo "2. Deploy Edge Functions (if any):"
if [ -d "$MODULE_PATH/supabase/functions" ]; then
  for func_dir in "$MODULE_PATH/supabase/functions/"*/; do
    func_name=$(basename "$func_dir")
    echo "   supabase functions deploy $func_name"
  done
fi
echo ""
echo "3. Register module in database (optional):"
echo "   INSERT INTO module_registry (id, version, type, install_source)"
echo "   VALUES ('$MODULE_ID', '$MODULE_VERSION', 'core', 'manual');"
echo ""
echo "4. Build and test:"
echo "   npm run build"
echo "   npm run dev"
echo ""
echo "=============================================="
