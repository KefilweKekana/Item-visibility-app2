frappe.ui.form.on('Item', {
    refresh: function(frm) {
        // Add custom buttons for sharing
        if (frm.doc.custom_is_private && !frm.is_new()) {
            add_sharing_buttons(frm);
        }
        
        // Show warning if private but no users added
        if (frm.doc.custom_is_private && 
            (!frm.doc.custom_allowed_users || frm.doc.custom_allowed_users.length === 0)) {
            frm.dashboard.add_comment(
                __('Warning: This is a private item but no users have been added. Only you can see it.'), 
                'yellow', 
                true
            );
        }
        
        // Add indicator
        update_visibility_indicator(frm);
    },
    
    custom_is_private: function(frm) {
        // Clear allowed users when making item public
        if (!frm.doc.custom_is_private) {
            frm.clear_table('custom_allowed_users');
            frm.refresh_field('custom_allowed_users');
        }
        
        // Show warning for private items
        if (frm.doc.custom_is_private && 
            (!frm.doc.custom_allowed_users || frm.doc.custom_allowed_users.length === 0)) {
            frappe.msgprint({
                title: __('Private Item'),
                message: __('This item is now private. Add users below to share it with specific people.'),
                indicator: 'orange'
            });
        }
        
        update_visibility_indicator(frm);
    }
});

function add_sharing_buttons(frm) {
    // Button to share with a role
    frm.add_custom_button(__('Share with Role'), function() {
        frappe.prompt({
            label: __('Role'),
            fieldname: 'role',
            fieldtype: 'Link',
            options: 'Role',
            reqd: 1
        }, function(values) {
            frappe.call({
                method: 'item_visibility.permissions.share_item_with_role',
                args: {
                    item: frm.doc.name,
                    role: values.role
                },
                freeze: true,
                freeze_message: __('Sharing item...'),
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint({
                            title: __('Success'),
                            message: r.message.message,
                            indicator: 'green'
                        });
                        frm.reload_doc();
                    }
                }
            });
        }, __('Share Item with Role'));
    }, __('Visibility'));
    
    // Button to view who can access
    frm.add_custom_button(__('View Access'), function() {
        let allowed_users = frm.doc.custom_allowed_users || [];
        
        if (allowed_users.length === 0) {
            frappe.msgprint({
                title: __('No Users'),
                message: __('No users have access to this private item yet.'),
                indicator: 'orange'
            });
            return;
        }
        
        let html = '<div style="max-height: 400px; overflow-y: auto;">';
        html += '<table class="table table-bordered">';
        html += '<thead><tr><th>User</th><th>Action</th></tr></thead><tbody>';
        
        allowed_users.forEach(function(row) {
            html += `<tr>
                <td>${row.user}</td>
                <td><button class="btn btn-xs btn-danger" onclick="remove_user_access('${frm.doc.name}', '${row.user}')">Remove</button></td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        frappe.msgprint({
            title: __('Users with Access'),
            message: html,
            wide: true
        });
    }, __('Visibility'));
}

function update_visibility_indicator(frm) {
    // Add visual indicator for item visibility
    if (frm.doc.custom_is_private) {
        let count = frm.doc.custom_allowed_users ? frm.doc.custom_allowed_users.length : 0;
        frm.dashboard.set_headline_alert(
            __('Private Item - Shared with {0} user(s)', [count]),
            'orange'
        );
    } else {
        frm.dashboard.clear_headline();
    }
}

// Global function to remove user access (called from msgprint)
window.remove_user_access = function(item, user) {
    frappe.confirm(
        __('Remove access for {0}?', [user]),
        function() {
            frappe.call({
                method: 'item_visibility.permissions.remove_user_access',
                args: {
                    item: item,
                    user: user
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint({
                            title: __('Success'),
                            message: r.message.message,
                            indicator: 'green'
                        });
                        cur_frm.reload_doc();
                    }
                }
            });
        }
    );
};
