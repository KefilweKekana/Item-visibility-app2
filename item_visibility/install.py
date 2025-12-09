import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

def after_install():
    """
    Run after app installation to set up custom fields and configurations.
    """
    print("Setting up Item Visibility...")
    
    # Create custom fields
    create_item_custom_fields()
    
    # Clear cache to ensure changes take effect
    frappe.clear_cache()
    
    print("Item Visibility setup completed successfully!")


def create_item_custom_fields():
    """
    Create custom fields on Item doctype for visibility control.
    """
    custom_fields = {
        "Item": [
            {
                "fieldname": "custom_visibility_section",
                "label": "Item Visibility Settings",
                "fieldtype": "Section Break",
                "insert_after": "disabled",
                "collapsible": 1
            },
            {
                "fieldname": "custom_is_private",
                "label": "Is Private Item",
                "fieldtype": "Check",
                "insert_after": "custom_visibility_section",
                "description": "If checked, only allowed users can see this item",
                "default": "0"
            },
            {
                "fieldname": "custom_visibility_column_break",
                "fieldtype": "Column Break",
                "insert_after": "custom_is_private"
            },
            {
                "fieldname": "custom_visibility_help",
                "label": "Visibility Help",
                "fieldtype": "HTML",
                "insert_after": "custom_visibility_column_break",
                "options": """
                    <div style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin-top: 10px;">
                        <strong>How Item Visibility Works:</strong><br>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            <li><strong>Public Items:</strong> Unchecked - Everyone can see</li>
                            <li><strong>Private Items:</strong> Checked - Only allowed users can see</li>
                        </ul>
                        <em>Add users below to share private items.</em>
                    </div>
                """
            },
            {
                "fieldname": "custom_allowed_users",
                "label": "Allowed Users",
                "fieldtype": "Table",
                "options": "Item Allowed User",
                "insert_after": "custom_visibility_help",
                "depends_on": "eval:doc.custom_is_private==1",
                "description": "Users who can view this private item"
            },
            {
                "fieldname": "custom_visibility_section_break",
                "fieldtype": "Section Break",
                "insert_after": "custom_allowed_users"
            }
        ]
    }
    
    create_custom_fields(custom_fields, update=True)
    print("Custom fields created successfully!")
