import frappe
from frappe import _

@frappe.whitelist()
def get_items_with_visibility(filters=None):
    """
    Get items with their visibility status and allowed users.
    
    Args:
        filters: Dict of filters to apply
        
    Returns:
        List of items with visibility information
    """
    if isinstance(filters, str):
        import json
        filters = json.loads(filters)
    
    if not filters:
        filters = {}
    
    # Build query
    conditions = ["1=1"]
    values = []
    
    # Handle custom_is_private filter
    if "custom_is_private" in filters:
        if isinstance(filters["custom_is_private"], list):
            # Handle ['in', [0, null]] type filters
            if filters["custom_is_private"][0] == "in":
                conditions.append("(`tabItem`.custom_is_private IS NULL OR `tabItem`.custom_is_private = 0)")
        else:
            conditions.append("`tabItem`.custom_is_private = %s")
            values.append(filters["custom_is_private"])
        filters.pop("custom_is_private")
    
    # Handle other filters
    for key, value in filters.items():
        if key == "doctype":
            continue
        if isinstance(value, list) and value[0] == "like":
            conditions.append(f"`tabItem`.{key} LIKE %s")
            values.append(value[1])
        else:
            conditions.append(f"`tabItem`.{key} = %s")
            values.append(value)
    
    where_clause = " AND ".join(conditions)
    
    # Query items
    items = frappe.db.sql(f"""
        SELECT 
            `tabItem`.name,
            `tabItem`.item_name,
            `tabItem`.item_group,
            `tabItem`.custom_is_private
        FROM `tabItem`
        WHERE {where_clause}
        ORDER BY `tabItem`.modified DESC
        LIMIT 500
    """, tuple(values), as_dict=True)
    
    # Get allowed users for each item
    for item in items:
        item['allowed_users'] = frappe.db.sql("""
            SELECT user 
            FROM `tabItem Allowed User` 
            WHERE parent = %s
        """, item.name, as_dict=True)
    
    return items


@frappe.whitelist()
def bulk_toggle_visibility(items, is_private):
    """
    Toggle visibility for multiple items.
    
    Args:
        items: List of item names
        is_private: Boolean - whether to make items private
        
    Returns:
        Success message
    """
    if isinstance(items, str):
        import json
        items = json.loads(items)
    
    if isinstance(is_private, str):
        is_private = is_private.lower() in ['true', '1', 'yes']
    
    updated = 0
    
    for item_name in items:
        try:
            item = frappe.get_doc("Item", item_name)
            
            # Check permission
            if not frappe.has_permission("Item", "write", item):
                continue
            
            item.custom_is_private = 1 if is_private else 0
            
            # If making public, clear allowed users
            if not is_private:
                item.custom_allowed_users = []
            
            item.save(ignore_permissions=True)
            updated += 1
            
        except Exception as e:
            frappe.log_error(f"Error updating item {item_name}: {str(e)}")
            continue
    
    frappe.db.commit()
    
    return {
        "success": True,
        "updated": updated,
        "message": _("Updated {0} item(s)").format(updated)
    }


@frappe.whitelist()
def bulk_share_items(items, users=None, role=None):
    """
    Share multiple items with users or role.
    
    Args:
        items: List of item names
        users: List of user emails
        role: Role name
        
    Returns:
        Success message
    """
    if isinstance(items, str):
        import json
        items = json.loads(items)
    
    if isinstance(users, str):
        import json
        users = json.loads(users) if users else []
    
    # Get users from role if provided
    role_users = []
    if role:
        role_users = frappe.db.sql_list("""
            SELECT DISTINCT parent 
            FROM `tabHas Role` 
            WHERE role = %s 
            AND parenttype = 'User'
        """, role)
    
    # Combine users
    all_users = set(users or [])
    all_users.update(role_users)
    
    if not all_users:
        frappe.throw(_("Please select users or a role"))
    
    updated = 0
    users_added = 0
    
    for item_name in items:
        try:
            item = frappe.get_doc("Item", item_name)
            
            # Check permission
            if not frappe.has_permission("Item", "write", item):
                continue
            
            # Make item private if not already
            if not item.custom_is_private:
                item.custom_is_private = 1
            
            # Get existing users
            existing_users = [d.user for d in item.custom_allowed_users]
            
            # Add new users
            for user in all_users:
                if user not in existing_users:
                    item.append("custom_allowed_users", {
                        "user": user
                    })
                    users_added += 1
            
            item.save(ignore_permissions=True)
            updated += 1
            
        except Exception as e:
            frappe.log_error(f"Error sharing item {item_name}: {str(e)}")
            continue
    
    frappe.db.commit()
    
    message = _("Shared {0} item(s) with {1} user(s)").format(updated, len(all_users))
    if users_added > 0:
        message += _(" ({0} new access grants)").format(users_added)
    
    return {
        "success": True,
        "updated": updated,
        "users_added": users_added,
        "message": message
    }


@frappe.whitelist()
def remove_bulk_access(items, users=None):
    """
    Remove access for users from multiple items.
    
    Args:
        items: List of item names
        users: List of user emails
        
    Returns:
        Success message
    """
    if isinstance(items, str):
        import json
        items = json.loads(items)
    
    if isinstance(users, str):
        import json
        users = json.loads(users) if users else []
    
    if not users:
        frappe.throw(_("Please select users to remove"))
    
    updated = 0
    removed = 0
    
    for item_name in items:
        try:
            item = frappe.get_doc("Item", item_name)
            
            # Check permission
            if not frappe.has_permission("Item", "write", item):
                continue
            
            # Remove users
            for user in users:
                for i, d in enumerate(item.custom_allowed_users):
                    if d.user == user:
                        item.remove(d)
                        removed += 1
                        break
            
            item.save(ignore_permissions=True)
            updated += 1
            
        except Exception as e:
            frappe.log_error(f"Error removing access from item {item_name}: {str(e)}")
            continue
    
    frappe.db.commit()
    
    return {
        "success": True,
        "updated": updated,
        "removed": removed,
        "message": _("Removed access from {0} item(s)").format(updated)
    }


@frappe.whitelist()
def get_visibility_stats():
    """
    Get statistics about item visibility.
    
    Returns:
        Dict with statistics
    """
    stats = {}
    
    # Total items
    stats['total'] = frappe.db.count('Item')
    
    # Private items
    stats['private'] = frappe.db.sql("""
        SELECT COUNT(*) 
        FROM `tabItem` 
        WHERE custom_is_private = 1
    """)[0][0] or 0
    
    # Public items
    stats['public'] = stats['total'] - stats['private']
    
    # Shared items (private items with allowed users)
    stats['shared'] = frappe.db.sql("""
        SELECT COUNT(DISTINCT parent) 
        FROM `tabItem Allowed User`
    """)[0][0] or 0
    
    # Most shared item
    most_shared = frappe.db.sql("""
        SELECT parent, COUNT(*) as count
        FROM `tabItem Allowed User`
        GROUP BY parent
        ORDER BY count DESC
        LIMIT 1
    """, as_dict=True)
    
    if most_shared:
        stats['most_shared'] = {
            'item': most_shared[0]['parent'],
            'count': most_shared[0]['count']
        }
    
    return stats
