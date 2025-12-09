frappe.pages['item-visibility-manager'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Item Visibility Manager',
		single_column: true
	});

	new ItemVisibilityManager(page);
};

class ItemVisibilityManager {
	constructor(page) {
		this.page = page;
		this.parent = $(page.body);
		this.filters = {};
		
		this.setup_view();
		this.setup_filters();
		this.load_items();
	}

	setup_view() {
		// Add primary action buttons
		this.page.set_primary_action(__('Make Items Private'), () => {
			this.bulk_action('make_private');
		});

		this.page.add_action_icon('refresh', () => {
			this.load_items();
		});

		// Create main container
		this.parent.html(`
			<div class="item-visibility-manager">
				<div class="filter-section" style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div class="row">
						<div class="col-md-3">
							<label>${__('Filter by Status')}</label>
							<select class="form-control" id="status-filter">
								<option value="all">${__('All Items')}</option>
								<option value="private">${__('Private Items')}</option>
								<option value="public">${__('Public Items')}</option>
							</select>
						</div>
						<div class="col-md-3">
							<label>${__('Filter by Item Group')}</label>
							<select class="form-control" id="item-group-filter">
								<option value="">${__('All Groups')}</option>
							</select>
						</div>
						<div class="col-md-3">
							<label>${__('Search Items')}</label>
							<input type="text" class="form-control" id="search-items" placeholder="${__('Search by name or code...')}">
						</div>
						<div class="col-md-3">
							<label>&nbsp;</label><br>
							<button class="btn btn-default btn-sm" id="apply-filters">
								<i class="fa fa-filter"></i> ${__('Apply Filters')}
							</button>
						</div>
					</div>
				</div>

				<div class="stats-section" style="margin-bottom: 20px;">
					<div class="row">
						<div class="col-md-3">
							<div class="stat-card" style="padding: 15px; background: #e3f2fd; border-radius: 8px; text-align: center;">
								<h3 id="total-items" style="margin: 0; color: #1976d2;">0</h3>
								<p style="margin: 5px 0 0 0; color: #666;">${__('Total Items')}</p>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card" style="padding: 15px; background: #fff3e0; border-radius: 8px; text-align: center;">
								<h3 id="private-items" style="margin: 0; color: #f57c00;">0</h3>
								<p style="margin: 5px 0 0 0; color: #666;">${__('Private Items')}</p>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card" style="padding: 15px; background: #e8f5e9; border-radius: 8px; text-align: center;">
								<h3 id="public-items" style="margin: 0; color: #388e3c;">0</h3>
								<p style="margin: 5px 0 0 0; color: #666;">${__('Public Items')}</p>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card" style="padding: 15px; background: #f3e5f5; border-radius: 8px; text-align: center;">
								<h3 id="shared-items" style="margin: 0; color: #7b1fa2;">0</h3>
								<p style="margin: 5px 0 0 0; color: #666;">${__('Shared Items')}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="items-table-section" style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<div style="padding: 15px; border-bottom: 1px solid #eee;">
						<div class="row">
							<div class="col-md-6">
								<h4 style="margin: 0;">${__('Items')}</h4>
							</div>
							<div class="col-md-6 text-right">
								<button class="btn btn-sm btn-default" id="select-all">
									<i class="fa fa-check-square-o"></i> ${__('Select All')}
								</button>
								<button class="btn btn-sm btn-default" id="deselect-all">
									<i class="fa fa-square-o"></i> ${__('Deselect All')}
								</button>
								<button class="btn btn-sm btn-primary" id="bulk-make-private">
									<i class="fa fa-lock"></i> ${__('Make Private')}
								</button>
								<button class="btn btn-sm btn-success" id="bulk-make-public">
									<i class="fa fa-unlock"></i> ${__('Make Public')}
								</button>
								<button class="btn btn-sm btn-warning" id="bulk-share">
									<i class="fa fa-share-alt"></i> ${__('Share Selected')}
								</button>
							</div>
						</div>
					</div>
					<div id="items-table" style="padding: 15px;">
						<div class="text-center" style="padding: 40px;">
							<i class="fa fa-spinner fa-spin fa-2x text-muted"></i>
							<p class="text-muted" style="margin-top: 10px;">${__('Loading items...')}</p>
						</div>
					</div>
				</div>
			</div>
		`);

		this.setup_event_handlers();
		this.load_item_groups();
	}

	setup_event_handlers() {
		// Filter handlers
		this.parent.find('#apply-filters').on('click', () => {
			this.load_items();
		});

		this.parent.find('#search-items').on('keyup', frappe.utils.debounce(() => {
			this.load_items();
		}, 500));

		// Bulk action handlers
		this.parent.find('#select-all').on('click', () => {
			this.parent.find('.item-checkbox').prop('checked', true);
		});

		this.parent.find('#deselect-all').on('click', () => {
			this.parent.find('.item-checkbox').prop('checked', false);
		});

		this.parent.find('#bulk-make-private').on('click', () => {
			this.bulk_action('make_private');
		});

		this.parent.find('#bulk-make-public').on('click', () => {
			this.bulk_action('make_public');
		});

		this.parent.find('#bulk-share').on('click', () => {
			this.bulk_share();
		});
	}

	load_item_groups() {
		frappe.call({
			method: 'frappe.client.get_list',
			args: {
				doctype: 'Item Group',
				fields: ['name'],
				limit_page_length: 0
			},
			callback: (r) => {
				if (r.message) {
					let select = this.parent.find('#item-group-filter');
					r.message.forEach(group => {
						select.append(`<option value="${group.name}">${group.name}</option>`);
					});
				}
			}
		});
	}

	load_items() {
		let filters = {
			doctype: 'Item'
		};

		// Apply status filter
		let status = this.parent.find('#status-filter').val();
		if (status === 'private') {
			filters.custom_is_private = 1;
		} else if (status === 'public') {
			filters.custom_is_private = ['in', [0, null]];
		}

		// Apply item group filter
		let item_group = this.parent.find('#item-group-filter').val();
		if (item_group) {
			filters.item_group = item_group;
		}

		// Apply search filter
		let search = this.parent.find('#search-items').val();
		if (search) {
			filters.name = ['like', `%${search}%`];
		}

		frappe.call({
			method: 'item_visibility.api.get_items_with_visibility',
			args: { filters: filters },
			callback: (r) => {
				if (r.message) {
					this.render_items(r.message);
					this.update_stats(r.message);
				}
			}
		});
	}

	render_items(items) {
		if (items.length === 0) {
			this.parent.find('#items-table').html(`
				<div class="text-center" style="padding: 40px;">
					<i class="fa fa-inbox fa-3x text-muted"></i>
					<p class="text-muted" style="margin-top: 10px;">${__('No items found')}</p>
				</div>
			`);
			return;
		}

		let html = `
			<table class="table table-bordered table-hover">
				<thead>
					<tr>
						<th width="40"><input type="checkbox" id="master-checkbox"></th>
						<th>${__('Item Code')}</th>
						<th>${__('Item Name')}</th>
						<th>${__('Item Group')}</th>
						<th>${__('Status')}</th>
						<th>${__('Shared With')}</th>
						<th width="200">${__('Actions')}</th>
					</tr>
				</thead>
				<tbody>
		`;

		items.forEach(item => {
			let status_badge = item.custom_is_private 
				? '<span class="label label-warning">Private</span>' 
				: '<span class="label label-success">Public</span>';
			
			let shared_count = item.allowed_users ? item.allowed_users.length : 0;
			let shared_text = shared_count > 0 
				? `${shared_count} user(s)` 
				: '<span class="text-muted">None</span>';

			html += `
				<tr data-item="${item.name}">
					<td><input type="checkbox" class="item-checkbox" value="${item.name}"></td>
					<td><a href="/app/item/${item.name}" target="_blank">${item.name}</a></td>
					<td>${item.item_name || ''}</td>
					<td>${item.item_group || ''}</td>
					<td>${status_badge}</td>
					<td>${shared_text}</td>
					<td>
						<button class="btn btn-xs btn-default btn-edit" data-item="${item.name}">
							<i class="fa fa-pencil"></i> ${__('Edit')}
						</button>
						<button class="btn btn-xs btn-primary btn-share" data-item="${item.name}">
							<i class="fa fa-share"></i> ${__('Share')}
						</button>
						<button class="btn btn-xs ${item.custom_is_private ? 'btn-success' : 'btn-warning'} btn-toggle" data-item="${item.name}" data-private="${item.custom_is_private}">
							<i class="fa fa-${item.custom_is_private ? 'unlock' : 'lock'}"></i>
						</button>
					</td>
				</tr>
			`;
		});

		html += '</tbody></table>';

		this.parent.find('#items-table').html(html);

		// Add event handlers for action buttons
		this.parent.find('.btn-edit').on('click', (e) => {
			let item = $(e.currentTarget).data('item');
			frappe.set_route('Form', 'Item', item);
		});

		this.parent.find('.btn-share').on('click', (e) => {
			let item = $(e.currentTarget).data('item');
			this.show_share_dialog([item]);
		});

		this.parent.find('.btn-toggle').on('click', (e) => {
			let item = $(e.currentTarget).data('item');
			let is_private = $(e.currentTarget).data('private');
			this.toggle_visibility([item], !is_private);
		});

		this.parent.find('#master-checkbox').on('change', (e) => {
			this.parent.find('.item-checkbox').prop('checked', $(e.target).prop('checked'));
		});
	}

	update_stats(items) {
		let total = items.length;
		let private_count = items.filter(i => i.custom_is_private).length;
		let public_count = total - private_count;
		let shared_count = items.filter(i => i.allowed_users && i.allowed_users.length > 0).length;

		this.parent.find('#total-items').text(total);
		this.parent.find('#private-items').text(private_count);
		this.parent.find('#public-items').text(public_count);
		this.parent.find('#shared-items').text(shared_count);
	}

	bulk_action(action) {
		let selected = this.get_selected_items();
		
		if (selected.length === 0) {
			frappe.msgprint(__('Please select at least one item'));
			return;
		}

		if (action === 'make_private') {
			this.toggle_visibility(selected, true);
		} else if (action === 'make_public') {
			this.toggle_visibility(selected, false);
		}
	}

	bulk_share() {
		let selected = this.get_selected_items();
		
		if (selected.length === 0) {
			frappe.msgprint(__('Please select at least one item'));
			return;
		}

		this.show_share_dialog(selected);
	}

	get_selected_items() {
		let selected = [];
		this.parent.find('.item-checkbox:checked').each(function() {
			selected.push($(this).val());
		});
		return selected;
	}

	toggle_visibility(items, make_private) {
		frappe.call({
			method: 'item_visibility.api.bulk_toggle_visibility',
			args: {
				items: items,
				is_private: make_private
			},
			freeze: true,
			freeze_message: __('Updating items...'),
			callback: (r) => {
				if (r.message) {
					frappe.show_alert({
						message: __('Updated {0} item(s)', [items.length]),
						indicator: 'green'
					});
					this.load_items();
				}
			}
		});
	}

	show_share_dialog(items) {
		let d = new frappe.ui.Dialog({
			title: __('Share Items'),
			fields: [
				{
					fieldtype: 'HTML',
					options: `<p>${__('Sharing {0} item(s)', [items.length])}</p>`
				},
				{
					fieldtype: 'Section Break',
					label: __('Share with Users')
				},
				{
					fieldname: 'users',
					fieldtype: 'Table MultiSelect',
					label: __('Select Users'),
					options: 'User',
					get_query: () => {
						return {
							filters: {
								enabled: 1
							}
						};
					}
				},
				{
					fieldtype: 'Section Break',
					label: __('Or Share with Role')
				},
				{
					fieldname: 'role',
					fieldtype: 'Link',
					label: __('Select Role'),
					options: 'Role'
				}
			],
			primary_action_label: __('Share'),
			primary_action: (values) => {
				if (!values.users && !values.role) {
					frappe.msgprint(__('Please select users or a role'));
					return;
				}

				frappe.call({
					method: 'item_visibility.api.bulk_share_items',
					args: {
						items: items,
						users: values.users,
						role: values.role
					},
					freeze: true,
					freeze_message: __('Sharing items...'),
					callback: (r) => {
						if (r.message) {
							frappe.show_alert({
								message: r.message.message,
								indicator: 'green'
							});
							d.hide();
							this.load_items();
						}
					}
				});
			}
		});

		d.show();
	}
}
