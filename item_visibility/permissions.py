import frappe

def item_query(user):
    """
    Filter items in list view based on custom visibility.
    
    Returns SQL condition to filter items that the user can see:
    - All public items (custom_is_private = 0 or NULL)
    - Private items where user is in the allowed users list
    """
    
    if user == "Administrator":
        return ""
    
    return """(
        `tabItem`.custom_is_private != 1 
        OR `tabItem`.custom_is_private IS NULL
        OR `tabItem`.name IN (
            SELECT parent 
            FROM `tabItem Allowed User` 
            WHERE user = {user}
        )
    )""".format(user=frappe.db.escape(user))


def has_item_permission(doc, ptype, user):
    """
    Check permission when opening a specific item document.
    
    Args:
        doc: Item document
        ptype: Permission type (read, write, etc.)
        user: User email
        
    Returns:
        Boolean indicating if user has permission
    """
    
    if user == "Administrator":
        return True
    
    # If item is not private, allow access to all
    if not doc.get("custom_is_private"):
        return True
    
    # Check if user is in allowed users list
    allowed_users = [d.user for d in doc.get("custom_allowed_users", [])]
    return user in allowed_users


@frappe.whitelist()
def get_visible_items(user=None):
    """
    Get list of all items visible to a user.
    Useful for custom reports and queries.
    
    Args:
        user: User email (defaults to current user)
        
    Returns:
        List of item names
    """
    if not user:
        user = frappe.session.user
    
    if user == "Administrator":
        return frappe.db.sql_list("SELECT name FROM `tabItem`")
    
    return frappe.db.sql_list("""
        SELECT name FROM `tabItem`
        WHERE custom_is_private != 1 
        OR custom_is_private IS NULL
        OR name IN (
            SELECT parent FROM `tabItem Allowed User` WHERE user = %s
        )
    """, user)


@frappe.whitelist()
def share_item_with_role(item, role):
    """
    Share a private item with all users having a specific role.
    
    Args:
        item: Item name/ID
        role: Role name
    """
    if not frappe.has_permission("Item", "write", item):
        frappe.throw("No permission to share this item")
    
    # Get all users with this role
    users = frappe.db.sql_list("""
        SELECT DISTINCT parent 
        FROM `tabHas Role` 
        WHERE role = %s 
        AND parenttype = 'User'
    """, role)
    
    item_doc = frappe.get_doc("Item", item)
    
    # Add users to allowed list if not already present
    existing_users = [d.user for d in item_doc.custom_allowed_users]
    
    for user in users:
        if user not in existing_users:
            item_doc.append("custom_allowed_users", {
                "user": user
            })
    
    item_doc.save()
    
    return {
        "message": f"Item shared with {len(users)} users having role '{role}'",
        "users_added": len(users) - len(existing_users)
    }


@frappe.whitelist()
def remove_user_access(item, user):
    """
    Remove a user's access to a private item.
    
    Args:
        item: Item name/ID
        user: User email
    """
    if not frappe.has_permission("Item", "write", item):
        frappe.throw("No permission to modify this item's sharing")
    
    item_doc = frappe.get_doc("Item", item)
    
    # Find and remove the user
    for i, d in enumerate(item_doc.custom_allowed_users):
        if d.user == user:
            item_doc.remove(d)
            break
    
    item_doc.save()
    
    return {"message": f"Access removed for {user}"}
