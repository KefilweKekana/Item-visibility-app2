# Item Visibility

Control item visibility per user in ERPNext. Make items private and share them with specific users or roles.

## ✨ Key Feature: Centralized Manager Dashboard

**NEW!** Manage all item visibility from one powerful screen:
- 📊 See all items and their privacy status at a glance
- ⚡ Bulk make items private or public
- 👥 Bulk share items with users or roles
- 🔍 Advanced filtering and search
- 📈 Real-time visibility statistics

**Access:** Search for **"Item Visibility Manager"** or navigate to `/app/item-visibility-manager`

## Features

- ✅ **Private Items**: Mark items as private so only selected users can see them
- ✅ **User-based Sharing**: Share private items with specific users
- ✅ **Role-based Sharing**: Share private items with all users having a specific role
- ✅ **System Manager Compatible**: Works even when all users are System Managers
- ✅ **No User Permissions Required**: Uses custom permission logic instead of ERPNext's standard user permissions
- ✅ **UI Enhancements**: Visual indicators and easy-to-use sharing interface

## How It Works

### Public Items (Default)
- **Is Private Item** = Unchecked
- **Visible to**: Everyone

### Private Items
- **Is Private Item** = Checked
- **Allowed Users** = Empty
- **Visible to**: Only the creator and Administrator

### Shared Private Items
- **Is Private Item** = Checked
- **Allowed Users** = user1@example.com, user2@example.com
- **Visible to**: Only specified users and Administrator

## Installation

### Method 1: Install from Directory

1. Copy the `item_visibility` folder to your `frappe-bench/apps/` directory:
   ```bash
   cd ~/frappe-bench/apps
   # Copy the item_visibility folder here
   ```

2. Install the app on your site:
   ```bash
   bench --site your-site-name install-app item_visibility
   ```

3. Restart bench:
   ```bash
   bench restart
   ```

### Method 2: Install from Git (if you upload to GitHub)

```bash
cd ~/frappe-bench
bench get-app https://github.com/yourusername/item_visibility.git
bench --site your-site-name install-app item_visibility
bench restart
```

## Usage

### Using the Centralized Manager (Recommended)

The **Item Visibility Manager** provides a centralized interface to manage all items:

1. Search for "Item Visibility Manager" or go to `/app/item-visibility-manager`
2. View all items with their privacy status
3. Use filters to find specific items
4. Select multiple items and use bulk actions:
   - Make Private
   - Make Public
   - Share with users or roles
5. View real-time statistics

**For detailed instructions, see [MANAGER_GUIDE.md](MANAGER_GUIDE.md)**

### Managing Individual Items

#### Making an Item Private

1. Open any Item document
2. Scroll to **Item Visibility Settings** section
3. Check **Is Private Item**
4. Click **Save**

The item is now private! Only you and the Administrator can see it.

### Sharing with Specific Users

1. In a private item, scroll to **Allowed Users** table
2. Click **Add Row**
3. Select the user from the dropdown
4. Click **Save**

The user can now see and access this item.

### Sharing with a Role

1. In a private item, click the **Visibility** button
2. Select **Share with Role**
3. Choose a role (e.g., "Sales User")
4. Click **Submit**

All users with that role will be added to the allowed users list.

### Viewing Who Has Access

1. In a private item, click the **Visibility** button
2. Select **View Access**
3. A popup shows all users with access
4. You can remove users directly from this popup

## Visual Indicators

- **Orange Alert**: Shows on private items indicating how many users have access
- **Warning Message**: Displays if an item is private but has no allowed users
- **Help Text**: Clear instructions in the form

## API Methods

### Get Visible Items
```python
import frappe

# Get all items visible to current user
items = frappe.call('item_visibility.permissions.get_visible_items')

# Get items visible to specific user
items = frappe.call('item_visibility.permissions.get_visible_items', user='user@example.com')
```

### Share with Role
```python
import frappe

# Share item with all users having a role
frappe.call('item_visibility.permissions.share_item_with_role',
    item='ITEM-001',
    role='Sales User'
)
```

### Remove User Access
```python
import frappe

# Remove a user's access
frappe.call('item_visibility.permissions.remove_user_access',
    item='ITEM-001',
    user='user@example.com'
)
```

## Technical Details

### How Permissions Work

The app uses ERPNext's `permission_query_conditions` and `has_permission` hooks to filter items at the database level. This ensures:

- Items are filtered in **List View**
- Items are filtered in **Link Fields**
- Items are filtered in **Reports**
- Items are blocked in **API calls**
- Direct URL access is prevented

### Database Query

The permission filter adds this SQL condition:
```sql
(
    `tabItem`.custom_is_private != 1 
    OR `tabItem`.custom_is_private IS NULL
    OR `tabItem`.name IN (
        SELECT parent 
        FROM `tabItem Allowed User` 
        WHERE user = 'user@example.com'
    )
)
```

### Custom Fields Added

- `custom_is_private` (Check): Whether item is private
- `custom_allowed_users` (Table): List of users who can access

## Use Cases

### Confidential Products
Hide new product developments from general staff:
```
Item: "Project Phoenix - New Widget"
Private: Yes
Shared with: R&D Team only
```

### Customer-Specific Items
Restrict visibility to relevant sales reps:
```
Item: "Custom Part for ABC Corp"
Private: Yes
Shared with: Account Manager for ABC Corp
```

### Supplier Exclusive Items
Limit to purchasing team:
```
Item: "Exclusive Component X"
Private: Yes
Shared with: Purchasing Manager, Buyers
```

### Price-Sensitive Items
Control who sees items with special pricing:
```
Item: "VIP Client Package"
Private: Yes
Shared with: Senior Sales Team
```

## Troubleshooting

### Items Not Showing Up

1. Check if the item is marked as private
2. Verify your user is in the allowed users list
3. Clear cache: `bench --site your-site-name clear-cache`

### Permission Errors

1. Ensure the app is installed: `bench --site your-site-name list-apps`
2. Check hooks are loaded: Look for `item_visibility` in site_config.json
3. Restart bench: `bench restart`

### Custom Fields Not Appearing

```bash
# Manually sync custom fields
bench --site your-site-name execute frappe.custom.doctype.custom_field.custom_field.sync_custom_fields
bench --site your-site-name clear-cache
```

## Uninstallation

```bash
bench --site your-site-name uninstall-app item_visibility
```

Note: Custom fields will remain after uninstallation. To remove them:
1. Go to **Customize Form**
2. Select **Item**
3. Delete fields starting with `custom_visibility_` and `custom_is_private`

## Support

For issues or questions:
- Create an issue on GitHub
- Email: your-email@example.com

## License

MIT License

## Credits

Built for ERPNext by Your Company
