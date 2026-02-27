let invoices = [];
let customers = [];
let salonSettings = {};
let serviceBookings = [];
let servicesActualSubtotal = 0;
// Wallet vars
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
          <th>Invoice</th>
          <th>Customer</th>
          <th class="sortable" data-column="invoice_date">
            Date 
            <span class="sort-arrow ${sortConfig.column === 'invoice_date' ? (sortConfig.direction === 'asc' ? 'active-asc' : 'active-desc') : ''}">
              <span class="arrow-up">▲</span><span class="arrow-down">▼</span>
            </span>
          </th>
          <th>Subtotal</th>
          <th>GST</th>
          <th>Wallet</th>
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
        (inv) => {
          const subtotal = parseFloat(inv.subtotal) || 0;
          const tax = parseFloat(inv.tax) || 0;
          const walletApplied = parseFloat(inv.wallet_applied) || 0;
          const total = parseFloat(inv.total) || 0;
          
          return `
          <tr>
            <td>${inv.invoice_number}</td>
            <td>${inv.customer_name || "N/A"}</td>
            <td>${utils.formatDate(inv.invoice_date)}</td>
            <td>${utils.formatCurrency(subtotal, currency)}</td>
            <td>${utils.formatCurrency(tax, currency)}</td>
            <td>${walletApplied > 0 ? `-${utils.formatCurrency(walletApplied, currency)}` : '-'}</td>
            <td>${utils.formatCurrency(total, currency)}</td>
            <td><span class="badge badge-${getInvoiceStatusClass(inv.status)}">${inv.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="window.billingModule.viewInvoice(${inv.id})">View</button>
              <button class="btn btn-sm btn-success" onclick="window.billingModule.printInvoice(${inv.id})">Print</button>
              <button class="btn btn-sm btn-danger" onclick="window.billingModule.deleteInvoice(${inv.id})">Delete</button>
              <select class="btn btn-sm" onchange="window.billingModule.updateStatus(${inv.id}, this.value)">
                <option value="">Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        `})
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

    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

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
        await window.billingModule.loadCustomerWallet(customerId);
        await window.billingModule.loadServiceData(customerId, date);
      }
    });

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

  window.billingModule.loadCustomerHistory = async function (customerId) {
    const container = document.getElementById('customerHistory');
    if (!container) return;

    container.style.display = 'block';
    container.innerHTML = '<p class="text-muted"><small>Loading history...</small></p>';

    try {
      const bookings = await api.bookings.getAll({ customer_id: customerId });
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
              <strong>${utils.formatCurrency(parseFloat(b.total_amount) || 0, currency)}</strong>
            </li>
          `).join('')}
        </ul>
      `;
    } catch (err) {
      console.error('Error loading history', err);
      container.innerHTML = '<p class="text-danger"><small>Failed to load history</small></p>';
    }
  };

  async function getUnpaidBookings(customerId) {
    if (!customerId) return [];

    try {
      const allBookings = await api.bookings.getAll({ customer_id: customerId });

      const invoiceableBookings = allBookings.filter(b =>
        ['completed', 'confirmed'].includes(b.status)
      );

      const customerInvoices = await api.billing.getAll();
      const thisCustomerInvoices = customerInvoices.filter(inv =>
        Number(inv.customer_id) === Number(customerId) &&
        inv.status !== 'cancelled'
      );

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
      return [];
    }
  }

  window.billingModule.loadServiceData = async function (customerId, date) {
    try {
      const includeAllElement = document.getElementById('includeAllUnpaid');
      const includeAll = includeAllElement ? includeAllElement.checked : false;

      let unpaidBookings = await getUnpaidBookings(customerId);

      let availableBookings = [];
      if (includeAll) {
        availableBookings = unpaidBookings;
      } else if (date) {
        availableBookings = unpaidBookings.filter(b => b.booking_date === date);
      } else {
        availableBookings = [];
      }

      availableBookings.sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date));

      serviceBookings = availableBookings || [];

      const currency = salonSettings.billing?.currency || "INR";

      if (availableBookings.length === 0) {
        document.getElementById("serviceDetails").style.display = "none";
        servicesActualSubtotal = 0;
        walletApplied = 0;
        window.updateInvoiceCalculations();
      } else {
        try {
          const bookingIds = availableBookings.map(b => b.id).join(',');
          const autoData = await api.billing.getAutoItems({
            customer_id: customerId,
            booking_ids: bookingIds
          });

          const bookingTotals = autoData.booking_totals || [];
          if (bookingTotals.length > 0) {
            servicesActualSubtotal = bookingTotals.reduce((s, t) => s + (parseFloat(t.subtotal_amount) || 0), 0);
          } else {
            servicesActualSubtotal = availableBookings.reduce(
              (sum, b) => sum + (parseFloat(b.subtotal_amount) || parseFloat(b.total_amount) || 0),
              0
            );
          }
        } catch (error) {
          servicesActualSubtotal = availableBookings.reduce(
            (sum, b) => sum + (parseFloat(b.subtotal_amount) || parseFloat(b.total_amount) || 0),
            0
          );
        }

        document.getElementById("serviceInfo").innerHTML = `
          <ul style="max-height: 200px; overflow-y: auto; list-style:none; padding-left:0;">
            ${availableBookings
          .map(
            (b) =>
              `<li style="border-bottom:1px solid #eee; padding:5px 0;">
                <div style="display:flex; justify-content:space-between;">
                  <strong>${utils.formatDate(b.booking_date)}</strong>
                  <span>${utils.formatCurrency(parseFloat(b.total_amount) || 0, currency)}</span>
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
            <strong>Services Subtotal: ${utils.formatCurrency(servicesActualSubtotal, currency)}</strong>
          </div>
        `;
        document.getElementById("serviceDetails").style.display = "block";
      }

      window.updateInvoiceCalculations();
    } catch (error) {
      console.error("Error loading services:", error);
      utils.showToast("Failed to load booking services", "error");
    }
  };

  window.billingModule.loadCustomerWallet = async function (customerId) {
    try {
      customerWalletBalance = 0;
      window.billingModule.currentMembership = null;
      if (!customerId) return;
      const membership = await api.memberships.getForCustomer(customerId);
      if (membership) {
        window.billingModule.currentMembership = membership || null;
        customerWalletBalance = parseFloat(membership?.wallet_balance) || 0;
      }
    } catch (err) {
      console.warn('Failed to load membership wallet', err);
      customerWalletBalance = 0;
      window.billingModule.currentMembership = null;
    }
    window.updateInvoiceCalculations();
  };

  window.updateInvoiceCalculations = function () {
    const currency = salonSettings.billing?.currency || "INR";
    let extraItemsTotal = 0;

    document.querySelectorAll("#extraItems .extra-item").forEach((item) => {
      const qty = parseFloat(item.querySelector(".item-qty")?.value) || 0;
      const price = parseFloat(item.querySelector(".item-price")?.value) || 0;
      const itemSubtotal = qty * price;
      extraItemsTotal += itemSubtotal;
    });

    const gstEnabled = salonSettings.billing?.gst_enabled;
    const gstRate = parseFloat(salonSettings.billing?.gst_rate) || 18;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;

    const servicesSubtotal = parseFloat(servicesActualSubtotal) || 0;
    const subtotal = parseFloat((servicesSubtotal + extraItemsTotal).toFixed(2));

    let cgst = 0;
    let sgst = 0;

    if (gstEnabled) {
      cgst = parseFloat((subtotal * cgstRate / 100).toFixed(2));
      sgst = parseFloat((subtotal * sgstRate / 100).toFixed(2));
    }

    const totalTax = parseFloat((cgst + sgst).toFixed(2));
    const grossTotal = parseFloat((subtotal + totalTax).toFixed(2));

    const useWallet = !!document.getElementById('useMembershipWallet')?.checked;
    walletApplied = 0;
    if (useWallet && customerWalletBalance > 0) {
      walletApplied = Math.min(parseFloat(customerWalletBalance) || 0, grossTotal);
    }
    remainingWallet = parseFloat(Math.max(0, (parseFloat(customerWalletBalance) || 0) - walletApplied).toFixed(2));

    const finalPayable = parseFloat(Math.max(0, grossTotal - walletApplied).toFixed(2));

    const summaryEl = document.getElementById('summaryDetails');
    if (summaryEl) {
      summaryEl.style.transition = 'opacity 180ms ease';
      summaryEl.style.opacity = '0.6';
      setTimeout(() => { summaryEl.style.opacity = '1'; }, 180);
    }

    const membership = window.billingModule.currentMembership;
    let membershipHTML = '';

    if (membership) {
      membershipHTML = `
        <div style="background:#e8f5e9; padding:12px; border-radius:6px; margin-bottom:12px; border-left:4px solid #2e7d32;">
          <h6 style="margin:0 0 8px 0; color:#2e7d32;">👑 MEMBERSHIP WALLET</h6>
          <p style="margin:2px 0;"><strong>Plan:</strong> ${membership.plan_name || 'Active Plan'}</p>
          ${membership.discount_percent ? `<p style="margin:2px 0;"><strong>Discount:</strong> ${membership.discount_percent}%</p>` : ''}
          <p style="margin:2px 0;"><strong>Wallet Balance:</strong> ${utils.formatCurrency(customerWalletBalance, currency)}</p>
          ${membership.valid_till ? `<p style="margin:2px 0; font-size:0.85em; color:#555;">Valid Till: ${utils.formatDate(membership.valid_till)}</p>` : ''}
        </div>
      `;
    }

    document.getElementById("summaryDetails").innerHTML = `
      <div class="invoice-summary-box">
        ${membershipHTML}

        <h6 style="margin: 0 0 8px 0; color: #1976d2;">📋 SERVICES</h6>
        <p style="margin: 2px 0;"><strong>Services Subtotal:</strong> ${utils.formatCurrency(servicesSubtotal, currency)}</p>

        ${extraItemsTotal > 0 ? `
        <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin-bottom: 12px;">
          <h6 style="margin: 0 0 8px 0; color: #f57c00;">🛍️ EXTRA ITEMS</h6>
          <p style="margin: 2px 0;"><strong>Items Subtotal:</strong> ${utils.formatCurrency(extraItemsTotal, currency)}</p>
        </div>
        ` : ''}

        <h6 style="margin: 10px 0 8px 0; color: #9c27b0;">💰 GST BREAKDOWN</h6>
        ${gstEnabled ? `
          <p style="margin: 2px 0;"><strong>CGST (${cgstRate}%):</strong> ${utils.formatCurrency(cgst, currency)}</p>
          <p style="margin: 2px 0;"><strong>SGST (${sgstRate}%):</strong> ${utils.formatCurrency(sgst, currency)}</p>
          <p style="margin: 2px 0;"><strong>Total GST (${gstRate}%):</strong> ${utils.formatCurrency(totalTax, currency)}</p>
        ` : ''}

        <hr style="margin: 10px 0;">

        <p style="margin: 2px 0;"><strong>Gross Total:</strong> ${utils.formatCurrency(grossTotal, currency)}</p>

        <h6 style="margin: 10px 0 8px 0; color: #2e7d32;">👑 MEMBERSHIP WALLET</h6>
        <p style="margin:2px 0;">Wallet Balance: ${utils.formatCurrency(customerWalletBalance || 0, currency)}</p>
        <label style="display:flex; align-items:center; gap:8px; margin:4px 0;">
          <input type="checkbox" id="useMembershipWallet" ${useWallet ? 'checked' : ''}> <span>Use Wallet</span>
        </label>
        <p style="margin:2px 0; color:#d32f2f;">Wallet Applied: -${utils.formatCurrency(walletApplied, currency)}</p>
        <p style="margin:2px 0; color:#777;">Remaining Balance: ${utils.formatCurrency(remainingWallet, currency)}</p>

        <hr style="margin: 10px 0;">

        <h5 style="color:#1a237e; font-size:1.2em; margin:0;">
          FINAL PAYABLE: ${utils.formatCurrency(finalPayable, currency)}
        </h5>
      </div>
    `;

    const walletCheckbox = document.getElementById('useMembershipWallet');
    if (walletCheckbox) {
      walletCheckbox.removeEventListener('change', window.updateInvoiceCalculations);
      walletCheckbox.addEventListener('change', () => window.updateInvoiceCalculations());
    }

    const invoiceStatusEl = document.getElementById('invoiceStatus');
    const paymentCheckboxes = Array.from(document.querySelectorAll('input[name="payment_method"]'));
    if (finalPayable === 0) {
      if (invoiceStatusEl) invoiceStatusEl.value = 'paid';
      paymentCheckboxes.forEach(ch => {
        ch.checked = false;
        ch.disabled = true;
      });
    } else {
      paymentCheckboxes.forEach(ch => {
        ch.disabled = false;
      });

      if (invoiceStatusEl && invoiceStatusEl.value === 'paid') {
        invoiceStatusEl.value = 'pending';
      }
    }
  };

  document
    .getElementById("invoiceForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

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

      if (serviceBookings.length === 0 && extraItems.length === 0) {
        utils.showToast("Cannot create invoice: No services to invoice and no extra items added", "error");
        return;
      }

      const customerId = parseInt(document.getElementById("invoiceCustomer").value);
      const invoiceDate = document.getElementById("invoiceDate").value;
      let autoData = { items: [], booking_totals: [], auto_discount: 0, breakdown: { taxRate: parseFloat(salonSettings.billing?.gst_rate) || 0 } };

      try {
        if (customerId && invoiceDate && serviceBookings.length > 0) {
          autoData = await api.billing.getAutoItems({ 
            customer_id: customerId, 
            date: invoiceDate, 
            booking_ids: serviceBookings.map(b => b.id).join(',') 
          });
          const bookingIdSet = new Set(serviceBookings.map(b => Number(b.id)));
          autoData.items = (autoData.items || []).filter(it => {
            const bid = Number(it.booking_id ?? it.bookingId ?? it.bookingid);
            return bookingIdSet.has(bid);
          });
          autoData.booking_totals = (autoData.booking_totals || []).filter(t => bookingIdSet.has(Number(t.booking_id)));
        }
      } catch (err) {
        console.warn('Auto-items fetch failed, proceeding without auto-discounts:', err?.message);
      }

      const extraItemsAsInvoiceItems = extraItems.map(i => ({
        service_id: null,
        description: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.total
      }));

      const serviceItems = serviceBookings.length > 0 ? [...(autoData.items || [])] : [];

      serviceItems.forEach((item, index) => {
        if (serviceBookings[index]) {
          item.booking_ids = [Number(serviceBookings[index].id)];
        }
      });

      const combinedItems = [...serviceItems, ...extraItemsAsInvoiceItems];
      
      const bookingSubtotalSum = (autoData.booking_totals || []).reduce((s, t) => s + (parseFloat(t.subtotal_amount) || 0), 0);
      const servicesSubtotal = serviceBookings.length > 0 ?
        (bookingSubtotalSum > 0 ? bookingSubtotalSum : servicesActualSubtotal) :
        servicesActualSubtotal;
      
      const extraItemsTotal = extraItems.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
      const subtotal = parseFloat((servicesSubtotal + extraItemsTotal).toFixed(2));

      const gstEnabled = salonSettings.billing?.gst_enabled;
      const gstRate = parseFloat(salonSettings.billing?.gst_rate ?? autoData.breakdown?.taxRate ?? 18) || 18;
      const cgstRate = gstRate / 2;
      const sgstRate = gstRate / 2;

      let cgst = 0;
      let sgst = 0;

      if (gstEnabled) {
        cgst = parseFloat((subtotal * cgstRate / 100).toFixed(2));
        sgst = parseFloat((subtotal * sgstRate / 100).toFixed(2));
      }

      const totalTax = parseFloat((cgst + sgst).toFixed(2));
      const grossTotal = parseFloat((subtotal + totalTax).toFixed(2));

      const useWallet = !!document.getElementById('useMembershipWallet')?.checked;
      let appliedWallet = 0;
      if (useWallet && customerWalletBalance > 0) {
        appliedWallet = Math.min(parseFloat(customerWalletBalance) || 0, grossTotal);
      }
      const remaining = parseFloat(Math.max(0, (parseFloat(customerWalletBalance) || 0) - appliedWallet).toFixed(2));
      const finalTotal = parseFloat(Math.max(0, grossTotal - appliedWallet).toFixed(2));

      const formData = {
        customer_id: customerId,
        invoice_date: invoiceDate,
        items: combinedItems,
        booking_ids: serviceBookings.map(b => b.id),
        subtotal,
        cgst,
        sgst,
        tax: totalTax,
        discount: 0,
        gross_total: grossTotal,
        wallet_applied: appliedWallet,
        remaining_wallet: remaining,
        total: finalTotal,
        status: (finalTotal === 0) ? 'paid' : document.getElementById("invoiceStatus").value,
        payment_methods: (finalTotal === 0) ? [] : paymentMethods,
        notes: document.getElementById("invoiceNotes").value || ''
      };

      try {
        if (isEdit) {
          await api.billing.update(invoice.id, formData);
          utils.showToast("Invoice updated successfully", "success");
        } else {
          await api.billing.create(formData);
          utils.showToast("Invoice created successfully", "success");

          if (appliedWallet > 0 && window.billingModule.currentMembership && window.billingModule.currentMembership.id) {
            await api.memberships.update(window.billingModule.currentMembership.id, { wallet_balance: remaining });
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
      const gstRate = parseFloat(salonSettings.billing?.gst_rate) || 18;
      const cgstRate = gstRate / 2;
      const sgstRate = gstRate / 2;
      const gstEnabled = salonSettings.billing?.gst_enabled;

      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'Walk-in Customer';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) { }
      }

      const subtotal = parseFloat(invoice.subtotal) || 0;
      
      let cgst = parseFloat(invoice.cgst) || 0;
      let sgst = parseFloat(invoice.sgst) || 0;
      
      if (gstEnabled && (cgst === 0 && sgst === 0) && subtotal > 0) {
        cgst = parseFloat((subtotal * cgstRate / 100).toFixed(2));
        sgst = parseFloat((subtotal * sgstRate / 100).toFixed(2));
      }

      const totalTax = parseFloat((cgst + sgst).toFixed(2));
      const grossTotal = parseFloat((subtotal + totalTax).toFixed(2));
      const discount = parseFloat(invoice.discount) || 0;
      const walletApplied = parseFloat(invoice.wallet_applied) || 0;
      const total = parseFloat(invoice.total) || 0;

      // Fetch membership details if wallet was used
      let membershipDetails = '';
      if (walletApplied > 0) {
        try {
          if (invoice.membership_id) {
            const membership = await api.memberships.getById(invoice.membership_id);
            if (membership) {
              membershipDetails = `
                <div style="margin-top:15px; padding:15px; background:#e8f5e9; border-radius:6px; border-left:4px solid #2e7d32;">
                  <h6 style="margin:0 0 10px 0; color:#2e7d32; font-size:16px;">👑 MEMBERSHIP PAYMENT</h6>
                  <p style="margin:5px 0;"><strong>Plan:</strong> ${membership.plan_name || 'Membership Plan'}</p>
                  <p style="margin:5px 0;"><strong>Member:</strong> ${membership.customer_name || invoice.customer_name}</p>
                  <p style="margin:5px 0; color:#d32f2f; font-size:15px;"><strong>Wallet Amount Used:</strong> -${utils.formatCurrency(walletApplied, currency)}</p>
                  <p style="margin:5px 0;"><strong>Remaining Wallet Balance:</strong> ${utils.formatCurrency(parseFloat(membership.wallet_balance) || 0, currency)}</p>
                  ${membership.valid_till ? `<p style="margin:5px 0;"><strong>Valid Till:</strong> ${utils.formatDate(membership.valid_till)}</p>` : ''}
                </div>
              `;
            }
          } else {
            membershipDetails = `
              <div style="margin-top:15px; padding:15px; background:#e8f5e9; border-radius:6px; border-left:4px solid #2e7d32;">
                <h6 style="margin:0 0 10px 0; color:#2e7d32; font-size:16px;">👑 MEMBERSHIP PAYMENT</h6>
                <p style="margin:5px 0;"><strong>Wallet Amount Used:</strong> -${utils.formatCurrency(walletApplied, currency)}</p>
                <p style="margin:5px 0;"><em>This bill was fully paid using membership wallet</em></p>
              </div>
            `;
          }
        } catch (err) {
          console.warn('Could not fetch membership details', err);
          membershipDetails = `
            <div style="margin-top:15px; padding:15px; background:#e8f5e9; border-radius:6px; border-left:4px solid #2e7d32;">
              <h6 style="margin:0 0 10px 0; color:#2e7d32; font-size:16px;">👑 MEMBERSHIP PAYMENT</h6>
              <p style="margin:5px 0;"><strong>Wallet Amount Used:</strong> -${utils.formatCurrency(walletApplied, currency)}</p>
              <p style="margin:5px 0;"><em>Payment made from membership wallet</em></p>
            </div>
          `;
        }
      }

      const itemsHTML = (invoice.items || []).map(item => {
        const price = parseFloat(item.price) || 0;
        const itemTotal = parseFloat(item.total) || 0;
        return `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #ddd;">${item.description || 'Service'}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${utils.formatCurrency(price, currency)}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${utils.formatCurrency(itemTotal, currency)}</td>
        </tr>
      `}).join('');

      const html = `
        <div style="max-height: 500px; overflow-y: auto; padding: 15px;">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${utils.formatDate(invoice.invoice_date)}</p>
          <p><strong>Customer:</strong> ${invoice.customer_name || 'Walk-in Customer'}</p>
          ${invoice.customer_phone ? `<p><strong>Phone:</strong> ${invoice.customer_phone}</p>` : ''}
          <hr>
          
          <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background:#f2f2f2;">
                <th style="padding:8px; text-align:left;">Description</th>
                <th style="padding:8px; text-align:center;">Qty</th>
                <th style="padding:8px; text-align:right;">Price</th>
                <th style="padding:8px; text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          <hr>
          
          <div class="gst-summary" style="margin-top:15px;">
            <p style="display:flex; justify-content:space-between; margin:5px 0;">
              <strong>Subtotal:</strong> 
              <span>${utils.formatCurrency(subtotal, currency)}</span>
            </p>
            
            ${gstEnabled ? `
            <div style="margin:10px 0;">
              <h6 style="margin:0 0 5px 0; color:#9c27b0;">💰 GST CALCULATION</h6>
              <p style="display:flex; justify-content:space-between; margin:3px 0;">
                <span>CGST (${cgstRate}%):</span>
                <span>${utils.formatCurrency(cgst, currency)}</span>
              </p>
              <p style="display:flex; justify-content:space-between; margin:3px 0;">
                <span>SGST (${sgstRate}%):</span>
                <span>${utils.formatCurrency(sgst, currency)}</span>
              </p>
              <p style="display:flex; justify-content:space-between; margin:3px 0; border-top:1px dashed #ccc; padding-top:3px;">
                <strong>Total GST (${gstRate}%):</strong>
                <strong>${utils.formatCurrency(totalTax, currency)}</strong>
              </p>
            </div>
            ` : ''}
            
            <p style="display:flex; justify-content:space-between; margin:5px 0;">
              <strong>Gross Total:</strong> 
              <span>${utils.formatCurrency(grossTotal, currency)}</span>
            </p>
            
            <p style="display:flex; justify-content:space-between; margin:5px 0;">
              <strong>Discount:</strong> 
              <span>${utils.formatCurrency(discount, currency)}</span>
            </p>
            
            ${walletApplied > 0 ? `
            <div style="margin:15px 0; padding:10px; background:#fff3e0; border-radius:4px;">
              <p style="display:flex; justify-content:space-between; margin:3px 0; color:#d32f2f;">
                <strong>💳 Wallet Payment:</strong>
                <strong>-${utils.formatCurrency(walletApplied, currency)}</strong>
              </p>
            </div>
            ` : ''}
            
            <div style="margin-top:15px; padding-top:10px; border-top:2px solid #3f51b5;">
              <p style="display:flex; justify-content:space-between; margin:0; font-size:1.3em; color:#1a237e;">
                <strong>FINAL PAYABLE:</strong>
                <strong>${utils.formatCurrency(total, currency)}</strong>
              </p>
            </div>
            
            <p style="margin-top:10px;">
              <strong>Status:</strong> 
              <span class="badge badge-${getInvoiceStatusClass(invoice.status)}" style="padding:3px 8px;">${invoice.status.toUpperCase()}</span>
            </p>
            
            ${invoice.payment_methods && invoice.payment_methods.length > 0 ? `
              <p><strong>Payment Method:</strong> ${invoice.payment_methods.join(', ').toUpperCase()}</p>
            ` : walletApplied > 0 ? `
              <p><strong>Payment Method:</strong> MEMBERSHIP WALLET</p>
            ` : ''}
            
            ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          </div>

          ${membershipDetails}

          <div style="display:flex; gap:10px; margin-top:20px; justify-content:center;">
            <button class="btn btn-primary" onclick="window.billingModule.printInvoice(${invoice.id})" style="padding:8px 20px;">Print Invoice</button>
            <button class="btn btn-outline" onclick="window.appUtils.closeModal()" style="padding:8px 20px;">Close</button>
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
      const gstRate = parseFloat(salonSettings.billing?.gst_rate) || 18;
      const cgstRate = gstRate / 2;
      const sgstRate = gstRate / 2;
      const gstEnabled = salonSettings.billing?.gst_enabled;

      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'Walk-in Customer';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) { }
      }

      const subtotal = parseFloat(invoice.subtotal) || 0;
      
      let cgst = parseFloat(invoice.cgst) || 0;
      let sgst = parseFloat(invoice.sgst) || 0;
      
      if (gstEnabled && (cgst === 0 && sgst === 0) && subtotal > 0) {
        cgst = parseFloat((subtotal * cgstRate / 100).toFixed(2));
        sgst = parseFloat((subtotal * sgstRate / 100).toFixed(2));
      }

      const totalTax = parseFloat((cgst + sgst).toFixed(2));
      const grossTotal = parseFloat((subtotal + totalTax).toFixed(2));
      const discount = parseFloat(invoice.discount) || 0;
      const walletApplied = parseFloat(invoice.wallet_applied) || 0;
      const total = parseFloat(invoice.total) || 0;

      // Fetch membership details if wallet was used
      let membershipDetails = '';
      if (walletApplied > 0) {
        try {
          if (invoice.membership_id) {
            const membership = await api.memberships.getById(invoice.membership_id);
            if (membership) {
              membershipDetails = `
                <div style="margin:20px 0; padding:15px; background:#f1f8e9; border-radius:6px; border-left:4px solid #2e7d32;">
                  <h4 style="margin:0 0 10px 0; color:#2e7d32;">👑 MEMBERSHIP WALLET PAYMENT</h4>
                  <table style="width:100%; border:none;">
                    <tr>
                      <td style="padding:5px 0;"><strong>Plan:</strong></td>
                      <td style="padding:5px 0; text-align:right;">${membership.plan_name || 'Membership Plan'}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;"><strong>Member:</strong></td>
                      <td style="padding:5px 0; text-align:right;">${membership.customer_name || invoice.customer_name}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;"><strong>Amount Deducted:</strong></td>
                      <td style="padding:5px 0; text-align:right; color:#d32f2f;">-${utils.formatCurrency(walletApplied, currency)}</td>
                    </tr>
                    <tr>
                      <td style="padding:5px 0;"><strong>Remaining Balance:</strong></td>
                      <td style="padding:5px 0; text-align:right;">${utils.formatCurrency(parseFloat(membership.wallet_balance) || 0, currency)}</td>
                    </tr>
                  </table>
                </div>
              `;
            }
          }
        } catch (err) {
          console.warn('Could not fetch membership details for print', err);
        }
      }

      const itemsHTML = (invoice.items || []).map(item => {
        const price = parseFloat(item.price) || 0;
        const itemTotal = parseFloat(item.total) || 0;
        return `
        <tr>
          <td style="padding:8px; border-bottom:1px solid #ddd;">${item.description || 'Service'}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${utils.formatCurrency(price, currency)}</td>
          <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${utils.formatCurrency(itemTotal, currency)}</td>
        </tr>
      `}).join('');

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 5px 0; }
            .header p { margin: 2px 0; color: #666; }
            .invoice-title { font-size: 24px; font-weight: bold; margin: 15px 0; }
            .details { display: flex; justify-content: space-between; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f2f2f2; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .summary { margin: 20px 0; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .wallet-row { color: #d32f2f; }
            .final-row { font-size: 18px; font-weight: bold; color: #1a237e; margin-top: 10px; padding-top: 10px; border-top: 2px solid #3f51b5; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature { text-align: center; width: 200px; }
            .note { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            hr { margin: 15px 0; border: 0; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <h1>${salonSettings.salon?.name || 'SALON NAME'}</h1>
              <p>${salonSettings.salon?.address || 'Address Line'}</p>
              <p>Phone: ${salonSettings.salon?.phone || ''} | Email: ${salonSettings.salon?.email || ''}</p>
              ${salonSettings.salon?.gstin ? `<p><strong>GSTIN:</strong> ${salonSettings.salon.gstin}</p>` : ''}
              <div class="invoice-title">TAX INVOICE</div>
            </div>
            
            <div class="details">
              <div>
                <p><strong>Invoice No:</strong> ${invoice.invoice_number}</p>
                <p><strong>Date:</strong> ${utils.formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <p><strong>Customer:</strong> ${invoice.customer_name || 'Walk-in Customer'}</p>
                ${invoice.customer_phone ? `<p><strong>Phone:</strong> ${invoice.customer_phone}</p>` : ''}
              </div>
            </div>
            
            <h3>📋 SERVICE TABLE</h3>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="summary">
              <div class="summary-row">
                <span><strong>Subtotal:</strong></span>
                <span>${utils.formatCurrency(subtotal, currency)}</span>
              </div>
              
              <h4 style="margin-top:15px;">💰 GST CALCULATION</h4>
              <div class="summary-row">
                <span>CGST (${cgstRate}%)</span>
                <span>${utils.formatCurrency(cgst, currency)}</span>
              </div>
              <div class="summary-row">
                <span>SGST (${sgstRate}%)</span>
                <span>${utils.formatCurrency(sgst, currency)}</span>
              </div>
              <div class="summary-row">
                <span><strong>Total GST (${gstRate}%)</strong></span>
                <span><strong>${utils.formatCurrency(totalTax, currency)}</strong></span>
              </div>
              
              <hr>
              
              <div class="summary-row">
                <span>Gross Total</span>
                <span>${utils.formatCurrency(grossTotal, currency)}</span>
              </div>
              
              <div class="summary-row">
                <span><strong>Discount:</strong></span>
                <span>${utils.formatCurrency(discount, currency)}</span>
              </div>
              
              ${walletApplied > 0 ? `
              <h4 style="margin-top:15px;">👑 MEMBERSHIP WALLET</h4>
              <div class="summary-row wallet-row" style="background:#fff3e0; padding:8px; border-radius:4px;">
                <span><strong>Wallet Payment</strong></span>
                <span><strong>-${utils.formatCurrency(walletApplied, currency)}</strong></span>
              </div>
              ` : ''}
              
              <div class="summary-row final-row">
                <span><strong>FINAL PAYABLE</strong></span>
                <span><strong>${utils.formatCurrency(total, currency)}</strong></span>
              </div>
            </div>
            
            ${membershipDetails}
            
            <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
              <p><strong>Status:</strong> <span style="color: ${invoice.status === 'paid' ? 'green' : invoice.status === 'pending' ? 'orange' : 'red'}">${invoice.status.toUpperCase()}</span></p>
              <p><strong>Payment Mode:</strong> ${walletApplied > 0 ? 'MEMBERSHIP WALLET' : (invoice.payment_methods?.join(', ') || 'N/A').toUpperCase()}</p>
            </div>
            
            ${invoice.notes ? `
            <div style="margin-top: 30px;">
              <p><strong>Notes:</strong></p>
              <p>${invoice.notes}</p>
            </div>
            ` : ''}
            
            <div class="footer">
              <div class="signature">
                <p>_________________________</p>
                <p>Customer Signature</p>
              </div>
              <div class="signature">
                <p>_________________________</p>
                <p>Authorized Signature</p>
              </div>
            </div>
            
            <div class="note">
              <p>Thank you for your business!</p>
              <p>${salonSettings.salon?.name || 'Salon Management System'}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      utils.printHTML(printHTML, `Invoice-${invoice.invoice_number}`);
    } catch (err) {
      utils.showToast(err.message || 'Print failed', 'error');
    }
  },

  renderQuickCard: function(inv) {
    const currency = salonSettings.billing?.currency || "INR";
    const subtotal = parseFloat(inv.subtotal) || 0;
    const tax = parseFloat(inv.tax) || 0;
    const walletApplied = parseFloat(inv.wallet_applied) || 0;
    const total = parseFloat(inv.total) || 0;
    
    return `
      <div class="quick-invoice-card" style="border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:10px; background:#fff;">
        <p><strong>${inv.invoice_number}</strong></p>
        <p>${inv.customer_name || 'N/A'}</p>
        <p>Date: ${utils.formatDate(inv.invoice_date)}</p>
        <hr style="margin:10px 0;">
        <p>Subtotal: ${utils.formatCurrency(subtotal, currency)}</p>
        <p>GST (18%): ${utils.formatCurrency(tax, currency)}</p>
        ${walletApplied > 0 ? 
          `<p style="color:#d32f2f;">Wallet: -${utils.formatCurrency(walletApplied, currency)}</p>` 
          : ''
        }
        <h5 style="color:#1a237e; margin:10px 0;">Total: ${utils.formatCurrency(total, currency)}</h5>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="btn btn-sm btn-outline" onclick="window.billingModule.viewInvoice(${inv.id})">View</button>
          <button class="btn btn-sm btn-success" onclick="window.billingModule.printInvoice(${inv.id})">Print</button>
        </div>
      </div>
    `;
  },

  updateStatus: async function (id, status) {
    if (!status) return;
    await api.billing.updateStatus(id, status);
    utils.showToast("Status updated successfully", "success");
    const contentArea = document.getElementById("contentArea");
    await render(contentArea);
  },
  
  deleteInvoice: async function (id) {
    if (!confirm('Are you sure you want to cancel & delete this invoice?')) return;

    try {
      const invoice = await api.billing.getById(id);

      await api.billing.updateStatus(id, 'cancelled');

      if (invoice.booking_ids && invoice.booking_ids.length > 0) {
        const bookingIds = Array.isArray(invoice.booking_ids)
          ? invoice.booking_ids
          : JSON.parse(invoice.booking_ids);

        for (const bid of bookingIds) {
          try {
            await api.bookings.update(bid, {
              invoice_id: null,
              billing_status: 'unbilled'
            });
          } catch (e) {
            console.warn('Failed to update booking', bid, e);
          }
        }
      }

      if (invoice.wallet_applied > 0 && invoice.membership_id) {
        try {
          const membership = await api.memberships.getById(invoice.membership_id);
          const restoredBalance = (parseFloat(membership.wallet_balance) || 0) + (parseFloat(invoice.wallet_applied) || 0);
          await api.memberships.update(invoice.membership_id, { wallet_balance: restoredBalance });
        } catch (e) {
          console.warn('Failed to restore membership wallet after invoice cancellation', e);
        }
      }

      await api.billing.delete(id);

      utils.showToast('Invoice cancelled & reset successfully', 'success');

      const contentArea = document.getElementById('contentArea');
      await render(contentArea);

    } catch (err) {
      utils.showToast(err.message || 'Failed to delete invoice', 'error');
    }
  }
};