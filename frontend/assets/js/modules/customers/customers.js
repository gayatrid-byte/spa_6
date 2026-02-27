// Customers module
let customers = [];
let currentFilters = {
  dateFilter: 'all',
  sortBy: 'created_desc',
  membershipFilter: 'all'
};

export async function render(container) {
  if (window.__openCustomerFromCalendar) {
  delete window.__openCustomerFromCalendar;
  setTimeout(() => showCustomerForm(), 0);
}



  try {
    // Load customers with default filters
    await loadCustomers();
    
    container.innerHTML = `
      <div class="card mb-3">
        <h3>Customer Filters</h3>
        <div class="d-flex gap-2 mb-3">
          <div class="form-group" style="flex: 1">
            <label for="dateFilter">Date Filter</label>
            <select id="dateFilter" class="form-control">
              <option value="all" ${currentFilters.dateFilter === 'all' ? 'selected' : ''}>All Customers</option>
              <option value="today" ${currentFilters.dateFilter === 'today' ? 'selected' : ''}>Today</option>
              <option value="last_7_days" ${currentFilters.dateFilter === 'last_7_days' ? 'selected' : ''}>Last 1 Week</option>
              <option value="last_30_days" ${currentFilters.dateFilter === 'last_30_days' ? 'selected' : ''}>Last 1 Month</option>
              <option value="last_90_days" ${currentFilters.dateFilter === 'last_90_days' ? 'selected' : ''}>Last 3 Months</option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 1">
            <label for="sortBy">Sort By</label>
            <select id="sortBy" class="form-control">
              <option value="created_desc" ${currentFilters.sortBy === 'created_desc' ? 'selected' : ''}>Newest First</option>
              <option value="created_asc" ${currentFilters.sortBy === 'created_asc' ? 'selected' : ''}>Oldest First</option>
              <option value="name_asc" ${currentFilters.sortBy === 'name_asc' ? 'selected' : ''}>Name A → Z</option>
              <option value="name_desc" ${currentFilters.sortBy === 'name_desc' ? 'selected' : ''}>Name Z → A</option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 1">
            <label for="membershipFilter">Membership</label>
            <select id="membershipFilter" class="form-control">
              <option value="all" ${currentFilters.membershipFilter === 'all' ? 'selected' : ''}>All</option>
              <option value="has" ${currentFilters.membershipFilter === 'has' ? 'selected' : ''}>Has Membership</option>
              <option value="none" ${currentFilters.membershipFilter === 'none' ? 'selected' : ''}>No Membership</option>
              <option value="active" ${currentFilters.membershipFilter === 'active' ? 'selected' : ''}>Active</option>
              <option value="pending" ${currentFilters.membershipFilter === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="expired" ${currentFilters.membershipFilter === 'expired' ? 'selected' : ''}>Expired</option>
            </select>
          </div>
          
          <div class="form-group" style="flex: 2">
            <label for="searchCustomer">Search</label>
            <div class="d-flex gap-1">
              <input type="text" id="searchCustomer" placeholder="Search by phone, name, email..." class="form-control">
              <button id="clearSearchBtn" class="btn btn-outline">Clear</button>
            </div>
          </div>
        </div>
        
        <div id="activeFilters" class="mb-2"></div>
      </div>
      
      <div class="table-container">
        <div class="table-header">
          <h2 class="table-title">Customers</h2>
          <div class="d-flex gap-2">
            <button id="addCustomerBtn" class="btn btn-primary">Add Customer</button>
          </div>
        </div>
        
        <div id="customersTable">
          ${renderCustomersTable(customers)}
        </div>
      </div>
    `;
    attachEventListeners(container);
    updateActiveFiltersDisplay();

    // 🔥 OPEN FORM AFTER DOM IS READY
    if (window.__openCustomerFromCalendar) {
      delete window.__openCustomerFromCalendar;
      showCustomerForm();
    }
    // Attach event listeners
    attachEventListeners(container);
    updateActiveFiltersDisplay();
  } catch (error) {
    console.error('Error loading customers:', error);
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>Failed to load customers: ${error.message}</p>
      </div>
    `;
  }
}

async function loadCustomers() {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('dateFilter', currentFilters.dateFilter);
    params.append('sortBy', currentFilters.sortBy);
    params.append('membershipFilter', currentFilters.membershipFilter);
    
    // Pass filters to API to enable backend filtering/sorting
    customers = await api.customers.getAll({
      dateFilter: currentFilters.dateFilter,
      sortBy: currentFilters.sortBy,
      membershipFilter: currentFilters.membershipFilter
    });
  } catch (error) {
    console.error('Error loading customers:', error);
    throw error;
  }
}

function renderCustomersTable(customersList) {
  // Apply sorting to the data
  let sortedCustomers = [...customersList];
  
  sortedCustomers.sort((a, b) => {
    switch (currentFilters.sortBy) {
      case 'created_desc':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'created_asc':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'name_asc':
        const nameA = (a.name || a.phone || '').toLowerCase();
        const nameB = (b.name || b.phone || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      case 'name_desc':
        const nameA2 = (a.name || a.phone || '').toLowerCase();
        const nameB2 = (b.name || b.phone || '').toLowerCase();
        if (nameA2 > nameB2) return -1;
        if (nameA2 < nameB2) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });
  
  if (sortedCustomers.length === 0) {
    return '<p class="text-center">No customers found</p>';
  }
  
  return `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Membership</th>
          <th>Created Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sortedCustomers.map(customer => `
          <tr>
            <td>
              <div style="font-weight: ${customer.name ? 'bold' : 'normal'}">
                ${customer.name || customer.phone || 'N/A'}
              </div>
              ${customer.name && customer.phone ? `<small class="text-muted">${customer.phone}</small>` : ''}
            </td>
            <td>${customer.email || '—'}</td>
            <td>${customer.phone || '—'}</td>
            <td>${customer.address || '—'}</td>
            <td>
              ${customer.membership_plan_name ? `
                <div>${customer.membership_plan_name}${customer.membership_tier ? ` <small class="text-muted">(${customer.membership_tier})</small>` : ''}</div>
                ${(() => {
                  const status = customer.membership_status || '';
                  const endDate = customer.membership_end_date ? utils.formatDate(customer.membership_end_date) : null;
                  const label = endDate ? `${status} until ${endDate}` : status;
                  return `<small class="text-muted">${label}</small>`;
                })()}
              ` : `
                <div>
                  <button class="btn btn-sm" onclick="window.customersModule.addMembership(${customer.id})">Add Membership</button>
                </div>
              `}
            </td>
            <td>${utils.formatDate(customer.created_at)}</td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="window.customersModule.editCustomer(${customer.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="window.customersModule.deleteCustomer(${customer.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function updateActiveFiltersDisplay() {
  const activeFiltersDiv = document.getElementById('activeFilters');
  if (!activeFiltersDiv) return;
  
  const filters = [];
  
  // Add date filter
  if (currentFilters.dateFilter !== 'all') {
    const dateLabels = {
      'today': 'Today',
      'last_7_days': 'Last 1 Week',
      'last_30_days': 'Last 1 Month',
      'last_90_days': 'Last 3 Months'
    };
    filters.push(`Date: ${dateLabels[currentFilters.dateFilter]} <span class="clear-filter" data-filter="dateFilter">×</span>`);
  }
  
  // Add sort filter if not default
  if (currentFilters.sortBy !== 'created_desc') {
    const sortLabels = {
      'created_asc': 'Oldest First',
      'name_asc': 'Name A→Z',
      'name_desc': 'Name Z→A'
    };
    filters.push(`Sort: ${sortLabels[currentFilters.sortBy]} <span class="clear-filter" data-filter="sortBy">×</span>`);
  }
  
  // Membership
  if (currentFilters.membershipFilter !== 'all') {
    const membershipLabels = {
      'has': 'Has Membership',
      'none': 'No Membership',
      'active': 'Membership: Active',
      'pending': 'Membership: Pending',
      'expired': 'Membership: Expired'
    };
    filters.push(`Membership: ${membershipLabels[currentFilters.membershipFilter]} <span class="clear-filter" data-filter="membershipFilter">×</span>`);
  }
  
  if (filters.length > 0) {
    activeFiltersDiv.innerHTML = `
      <div class="d-flex gap-2 flex-wrap">
        ${filters.map(filter => `
          <span class="badge badge-info d-flex align-items-center">
            ${filter}
          </span>
        `).join('')}
        <button id="clearAllFiltersBtn" class="btn btn-sm btn-outline">Clear All</button>
      </div>
    `;
    
    // Add event listeners to clear buttons
    activeFiltersDiv.querySelectorAll('.clear-filter').forEach(btn => {
      btn.addEventListener('click', async function() {
        const filter = this.dataset.filter;
        
        if (filter === 'dateFilter') {
          document.getElementById('dateFilter').value = 'all';
          currentFilters.dateFilter = 'all';
        } else if (filter === 'sortBy') {
          document.getElementById('sortBy').value = 'created_desc';
          currentFilters.sortBy = 'created_desc';
        } else if (filter === 'membershipFilter') {
          document.getElementById('membershipFilter').value = 'all';
          currentFilters.membershipFilter = 'all';
        }
        
        await applyFilters();
      });
    });
    
    // Clear all filters button
    const clearAllBtn = document.getElementById('clearAllFiltersBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', async function() {
        // Reset all filters
        document.getElementById('dateFilter').value = 'all';
        document.getElementById('sortBy').value = 'created_desc';
        document.getElementById('membershipFilter').value = 'all';
        currentFilters.dateFilter = 'all';
        currentFilters.sortBy = 'created_desc';
        currentFilters.membershipFilter = 'all';
        
        // Clear search
        const searchInput = document.getElementById('searchCustomer');
        if (searchInput) searchInput.value = '';
        
        await applyFilters();
      });
    }
  } else {
    activeFiltersDiv.innerHTML = '<span class="text-muted">No filters applied</span>';
  }
}

function attachEventListeners(container) {
  // Top bar filter changes
  const dateFilter = container.querySelector('#dateFilter');
  const sortBy = container.querySelector('#sortBy');
  const membershipFilter = container.querySelector('#membershipFilter');
  
  dateFilter?.addEventListener('change', async function() {
    currentFilters.dateFilter = this.value;
    await applyFilters();
  });
  
  sortBy?.addEventListener('change', async function() {
    currentFilters.sortBy = this.value;
    await applyFilters();
  });
  
  membershipFilter?.addEventListener('change', async function() {
    currentFilters.membershipFilter = this.value;
    await applyFilters();
  });
  
  // Search input
  const searchInput = container.querySelector('#searchCustomer');
  searchInput?.addEventListener('input', utils.debounce(async function(e) {
    const query = e.target.value.trim();
    if (query) {
      try {
        const results = await api.customers.search(query);
        customers = results;
        const tableDiv = document.getElementById('customersTable');
        if (tableDiv) {
          tableDiv.innerHTML = renderCustomersTable(customers);
        }
        updateActiveFiltersDisplay();
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      await loadAndRenderCustomers();
    }
  }, 500));
  
  // Clear search button
  const clearSearchBtn = container.querySelector('#clearSearchBtn');
  clearSearchBtn?.addEventListener('click', async function() {
    if (searchInput) searchInput.value = '';
    await loadAndRenderCustomers();
  });
  
  // Add customer
  const addBtn = container.querySelector('#addCustomerBtn');
    // Listen for open-customer-form event from other modules
  document.addEventListener('open-customer-form', () => {
    showCustomerForm();
  });
  addBtn?.addEventListener('click', () => showCustomerForm());
}

async function applyFilters() {
  try {
    await loadCustomers();
    const tableDiv = document.getElementById('customersTable');
    if (tableDiv) {
      tableDiv.innerHTML = renderCustomersTable(customers);
      updateActiveFiltersDisplay();
    }
  } catch (error) {
    console.error('Error applying filters:', error);
    utils.showToast('Error applying filters', 'error');
  }
}

async function loadAndRenderCustomers() {
  try {
    await loadCustomers();
    const tableDiv = document.getElementById('customersTable');
    if (tableDiv) {
      tableDiv.innerHTML = renderCustomersTable(customers);
      updateActiveFiltersDisplay();
    }
  } catch (error) {
    console.error('Error loading customers:', error);
    utils.showToast('Error loading customers', 'error');
  }
}

export function showCustomerForm(customer = null) {
  const isEdit = !!customer;
  
  const formHTML = `
    <form id="customerForm">
      <div class="form-group">
        <label for="customerPhone"><strong>Phone Number *</strong></label>
        <input type="tel" id="customerPhone" name="phone" 
               value="${customer?.phone || ''}" 
               placeholder="Enter 10-digit phone number" 
               required
               pattern="[0-9]{10}"
               maxlength="10"
               title="Please enter exactly 10 digits">
        <small class="text-muted">Required field. Must be exactly 10 digits. Phone number must be unique.</small>
      </div>
      
      <div class="form-group">
        <label for="customerName">Name <small class="text-muted">(Optional)</small></label>
        <input type="text" id="customerName" name="name" 
               value="${customer?.name || ''}" 
               placeholder="Enter customer name (optional)">
      </div>
      
      <div class="form-group">
        <label for="customerEmail">Email <small class="text-muted">(Optional)</small></label>
        <input type="email" id="customerEmail" name="email" 
               value="${customer?.email || ''}" 
               placeholder="Enter email address (optional)">
      </div>
      
      <div class="form-group">
        <label for="customerAddress">Address <small class="text-muted">(Optional)</small></label>
        <input type="text" id="customerAddress" name="address" 
               value="${customer?.address || ''}" 
               placeholder="Enter address (optional)">
      </div>
      
      <div class="form-group">
        <label for="customerNotes">Notes <small class="text-muted">(Optional)</small></label>
        <textarea id="customerNotes" name="notes" rows="3" 
                  placeholder="Add notes (optional)">${customer?.notes || ''}</textarea>
      </div>
      
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">
          ${isEdit ? 'Update' : 'Create'} Customer
        </button>
        <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">
          Cancel
        </button>
      </div>
    </form>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Customer' : 'Add Customer', formHTML);
  
  // Focus on phone field
  setTimeout(() => {
    document.getElementById('customerPhone')?.focus();
  }, 100);
  
  // Add phone input formatting - only allow numbers and limit to 10 digits
  const phoneInput = document.getElementById('customerPhone');
  phoneInput?.addEventListener('input', function(e) {
    // Remove any non-numeric characters
    let value = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    e.target.value = value;
  });
  
  // Attach form submit handler
  document.getElementById('customerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const phone = document.getElementById('customerPhone').value.trim();
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const notes = document.getElementById('customerNotes').value.trim();
    
    // Validate phone format - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      utils.showToast('Please enter exactly 10 digits for phone number', 'error');
      return;
    }
    
    const formData = {
      phone: phone,
      name: name || null,
      email: email || null,
      address: address || null,
      notes: notes || null
    };
    
    try {
      if (isEdit) {
        await api.customers.update(customer.id, formData);
        utils.showToast('Customer updated successfully', 'success');
      } else {
        await api.customers.create(formData);
        utils.showToast('Customer created successfully', 'success');
      }
      
      window.appUtils.closeModal();

      if (window.__calendarContext) {
        window.__calendarContext = false;

        if (window.calendarInstance) {
          window.calendarInstance.refetchEvents();
        }

      } else {
        await loadAndRenderCustomers();
      }

    } catch (error) {
      if (error.message.includes('already exists')) {
        utils.showToast('Phone number already exists for another customer', 'error');
      } else if (error.message.includes('Phone number is required')) {
        utils.showToast('Phone number is required', 'error');
      } else {
        utils.showToast(error.message || 'Operation failed', 'error');
      }
    }
  });
}

// Export functions for global access
window.customersModule = {
  showCustomerForm,
  editCustomer: async function(id) {
    const customer = await api.customers.getById(id);
    showCustomerForm(customer);
  },
  
  deleteCustomer: async function(id) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await api.customers.delete(id);
        utils.showToast('Customer deleted successfully', 'success');
        await loadAndRenderCustomers();
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  },

  addMembership: async function(customerId) {
    try {
      const plans = await api.memberships.getPlans();
      if (!plans || plans.length === 0) {
        utils.showToast('No membership plans available', 'error');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const planOptions = plans.map(p => `
        <option value="${p.id}">
          ${p.name} (${p.tier}) - ${p.duration_days} days
        </option>
      `).join('');

      const formHTML = `
        <form id="assignMembershipForm">
          <div class="form-group">
            <label for="assignPlan">Plan</label>
            <select id="assignPlan" class="form-control" required>
              ${planOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="assignStart">Start Date</label>
            <input type="date" id="assignStart" class="form-control" value="${today}" required />
          </div>
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">Assign</button>
            <button type="button" class="btn btn-outline" onclick="window.appUtils.closeModal()">Cancel</button>
          </div>
        </form>
      `;

      window.appUtils.showModal('Assign Membership', formHTML);

      document.getElementById('assignMembershipForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const selectedPlan = parseInt(document.getElementById('assignPlan').value, 10);
        const startDate = document.getElementById('assignStart').value;

        try {
          await api.memberships.assign({ customer_id: customerId, plan_id: selectedPlan, start_date: startDate });
          utils.showToast('Membership assigned successfully', 'success');
          window.appUtils.closeModal();
          await loadAndRenderCustomers();
        } catch (err) {
          utils.showToast(err.message || 'Assignment failed', 'error');
        }
      });
    } catch (error) {
      utils.showToast(error.message || 'Failed to load plans', 'error');
    }
  }
};

/* =========================================================
   GLOBAL EVENT LISTENER (CALENDAR → CUSTOMER)
   ========================================================= */
if (!window.__customerEventRegistered) {
  document.addEventListener('open-customer-form', () => {
    showCustomerForm();
  });
  window.__customerEventRegistered = true;
}
