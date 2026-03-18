// Bookings module
let bookings = [];
let customers = [];
let mainCategories = [];
let subCategories = {};
let categoriesTree = [];
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

window.handleAddCombo = async function (select) {
  const comboId = select.value;
  if (!comboId) return;

  try {
    utils.showToast('Applying combo offer...', 'info');
    const combo = await api.services.getComboById(comboId);

    if (!combo || !combo.services || combo.services.length === 0) {
      utils.showToast('Selected combo has no services.', 'warning');
      return;
    }

    const serviceItemsContainer = document.getElementById('serviceItems');
    if (!serviceItemsContainer) return;

    // Remove empty first service item if it exists
    const firstItem = serviceItemsContainer.children[0];
    if (serviceItemsContainer.children.length === 1 && firstItem) {
      const svcSelect = firstItem.querySelector('.service-select');
      if (!svcSelect || !svcSelect.value) {
        firstItem.remove();
      }
    }

    const totalComboPrice = parseFloat(combo.combo_price);
    const serviceCount = combo.services.length;
    const pricePerService = (totalComboPrice / serviceCount).toFixed(2);

    for (let i = 0; i < combo.services.length; i++) {
      const svc = combo.services[i];
      const index = serviceItemsContainer.children.length;

      // Ensure cache is populated for this subcategory
      if (!services[svc.category_id]) {
        try {
          const fetchedServices = await api.services.getByCategory(svc.category_id);
          services[svc.category_id] = fetchedServices;
        } catch (e) {
          services[svc.category_id] = [svc];
        }
      }

      const itemPrice = i === 0
        ? (totalComboPrice - (parseFloat(pricePerService) * (serviceCount - 1))).toFixed(2)
        : pricePerService;

      const itemData = {
        subcategory_id: svc.category_id,
        service_id: svc.id,
        price: itemPrice,
        duration_minutes: svc.duration_minutes,
        notes: `Combo: ${combo.name}`
      };

      serviceItemsContainer.insertAdjacentHTML('beforeend', renderServiceItem(itemData, index));

      // Initialize rooms and staff
      loadRooms(svc.id, index);
      loadStaff(svc.id, index);
    }

    reindexServiceItems();
    calculateSummary();
    utils.showToast(`${combo.name} applied successfully`, 'success');
    select.value = '';

  } catch (error) {
    console.error('Error applying combo:', error);
    utils.showToast('Failed to apply combo offer', 'error');
  }
};

// Build nested sub-category options grouped under main categories
function buildNestedSubCategoryOptions(selectedId = null, onlyParentId = null) {
  try {
    const tree = Array.isArray(categoriesTree) ? categoriesTree : [];
    if (!tree || tree.length === 0) {
      return '';
    }
    const html = tree.map(main => {
      const mainId = main.id;
      if (onlyParentId && parseInt(onlyParentId) !== parseInt(mainId)) return '';
      const subs = Array.isArray(main.sub_categories)
        ? main.sub_categories
        : (Array.isArray(main.subcategories) ? main.subcategories : []);
      if (!subs || subs.length === 0) return '';
      const options = subs.map(sub => {
        const selected = (selectedId && parseInt(selectedId) === parseInt(sub.id)) ? 'selected' : '';
        return `<option value="${sub.id}" data-parent-id="${mainId}" ${selected}>${sub.name}</option>`;
      }).join('');
      return `<optgroup label="${main.name}">${options}</optgroup>`;
    }).join('');
    return html;
  } catch (_) {
    return '';
  }
}

// Populate services when category (sub-category) changes
window.handleCategoryChange = async function (select, index) {
  const subcategoryId = select.value;

  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const serviceSelect = serviceItem.querySelector('.service-select');

  if (!subcategoryId) {
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    serviceItem.querySelector('.room-select').innerHTML = '<option value="">Select Room (Optional)</option>';
    serviceItem.querySelector('.staff-select').innerHTML = '<option value="">Select Staff (Optional)</option>';
    serviceItem.querySelector('.price-input').value = 0;
    serviceItem.querySelector('.duration-input').value = 0;
    calculateSummary();
    return;
  }

  // Load services for selected sub-category
  try {
    const servicesData = await api.services.getByCategory(subcategoryId);
    services[subcategoryId] = servicesData;
    serviceSelect.innerHTML = `
      <option value="">Select Service</option>
      ${servicesData.map(service => `
        <option value="${service.id}" 
                data-price="${service.base_price}" 
                data-duration="${service.duration_minutes}">
          ${service.name} (${service.duration_minutes} min - ${utils.formatCurrency(service.base_price)})
        </option>
      `).join('')}
    `;

    // Auto-select first service and load its details
    if (servicesData && servicesData.length > 0) {
      serviceSelect.value = servicesData[0].id;
      // Trigger loadServiceDetails to load rooms and staff
      loadServiceDetails(serviceSelect, index);
    } else {
      // Clear dependent fields
      serviceItem.querySelector('.room-select').innerHTML = '<option value="">Select Room (Optional)</option>';
      serviceItem.querySelector('.staff-select').innerHTML = '<option value="">Select Staff (Optional)</option>';
      serviceItem.querySelector('.price-input').value = 0;
      serviceItem.querySelector('.duration-input').value = 0;
      calculateSummary();
    }
  } catch (error) {
    console.error('Error loading services:', error);
  }
};


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
    // Booking stores original totals only. Membership discounts/wallets are applied at invoice stage.
    discount_amount: 0,
    tax_amount: parseFloat(e.target.dataset.tax || '0') || 0, // 5% tax
    wallet_applied: 0,
    notes: formData.get('notes')
  };
  console.log('[Bookings] initial bookingData', bookingData);
  // Membership application flags
  bookingData.membership_apply = (e.target.dataset.membershipApply === 'true');
  bookingData.apply_percent = (e.target.dataset.applyPercent === 'true');
  bookingData.apply_wallet = (e.target.dataset.applyWallet === 'true');
  // Preview totals from UI (server may recompute but we provide for consistency)
  bookingData.subtotal_preview = parseFloat(e.target.dataset.subtotal || '0') || 0;
  bookingData.plan_deduction_preview = 0;
  bookingData.wallet_applied_preview = 0;
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
    const catSel = item.querySelector('.category-select');
    const subcategoryId = parseInt(catSel?.value || '0') || null;

    // Get parent category_id from the selected option's data-parent-id attribute
    let categoryId = null;
    if (catSel && subcategoryId) {
      const selectedOption = catSel.querySelector(`option[value="${subcategoryId}"]`);
      if (selectedOption) {
        categoryId = parseInt(selectedOption.getAttribute('data-parent-id') || '0') || null;
      }
    }

    const serviceData = {
      category_id: categoryId,
      subcategory_id: subcategoryId,
      service_id: parseInt(item.querySelector('.service-select').value),
      room_id: (function () {
        const v = item.querySelector('.room-select').value;
        return v ? parseInt(v) : null;
      })(),
      staff_id: (function () {
        const v = item.querySelector('.staff-select').value;
        return v ? parseInt(v) : null;
      })(),
      price: (function () {
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

    if (window.__calendarContext) {
      window.__calendarContext = false;

      if (window.calendarInstance) {
        window.calendarInstance.refetchEvents();
      }

    } else {
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    }


  } catch (error) {
    console.error('[Bookings] submit error', error);
    utils.showToast(error.message || 'Operation failed', 'error');
  }
}

// Customer search helper (global)
window.searchCustomers = async function (query = null) {
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
  // 🔥 Force open NEW booking form only
  if (window.__forceNewBookingForm === true) {
    window.__forceNewBookingForm = false;

    setTimeout(() => {
      showBookingForm(null); // ALWAYS NEW
    }, 0);
  }


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
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Process</option>
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
        
        <div class="stats-filter-section">
          <div class="d-flex align-items-center gap-3 mb-3">
            <label for="monthFilter" class="form-label">Filter Month:</label>
            <select id="monthFilter" class="form-control" style="width: auto;">
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
              <option value="last3">Last 3 Months</option>
            </select>
          </div>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <h3>Today's Bookings</h3>
            <p id="todayBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>In Process</h3>
            <p id="inProcessBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Completed</h3>
            <p id="completedBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Cancelled</h3>
            <p id="cancelledBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Booked</h3>
            <p id="totalBookings" class="stat-value">0</p>
          </div>
          <div class="stat-card">
            <h3>Revenue</h3>
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
    attachEventListeners(container);
    initActionMenus();

    // 🔥 OPEN FORM AFTER FULL RENDER
    // 🔥 Force open NEW booking form only


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
              <td>${utils.formatCurrency(booking.total_amount || 0, 'INR')}</td>
              <td>
                <span class="badge badge-${window.getBookingStatusClass ? window.getBookingStatusClass(booking.status) : (function (s) { const m = { pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'danger' }; return m[s] || 'secondary'; })(booking.status)}">
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
                  <div class="action-menu-wrap" style="position: relative; display: inline-block;">
                    <button class="btn btn-sm btn-outline action-menu-toggle" type="button" aria-haspopup="true" aria-expanded="false">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="action-menu" role="menu" style="display:none; position: absolute; right: 0; top: 100%; min-width: 150px; background: white; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000; padding: 4px 0;">
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'confirmed')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; cursor: pointer;">Confirm</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'in_progress')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; cursor: pointer;">Start Service</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'completed')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; cursor: pointer;">Complete</button>
                      <button class="dropdown-item" type="button" onclick="window.bookingsModule.updateStatus(${booking.id}, 'cancelled')" style="display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; cursor: pointer;">Cancel</button>
                      <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;">
                      <button class="dropdown-item text-danger" type="button" onclick="window.bookingsModule.deleteBooking(${booking.id})" style="display: block; width: 100%; text-align: left; padding: 8px 16px; border: none; background: none; cursor: pointer; color: #dc3545;">Delete</button>
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
  filterType.addEventListener('change', async function () {
    await applyFilters();
  });

  // Filter by status
  const filterStatus = container.querySelector('#filterStatus');
  filterStatus.addEventListener('change', async function () {
    await applyFilters();
  });

  // Filter by date
  const filterDate = container.querySelector('#filterDate');
  filterDate.addEventListener('change', async function () {
    await applyFilters();
  });

  // New booking button
  const newBookingBtn = container.querySelector('#newBookingBtn');
  newBookingBtn.addEventListener('click', () => showBookingForm());

  // Month filter
  const monthFilter = container.querySelector('#monthFilter');
  monthFilter.addEventListener('change', async function () {
    await loadDashboardStats();
  });
}

// Initialize custom action menu toggles (three dots dropdowns)
function initActionMenus() {
  console.log('Initializing action menus...');

  // Close any open menus
  const closeAllMenus = () => {
    document.querySelectorAll('.action-menu').forEach(menu => { menu.style.display = 'none'; });
    document.querySelectorAll('.action-menu-toggle').forEach(btn => { btn.setAttribute('aria-expanded', 'false'); });
    // Remove menu-open class from any rows
    document.querySelectorAll('.menu-open').forEach(r => r.classList.remove('menu-open'));
  };

  // Remove any existing click listeners to avoid duplicates
  document.removeEventListener('click', closeAllMenus);

  // Set up toggles
  const menuWraps = document.querySelectorAll('.action-menu-wrap');
  console.log(`Found ${menuWraps.length} action menu wraps`);

  menuWraps.forEach((wrap, index) => {
    const toggle = wrap.querySelector('.action-menu-toggle');
    const menu = wrap.querySelector('.action-menu');

    console.log(`Menu ${index}:`, { toggle: !!toggle, menu: !!menu });

    if (!toggle || !menu) return;

    // Remove existing listeners to avoid duplicates
    toggle.replaceWith(toggle.cloneNode(true));
    const newToggle = wrap.querySelector('.action-menu-toggle');

    newToggle.addEventListener('click', (e) => {
      console.log('Action menu toggle clicked');
      e.preventDefault();
      e.stopPropagation();

      const isOpen = menu.style.display === 'block';
      console.log('Menu is currently open:', isOpen);

      closeAllMenus();

      if (!isOpen) {
        console.log('Opening menu...');

        // Clear all existing inline styles and force override
        menu.removeAttribute('style');

        // Apply styles using setProperty with important flag to override any existing CSS
        menu.style.setProperty('display', 'block', 'important');
        menu.style.setProperty('position', 'absolute', 'important');
        menu.style.setProperty('right', '0', 'important');
        menu.style.setProperty('top', '100%', 'important');
        menu.style.setProperty('left', 'auto', 'important');
        menu.style.setProperty('z-index', '9999', 'important');
        menu.style.setProperty('background-color', 'white', 'important');
        menu.style.setProperty('border', '1px solid #ddd', 'important');
        menu.style.setProperty('border-radius', '4px', 'important');
        menu.style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.15)', 'important');
        menu.style.setProperty('min-width', '150px', 'important');
        menu.style.setProperty('padding', '4px 0', 'important');

        console.log('Menu styles applied:', {
          display: menu.style.display,
          position: menu.style.position,
          zIndex: menu.style.zIndex,
          top: menu.style.top,
          right: menu.style.right
        });

        // Also log computed styles to see what's actually rendered
        const computedStyle = window.getComputedStyle(menu);
        console.log('Menu computed styles:', {
          display: computedStyle.display,
          position: computedStyle.position,
          top: computedStyle.top,
          right: computedStyle.right,
          zIndex: computedStyle.zIndex,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity
        });

        newToggle.setAttribute('aria-expanded', 'true');
        // Add menu-open class to the row to disable background interactions
        const row = wrap.closest('tr');
        if (row) row.classList.add('menu-open');
      }
    });
    
    // Prevent clicks inside the menu from bubbling to document (which would close it)
    menu.addEventListener('click', (ev) => { ev.stopPropagation(); });
    // Ensure dropdown items do not propagate
    menu.querySelectorAll('.dropdown-item').forEach(it => it.addEventListener('click', (ev) => { ev.stopPropagation(); }));
  });

  // Click outside to close - set up properly without { once: true }
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-menu-wrap')) {
        closeAllMenus();
      }
    });
  }, 100);
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
    console.log('Dashboard stats received:', stats);
    const contentArea = document.getElementById('contentArea');

    if (contentArea) {
      // Update all dashboard cards
      const todayEl = contentArea.querySelector('#todayBookings');
      const inProcessEl = contentArea.querySelector('#inProcessBookings');
      const completedEl = contentArea.querySelector('#completedBookings');
      const cancelledEl = contentArea.querySelector('#cancelledBookings');
      const totalEl = contentArea.querySelector('#totalBookings');
      const revenueEl = contentArea.querySelector('#monthlyRevenue');

      if (todayEl) todayEl.textContent = stats.today_bookings || 0;
      if (inProcessEl) inProcessEl.textContent = stats.in_process_bookings || 0;
      if (completedEl) completedEl.textContent = stats.completed_bookings || 0;
      if (cancelledEl) cancelledEl.textContent = stats.cancelled_bookings || 0;
      if (totalEl) totalEl.textContent = stats.monthly_bookings || 0;
      if (revenueEl) revenueEl.textContent = `${utils.formatCurrency(stats.total_revenue || 0, 'INR')}`;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    utils.showToast('Error loading dashboard statistics', 'error');
  }
}

export async function showBookingForm(booking = null) {
  const isEdit = !!booking;
  console.log('[Bookings] showBookingForm', { isEdit, booking });

  try {
    if (mainCategories.length === 0) {
      const categoriesData = await api.services.getMainCategories();
      mainCategories = Array.isArray(categoriesData) ? categoriesData : [];
    }
    // Always fetch categories tree to render nested sub-category groups
    try {
      const tree = await api.services.getCategoriesTree();
      categoriesTree = Array.isArray(tree) ? tree : [];
    } catch (err) {
      console.warn('[Bookings] getCategoriesTree failed; nested sub-categories may not show.', err);
      categoriesTree = [];
    }

    // Load combos
    let combos = [];
    try {
      combos = await api.services.getCombos();
    } catch (err) {
      console.warn('[Bookings] Failed to fetch combos', err);
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
  value="${isEdit && booking.booking_date
        ? new Date(booking.booking_date).toISOString().split('T')[0]
        : (window.calendarBookingPayload?.date || utils.getTodayDate())
      }" required>

            </div>
            
            <div class="form-group">
              <label for="startTime">Start Time *</label>
              <input type="time" id="startTime" name="start_time" 
  value="${isEdit && booking.start_time
        ? booking.start_time.substring(0, 5)
        : (window.calendarBookingPayload?.time || '10:00')
      }" required>

            </div>
          </div>
          
          <div class="form-section">
            <h4>Customer Details</h4>
            <div class="customer-search">
              <div class="form-group">
                <label>Search Customer (Phone/Name)</label>
                <div class="input-with-button">
                  <input type="text" id="customerSearch" placeholder="Enter phone or name...">
                  <button type="button" class="btn btn-outline" style="margin-top: 15px;" onclick="searchCustomers()">
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
            <h4>Combo Offers</h4>
            <div class="form-group">
              <label for="comboSelect">Available Combos</label>
              <select id="comboSelect" class="form-control" onchange="handleAddCombo(this)">
                <option value="">-- Apply a Combo Offer --</option>
                ${combos.map(c => `<option value="${c.id}">${c.name} (${utils.formatCurrency(c.combo_price)})</option>`).join('')}
              </select>
              <small class="text-muted">Selecting a combo will add its services to the list below.</small>
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
                <span id="subtotalAmount">0.00</span>
              </div>
              <div class="summary-row">
                <span>Tax (5%):</span>
                <span id="taxAmount">0.00</span>
              </div>
              <div class="summary-row">
                <span>Discount:</span>
                <span id="discountDisplay">0.00</span>
              </div>
              <div class="summary-row">
                <span>Wallet Applied:</span>
                <span id="walletAppliedDisplay">0.00</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span id="totalAmount">0.00</span>
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
            <button type="button" class="btn btn-secondary" onclick="handleBookingCancel()">Cancel</button>
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
          <label>Category</label>
          <select class="category-select" onchange="handleCategoryChange(this, ${index})" required>
            <option value="">Select Category</option>
            ${(() => {
      const tree = Array.isArray(categoriesTree) ? categoriesTree : [];
      if (tree.length === 0) return '';
      return tree.map(main => {
        const subs = Array.isArray(main.sub_categories) ? main.sub_categories : (Array.isArray(main.subcategories) ? main.subcategories : []);
        if (!subs || subs.length === 0) return '';
        const subOptions = subs.map(sub => `
                  <option value="${sub.id}" data-parent-id="${main.id}" ${(item && item.subcategory_id === sub.id) ? 'selected' : ''}>${sub.name}</option>
                `).join('');
        return `<optgroup label="${main.name}">${subOptions}</optgroup>`;
      }).join('');
    })()}
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
                  ${s.name} (${s.duration_minutes} min - ${utils.formatCurrency(s.base_price)})
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
      </div>

      <div class="form-row service-row-3">
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
      await loadServicesForItem(item.subcategory_id, i);
      // Pre-load rooms and staff for edit mode so selects can be preselected
      try {
        await loadRoomsForItem(item.service_id, i);
      } catch (e) {
        console.warn('[Bookings] loadRoomsForItem failed for edit item', e);
      }
      try {
        await loadStaffForItem(item.service_id, i);
      } catch (e) {
        console.warn('[Bookings] loadStaffForItem failed for edit item', e);
      }
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

  // Attach change listener for dynamically created service selects (delegated)
  if (!window._bookings_service_select_listener_attached) {
    window._bookings_service_select_listener_attached = true;
    document.addEventListener('change', function (e) {
      try {
        if (e.target && e.target.classList && e.target.classList.contains('service-select')) {
          const item = e.target.closest('.service-item');
          if (!item) return;
          const index = parseInt(item.dataset.index || '0');
          loadServiceDetails(e.target, index);
        }
      } catch (err) {
        console.warn('[Bookings] delegated service-select handler error', err);
      }
    });
  }

  // Capture basePrice for all existing items (edit mode or initial render)
  Array.from(document.querySelectorAll('.service-item .price-input')).forEach(inp => {
    if (!inp.dataset.basePrice) {
      inp.dataset.basePrice = String(parseFloat(inp.value || '0') || 0);
    }
  });

  // If categoriesTree is available, ensure category selects are populated with nested structure
  try {
    const items = document.querySelectorAll('.service-item');
    items.forEach(item => {
      const categorySel = item.querySelector('.category-select');
      if (categorySel) {
        // Populate with optgroup structure
        const tree = Array.isArray(categoriesTree) ? categoriesTree : [];
        const html = `
          <option value="">Select Category</option>
          ${tree.map(main => {
          const subs = Array.isArray(main.sub_categories) ? main.sub_categories : [];
          if (!subs || subs.length === 0) return '';
          const subOptions = subs.map(sub => `
              <option value="${sub.id}" data-parent-id="${main.id}">
                ${sub.name}
              </option>
            `).join('');
          return `<optgroup label="${main.name}">${subOptions}</optgroup>`;
        }).join('')}
        `;
        categorySel.innerHTML = html;

        // Pre-select if editing
        if (booking && booking.items) {
          const idx = parseInt(item.dataset.index || '0');
          const pre = booking.items[idx]?.subcategory_id;
          if (pre) categorySel.value = String(pre);
        }
      }
    });
  } catch (err) {
    console.warn('[Bookings] Nested category initialization skipped', err);
  }

}


window.scrollServiceItems = function (direction) {
  const container = document.getElementById('serviceItems');
  if (!container) return;
  const amount = 600 * (direction < 0 ? -1 : 1);
  container.scrollBy({ left: amount, behavior: 'smooth' });
};

window.selectCustomer = function (id, name, phone) {
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

window.toggleNewCustomerForm = function () {
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

window.addServiceItem = function () {
  const serviceItems = document.getElementById('serviceItems');
  const index = serviceItems.children.length;
  serviceItems.insertAdjacentHTML('beforeend', renderServiceItem(null, index));
  // Smoothly scroll new card into view for horizontal layout
  reindexServiceItems();
  const newCard = serviceItems.lastElementChild;
  if (newCard && newCard.scrollIntoView) {
    newCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }
  // Hide subcategory until a main category is chosen
  const subGroup = newCard.querySelector('.sub-category-group');
  if (subGroup) { subGroup.style.display = 'none'; }
};

window.removeServiceItem = function (button) {
  const serviceItem = button.closest('.service-item');
  serviceItem.remove();
  reindexServiceItems();
  calculateSummary();
};

window.loadSubCategories = async function (select, index) {
  // Deprecated: no longer used after unifying category selection.
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

  calculateSummary();
}

window.loadServices = async function (select, index) {
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
          ${service.name} (${service.duration_minutes} min - ${utils.formatCurrency(service.base_price)})
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

window.loadServiceDetails = function (select, index) {
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
    const subSelect = serviceItem.querySelector('.category-select');
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

    // Fetch all staff for department (or all if no department)
    const allStaff = await api.staff.getAll(department ? { department } : {});

    // Determine booking date for attendance filtering
    let bookingDate = document.getElementById('bookingDate')?.value || '';
    if (!bookingDate) bookingDate = utils.getTodayDate();

    // Get present staff attendance records for the date
    const attendance = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
    const attendanceFiltered = department ? attendance.filter(a => a.department === department) : attendance;
    const presentIds = new Set(attendanceFiltered.map(a => a.staff_id));

    // Exclude staff on approved leave for that date
    const leaves = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
    const onLeaveIds = new Set(leaves.map(l => l.staff_id));

    // Filter by service qualification (services_qualified contains service IDs)
    const targetServiceId = parseInt(serviceId);
    const qualifiedStaff = allStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));

    // Cache for pre-populating when editing
    staff[serviceId] = qualifiedStaff;
    staffSelect.innerHTML = `
      <option value="">Select Staff (Optional)</option>
      ${qualifiedStaff.map(s => {
        let status = presentIds.has(s.id) ? '' : (onLeaveIds.has(s.id) ? ' (On Leave)' : ' (Absent)');
        return `<option value="${s.id}">${s.name} - ${s.department}${status}</option>`;
      }).join('')}
    `;
    if (qualifiedStaff.length === 0) {
      staffSelect.insertAdjacentHTML('beforeend', '<option disabled>(No qualified staff for this service)</option>');
    }
  } catch (error) {
    console.error('Error loading staff:', error);
    staffSelect.innerHTML = '<option value="">Error loading staff</option>';
  }
}

async function loadStaffForItem(serviceId, index) {
  const serviceItem = document.querySelector(`.service-item[data-index="${index}"]`);
  const staffSelect = serviceItem.querySelector('.staff-select');
  try {
    // Infer department via service details
    let department = '';
    try {
      const svcDetail = await api.services.getById(serviceId);
      department = svcDetail?.main_category_name || '';
    } catch (e) {
      department = '';
    }
    const allStaff = await api.staff.getAll(department ? { department } : {});

    // Attendance and leave for status
    let bookingDate = document.getElementById('bookingDate')?.value || '';
    if (!bookingDate) bookingDate = utils.getTodayDate();
    const attendance = await api.staff.getAttendance({ date: bookingDate, status: 'present' });
    const attendanceFiltered = department ? attendance.filter(a => a.department === department) : attendance;
    const presentIds = new Set(attendanceFiltered.map(a => a.staff_id));
    const leaves = await api.staff.getLeaves({ date: bookingDate, status: 'approved' });
    const onLeaveIds = new Set(leaves.map(l => l.staff_id));

    // Filter by service qualification (services_qualified contains service IDs)
    const targetServiceId = parseInt(serviceId);
    const qualifiedStaff = allStaff.filter(s => parseQualifiedList(s.services_qualified).includes(targetServiceId));

    // Cache for pre-populating when editing
    staff[serviceId] = qualifiedStaff;
    staffSelect.innerHTML = `
      <option value="">Select Staff (Optional)</option>
      ${qualifiedStaff.map(s => {
        let status = presentIds.has(s.id) ? '' : (onLeaveIds.has(s.id) ? ' (On Leave)' : ' (Absent)');
        return `<option value="${s.id}">${s.name} - ${s.department}${status}</option>`;
      }).join('')}
    `;
    if (qualifiedStaff.length === 0) {
      staffSelect.insertAdjacentHTML('beforeend', '<option disabled>(No qualified staff for this service)</option>');
    }
  } catch (error) {
    console.error('Error loading staff:', error);
    staffSelect.innerHTML = '<option value="">Error loading staff</option>';
  }
}

window.calculateSummary = function () {
  let subtotal = 0;
  let totalDuration = 0;
  // Build items with base prices
  const serviceItems = Array.from(document.querySelectorAll('.service-item')).map(item => {
    const priceInput = item.querySelector('.price-input');
    const basePrice = parseFloat(priceInput?.dataset.basePrice || priceInput.value || '0') || 0;
    const duration = parseInt(item.querySelector('.duration-input').value) || 0;
    return { item, priceInput, basePrice, duration };
  });
  serviceItems.forEach(s => { subtotal += s.basePrice; totalDuration += s.duration; });

  // Calculate tax (5% default)
  const TAX_PERCENTAGE = 5;
  const tax = parseFloat((subtotal * (TAX_PERCENTAGE / 100)).toFixed(2));

  const total = parseFloat((subtotal + tax).toFixed(2));

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

  // Update display (Booking summary shows subtotal, tax, total only — wallet only applies at invoice stage)
  document.getElementById('subtotalAmount').textContent = `${utils.formatCurrency(subtotal)}`;
  document.getElementById('taxAmount').textContent = `${utils.formatCurrency(tax)}`;
  document.getElementById('discountDisplay').textContent = `0.00`;
  // Keep wallet display but show zero to avoid confusion
  document.getElementById('walletAppliedDisplay').textContent = `0.00`;
  document.getElementById('totalAmount').textContent = `${utils.formatCurrency(total)}`;
  document.getElementById('totalDuration').textContent = `${totalDuration} minutes`;
  document.getElementById('endTime').textContent = endTime;

  // Update form data (do not store wallet/discount here)
  document.getElementById('bookingForm').dataset.endTime = endTime;
  document.getElementById('bookingForm').dataset.totalDuration = totalDuration;
  const formEl = document.getElementById('bookingForm');
  formEl.dataset.subtotal = String(subtotal);
  formEl.dataset.tax = String(tax);
  formEl.dataset.discount = String(0);
  formEl.dataset.walletApplied = String(0);
  formEl.dataset.finalTotal = String(total);
};

async function fetchCustomerMembership(customerId) {
  try {
    // Fetch both customer details and membership
    const [customer, membership] = await Promise.all([
      api.customers.getById(customerId),
      api.memberships.getForCustomer(customerId)
    ]);

    // Store customer data (includes wallet_balance)
    window.bookingCustomer = customer || null;

    // Store membership data
    window.bookingMembership = membership || null;

    // Recalculate summary to reflect membership and wallet
    calculateSummary();
  } catch (error) {
    console.error('Error fetching customer/membership:', error);
    window.bookingCustomer = null;
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
  viewBooking: async function (id) {
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
              <div><strong>Status:</strong> <span class="badge badge-${window.getBookingStatusClass ? window.getBookingStatusClass(booking.status) : (function (s) { const m = { pending: 'warning', confirmed: 'info', in_progress: 'primary', completed: 'success', cancelled: 'danger' }; return m[s] || 'secondary'; })(booking.status)}">${booking.status}</span></div>
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
                  <span>Price: ${utils.formatCurrency(item.price)}</span>
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
                <span>${utils.formatCurrency(booking.subtotal_amount)}</span>
              </div>
              <div class="summary-row">
                <span>Tax (5%):</span>
                <span>${utils.formatCurrency(booking.tax_amount || 0)}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span>${utils.formatCurrency(booking.total_amount)}</span>
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

  editBooking: async function (id) {
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

  updateStatus: async function (id, status) {
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

  deleteBooking: async function (id) {
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

/* =========================================================
   PUBLIC BOOKING TRIGGER (CALENDAR / GLOBAL USE)
   ========================================================= */
window.handleBookingCancel = function () {
  window.appUtils.closeModal();

  if (window.__calendarContext) {
    window.__calendarContext = false;
  }
};


