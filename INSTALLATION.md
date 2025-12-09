# Installation Guide for Item Visibility

This guide will walk you through installing the Item Visibility app on your ERPNext instance.

## Prerequisites

- ERPNext v13, v14, or v15 installed
- Access to the server/terminal where ERPNext is running
- Bench command line tool available
- Administrator access to your ERPNext site

## Step 1: Download the App

### Option A: Using Git (Recommended)

If you've uploaded this to GitHub:

```bash
cd ~/frappe-bench
bench get-app https://github.com/yourusername/item_visibility.git
```

### Option B: Manual Installation

1. Copy the entire `item_visibility` folder to your bench's apps directory:

```bash
# If you have the folder on your local machine
scp -r item_visibility user@your-server:~/frappe-bench/apps/

# Or if you're already on the server
cp -r /path/to/item_visibility ~/frappe-bench/apps/
```

## Step 2: Install the App on Your Site

```bash
cd ~/frappe-bench

# Install the app
bench --site your-site-name install-app item_visibility
```

Replace `your-site-name` with your actual site name (e.g., `site1.local` or `erp.yourcompany.com`).

## Step 3: Restart Services

```bash
# Restart bench
bench restart

# If using production setup with supervisor
sudo service supervisor restart
```

## Step 4: Clear Cache

```bash
# Clear cache to ensure all changes are applied
bench --site your-site-name clear-cache
```

## Step 5: Verify Installation

1. Log in to your ERPNext site
2. Go to **Stock > Item > Item List**
3. Open any item
4. Look for the **Item Visibility Settings** section
5. You should see:
   - **Is Private Item** checkbox
   - **Allowed Users** table (when private is checked)

## Step 6: Test the App

### Test 1: Create a Private Item

1. Create a new item or open an existing one
2. Check **Is Private Item**
3. Click **Save**
4. Log in as a different user
5. The item should NOT appear in the item list

### Test 2: Share a Private Item

1. Log in as Administrator or item creator
2. Open the private item
3. Add a user to **Allowed Users** table
4. Click **Save**
5. Log in as that user
6. The item should now be visible

### Test 3: Share with Role

1. Open a private item
2. Click **Visibility** button
3. Select **Share with Role**
4. Choose a role (e.g., "Sales User")
5. All users with that role should now see the item

## Troubleshooting

### App Not Installing

**Error**: "App not found in apps.txt"

**Solution**:
```bash
# Manually add the app to apps.txt
echo "item_visibility" >> ~/frappe-bench/sites/apps.txt

# Then install
bench --site your-site-name install-app item_visibility
```

### Custom Fields Not Appearing

**Solution 1**: Manually sync custom fields
```bash
bench --site your-site-name execute item_visibility.install.create_item_custom_fields
bench --site your-site-name clear-cache
```

**Solution 2**: Use Customize Form
1. Go to **Customize Form**
2. Select **Item**
3. Click **Reset to defaults** (warning: this removes all customizations)
4. Reinstall the app

### Permission Not Working

**Solution**: Ensure hooks are loaded
```bash
# Check if app is in installed_apps
bench --site your-site-name console

# In the console:
>>> frappe.get_installed_apps()
# Should include 'item_visibility'

# Check if hooks are working
>>> frappe.get_hooks('permission_query_conditions')
# Should show Item: item_visibility.permissions.item_query
```

### Database Errors

**Solution**: Migrate the site
```bash
bench --site your-site-name migrate
bench --site your-site-name clear-cache
bench restart
```

## Production Setup Considerations

### 1. Enable in Production Mode

```bash
# Switch to production mode
bench --site your-site-name enable-scheduler
bench restart
```

### 2. Update Nginx Configuration

If you're running ERPNext in production with Nginx:

```bash
# Generate new nginx config
bench setup nginx

# Reload nginx
sudo service nginx reload
```

### 3. Performance Optimization

For sites with many items (10,000+), consider adding a database index:

```bash
bench --site your-site-name console

# In console:
>>> frappe.db.sql("""
    CREATE INDEX idx_item_private 
    ON `tabItem` (custom_is_private)
""")
>>> frappe.db.commit()
```

## Updating the App

### Pull Latest Changes

If installed from Git:
```bash
cd ~/frappe-bench/apps/item_visibility
git pull origin main

cd ~/frappe-bench
bench --site your-site-name migrate
bench restart
```

### Manual Update

Replace the app folder and run:
```bash
bench --site your-site-name migrate
bench --site your-site-name clear-cache
bench restart
```

## Uninstalling

If you need to remove the app:

```bash
# Uninstall from site
bench --site your-site-name uninstall-app item_visibility

# Optionally remove from apps directory
rm -rf ~/frappe-bench/apps/item_visibility
```

**Note**: Custom fields will remain. To remove them:
1. Go to **Customize Form**
2. Select **Item**
3. Delete fields: `custom_is_private`, `custom_allowed_users`, etc.

## Multi-Site Setup

If you have multiple sites on one bench:

```bash
# List all sites
bench --site all list

# Install on specific sites
bench --site site1.local install-app item_visibility
bench --site site2.local install-app item_visibility

# Or install on all sites
bench --site all install-app item_visibility
```

## Docker Setup

If running ERPNext in Docker:

```bash
# Enter the container
docker exec -it <container-name> bash

# Follow standard installation steps
cd /home/frappe/frappe-bench
bench get-app https://github.com/yourusername/item_visibility.git
bench --site <site-name> install-app item_visibility
```

## Support

If you encounter issues:

1. Check the error log:
   ```bash
   tail -f ~/frappe-bench/sites/your-site-name/logs/web.log
   ```

2. Check bench logs:
   ```bash
   tail -f ~/frappe-bench/logs/bench.log
   ```

3. Enable developer mode for detailed errors:
   ```bash
   bench --site your-site-name set-config developer_mode 1
   bench --site your-site-name clear-cache
   ```

## Next Steps

After successful installation:

1. Read the [README.md](README.md) for usage instructions
2. Train your users on how to use private items
3. Set up default private items for confidential products
4. Create role-based sharing for teams

---

**Questions?** Contact: your-email@example.com
