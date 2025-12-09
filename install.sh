#!/bin/bash

# Item Visibility App - Quick Installation Script
# This script helps you quickly install the Item Visibility app on ERPNext

set -e

echo "=========================================="
echo "Item Visibility App Installation"
echo "=========================================="
echo ""

# Check if bench is available
if ! command -v bench &> /dev/null; then
    echo "Error: bench command not found"
    echo "Please ensure you're in the correct directory and Frappe bench is installed"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_NAME="item_visibility"

# Check if we're in the apps directory
if [[ $SCRIPT_DIR == *"/apps/$APP_NAME" ]]; then
    echo "✓ App is in the correct location (frappe-bench/apps/)"
    BENCH_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
else
    echo "Error: This script should be run from frappe-bench/apps/item_visibility/"
    echo "Current location: $SCRIPT_DIR"
    echo ""
    echo "Please copy this folder to: ~/frappe-bench/apps/$APP_NAME"
    echo "Then run: cd ~/frappe-bench/apps/$APP_NAME && bash install.sh"
    exit 1
fi

cd "$BENCH_DIR"

echo ""
echo "Bench directory: $BENCH_DIR"
echo ""

# Ask for site name
read -p "Enter your site name (e.g., site1.local or erp.yourcompany.com): " SITE_NAME

if [ -z "$SITE_NAME" ]; then
    echo "Error: Site name cannot be empty"
    exit 1
fi

# Check if site exists
if [ ! -d "sites/$SITE_NAME" ]; then
    echo "Error: Site '$SITE_NAME' not found in $BENCH_DIR/sites/"
    echo ""
    echo "Available sites:"
    ls -1 sites/ | grep -v "assets" | grep -v "apps.txt" | grep -v "common_site_config.json"
    exit 1
fi

echo ""
echo "Installing $APP_NAME on $SITE_NAME..."
echo ""

# Install the app
bench --site "$SITE_NAME" install-app "$APP_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ App installed successfully!"
    echo ""
    echo "Clearing cache..."
    bench --site "$SITE_NAME" clear-cache
    
    echo ""
    echo "Restarting bench..."
    bench restart
    
    echo ""
    echo "=========================================="
    echo "Installation Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Log in to your ERPNext site"
    echo "2. Go to Stock > Item > Item List"
    echo "3. Open any item and look for 'Item Visibility Settings'"
    echo ""
    echo "For usage instructions, see README.md"
    echo ""
else
    echo ""
    echo "✗ Installation failed!"
    echo "Please check the error messages above"
    echo ""
    echo "Common issues:"
    echo "- App already installed: Run 'bench --site $SITE_NAME uninstall-app $APP_NAME' first"
    echo "- Dependencies missing: Run 'bench setup requirements'"
    echo ""
    exit 1
fi
