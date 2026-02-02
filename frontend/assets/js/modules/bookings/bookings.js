// Bookings module
let bookings = [];
let customers = [];
let mainCategories = [];
let subCategories = {};
let services = {};
let rooms = {};
let staff = {};


function reindexServiceItems() {
  document.querySelectorAll('.service-item').forEach((item, idx) => {
    item.dataset.index = idx;
    const title = item.querySelector('.service-header h5');
    if (title) title.textContent = `Service #${idx + 1}`;
  });
}

// Top-level submit handler to avoid scope issues
async function handleBookingFormSubmit(e) {
  if (e.target.id !== 'bookingForm') return;
  e.preventDefault();
  console.log('[Bookings] bookingForm submit triggered');

  const isEdit = !!e.target.dataset.bookingId;
  const formData = new FormData(e.target);
  const bookingData = {
    booking_type: formData.get('booking_type'),
    booking_date: formData.get('booking_date'),
    start_time: formData.get('start_time'),
    end_time: e.target.dataset.endTime,
    discount_amount: parseFloat(formData.get('discount_amount')) || 0,
    notes: formData.get('notes')
  };
  console.log('[Bookings] initial bookingData', bookingData);
  // Membership application flags
  bookingData.membership_apply = (e.target.dataset.membershipApply === 'true');
  bookingData.apply_free = (e.target.dataset.applyFree === 'true');
  bookingData.apply_percent = (e.target.dataset.applyPercent === 'true');
  bookingData.apply_wallet = (e.target.dataset.applyWallet === 'true');
  // Free services selected count
  bookingData.free_services_used = parseInt(e.target.dataset.freeCount || '0') || 0;
  // Preview totals from UI (server may recompute but we provide for consistency)
  bookingData.subtotal_preview = parseFloat(e.target.dataset.subtotal || '0') || 0;
  bookingData.plan_deduction_preview = parseFloat(e.target.dataset.planDeduction || '0') || 0;
  bookingData.wallet_applied_preview = parseFloat(e.target.dataset.walletApplied || '0') || 0;
  bookingData.total_amount_preview = parseFloat(e.target.dataset.finalTotal || '0') || 0;

  // Handle customer
  const customerId = formData.get('customer_id');
  console.log('[Bookings] form customer_id', customerId);
  if (customerId) {
    bookingData.customer_id = parseInt(customerId);
  } else if (formData.get('new_customer_phone')) {
    // Create new customer
    try {
      const newCustomer = await api.customers.create({
        name: formData.get('new_customer_name') || 'Walk-in Customer',
        phone: formData.get('new_customer_phone'),
        email: formData.get('new_customer_email') || '',
        salon_id: window.currentUser?.salon_id || 1
      });
      bookingData.customer_id = newCustomer.id;
    } catch (error) {
      utils.showToast('Error creating customer: ' + error.message, 'error');
      return;
    }
  }

  // Require customer selection if applying membership benefits
  if (!bookingData.customer_id && bookingData.membership_apply) {
    utils.showToast('Please select a customer to apply membership.', 'warning');
    return;
  }

  // Collect service items
  const serviceItems = [];
  document.querySelectorAll('.service-item').forEach(item => {
    const serviceData = {
      category_id: parseInt(item.querySelector('.main-category').value),
      subcategory_id: parseInt(item.querySelector('.sub-category').value),
      service_id: parseInt(item.querySelector('.service-select').value),
      room_id: (function(){
        const v = item.querySelector('.room-select').value;
        return v ? parseInt(v) : null;
      })(),
      staff_id: (function(){
        const v = item.querySelector('.staff-select').value;
        return v ? parseInt(v) : null;
      })(),
      price: (function(){
        const inp = item.querySelector('.price-input');
        const base = parseFloat(inp?.dataset?.basePrice || inp.value || '0');
        return base;
      })(),
      duration_minutes: parseInt(item.querySelector('.duration-input').value),
      notes: item.querySelector('.service-notes').value
    };
    if (serviceData.category_id && serviceData.subcategory_id && 
        serviceData.service_id &&
        serviceData.price > 0 && serviceData.duration_minutes > 0) {
      serviceItems.push(serviceData);
    }
  });

  if (serviceItems.length === 0) {
    utils.showToast('Please add at least one valid service', 'error');
    return;
  }

  bookingData.items = serviceItems;
  console.log('[Bookings] final bookingData before API', bookingData);

  try {
    if (isEdit) {
      const result = await api.bookings.update(e.target.dataset.bookingId, bookingData);
      console.log('[Bookings] update response', result);
      if (result && result.message) {
        utils.showToast(result.message, 'success');
      } else {
        utils.showToast('Booking updated successfully', 'success');
      }
    } else {
      const result = await api.bookings.create(bookingData);
      console.log('[Bookings] create response', result);
      if (result && result.booking_id) {
        utils.showToast(`Booking #${result.booking_id} created successfully`, 'success');
      } else {
        utils.showToast(result?.message || 'Booking created successfully', 'success');
      }
    }

    window.appUtils.closeModal();
    const contentArea = document.getElementById('contentArea');
    await render(contentArea);
  } catch (error) {
    console.error('[Bookings] submit error', error);
    utils.showToast(error.message || 'Operation failed', 'error');
  }
}

// Customer search helper (global)
window.searchCustomers = async function(query = null) {
  const searchInput = document.getElementById('customerSearch');
  const resultsDiv = document.getElementById('customerResults');
  const q = (query !== null ? query : (searchInput?.value || '')).trim();
  console.log('[Bookings] searchCustomers', q);

  // If invoked via button (query === null), show ALL customers as a dropdown
  if (query === null) {
    try {
      let list = Array.isArray(customers) ? customers : [];
      if (!list || list.length === 0) {
        try { list = await api.customers.getAll(); } catch (_) { list = []; }
      }
      if (!list || list.length === 0) {
        if (resultsDiv) resultsDiv.innerHTML = '<div class="search-results-list"><div class="text-muted">No customers available</div></div>';
        return;
      }
      const options = list.map(c => `<option value="${c.id}">${c.name}${c.phone ? ` (${c.phone})` : ''}</option>`).join('');
      const html = `
        <div class="search-results-list">
          <label class="text-muted">Select Customer</label>
          <select id="customerDropdown" class="form-control">
            <option value="">-- Choose --</option>
            ${options}
          </select>
        </div>
      `;
      if (resultsDiv) {
        resultsDiv.innerHTML = html;
        const dd = document.getElementById('customerDropdown');
        if (dd) {
          dd.addEventListener('change', () => {
            const id = parseInt(dd.value);
            if (!id) return;
            const selected = list.find(c => c.id === id);
            if (selected) selectCustomer(selected.id, selected.name, selected.phone || '');
          });
        }
      }
      return;
    } catch (err) {
      console.error('Dropdown load error:', err);
    }
  }

  if (!q || q.length < 1) {
    if (resultsDiv) resultsDiv.innerHTML = '';
    return;
  }

  try {
    if (resultsDiv) resultsDiv.innerHTML = '<div class="search-results-list"><div class="text-muted">Searching...</div></div>';
    let remoteResults = [];
    try {
      remoteResults = await api.bookings.customers.search(q);
    } catch (apiErr) {
      console.warn('[Bookings] bookings search failed, trying customers.search', apiErr?.message || apiErr);
      try {
        remoteResults = await api.customers.search(q);
      } catch (apiErr2) {
        console.warn('[Bookings] customers search failed, using local fallback', apiErr2?.message || apiErr2);
        remoteResults = [];
      }
    }
    console.log('[Bookings] searchCustomers remote results', remoteResults?.length || 0);

    // Fallback to local list if remote empty
    let finalResults = remoteResults;
    if (!finalResults || finalResults.length === 0) {
      const list = Array.isArray(customers) ? customers : [];
      const qLower = q.toLowerCase();
      finalResults = list.filter(c => {
        const name = (c.name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(qLower) || phone.includes(qLower) || email.includes(qLower);
      }).slice(0, 10);
      console.log('[Bookings] searchCustomers local fallback results', finalResults.length);
    }

    if (!finalResults || finalResults.length === 0) {
      if (resultsDiv) resultsDiv.innerHTML = '<div class="search-results-list"><div class="text-muted">No matches found</div></div>';
      return;
    }
    const options = finalResults.map(c => `<option value="${c.id}">${c.name}${c.phone ? ` (${c.phone})` : ''}</option>`).join('');
    const html = `
      <div class="search-results-list">
        <label class="text-muted">Select Customer</label>
        <select id="customerDropdown" class="form-control">
          <option value="">-- Choose --</option>
          ${options}
        </select>
      </div>
    `;
    if (resultsDiv) {
      resultsDiv.innerHTML = html;
      const dd = document.getElementById('customerDropdown');
      if (dd) {
        dd.addEventListener('change', () => {
          const id = parseInt(dd.value);
          if (!id) return;
          const selected = finalResults.find(c => c.id === id);
          if (selected) selectCustomer(selected.id, selected.name, selected.phone || '');
        });
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    if (resultsDiv) resultsDiv.innerHTML = '<div class="search-results-list"><div class="text-error">Search failed</div></div>';
  }
};

// Parse services_qualified into an array of integers
function parseQualifiedList(sq) {
  try {
    if (!sq) return [];
    if (Array.isArray(sq)) {
      return sq.map(x => parseInt(x)).filter(n => Number.isFinite(n));
    }
    // Try JSON first
    const parsed = JSON.parse(sq);
    if (Array.isArray(parsed)) {
      return parsed.map(x => parseInt(x)).filter(n => Number.isFinite(n));
    }
  } catch (_) {
    // Fall back to CSV string parsing
    if (typeof sq === 'string') {
      return sq
        .split(/[,;\s]+/)
        .map(s => parseInt(s))
        .filter(n => Number.isFinite(n));
    }
  }
  return [];
}

export async function render(container) {
  try {
    // Load all necessary data
    const [bookingsData, customersData, categoriesData] = await Promise.all([
      api.bookings.getAll(),
      api.customers.getAll(),
      api.services.getMainCategories()
    ]);
    
    bookings = bookingsData;
    customers = customersData;
    // getMainCategories returns an array; no nested 'main' property
    mainCategories = Array.isArray(categoriesData) ? categoriesData : [];
    
    container.innerHTML = `
      <div class="booking-container">
        <div class="booking-header">
          <h2 class="page-title">Bookings Management</h2>
          <div class="header-actions">
            <div class="filters">
              <select id="filterType" class="form-control">
                <option value="">All Types</option>
                <option value="walk_in">Walk-in</option>
                <option value="calling">Calling Appointment</option>
              </select>
              <select id="filterStatus" class="form-control">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input type="date" id="filterDate" class="form-control" placeholder="Filter by date">
            </div>
            <button id="newBookingBtn" class="btn btn-primary">
              <i class="fas fa-plus"></i> New Booking
            </button>
          </div>
        </div>
        
        <div class="stats-cards">
          <div class="stat-card">
            <h3>Today's Bookings</h3>
            <p id="todayBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Pending</h3>
            <p id="pendingBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Confirmed</h3>
            <p id="confirmedBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Revenue (30 days)</h3>
            <p id="monthlyRevenue" class="stat-value">₹0</p>
          </div>
        </div>
        
        <div id="bookingsTable">
          ${renderBookingsTable(bookings)}
        </div>
      </div>
    `;
    
    // Load dashboard stats
    await loadDashboardStats();
    
    // Attach event listeners
    attachEventListeners(container);
    // Initialize action menus for ellipsis dropdowns
    initActionMenus();
  } catch (error) {
    console.error('Error loading bookings:', error);
    container.innerHTML = `
      <div class="error-card">
        <h3>Error Loading Bookings</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-secondary">Retry</button>
      </div>
    `;
  }
}

function renderBookingsTable(bookingsList) {
  if (bookingsList.length === 0) {
    return '<div class="empty-state"><p>No bookings found</p></div>';
  }
  
  return `
    <div class="table-responsive">
      <table class="bookings-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Customer</th>
            <th>Date & Time</th>
            <th>Duration</th>
            <th>Services</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${bookingsList.map(booking => `
            <tr>
              <td>#${booking.id}</td>
              <td>
                <span class="badge badge-${booking.booking_type === 'walk_in' ? 'info' : 'primary'}">
                  ${booking.booking_type === 'walk_in' ? 'Walk-in' : 'Calling'}
                </span>
              </td>
              <td>
                <div class="customer-info">
                  <strong>${booking.customer_name || 'Walk-in Customer'}</strong>
                  ${booking.customer_phone ? `<br><small>${booking.customer_phone}</small>` : ''}
                </div>
              </td>
              <td>
                <div>${utils.formatDate(booking.booking_date)}</div>
                <small>${utils.formatTime(booking.start_time)} - ${utils.formatTime(booking.end_time)}</small>
              </td>
              <td>${booking.total_duration || 0} min</td>
              <td>${booking.total_services || 0}</td>
              <td>₹${utils.formatCurrency(booking.total_amount || 0)}</td>
              <td>
                <span class="badge badge-${window.getBookingStatusClass ? window.getBookingStatusClass(booking.status) : (function(s){const m={pending:'warning',confirmed:'info',in_progress:'primary',completed:'success',cancelled:'danger'};return m[s]||'secondary';})(booking.status)}">
                  ${booking.status}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-outline" onclick="window.bookingsModule.viewBooking(${booking.id})">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline" onclick="window.bookingsModule.editBooking(${booking.id})">
                    <i class="fas fa-edit"></i>
                  </button>
                  <div class="action-menu-wrap">
                    <button class="btn btn-sm btn-outline action-menu-toggle" type="button" aria-haspopup="true" aria-expanded="false">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="action-menu" role="menu" style="display:none;">
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'confirmed')">Confirm</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'in_progress')">Start Service</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'completed')">Complete</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'cancelled')">Cancel</button>
                      <div class="dropdown-divider"></div>
                      <button class="dropdown-item text-danger" type="button" onclick="window.bookingsModule.deleteBooking(${booking.id})">Delete</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function attachEventListeners(container) {
  // Filter by type
  const filterType = container.querySelector('#filterType');
  filterType.addEventListener('change', async function() {
    await applyFilters();
  });
  
  // Filter by status
  const filterStatus = container.querySelector('#filterStatus');
  filterStatus.addEventListener('change', async function() {
    await applyFilters();
  });
  
  // Filter by date
  const filterDate = container.querySelector('#filterDate');
  filterDate.addEventListener('change', async function() {
    await applyFilters();
  });
  
  // New booking button
  const newBookingBtn = container.querySelector('#newBookingBtn');
  newBookingBtn.addEventListener('click', () => showBookingForm());
}

// Initialize custom action menu toggles (three dots dropdowns)
function initActionMenus() {
  // Close any open menus
  const closeAllMenus = () => {
    document.querySelectorAll('.action-menu').forEach(menu => { menu.style.display = 'none'; });
    document.querySelectorAll('.action-menu-toggle').forEach(btn => { btn.setAttribute('aria-expanded', 'false'); });
  };

  // Set up toggles
  document.querySelectorAll('.action-menu-wrap').forEach(wrap => {
    const toggle = wrap.querySelector('.action-menu-toggle');
    const menu = wrap.querySelector('.action-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = menu.style.display !== 'none';
      closeAllMenus();
      if (!isOpen) {
        menu.style.display = 'block';
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Click outside to close
  document.addEventListener('click', closeAllMenus, { once: true });
}

async function applyFilters() {
  try {
    const contentArea = document.getElementById('contentArea');
    const filterType = contentArea.querySelector('#filterType').value;
    const filterStatus = contentArea.querySelector('#filterStatus').value;
    const filterDate = contentArea.querySelector('#filterDate').value;
    
    const filters = {};
    if (filterType) filters.booking_type = filterType;
    if (filterStatus) filters.status = filterStatus;
    if (filterDate) filters.dateFrom = filterDate;
    
    const filtered = await api.bookings.getAll(filters);
    contentArea.querySelector('#bookingsTable').innerHTML = renderBookingsTable(filtered);
    // Re-init menus after re-render
    initActionMenus();
  } catch (error) {
    console.error('Filter error:', error);
    utils.showToast('Error applying filters', 'error');
  }
}

async function loadDashboardStats() {
  try {
    const stats = await api.bookings.stats();
    const contentArea = document.getElementById('contentArea');
    
    if (contentArea) {
      contentArea.querySelector('#todayBookings').textContent = stats.today_bookings || 0;
      contentArea.querySelector('#pendingBookings').textContent = stats.pending_bookings || 0;
      contentArea.querySelector('#confirmedBookings').textContent = stats.confirmed_bookings || 0;
      contentArea.querySelector('#monthlyRevenue').textContent = `₹${utils.formatCurrency(stats.total_revenue || 0)}`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function showBookingForm(booking = null) {
  const isEdit = !!booking;
  console.log('[Bookings] showBookingForm', { isEdit, booking });
  
  // Load all required data for form
  try {
    if (mainCategories.length === 0) {
      const categoriesData = await api.services.getMainCategories();
      mainCategories = Array.isArray(categoriesData) ? categoriesData : [];
    }
    
    const formHTML = `
      <div class="booking-form-container">
        <form id="bookingForm">
          <div class="form-row">
            <div class="form-group">
              <label for="bookingType">Booking Type *</label>
              <select id="bookingType" name="booking_type" required>
                <option value="walk_in" ${(!isEdit || booking.booking_type === 'walk_in') ? 'selected' : ''}>Walk-in</option>
                <option value="calling" ${(isEdit && booking.booking_type === 'calling') ? 'selected' : ''}>Calling Appointment</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="bookingDate">Date *</label>
              <input type="date" id="bookingDate" name="booking_date" 
                     value="${isEdit ? booking.booking_date : utils.getTodayDate()}" required>
            </div>
            
            <div class="form-group">
              <label for="startTime">Start Time *</label>
              <input type="time" id="startTime" name="start_time" 
                     value="${isEdit ? booking.start_time : '10:00'}" required>
            </div>
          </div>
          
          <div class="form-section">
            <h4>Customer Details</h4>
            <div class="customer-search">
              <div class="form-group">
                <label>Search Customer (Phone/Name)</label>
                <div class="input-with-button">
                  <input type="text" id="customerSearch" placeholder="Enter phone or name...">
                  <button type="button" class="btn btn-outline" onclick="searchCustomers()">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div id="customerResults" class="search-results"></div>
              
              <input type="hidden" id="customerIdHidden" name="customer_id" value="${isEdit ? (booking.customer_id || '') : ''}">
              <div class="text-muted" id="selectedCustomerDisplay">
                ${isEdit && booking.customer_name ? `${booking.customer_name} ${booking.customer_phone ? `(${booking.customer_phone})` : ''}` : ''}
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h4>Services</h4>
            <div class="service-toolbar">
              <span class="text-muted" style="margin-right:auto">Scroll to view all fields</span>
              <button type="button" class="btn btn-outline btn-sm" onclick="scrollServiceItems(-1)">◄</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="scrollServiceItems(1)">►</button>
            </div>
            <div id="serviceItems">
              ${isEdit && booking.items ? 
                booking.items.map((item, index) => renderServiceItem(item, index)).join('') : 
                renderServiceItem(null, 0)
              }
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="addServiceItem()">
              <i class="fas fa-plus"></i> Add Another Service
            </button>
          </div>
          
          <div class="form-section">
            <h4>Booking Summary</h4>
            <div class="summary-card">
              <div class="summary-row">
                <small class="text-muted">Membership benefits auto-apply when available. Calculations shown below.</small>
              </div>
              <div class="summary-row">
                <span>Subtotal:</span>
                <span id="subtotalAmount">₹0.00</span>
              </div>
              <div class="summary-row">
                <span>Discount:</span>
                <div class="discount-input">
                  <input type="number" id="discountAmount" name="discount_amount" 
                         value="${isEdit ? booking.discount_amount : 0}" min="0" step="0.01" 
                         oninput="calculateSummary()">
                  <span>₹</span>
                </div>
              </div>
              <div class="summary-row">
                <span>Plan/Free Deduction:</span>
                <span id="planDiscountDisplay">₹0.00</span>
              </div>
              <div class="summary-row">
                <span>Wallet Applied:</span>
                <span id="walletAppliedDisplay">₹0.00</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span id="totalAmount">₹0.00</span>
              </div>
              <div class="summary-row">
                <span>Total Duration:</span>
                <span id="totalDuration">0 minutes</span>
              </div>
              <div class="summary-row">
                <span>End Time:</span>
                <span id="endTime">--:--</span>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="bookingNotes">Notes</label>
            <textarea id="bookingNotes" name="notes" rows="3">${isEdit ? booking.notes : ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="window.appUtils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Use full-width modal for the booking form for better usability
    window.appUtils.showModal(isEdit ? 'Edit Booking' : 'New Booking', formHTML, 'full');
    
    if (isEdit) {
      document.getElementById('bookingForm').dataset.bookingId = booking.id;
    }

    // Initialize form
    await initializeBookingForm(booking);
    console.log('[Bookings] initializeBookingForm completed');
    const formEl = document.getElementById('bookingForm');
    if (formEl) {
      formEl.addEventListener('submit', handleBookingFormSubmit);
      console.log('[Bookings] submit handler attached');
    }
  } catch (error) {
    console.error('Error showing booking form:', error);
    utils.showToast('Error loading booking form', 'error');
  }
}

function renderServiceItem(item = null, index) {
  return `
    <div class="service-item" data-index="${index}">
      <div class="service-header">
        <h5>Service #${index + 1}</h5>
        ${index > 0 ? '<button type="button" class="btn btn-sm btn-danger" onclick="removeServiceItem(this)"><i class="fas fa-times"></i></button>' : ''}
      </div>
      <div class="form-row service-row-1">
        <div class="form-group">
          <label>Main Category</label>
          <select class="main-category" onchange="loadSubCategories(this, ${index})" required>
            <option value="">Select Category</option>
            ${mainCategories.map(cat => `
              <option value="${cat.id}" ${(item && item.category_id === cat.id) ? 'selected' : ''}>
                ${cat.name}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Sub Category</label>
          <select class="sub-category" onchange="loadServices(this, ${index})" required>
            <option value="">Select Sub Category</option>
            ${(item && subCategories[item.category_id]) ? 
              subCategories[item.category_id].map(sub => `
                <option value="${sub.id}" ${item.subcategory_id === sub.id ? 'selected' : ''}>
                  ${sub.name}
                </option>
              `).join('') : ''}
          </select>
        </div>
        
        <div class="form-group">
          <label>Service</label>
          <select class="service-select" onchange="loadServiceDetails(this, ${index})" required>
            <option value="">Select Service</option>
            ${(item && services[item.subcategory_id]) ? 
              services[item.subcategory_id].map(s => `
                <option value="${s.id}" ${item.service_id === s.id ? 'selected' : ''} 
                        data-price="${s.base_price}" data-duration="${s.duration_minutes}">
                  ${s.name} (${s.duration_minutes} min - ₹${utils.formatCurrency(s.base_price)})
                </option>
              `).join('') : ''}
          </select>
        </div>
      </div>
      
      <div class="form-row service-row-2">
        <div class="form-group">
          <label>Room (Optional)</label>
          <select class="room-select">
            <option value="">Select Room (Optional)</option>
            ${(item && rooms[item.service_id]) ? 
              rooms[item.service_id].map(r => `
                <option value="${r.id}" ${item.room_id === r.id ? 'selected' : ''}>
                  ${r.name}
                </option>
              `).join('') : ''}
          </select>
        </div>
        
        <div class="form-group">
          <label>Staff (Optional)</label>
          <select class="staff-select">
            <option value="">Select Staff (Optional)</option>
            ${(item && staff[item.service_id]) ? 
              staff[item.service_id].map(s => `
                <option value="${s.id}" ${item.staff_id === s.id ? 'selected' : ''}>
                  ${s.name}
                </option>
              `).join('') : ''}
          </select>
        </div>
        
        <div class="form-group">
          <label>Price (₹)</label>
          <input type="number" class="price-input" value="${item ? item.price : 0}" 
                 min="0" step="0.01" onchange="calculateSummary()" required>
        </div>
        
        <div class="form-group">
          <label>Duration (minutes)</label>
          <input type="number" class="duration-input" value="${item ? item.duration_minutes : 0}" 
                 min="15" step="15" onchange="calculateSummary()" required>
        </div>
      </div>
      
      <div class="form-group service-notes">
        <label>Service Notes</label>
        <textarea class="service-notes" rows="2">${item ? item.notes || '' : ''}</textarea>
      </div>
    </div>
  `;
}

async function initializeBookingForm(booking = null) {

  // Load existing services when editing
  if (booking && booking.items && booking.items.length > 0) {
    for (let i = 0; i < booking.items.length; i++) {
      const item = booking.items[i];
      await loadSubCategoriesForItem(item.category_id, i);
      await loadServicesForItem(item.subcategory_id, i);
    }
  }

  // Attach dynamic search on input with debounce
  const searchInput = document.getElementById('customerSearch');

  if (searchInput) {
    let debounceTimer = null;

    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim();

      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {

        if (val.length === 0) {
          const resultsDiv = document.getElementById('customerResults');
          if (resultsDiv) resultsDiv.innerHTML = '';
          return;
        }

        window.searchCustomers(val);

      }, 300);
    });
  }

  // Initial compute to reflect default toggle states
  calculateSummary();

  // Capture basePrice for all existing items (edit mode or initial render)
  Array.from(document.querySelectorAll('.service-item .price-input')).forEach(inp => {
    if (!inp.dataset.basePrice) {
      inp.dataset.basePrice = String(parseFloat(inp.value || '0') || 0);
    }
  });

}


window.scrollServiceItems = function(direction) {
  const container = document.getElementById('serviceItems');
  if (!container) return;
  const amount = 600 * (direction < 0 ? -1 : 1);
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

window.selectCustomer = function(id, name, phone) {
  console.log('[Bookings] selectCustomer', { id, name, phone });
  const display = `${name}${phone ? ` (${phone})` : ''}`;
  const hiddenEl = document.getElementById('customerIdHidden');
  if (hiddenEl) hiddenEl.value = String(id);
  const searchEl = document.getElementById('customerSearch');
  if (searchEl) searchEl.value = display;
  const dispEl = document.getElementById('selectedCustomerDisplay');
  if (dispEl) dispEl.textContent = display;
  const resultsDiv = document.getElementById('customerResults');
  if (resultsDiv) resultsDiv.innerHTML = '';
  // Fetch membership for selected customer and update summary preview
  fetchCustomerMembership(id);
};

window.toggleNewCustomerForm = function() {
  const form = document.getElementById('newCustomerForm');
  const showing = form.style.display === 'none';
  form.style.display = showing ? 'block' : 'none';
  const nameEl = document.getElementById('newCustomerName');
  const phoneEl = document.getElementById('newCustomerPhone');
  const emailEl = document.getElementById('newCustomerEmail');
  if (showing) {
    // Enable inputs and require phone when creating a new customer
    if (nameEl) nameEl.disabled = false;
    if (phoneEl) { phoneEl.disabled = false; phoneEl.required = true; }
    if (emailEl) emailEl.disabled = false;
  } else {
    // Hide mode: disable inputs and clear values to avoid validation issues
    if (nameEl) { nameEl.disabled = true; nameEl.value = ''; }
    if (phoneEl) { phoneEl.disabled = true; phoneEl.required = false; phoneEl.value = ''; }
    if (emailEl) { emailEl.disabled = true; emailEl.value = ''; }
  }
};

window.addServiceItem = function() {
  const serviceItems = document.getElementById('serviceItems');
  const index = serviceItems.children.length;
  serviceItems.insertAdjacentHTML('beforeend', renderServiceItem(null, index));
  // Smoothly scroll new card into view for horizontal layout
  reindexServiceItems(); 
  const newCard = serviceItems.lastElementChild;
  if (newCard && newCard.scrollIntoView) {
    newCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }
};

window.removeServiceItem = function(button) {
  const serviceItem = button.closest('.service-item');
  serviceItem.remove();
  reindexServiceItems();
  calculateSummary();
};

window.loadSubCategories = async function(select, index) {
  const categoryId = select.value;
  if (!categoryId) return;
  
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const subCategorySelect = serviceItem.querySelector('.sub-category');
  
  try {
    const fetchedSubCategories = await api.services.getSubCategories(categoryId);
    // Cache for pre-populating when editing
    subCategories[categoryId] = fetchedSubCategories;
    subCategorySelect.innerHTML = `
      <option value="">Select Sub Category</option>
      ${fetchedSubCategories.map(sub => `
        <option value="${sub.id}">${sub.name}</option>
      `).join('')}
    `;
    
    // Clear dependent fields
    serviceItem.querySelector('.service-select').innerHTML = '<option value="">Select Service</option>';
    serviceItem.querySelector('.room-select').innerHTML = '<option value="">Select Room (Optional)</option>';
    serviceItem.querySelector('.staff-select').innerHTML = '<option value="">Select Staff (Optional)</option>';
    serviceItem.querySelector('.price-input').value = 0;
    serviceItem.querySelector('.duration-input').value = 0;
    
    calculateSummary();
  } catch (error) {
    console.error('Error loading subcategories:', error);
  }
};

async function loadSubCategoriesForItem(categoryId, index) {
  try {
    const fetched = await api.services.getSubCategories(categoryId); // ✅ FIXED
    subCategories[categoryId] = fetched; // ✅ FIXED
  } catch (error) {
    console.error('Error loading subcategories:', error);
  }
  // Recompute summary after subcategories load
  calculateSummary();

  const freeCountEl = document.getElementById('freeCount');
  if (freeCountEl) {
    freeCountEl.addEventListener('change', () => {
      // Clamp to available count when known
      const max = parseInt(freeCountEl.max || '0') || 0;
      let val = parseInt(freeCountEl.value || '0') || 0;
      if (max > 0 && val > max) { freeCountEl.value = String(max); }
      if (val < 0) { freeCountEl.value = '0'; }
      calculateSummary();
    });
  }

  calculateSummary();
}

window.loadServices = async function(select, index) {
  const subcategoryId = select.value;
  if (!subcategoryId) return;
  
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const serviceSelect = serviceItem.querySelector('.service-select');
  
  try {
    const servicesData = await api.services.getByCategory(subcategoryId);
    // Cache for pre-populating when editing
    services[subcategoryId] = servicesData;
    serviceSelect.innerHTML = `
      <option value="">Select Service</option>
      ${servicesData.map(service => `
        <option value="${service.id}" 
                data-price="${service.base_price}" 
                data-duration="${service.duration_minutes}">
          ${service.name} (${service.duration_minutes} min - ₹${utils.formatCurrency(service.base_price)})
        </option>
      `).join('')}
    `;
    
    // Clear dependent fields
    serviceItem.querySelector('.room-select').innerHTML = '<option value="">Select Room (Optional)</option>';
    serviceItem.querySelector('.staff-select').innerHTML = '<option value="">Select Staff (Optional)</option>';
    serviceItem.querySelector('.price-input').value = 0;
    serviceItem.querySelector('.duration-input').value = 0;
    
    calculateSummary();
  } catch (error) {
    console.error('Error loading services:', error);
  }
};

async function loadServicesForItem(subcategoryId, index) {
  try {
    const servicesData = await api.services.getByCategory(subcategoryId);
    services[subcategoryId] = servicesData;
  } catch (error) {
    console.error('Error loading services:', error);
  }
}

window.loadServiceDetails = function(select, index) {
  const option = select.options[select.selectedIndex];
  const price = option.dataset.price;
  const duration = option.dataset.duration;
  const serviceId = select.value;
  
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const priceInput = serviceItem.querySelector('.price-input');
  priceInput.value = price;
  priceInput.dataset.basePrice = String(price);
  serviceItem.querySelector('.duration-input').value = duration;
  
  // Load rooms and staff for this service
  loadRooms(serviceId, index);
  loadStaff(serviceId, index);
  
  calculateSummary();
};

async function loadRooms(serviceId, index) {
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const roomSelect = serviceItem.querySelector('.room-select');
  
  try {
    const fetchedRooms = await api.services.getSuitableRooms(serviceId);
    // Cache for pre-populating when editing
    rooms[serviceId] = fetchedRooms;
    roomSelect.innerHTML = `
      <option value="">Select Room (Optional)</option>
      ${fetchedRooms.map(room => `
        <option value="${room.id}">${room.name}</option>
      `).join('')}
    `;
  } catch (error) {
    console.error('Error loading rooms:', error);
    roomSelect.innerHTML = '<option value="">Error loading rooms</option>';
  }
}

async function loadRoomsForItem(serviceId, index) {
  try {
    const roomsData = await api.services.getSuitableRooms(serviceId);
    rooms[serviceId] = roomsData;
  } catch (error) {
    console.error('Error loading rooms:', error);
  }
}

async function loadStaff(serviceId, index) {
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const staffSelect = serviceItem.querySelector('.staff-select');
  
  try {
    // Determine department from selected service's main category
    let department = '';
    // Try to infer from cached services by subcategory
    const subSelect = serviceItem.querySelector('.sub-category');
    const subId = parseInt(subSelect?.value || '0');
    if (subId && services[subId]) {
      const svc = services[subId].find(s => s.id === parseInt(serviceId));
      if (svc && svc.main_category_name) department = svc.main_category_name;
    }
    // Fallback: fetch service details to get main_category_name
    if (!department) {
      try {
        const svcDetail = await api.services.getById(serviceId);
        department = svcDetail?.main_category_name || '';
      } catch (e) {
        department = '';
      }
    }

    // Fetch staff filtered by department when available
    const allStaff = await api.staff.getAll(department ? { department } : {});

    // Determine booking date for attendance filtering
    let bookingDate = document.getElementById('bookingDate')?.value || '';
    if (!bookingDate) bookingDate = utils.getTodayDate();

    // Get present staff attendance records for the date
    const attendance = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
    // If department is known, filter attendance by department client-side
    const attendanceFiltered = department ? attendance.filter(a => a.department === department) : attendance;
    const presentIds = new Set(attendanceFiltered.map(a => a.staff_id));

    // Exclude staff on approved leave for that date
    const leaves = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
    const onLeaveIds = new Set(leaves.map(l => l.staff_id));

    // Filter by attendance and approved leave
    let availableStaff = allStaff.filter(s => presentIds.has(s.id) && !onLeaveIds.has(s.id));

    // Finally, filter by service qualification (services_qualified contains service IDs)
    const targetServiceId = parseInt(serviceId);
    availableStaff = availableStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));

    // If overly restrictive (e.g., department name mismatch), retry without department filter
    if (availableStaff.length === 0) {
      const allStaffNoDept = await api.staff.getAll();
      const attendanceNoDept = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
      const presentIdsNoDept = new Set(attendanceNoDept.map(a => a.staff_id));
      const leavesNoDept = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
      const onLeaveIdsNoDept = new Set(leavesNoDept.map(l => l.staff_id));
      let retryStaff = allStaffNoDept.filter(s => presentIdsNoDept.has(s.id) && !onLeaveIdsNoDept.has(s.id));
      retryStaff = retryStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));
      availableStaff = retryStaff;
    }
    // Cache for pre-populating when editing
    staff[serviceId] = availableStaff;
    staffSelect.innerHTML = `
      <option value="">Select Staff (Optional)</option>
      ${availableStaff.map(s => `
        <option value="${s.id}">${s.name} - ${s.department}</option>
      `).join('')}
    `;
    if (availableStaff.length === 0) {
      staffSelect.insertAdjacentHTML('beforeend', '<option disabled>(No present staff for selected date)</option>');
    }
  } catch (error) {
    console.error('Error loading staff:', error);
    staffSelect.innerHTML = '<option value="">Error loading staff</option>';
  }
}

async function loadStaffForItem(serviceId, index) {
  try {
    // For edit mode, infer department via service details
    let department = '';
    try {
      const svcDetail = await api.services.getById(serviceId);
      department = svcDetail?.main_category_name || '';
    } catch (e) {
      department = '';
    }
    const allStaff = await api.staff.getAll(department ? { department } : {});

    // Attendance filtering for the booked date
    let bookingDate = document.getElementById('bookingDate')?.value || '';
    if (!bookingDate) bookingDate = utils.getTodayDate();
    const attendance = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
    const attendanceFiltered = department ? attendance.filter(a => a.department === department) : attendance;
    const presentIds = new Set(attendanceFiltered.map(a => a.staff_id));
    const leaves = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
    const onLeaveIds = new Set(leaves.map(l => l.staff_id));
    // Filter by attendance and approved leave
    let availableStaff = allStaff.filter(s => presentIds.has(s.id) && !onLeaveIds.has(s.id));
    // Filter by qualification
    const targetServiceId = parseInt(serviceId);
    availableStaff = availableStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));

    // Fallback without department if no matches
    if (availableStaff.length === 0) {
      const allStaffNoDept = await api.staff.getAll();
      const attendanceNoDept = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
      const presentIdsNoDept = new Set(attendanceNoDept.map(a => a.staff_id));
      const leavesNoDept = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
      const onLeaveIdsNoDept = new Set(leavesNoDept.map(l => l.staff_id));
      let retryStaff = allStaffNoDept.filter(s => presentIdsNoDept.has(s.id) && !onLeaveIdsNoDept.has(s.id));
      retryStaff = retryStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));
      staff[serviceId] = retryStaff;
      return;
    }

    staff[serviceId] = availableStaff;
  } catch (error) {
    console.error('Error loading staff:', error);
  }
}

window.calculateSummary = function() {
  let subtotal = 0;
  let totalDuration = 0;
  // Build items with base prices to avoid double deduction when visualizing freebies
  const serviceItems = Array.from(document.querySelectorAll('.service-item')).map(item => {
    const priceInput = item.querySelector('.price-input');
    const basePrice = parseFloat(priceInput?.dataset.basePrice || priceInput.value || '0') || 0;
    const duration = parseInt(item.querySelector('.duration-input').value) || 0;
    return { item, priceInput, basePrice, duration };
  });
  serviceItems.forEach(s => { subtotal += s.basePrice; totalDuration += s.duration; });
  
  // Get discount
  const discountInput = document.getElementById('discountAmount');
  let discount = parseFloat(discountInput.value) || 0;
  
  // Validate discount
  if (discount > subtotal) {
    discount = subtotal;
    discountInput.value = subtotal;
    utils.showToast('Discount cannot exceed subtotal', 'warning');
  }
  
  const total = subtotal - discount;
  
  // Calculate end time
  const startTime = document.getElementById('startTime').value;
  let endTime = '--:--';
  if (startTime && totalDuration > 0) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + totalDuration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  
  // Update display
  document.getElementById('subtotalAmount').textContent = `₹${utils.formatCurrency(subtotal)}`;

  // Auto-apply membership benefits when available
  let planDeduction = 0;
  let walletApplied = 0;
  let effectiveFree = 0;
  const membershipActive = window.bookingMembership && (window.bookingMembership.status === 'active' || window.bookingMembership.status === 'pending');
  if (membershipActive) {
    const percent = parseFloat(window.bookingMembership.discount_percentage || 0);
    const freeRemaining = parseInt(window.bookingMembership.free_services_remaining || 0);
    // Sort items by base price descending for most-expensive-first application
    const sortedItems = [...serviceItems].sort((a,b) => b.basePrice - a.basePrice);
    // Reset visual prices to base before applying freebies
    sortedItems.forEach(s => { s.priceInput.value = s.basePrice; s.priceInput.classList.remove('free-applied'); });

    effectiveFree = Math.min(freeRemaining, sortedItems.length);
    // If free covers ALL items, full waiver
    if (effectiveFree >= sortedItems.length && sortedItems.length > 0) {
      planDeduction = subtotal; // Full waiver
      walletApplied = 0; // No wallet needed
      sortedItems.forEach(s => { s.priceInput.classList.add('free-applied'); });
    } else {
      const freeItems = sortedItems.slice(0, effectiveFree);
      const freeDeduction = freeItems.reduce((sum, s) => sum + s.basePrice, 0);
      freeItems.forEach(s => { s.priceInput.classList.add('free-applied'); });
      const afterFree = Math.max(0, subtotal - freeDeduction);
      const percentDiscount = percent > 0 ? (afterFree * (percent/100)) : 0;
      planDeduction = freeDeduction + percentDiscount;
      const walletBal = parseFloat(window.bookingMembership.wallet_balance || 0);
      const remainingAfter = Math.max(0, afterFree - percentDiscount - discount);
      walletApplied = Math.min(walletBal, remainingAfter);
    }
  }

  document.getElementById('planDiscountDisplay').textContent = `₹${utils.formatCurrency(planDeduction)}`;
  document.getElementById('walletAppliedDisplay').textContent = `₹${utils.formatCurrency(walletApplied)}`;

  const finalTotal = Math.max(0, total - planDeduction - walletApplied);
  document.getElementById('totalAmount').textContent = `₹${utils.formatCurrency(finalTotal)}`;
  document.getElementById('totalDuration').textContent = `${totalDuration} minutes`;
  document.getElementById('endTime').textContent = endTime;
  
  // Update end time in form data
  document.getElementById('bookingForm').dataset.endTime = endTime;
  document.getElementById('bookingForm').dataset.totalDuration = totalDuration;
  document.getElementById('bookingForm').dataset.membershipApply = (membershipActive ? 'true' : 'false');
  document.getElementById('bookingForm').dataset.applyFree = (membershipActive ? 'true' : 'false');
  document.getElementById('bookingForm').dataset.applyPercent = (membershipActive ? 'true' : 'false');
  document.getElementById('bookingForm').dataset.applyWallet = (membershipActive ? 'true' : 'false');
  document.getElementById('bookingForm').dataset.freeCount = String(effectiveFree || 0);
  // Persist preview totals for backend if needed
  const formEl = document.getElementById('bookingForm');
  formEl.dataset.subtotal = String(subtotal);
  formEl.dataset.planDeduction = String(planDeduction);
  formEl.dataset.walletApplied = String(walletApplied);
  formEl.dataset.finalTotal = String(finalTotal);
};

async function fetchCustomerMembership(customerId) {
  try {
    const membership = await api.memberships.getForCustomer(customerId);
    window.bookingMembership = membership || null;
    // Set available free count hint and max
    const freeCountEl = document.getElementById('freeCount');
    const hintEl = document.getElementById('freeCountHint');
    const freeAvail = parseInt(membership?.free_services_remaining || 0) || 0;
    if (freeCountEl) { freeCountEl.max = String(freeAvail); }
    if (hintEl) { hintEl.textContent = freeAvail > 0 ? `(Available: ${freeAvail})` : '(No free services)'; }
    // Recalculate summary to reflect membership
    calculateSummary();
  } catch (error) {
    window.bookingMembership = null;
  }
}




function getBookingStatusClass(status) {
  const statusClasses = {
    'pending': 'warning',
    'confirmed': 'info',
    'in_progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  };
  return statusClasses[status] || 'secondary';
}
// Expose for templates where module scoping may prevent direct reference
window.getBookingStatusClass = getBookingStatusClass;

// Export functions for global access
window.bookingsModule = {
  viewBooking: async function(id) {
    try {
      const booking = await api.bookings.getById(id);
      const detailsHTML = `
        <div class="booking-details">
          <div class="detail-section">
            <h4>Booking Information</h4>
            <div class="detail-grid">
              <div><strong>Booking ID:</strong> #${booking.id}</div>
              <div><strong>Type:</strong> ${booking.booking_type === 'walk_in' ? 'Walk-in' : 'Calling Appointment'}</div>
              <div><strong>Date:</strong> ${utils.formatDate(booking.booking_date)}</div>
              <div><strong>Time:</strong> ${utils.formatTime(booking.start_time)} - ${utils.formatTime(booking.end_time)}</div>
              <div><strong>Status:</strong> <span class="badge badge-${window.getBookingStatusClass ? window.getBookingStatusClass(booking.status) : (function(s){const m={pending:'warning',confirmed:'info',in_progress:'primary',completed:'success',cancelled:'danger'};return m[s]||'secondary';})(booking.status)}">${booking.status}</span></div>
              <div><strong>Total Duration:</strong> ${booking.total_duration} minutes</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>Customer Information</h4>
            <div class="detail-grid">
              <div><strong>Name:</strong> ${booking.customer_name || 'Walk-in Customer'}</div>
              <div><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</div>
              <div><strong>Email:</strong> ${booking.customer_email || 'N/A'}</div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>Services (${booking.items ? booking.items.length : 0})</h4>
            ${booking.items ? booking.items.map(item => `
              <div class="service-detail">
                <strong>${item.service_name}</strong>
                <div class="service-meta">
                  <span>Category: ${item.category_name}</span>
                  <span>Room: ${item.room_name || 'N/A'}</span>
                  <span>Staff: ${item.staff_name || 'N/A'}</span>
                  <span>Duration: ${item.duration_minutes} min</span>
                  <span>Price: ₹${utils.formatCurrency(item.price)}</span>
                </div>
                ${item.notes ? `<p class="service-notes"><em>${item.notes}</em></p>` : ''}
              </div>
            `).join('') : '<p>No services found</p>'}
          </div>
          
          <div class="detail-section">
            <h4>Payment Summary</h4>
            <div class="payment-summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${utils.formatCurrency(booking.subtotal_amount)}</span>
              </div>
              <div class="summary-row">
                <span>Discount:</span>
                <span>₹${utils.formatCurrency(booking.discount_amount)}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>₹${utils.formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
          </div>
          
          ${booking.notes ? `
            <div class="detail-section">
              <h4>Notes</h4>
              <p>${booking.notes}</p>
            </div>
          ` : ''}
        </div>
      `;
      
      window.appUtils.showModal(`Booking #${booking.id} Details`, detailsHTML, 'large');
    } catch (error) {
      utils.showToast('Error loading booking details: ' + error.message, 'error');
    }
  },
  
  editBooking: async function(id) {
    try {
      const booking = await api.bookings.getById(id);
      if (booking) {
        showBookingForm(booking);
      } else {
        utils.showToast('Booking not found', 'error');
      }
    } catch (error) {
      utils.showToast('Error loading booking: ' + error.message, 'error');
    }
  },
  
  updateStatus: async function(id, status) {
    if (!confirm(`Are you sure you want to change status to "${status}"?`)) return;
    
    try {
      await api.bookings.updateStatus(id, status);
      utils.showToast('Status updated successfully', 'success');
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Update failed', 'error');
    }
  },
  
  deleteBooking: async function(id) {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;
    
    try {
      await api.bookings.delete(id);
      utils.showToast('Booking deleted successfully', 'success');
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Delete failed', 'error');
    }
  }
};


