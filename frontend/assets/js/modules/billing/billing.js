let invoices = [];
let customers = [];
let salonSettings = {};
let serviceBookings = [];
let serviceAmount = 0;
let servicesActualSubtotal = 0;
let serviceTaxAmount = 0;
// Wallet vars (new)
let customerWalletBalance = 0;
let walletApplied = 0;
let remainingWallet = 0;
let sortConfig = { column: null, direction: 'asc' };

export async function render(container) {
  try {
    const [invoicesData, customersData, settingsData] = await Promise.all([
      api.billing.getAll(),
      api.customers.getAll(),
      api.settings.get()
    ]);

    invoices = invoicesData;
    customers = customersData;
    salonSettings = settingsData;

    container.innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <div class="d-flex gap-2">
            <button id="customerInvoiceBtn" class="btn btn-primary btn-sm">Customer Invoices</button>
            <button id="membershipInvoiceBtn" class="btn btn-outline btn-sm">Membership Invoices</button>
          </div>
          <div class="d-flex gap-2 mt-2">
            <select id="filterStatus" class="form-control">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button id="addInvoiceBtn" class="btn btn-primary">Create Invoice</button>
          </div>
        </div>
        <div id="invoicesTable">
          ${renderInvoicesTable(invoices)}
        </div>
      </div>
    `;
    document.getElementById("membershipInvoiceBtn")
      .addEventListener("click", () => {
        window.location.hash = "membership-billing";
      });

    attachEventListeners(container);
  } catch (error) {
    console.error("Error loading billing:", error);
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>Failed to load invoices: ${error.message}</p>
      </div>
    `;
  }
}

function renderInvoicesTable(invoiceList) {
  if (invoiceList.length === 0) {
    return '<p class="text-center">No invoices found</p>';
  }

  const currency = salonSettings.billing?.currency || "INR";

  return `
    <table>
      <thead>
        <tr>
          <th>Invoice </th>
          <th>Customer</th>
          <th class="sortable" data-column="invoice_date">
            Date 
            <span class="sort-arrow ${sortConfig.column === 'invoice_date' ? (sortConfig.direction === 'asc' ? 'active-asc' : 'active-desc') : ''}">
              <span class="arrow-up">▲</span><span class="arrow-down">▼</span>
            </span>
          </th>
          <th>Subtotal</th>
          <th>Tax</th>
          <th>Discount</th>
          <th>Total</th>
          <th class="sortable" data-column="status">
            Status 
            <span class="sort-arrow ${sortConfig.column === 'status' ? (sortConfig.direction === 'asc' ? 'active-asc' : 'active-desc') : ''}">
              <span class="arrow-up">▲</span><span class="arrow-down">▼</span>
            </span>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${invoiceList
      .map(
        (inv) => `
          <tr>
            <td>${inv.invoice_number}</td>
            <td>${inv.customer_name || "N/A"}</td>
            <td>${utils.formatDate(inv.invoice_date)}</td>
            <td>${utils.formatCurrency(inv.subtotal, currency)}</td>
            <td>${utils.formatCurrency(inv.tax, currency)}</td>
            <td>${utils.formatCurrency(inv.discount, currency)}</td>
            <td>${utils.formatCurrency(inv.total, currency)}</td>
            <td><span class="badge badge-${getInvoiceStatusClass(inv.status)}">${inv.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="window.billingModule.viewInvoice(${inv.id})">View</button>
              <button class="btn btn-sm btn-success" onclick="window.billingModule.printInvoice(${inv.id})">Print</button>
              <select class="btn btn-sm" onchange="window.billingModule.updateStatus(${inv.id}, this.value)">
                <option value="">Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        `
      )
      .join("")}
      </tbody>
    </table>
  `;
}

function attachEventListeners(container) {
  const filterSelect = container.querySelector("#filterStatus");
  filterSelect.addEventListener("change", async function () {
    const status = this.value;
    const filtered = status
      ? await api.billing.getAll({ status })
      : await api.billing.getAll();
    invoices = filtered;
    updateTable(container);
  });

  // Add sorting event listeners
  const sortableHeaders = container.querySelectorAll('th.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      if (sortConfig.column === column) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortConfig.column = column;
        sortConfig.direction = 'asc';
      }
      updateTable(container);
    });
  });

  const addBtn = container.querySelector("#addInvoiceBtn");
  addBtn.addEventListener("click", () => showInvoiceForm());
}

function updateTable(container) {
  const sorted = sortInvoices(invoices);
  container.querySelector("#invoicesTable").innerHTML = renderInvoicesTable(sorted);
  attachEventListeners(container);
}

function sortInvoices(list) {
  if (!sortConfig.column) return list;

  return [...list].sort((a, b) => {
    let aValue = a[sortConfig.column];
    let bValue = b[sortConfig.column];

    // Handle null values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Compare values
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}

async function showInvoiceForm(invoice = null) {
  const isEdit = !!invoice;
  let extraItems = invoice?.extra_items || [];

  const formHTML = `
    <form id="invoiceForm">
      <div class="form-group">
        <label for="invoiceCustomer">Customer *</label>
        <select id="invoiceCustomer" name="customer_id" required>
          <option value="">Select customer</option>
          ${customers
      .map(
        (c) =>
          `<option value="${c.id}" ${invoice?.customer_id === c.id ? "selected" : ""
          }>${c.name} - ${c.phone || "No phone"}</option>`
      )
      .join("")}
        </select>
      </div>
      
      <!-- Customer History Section -->
      <div id="customerHistory" class="card mb-3" style="display:none; background: #fff; padding: 15px; border: 1px solid #dee2e6;"></div>

      <div class="form-group">
        <label for="invoiceDate">Invoice Date *</label>
        <div class="d-flex align-items-center gap-3">
          <input type="date" id="invoiceDate" name="invoice_date" value="${invoice?.invoice_date || utils.getTodayDate()
    }" required style="flex:1">
          
          <div class="form-check" style="margin-bottom:0;">
            <input type="checkbox" class="form-check-input" id="includeAllUnpaid" checked>
            <label class="form-check-label" for="includeAllUnpaid">Include all unpaid bookings</label>
          </div>
        </div>
        <small class="text-muted">Uncheck to invoice only bookings on the selected date.</small>
      </div>

      <div id="serviceDetails" class="card mb-3" style="background: #f8f9fa; padding: 15px; display:none;">
        <h5>Service Details</h5>
        <div id="serviceInfo"></div>
      </div>

      <div class="form-group">
        <label>Extra Items (Oil, Products, etc.)</label>
        <div id="extraItems">
          ${extraItems
      .map(
        (item) => `
            <div class="extra-item d-flex gap-2 mb-2">
              <input type="text" placeholder="Item name" value="${item.name
          }" class="item-name" style="flex: 2">
              <input type="number" placeholder="Qty" value="${item.quantity
          }" class="item-qty" style="flex: 1" min="1">
              <input type="number" placeholder="Price" value="${item.price
          }" class="item-price" style="flex: 1" step="0.01" min="0">
              <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove(); window.updateInvoiceCalculations();">×</button>
            </div>
          `
      )
      .join("")}
        </div>
        <button type="button" id="addExtraItemBtn" class="btn btn-sm btn-outline mt-1">+ Add Extra Item</button>
      </div>

      <div id="calculationSummary" class="card mt-3" style="background:#f0f7ff; padding:15px; border-radius:6px;">
        <h5>Invoice Summary</h5>
        <div id="summaryDetails">
          <p>Select customer to fetch bookings</p>
        </div>
      </div>

      <div class="form-group">
        <label>Payment Status *</label>
        <select id="invoiceStatus" name="status" required>
          <option value="pending" ${invoice?.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="paid" ${invoice?.status === 'paid' || !invoice ? 'selected' : ''}>Paid</option>
        </select>
      </div>

      <div class="form-group">
        <label>Payment Method(s)</label>
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" name="payment_method" value="cash" 
              ${invoice?.payment_methods?.includes('cash') ? 'checked' : ''}>
            <span>Cash</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" name="payment_method" value="upi" 
              ${invoice?.payment_methods?.includes('upi') ? 'checked' : ''}>
            <span>UPI</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" name="payment_method" value="card" 
              ${invoice?.payment_methods?.includes('card') ? 'checked' : ''}>
            <span>Card</span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label for="invoiceNotes">Notes</label>
        <textarea id="invoiceNotes" name="notes" rows="2">${invoice?.notes || ""
    }</textarea>
      </div>

      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">${isEdit ? "Update" : "Create"
    } Invoice</button>
        ${isEdit
      ? `<button type="button" class="btn btn-success" onclick="window.billingModule.printInvoice(${invoice.id})">Print Invoice</button>`
      : ""
    }
      </div>
    </form>
  `;

  window.appUtils.showModal(isEdit ? "Edit Invoice" : "Create Invoice", formHTML);

  // If editing an existing invoice, preload wallet and service data for that customer
  if (isEdit && invoice && invoice.customer_id) {
    try {
      await window.billingModule.loadCustomerWallet(invoice.customer_id);
      await window.billingModule.loadServiceData(invoice.customer_id, document.getElementById('invoiceDate').value);
    } catch (err) {
      console.warn('Failed to preload invoice customer data', err);
    }
  }

  document
    .getElementById("invoiceDate")
    .addEventListener("change", async function () {
      const customerId = parseInt(document.getElementById("invoiceCustomer").value);
      const date = this.value;
      if (customerId) {
        await window.billingModule.loadServiceData(customerId, date);
      }
    });

  document
    .getElementById("invoiceCustomer")
    .addEventListener("change", async function () {
      const customerId = parseInt(this.value);
      const date = document.getElementById("invoiceDate").value;
      if (customerId) {
        await window.billingModule.loadCustomerHistory(customerId);
        // Load customer's membership wallet and unpaid bookings
        await window.billingModule.loadCustomerWallet(customerId);
        await window.billingModule.loadServiceData(customerId, date);
      }
    });

  // Load wallet when date changes as well (keeps wallet visible)
  document.getElementById("invoiceDate").addEventListener('change', async function () {
    const customerId = parseInt(document.getElementById("invoiceCustomer").value);
    if (customerId) await window.billingModule.loadCustomerWallet(customerId);
  });

  document
    .getElementById("includeAllUnpaid")
    ?.addEventListener("change", async function () {
      const customerId = parseInt(document.getElementById("invoiceCustomer").value);
      const date = document.getElementById("invoiceDate").value;
      if (customerId) {
        await window.billingModule.loadServiceData(customerId, date);
      }
    });

  document
    .getElementById("addExtraItemBtn")
    .addEventListener("click", function () {
      const itemsContainer = document.getElementById("extraItems");
      const newItem = document.createElement("div");
      newItem.className = "extra-item d-flex gap-2 mb-2";
      newItem.innerHTML = `
        <input type="text" placeholder="Item name" class="item-name" style="flex: 2">
        <input type="number" placeholder="Qty" class="item-qty" style="flex: 1" min="1" value="1">
        <input type="number" placeholder="Price" class="item-price" style="flex: 1" step="0.01" min="0">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove(); window.updateInvoiceCalculations();">×</button>
      `;
      itemsContainer.appendChild(newItem);
    });

  document.getElementById("extraItems").addEventListener("input", (e) => {
    if (
      e.target.classList.contains("item-qty") ||
      e.target.classList.contains("item-price")
    ) {
      window.updateInvoiceCalculations();
    }
  });

  /* =========================================================
     HELPER: Load Customer History 
     (Displays last 5 bookings regardless of payment status)
     ========================================================= */
  window.billingModule.loadCustomerHistory = async function (customerId) {
    const container = document.getElementById('customerHistory');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<p class="text-muted"><small>Loading history...</small></p>';

    try {
      const bookings = await api.bookings.getAll({ customer_id: customerId });
      // Sort DESC by date
      const sorted = bookings.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date)).slice(0, 5);

      if (sorted.length === 0) {
        container.innerHTML = '<p class="text-muted"><small>No previous bookings found.</small></p>';
        return;
      }

      const currency = salonSettings.billing?.currency || "INR";
      container.innerHTML = `
            <h6 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; color: #6c757d;">Previous 5 Bookings</h6>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em;">
                ${sorted.map(b => `
                    <li style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f8f9fa;">
                        <span>
                            <span class="badge badge-${b.status === 'completed' ? 'success' : 'secondary'}" style="font-size: 0.8em; padding: 2px 5px;">${b.status}</span>
                            <span style="margin-left:5px;">${utils.formatDate(b.booking_date)}</span>
                        </span>
                        <strong>${utils.formatCurrency(b.total_amount, currency)}</strong>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (err) {
      console.error('Error loading history', err);
      container.innerHTML = '<p class="text-danger"><small>Failed to load history</small></p>';
    }
  };

  /* =========================================================
     HELPER: Get Unpaid Bookings
     (Filters out bookings that are already linked to an invoice)
     ========================================================= */
  async function getUnpaidBookings(customerId) {
    if (!customerId) return [];

    try {
      // 1. Fetch completed bookings for this customer
      const allBookings = await api.bookings.getAll({ customer_id: customerId });

      // Filter for completed or confirmed bookings
      // The user specially asked for status: 'completed' but let's include confirmed too just in case
      const invoiceableBookings = allBookings.filter(b =>
        ['completed', 'confirmed'].includes(b.status)
      );

      // 2. Fetch invoices for this customer to find already invoiced bookings
      const customerInvoices = await api.billing.getAll();
      const thisCustomerInvoices = customerInvoices.filter(inv => Number(inv.customer_id) === Number(customerId));

      const invoicedBookingIds = new Set();
      thisCustomerInvoices.forEach(inv => {
        if (inv.booking_ids) {
          let ids = [];
          if (Array.isArray(inv.booking_ids)) ids = inv.booking_ids;
          else if (typeof inv.booking_ids === 'string') {
            try { ids = JSON.parse(inv.booking_ids); } catch (e) { }
          }
          ids.forEach(id => invoicedBookingIds.add(Number(id)));
        }
      });

      return invoiceableBookings.filter(b => !invoicedBookingIds.has(Number(b.id)));
    } catch (err) {
      console.error('Error getting unpaid bookings:', err);
      // Fallback: return empty array to be safe
      return [];
    }
  }

  /* =========================================================
     MAIN: Load Service Data (Unpaid Bookings for Invoice)
     ========================================================= */
  window.billingModule.loadServiceData = async function (customerId, date) {
    try {
      console.log('=== LOADING SERVICE DATA ===');

      const includeAllElement = document.getElementById('includeAllUnpaid');
      const includeAll = includeAllElement ? includeAllElement.checked : false;

      // 1. Get Unpaid Bookings
      let unpaidBookings = await getUnpaidBookings(customerId);

      // 2. Filter based on toggle
      let availableBookings = [];
      if (includeAll) {
        availableBookings = unpaidBookings;
      } else if (date) {
        availableBookings = unpaidBookings.filter(b => b.booking_date === date);
      } else {
        // If toggle OFF and NO date selected, show nothing
        availableBookings = [];
      }

      // Sort bookings by date ascending for invoice clarity
      availableBookings.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

      serviceBookings = availableBookings || [];

      console.log('Bookings to invoice:', serviceBookings.length);
      const currency = salonSettings.billing?.currency || "INR";

      if (availableBookings.length === 0) {
        document.getElementById("serviceDetails").style.display = "none";
        serviceAmount = 0;
        servicesActualSubtotal = 0;
        serviceTaxAmount = 0;
        walletApplied = 0;

        // Only show toast/log if user explicitly selected a customer
        if (customerId) {
          const msg = includeAll ? "All bookings for this customer are already invoiced." : "No unpaid bookings found for this date.";
          console.log(msg);
          // Verify if we should show a toast - maybe too intrusive if just switching customers
          // utils.showToast(msg, "info");
        }

        window.updateInvoiceCalculations();
      } else {
        // Calculate totals from bookings
        serviceAmount = availableBookings.reduce(
          (sum, b) => sum + (parseFloat(b.total_amount) || 0),
          0
        );

        // Sum up original subtotals
        servicesActualSubtotal = availableBookings.reduce(
          (sum, b) => sum + (parseFloat(b.subtotal_amount) || parseFloat(b.total_amount) || 0),
          0
        );

        // Display list of bookings being invoiced
        document.getElementById("serviceInfo").innerHTML = `
          <ul style="max-height: 200px; overflow-y: auto; list-style:none; padding-left:0;">
            ${availableBookings
            .map(
              (b) =>
                `<li style="border-bottom:1px solid #eee; padding:5px 0;">
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${utils.formatDate(b.booking_date)}</strong>
                        <span>${utils.formatCurrency(b.total_amount, currency)}</span>
                    </div>
                    <div style="font-size:0.9em; color:#666;">
                        <small>${b.services || "Services"}</small>
                        <br/>
                        <small class="text-muted">ID: #${b.id} | ${utils.formatTime(b.start_time)}</small>
                    </div>
                   </li>`
            )
            .join("")}
          </ul>
          <div style="margin-top:10px; border-top:2px solid #ddd; padding-top:5px;">
            <strong>Unpaid Total: ${utils.formatCurrency(serviceAmount, currency)}</strong>
          </div>
        `;
        document.getElementById("serviceDetails").style.display = "block";

        // Fetch detailed items from backend using booking_ids to get accurate tax/wallet/discount breakdowns
        try {
          const bookingIds = availableBookings.map(b => b.id).join(',');

          // We don't need 'date' param anymore for multi-booking fetch
          const autoData = await api.billing.getAutoItems({
            customer_id: customerId,
            booking_ids: bookingIds
          });

          // Use backend calculations if available
          const bookingTotals = autoData.booking_totals || [];
          if (bookingTotals.length > 0) {
            servicesActualSubtotal = bookingTotals.reduce((s, t) => s + parseFloat(t.subtotal_amount || 0), 0);
            serviceAmount = bookingTotals.reduce((s, t) => s + parseFloat(t.total_amount || 0), 0);
            serviceTaxAmount = bookingTotals.reduce((s, t) => s + parseFloat(t.tax_amount || 0), 0);
            // NOTE: Do not read or apply wallet from bookings here. Wallet applies only at invoice stage.
          } else {
            // Fallback to local sum
            serviceTaxAmount = availableBookings.reduce((s, b) => s + parseFloat(b.tax_amount || 0), 0);
          }

          } catch (error) {
            console.log('Error fetching details, using booking summaries', error);
            serviceTaxAmount = availableBookings.reduce((s, b) => s + parseFloat(b.tax_amount || 0), 0);
            walletApplied = 0;
          }
      }

      window.updateInvoiceCalculations();
    } catch (error) {
      console.error("Error loading services:", error);
      utils.showToast("Failed to load booking services", "error");
    }
  };

  // Load customer's membership and wallet balance
  window.billingModule.loadCustomerWallet = async function (customerId) {
    try {
      customerWalletBalance = 0;
      window.billingModule.currentMembership = null;
      if (!customerId) return;
      const membership = await api.memberships.getForCustomer(customerId);
      if (membership) {
        // membership may be null if none
        window.billingModule.currentMembership = membership || null;
        customerWalletBalance = parseFloat(membership?.wallet_balance || 0);
      }
    } catch (err) {
      console.warn('Failed to load membership wallet', err);
      customerWalletBalance = 0;
      window.billingModule.currentMembership = null;
    }
    // Recalculate display
    window.updateInvoiceCalculations();
  };

  window.updateInvoiceCalculations = function () {
    const currency = salonSettings.billing?.currency || "INR";
    let extraItemsTotal = 0;
    let extraItemsTax = 0;

    document
      .querySelectorAll("#extraItems .extra-item")
      .forEach((item) => {
        const qty = parseFloat(item.querySelector(".item-qty")?.value) || 0;
        const price = parseFloat(item.querySelector(".item-price")?.value) || 0;
        const itemSubtotal = qty * price;
        extraItemsTotal += itemSubtotal;
      });

    const taxRate = parseFloat(salonSettings.billing?.taxRate ?? 5) || 5;
    extraItemsTax = parseFloat((extraItemsTotal * (taxRate / 100)).toFixed(2));
    const extraItemsWithTax = extraItemsTotal + extraItemsTax;

    // New calculation flow: tax before wallet
    const servicesSubtotal = parseFloat((servicesActualSubtotal || 0).toFixed(2));
    const subtotal = parseFloat((servicesSubtotal + extraItemsTotal).toFixed(2));
    const tax = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
    const grossTotal = parseFloat((subtotal + tax).toFixed(2));

    // wallet logic
    const useWallet = !!document.getElementById('useMembershipWallet')?.checked;
    walletApplied = 0;
    if (useWallet && customerWalletBalance > 0) {
      walletApplied = Math.min(parseFloat(customerWalletBalance || 0), grossTotal);
    }
    remainingWallet = parseFloat(Math.max(0, (parseFloat(customerWalletBalance || 0) - walletApplied)).toFixed(2));

    const finalPayable = parseFloat(Math.max(0, grossTotal - walletApplied).toFixed(2));

    // subtle recalculation animation (opacity fade)
    const summaryEl = document.getElementById('summaryDetails');
    if (summaryEl) {
      summaryEl.style.transition = 'opacity 180ms ease';
      summaryEl.style.opacity = '0.6';
      setTimeout(() => { summaryEl.style.opacity = '1'; }, 180);
    }

    document.getElementById("summaryDetails").innerHTML = `
      <div style="background: #e8f4fd; padding: 10px; border-radius: 4px; margin-bottom: 12px;">
        <h6 style="margin: 0 0 8px 0; color: #1976d2;">📋 Services</h6>
        <p style="margin: 2px 0;"><strong>Services Subtotal:</strong> ${utils.formatCurrency(servicesSubtotal, currency)}</p>
        ${serviceTaxAmount > 0 ? `<p style="margin: 2px 0;"><small>Service Tax (from bookings): ${utils.formatCurrency(serviceTaxAmount, currency)}</small></p>` : ''}
      </div>

      ${extraItemsTotal > 0 ? `
      <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin-bottom: 12px;">
        <h6 style="margin: 0 0 8px 0; color: #f57c00;">🛍️ Extra Items</h6>
        <p style="margin: 2px 0;"><strong>Items Subtotal:</strong> ${utils.formatCurrency(extraItemsTotal, currency)}</p>
        <p style="margin: 2px 0;"><strong>Tax (${taxRate}%):</strong> ${utils.formatCurrency(extraItemsTax, currency)}</p>
        <p style="margin: 2px 0;"><strong>Items Total:</strong> ${utils.formatCurrency(extraItemsWithTax, currency)}</p>
      </div>
      ` : ''}

      <div style="background: #f9fafa; padding: 10px; border-radius: 4px; margin-bottom: 12px;">
        <h6 style="margin: 0 0 8px 0; color: #6a7d8c;">👑 Membership Wallet</h6>
        <p style="margin:2px 0; color:#333;"><strong>Available Wallet Balance:</strong> ${utils.formatCurrency(customerWalletBalance || 0, currency)}</p>
        <label style="display:flex; align-items:center; gap:8px; margin:4px 0;">
          <input type="checkbox" id="useMembershipWallet" ${useWallet ? 'checked' : ''}> <span>Use Membership Wallet</span>
        </label>
        <p id="walletAppliedDisplay" style="margin:2px 0; color:#333;"><strong>Wallet Applied:</strong> -${utils.formatCurrency(walletApplied, currency)}</p>
        <p id="remainingWalletDisplay" style="margin:2px 0; color:#777;"><strong>Remaining Wallet Balance:</strong> ${utils.formatCurrency(remainingWallet, currency)}</p>
      </div>

      <div style="background: #f1f8e9; padding: 10px; border-radius: 4px;">
        <h6 style="margin: 0 0 8px 0; color: #388e3c;">💰 Final Payment</h6>
        <div style="font-size: 14px;">
          <p style="margin: 2px 0;"><strong>Gross Total:</strong> ${utils.formatCurrency(grossTotal, currency)}</p>
          <p style="margin: 2px 0;"><strong>Final Payable Amount:</strong> ${utils.formatCurrency(finalPayable, currency)}</p>
        </div>
      </div>
    `;

    // Attach change listener for wallet checkbox to recalc
    const walletCheckbox = document.getElementById('useMembershipWallet');
    if (walletCheckbox) {
      walletCheckbox.addEventListener('change', () => window.updateInvoiceCalculations());
    }

    // If final payable is zero, auto-mark status paid and disable payment methods
    const invoiceStatusEl = document.getElementById('invoiceStatus');
    const paymentCheckboxes = Array.from(document.querySelectorAll('input[name="payment_method"]'));
    if (finalPayable === 0) {
      if (invoiceStatusEl) invoiceStatusEl.value = 'paid';
      paymentCheckboxes.forEach(ch => { ch.checked = false; ch.disabled = true; });
    } else {
      if (invoiceStatusEl && invoiceStatusEl.value === 'paid') invoiceStatusEl.value = 'pending';
      paymentCheckboxes.forEach(ch => { ch.disabled = false; });
    }

    // Update wallet info displays if present
    const walletAppliedEl = document.getElementById('walletAppliedDisplay');
    const remainingWalletEl = document.getElementById('remainingWalletDisplay');
    if (walletAppliedEl) walletAppliedEl.innerHTML = `<strong>Wallet Applied:</strong> -${utils.formatCurrency(walletApplied, currency)}`;
    if (remainingWalletEl) remainingWalletEl.innerHTML = `<strong>Remaining Wallet Balance:</strong> ${utils.formatCurrency(remainingWallet, currency)}`;
  };

  document
    .getElementById("invoiceForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const currency = salonSettings.billing?.currency || "INR";

      // Get selected payment methods
      const paymentMethods = [];
      document.querySelectorAll('input[name="payment_method"]:checked').forEach(checkbox => {
        paymentMethods.push(checkbox.value);
      });

      const extraItems = [];
      document.querySelectorAll(".extra-item").forEach((item) => {
        const name = item.querySelector(".item-name").value;
        const qty = parseFloat(item.querySelector(".item-qty").value) || 0;
        const price = parseFloat(item.querySelector(".item-price").value) || 0;
        if (name && qty > 0) {
          extraItems.push({
            name,
            quantity: qty,
            price,
            total: qty * price,
          });
        }
      });

      console.log('=== INVOICE FORM SUBMISSION VALIDATION ===');
      console.log('serviceBookings.length:', serviceBookings.length);
      console.log('extraItems.length:', extraItems.length);
      console.log('serviceBookings:', serviceBookings);
      console.log('extraItems:', extraItems);

      // Validation: Prevent creating invoices with no services and no extra items
      if (serviceBookings.length === 0 && extraItems.length === 0) {
        console.log('VALIDATION FAILED: No services and no extra items - preventing invoice creation');
        utils.showToast("Cannot create invoice: No services to invoice and no extra items added", "error");
        return;
      }

      console.log('VALIDATION PASSED: Proceeding with invoice creation');

      // Fetch auto items (actual service prices) for the selected customer and date
      const customerId = parseInt(document.getElementById("invoiceCustomer").value);
      const invoiceDate = document.getElementById("invoiceDate").value;
      let autoData = { items: [], booking_totals: [], auto_discount: 0, tax: 0, breakdown: { taxRate: parseFloat(salonSettings.billing?.taxRate || 0) } };

      // Only fetch autoData if there are available bookings to invoice
      try {
        if (customerId && invoiceDate && serviceBookings.length > 0) {
          autoData = await api.billing.getAutoItems({ customer_id: customerId, date: invoiceDate, booking_ids: serviceBookings.map(b => b.id).join(',') });
          // Keep only items corresponding to the non-invoiced bookings using booking_id match (normalize to numbers)
          const bookingIdSet = new Set(serviceBookings.map(b => Number(b.id)));
          autoData.items = (autoData.items || []).filter(it => {
            const bid = Number(it.booking_id ?? it.bookingId ?? it.bookingid);
            return bookingIdSet.has(bid);
          });
          autoData.booking_totals = (autoData.booking_totals || []).filter(t => bookingIdSet.has(Number(t.booking_id)));

          console.log('Submit autoData booking_totals (filtered):', autoData.booking_totals);
          console.log('Submit autoData items (filtered):', autoData.items);
          console.log('Submit bookingIdSet:', Array.from(bookingIdSet));

          // Debug the filtering process
          console.log('=== FILTERING DEBUG ===');
          console.log('Raw autoData.items before filtering:', autoData.items);
          autoData.items.forEach((item, index) => {
            const bid = Number(item.booking_id ?? item.bookingId ?? item.bookingid);
            console.log(`Item ${index}:`, item);
            console.log(`  booking_id variants:`, {
              booking_id: item.booking_id,
              bookingId: item.bookingId,
              bookingid: item.bookingid,
              computed_bid: bid
            });
            console.log(`  bookingIdSet.has(${bid}):`, bookingIdSet.has(bid));
          });
        }
      } catch (err) {
        console.warn('Auto-items fetch failed, proceeding without auto-discounts:', err?.message);
      }

      // Convert extra items to invoice_items format
      const extraItemsAsInvoiceItems = extraItems.map(i => ({
        service_id: null,
        description: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.total
      }));

      // Service items at actual price (from autoData) - only if there are available bookings
      const serviceItems = serviceBookings.length > 0 ? [...(autoData.items || [])] : [];

      console.log('serviceBookings count:', serviceBookings.length);
      console.log('extraItems count:', extraItems.length);
      console.log('serviceBookings array:', serviceBookings);
      console.log('extraItems array:', extraItems);
      console.log('autoData.items count:', serviceItems.length);
      console.log('serviceBookings:', serviceBookings);
      console.log('autoData.items:', serviceItems);

      // Add booking_ids to each service item from serviceBookings
      serviceItems.forEach((item, index) => {
        if (serviceBookings[index]) {
          item.booking_ids = [Number(serviceBookings[index].id)];
          console.log(`Added booking_ids ${item.booking_ids} to item ${index}: ${item.description}`);
        } else {
          console.log(`No serviceBooking at index ${index}, item: ${item.description}`);
        }
      });

      console.log('serviceItems after adding booking_ids:', serviceItems);

      const bookingSubtotalSum = (autoData.booking_totals || []).reduce((s, t) => s + (parseFloat(t.subtotal_amount) || 0), 0);

      // Use the same variables as the display calculation for consistency
      const servicesSubtotal = serviceBookings.length > 0 ?
        (bookingSubtotalSum > 0 ? bookingSubtotalSum : serviceItems.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0)) :
        servicesActualSubtotal; // Use global variable set by loadServiceData

      // Combine service items with extra items for invoice items
      const combinedItems = [...serviceItems, ...extraItemsAsInvoiceItems];
      const extraItemsTotal = extraItems.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
      const subtotal = parseFloat((servicesSubtotal + extraItemsTotal).toFixed(2));
      const taxRate = parseFloat(salonSettings.billing?.taxRate ?? autoData.breakdown?.taxRate ?? 5) || 5;
      // Tax applied on subtotal (services + extra items)
      const tax = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
      const grossTotal = parseFloat((subtotal + tax).toFixed(2));

      // Wallet application (only at invoice stage)
      const useWallet = !!document.getElementById('useMembershipWallet')?.checked;
      let appliedWallet = 0;
      if (useWallet && customerWalletBalance > 0) {
        appliedWallet = Math.min(parseFloat(customerWalletBalance || 0), grossTotal);
      }
      const remaining = parseFloat(Math.max(0, (parseFloat(customerWalletBalance || 0) - appliedWallet)).toFixed(2));
      const finalTotal = parseFloat(Math.max(0, grossTotal - appliedWallet).toFixed(2));

      const formData = {
        customer_id: customerId,
        invoice_date: invoiceDate,
        items: combinedItems,
        booking_ids: serviceBookings.map(b => b.id), // Store booking IDs to prevent duplicates
        subtotal,
        tax,
        discount: 0, // membership discount removed; wallet handles reductions
        gross_total: grossTotal,
        wallet_applied: appliedWallet,
        remaining_wallet: remaining,
        total: finalTotal,
        status: (finalTotal === 0) ? 'paid' : document.getElementById("invoiceStatus").value,
        payment_methods: (finalTotal === 0) ? [] : paymentMethods,
        notes: (document.getElementById("invoiceNotes").value || '')
      };

      try {
        if (isEdit) {
          await api.billing.update(invoice.id, formData);
          utils.showToast("Invoice updated successfully", "success");
        } else {
          const created = await api.billing.create(formData);
          utils.showToast("Invoice created successfully", "success");

          // If wallet was used, update membership wallet balance server-side
          try {
            if (appliedWallet > 0 && window.billingModule.currentMembership && window.billingModule.currentMembership.id) {
              await api.memberships.update(window.billingModule.currentMembership.id, { wallet_balance: remaining });
            }
          } catch (err) {
            console.warn('Failed to update membership wallet after invoice creation', err);
          }
        }

        window.appUtils.closeModal();
        const contentArea = document.getElementById("contentArea");
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || "Invoice operation failed", "error");
      }
    });
}

function getInvoiceStatusClass(status) {
  const statusClasses = {
    pending: "warning",
    paid: "success",
    cancelled: "danger",
  };
  return statusClasses[status] || "info";
}

window.billingModule = {
  viewInvoice: async function (id) {
    try {
      const invoice = await api.billing.getById(id);
      const currency = salonSettings.billing?.currency || "INR";

      // Fallback: fetch customer if not populated
      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'N/A';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) { }
      }

      const itemsHTML = (invoice.items || []).map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${utils.formatCurrency(item.price, currency)}</td>
          <td>${utils.formatCurrency(item.total, currency)}</td>
        </tr>
      `).join('');

      const html = `
        <div style="max-height: 400px; overflow-y: auto;">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${utils.formatDate(invoice.invoice_date)}</p>
          <p><strong>Customer:</strong> ${invoice.customer_name}</p>
          <hr>
          <table style="margin-top: 10px;">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          <hr>
          <p><strong>Subtotal:</strong> ${utils.formatCurrency(invoice.subtotal, currency)}</p>
          <p><strong>Tax:</strong> ${utils.formatCurrency(invoice.tax, currency)}</p>
          <p><strong>Discount:</strong> ${utils.formatCurrency(invoice.discount, currency)}</p>
          <p><strong>Total:</strong> ${utils.formatCurrency(invoice.total, currency)}</p>
          <p><strong>Status:</strong> <span class="badge badge-${getInvoiceStatusClass(invoice.status)}">${invoice.status}</span></p>
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary" onclick="window.billingModule.printInvoice(${invoice.id})">Print Invoice</button>
            <button class="btn btn-outline" onclick="window.appUtils.closeModal()">Close</button>
          </div>
        </div>
      `;

      window.appUtils.showModal('Invoice Details', html);
    } catch (err) {
      utils.showToast(err.message || 'Failed to view invoice', 'error');
    }
  },

  printInvoice: async function (id) {
    try {
      const invoice = await api.billing.getById(id);
      const currency = salonSettings.billing?.currency || "INR";
      const currencySymbol = utils.getCurrencySymbol(currency);

      // Fallback: fetch customer if not populated
      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'N/A';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) { }
      }

      const itemsHTML = (invoice.items || []).map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td class="text-right">${utils.formatCurrency(item.price, currency)}</td>
          <td class="text-right">${utils.formatCurrency(item.total, currency)}</td>
        </tr>
      `).join('');

      const printHTML = `
        <div class="invoice-header" style="text-align: center;">
          <h2>${salonSettings.salon?.name || 'Salon Management System'}</h2>
          <p>${salonSettings.salon?.address || ''}</p>
          <p>Phone: ${salonSettings.salon?.phone || ''} | Email: ${salonSettings.salon?.email || ''}</p>
          ${salonSettings.salon?.gstin ? `<p><strong>GSTIN:</strong> ${salonSettings.salon.gstin}</p>` : ''}
          <hr>
          <h3>INVOICE</h3>
        </div>
        
        <div class="invoice-details">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
              <p><strong>Date:</strong> ${utils.formatDate(invoice.invoice_date)}</p>
            </div>
            <div>
              <p><strong>Status:</strong> <span style="color: ${invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'orange' : 'red'}">${invoice.status.toUpperCase()}</span></p>
            </div>
          </div>
          
          <div style="margin: 20px 0;">
            <p><strong>Bill To:</strong></p>
            <p>${invoice.customer_name || 'N/A'}</p>
            ${invoice.customer_phone ? `<p>Phone: ${invoice.customer_phone}</p>` : ''}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>SUBTOTAL:</strong></td>
              <td class="text-right">${utils.formatCurrency(invoice.subtotal, currency)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right"><strong>Tax:</strong></td>
              <td class="text-right">${utils.formatCurrency(invoice.tax, currency)}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-right"><strong>Discount:</strong></td>
              <td class="text-right">${utils.formatCurrency(invoice.discount, currency)}</td>
            </tr>
            <tr class="total-row" style="border-top: 2px solid #000;">
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right">${utils.formatCurrency(invoice.total, currency)}</td>
            </tr>
          </tfoot>
        </table>
        
        ${invoice.notes ? `
          <div style="margin-top: 30px;">
            <p><strong>Notes:</strong></p>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="text-align: center;">
              <p>_________________________</p>
              <p>Customer Signature</p>
            </div>
            <div style="text-align: center;">
              <p>_________________________</p>
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Thank you for your business!</p>
          <p>${salonSettings.salon?.name || 'Salon Management System'}</p>
        </div>
      `;

      utils.printHTML(printHTML, `Invoice-${invoice.invoice_number}`);
    } catch (err) {
      utils.showToast(err.message || 'Print failed', 'error');
    }
  },

  updateStatus: async function (id, status) {
    if (!status) return;
    await api.billing.updateStatus(id, status);
    utils.showToast("Status updated successfully", "success");
    const contentArea = document.getElementById("contentArea");
    await render(contentArea);
  },
};
