let invoices = [];
let customers = [];
let salonSettings = {};
let serviceBookings = [];
let serviceAmount = 0;
let servicesActualSubtotal = 0;

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
          <h2 class="table-title">Invoices</h2>
          <div class="d-flex gap-2">
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

  const currency = salonSettings.billing?.currency || "USD";

  return `
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Customer</th>
          <th>Date</th>
          <th>Subtotal</th>
          <th>Tax</th>
          <th>Discount</th>
          <th>Total</th>
          <th>Status</th>
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
    container.querySelector("#invoicesTable").innerHTML =
      renderInvoicesTable(filtered);
  });

  const addBtn = container.querySelector("#addInvoiceBtn");
  addBtn.addEventListener("click", () => showInvoiceForm());
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
                `<option value="${c.id}" ${
                  invoice?.customer_id === c.id ? "selected" : ""
                }>${c.name} - ${c.phone || "No phone"}</option>`
            )
            .join("")}
        </select>
      </div>
      
      <div class="form-group">
        <label for="invoiceDate">Invoice Date *</label>
        <input type="date" id="invoiceDate" name="invoice_date" value="${
          invoice?.invoice_date || utils.getTodayDate()
        }" required>
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
              <input type="text" placeholder="Item name" value="${
                item.name
              }" class="item-name" style="flex: 2">
              <input type="number" placeholder="Qty" value="${
                item.quantity
              }" class="item-qty" style="flex: 1" min="1">
              <input type="number" placeholder="Price" value="${
                item.price
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
          <p>Select customer and date to fetch bookings</p>
        </div>
      </div>

      <div class="form-group">
        <label for="invoiceNotes">Notes</label>
        <textarea id="invoiceNotes" name="notes" rows="2">${
          invoice?.notes || ""
        }</textarea>
      </div>

      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">${
          isEdit ? "Update" : "Create"
        } Invoice</button>
        ${
          isEdit
            ? `<button type="button" class="btn btn-success" onclick="window.billingModule.printInvoice(${invoice.id})">Print Invoice</button>`
            : ""
        }
      </div>
    </form>
  `;

  window.appUtils.showModal(isEdit ? "Edit Invoice" : "Create Invoice", formHTML);

  document
    .getElementById("invoiceDate")
    .addEventListener("change", async function () {
      const customerId = parseInt(
        document.getElementById("invoiceCustomer").value
      );
      const date = this.value;
      if (customerId && date) {
        await window.billingModule.loadServiceData(customerId, date);
      }
    });

  document
    .getElementById("invoiceCustomer")
    .addEventListener("change", async function () {
      const customerId = parseInt(this.value);
      const date = document.getElementById("invoiceDate").value;
      if (customerId && date) {
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

  window.billingModule.loadServiceData = async function (customerId, date) {
    try {
      const bookings = await api.bookings.getAll({
        customer_id: customerId,
        dateFrom: date,
        dateTo: date,
      });

      const currency = salonSettings.billing?.currency || "USD";
      serviceBookings = bookings || [];

      if (bookings.length === 0) {
        document.getElementById("serviceDetails").style.display = "none";
        serviceAmount = 0;
        servicesActualSubtotal = 0;
        utils.showToast("No bookings found for that day", "info");
      } else {
        serviceAmount = bookings.reduce(
          (sum, b) => sum + (parseFloat(b.total_amount) || 0),
          0
        );

        document.getElementById("serviceInfo").innerHTML = `
          <ul>
            ${bookings
              .map(
                (b) =>
                  `<li>${utils.formatTime(b.start_time)} - ${
                    b.services || "Services"
                  }: ${utils.formatCurrency(b.total_amount, currency)}</li>`
              )
              .join("")}
          </ul>
          <p><strong>Total Service Amount:</strong> ${utils.formatCurrency(
            serviceAmount,
            currency
          )}</p>
        `;
        document.getElementById("serviceDetails").style.display = "block";
      }

      // Also fetch actual-priced service items for the same day to compute true subtotal
      try {
        const autoData = await api.billing.getAutoItems({ customer_id: customerId, date });
        servicesActualSubtotal = (autoData.items || []).reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
      } catch (_) {
        servicesActualSubtotal = 0;
      }

      window.updateInvoiceCalculations();
    } catch (error) {
      console.error("Error loading services:", error);
      utils.showToast("Failed to load booking services", "error");
    }
  };

  window.updateInvoiceCalculations = function () {
    const currency = salonSettings.billing?.currency || "USD";
    let extraItemsTotal = 0;
    document
      .querySelectorAll("#extraItems .extra-item")
      .forEach((item) => {
        const qty = parseFloat(item.querySelector(".item-qty")?.value) || 0;
        const price = parseFloat(item.querySelector(".item-price")?.value) || 0;
        extraItemsTotal += qty * price;
      });

    const membershipDiscount = Math.max(0, parseFloat((servicesActualSubtotal - serviceAmount).toFixed(2)));
    const subtotal = parseFloat((servicesActualSubtotal + extraItemsTotal).toFixed(2));
    const taxRate = parseFloat(salonSettings.billing?.taxRate || 0) || 0;
    const taxAmount = parseFloat((Math.max(0, subtotal - membershipDiscount) * (taxRate / 100)).toFixed(2));
    const grandTotal = Math.max(0, parseFloat((subtotal - membershipDiscount + taxAmount).toFixed(2)));

    document.getElementById("summaryDetails").innerHTML = `
      <p><strong>Services (actual subtotal):</strong> ${utils.formatCurrency(servicesActualSubtotal, currency)}</p>
      <p><small>After membership: ${utils.formatCurrency(serviceAmount, currency)}</small></p>
      <p><strong>Extra Items:</strong> ${utils.formatCurrency(
        extraItemsTotal,
        currency
      )}</p>
      <hr>
      <div>
        <small><strong>Subtotal:</strong> ${utils.formatCurrency(subtotal, currency)}</small><br>
        <small><strong>Discount (membership):</strong> ${utils.formatCurrency(membershipDiscount, currency)}</small><br>
        <small><strong>Tax (${taxRate}%):</strong> ${utils.formatCurrency(taxAmount, currency)}</small>
      </div>
      <h5 style="margin-top:8px;">Grand Total: ${utils.formatCurrency(grandTotal, currency)}</h5>
    `;
  };

  document
    .getElementById("invoiceForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const currency = salonSettings.billing?.currency || "USD";

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
      // Fetch auto items (actual service prices) for the selected customer and date
      const customerId = parseInt(document.getElementById("invoiceCustomer").value);
      const invoiceDate = document.getElementById("invoiceDate").value;
      let autoData = { items: [], auto_discount: 0, tax: 0, breakdown: { taxRate: parseFloat(salonSettings.billing?.taxRate || 0) } };
      try {
        if (customerId && invoiceDate) {
          autoData = await api.billing.getAutoItems({ customer_id: customerId, date: invoiceDate });
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

      // Service items at actual price (from autoData)
      const serviceItems = [...(autoData.items || [])];
      const servicesSubtotal = serviceItems.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);

      // Membership-adjusted service total from bookings (already loaded via loadServiceData)
      const membershipAdjustedServiceTotal = Math.max(0, parseFloat(serviceAmount || 0));
      // Discount equals difference between actual service subtotal and membership-adjusted total
      const membershipDiscount = Math.max(0, parseFloat((servicesSubtotal - membershipAdjustedServiceTotal).toFixed(2)));

      // Combine service items with extra items for invoice items
      const combinedItems = [...serviceItems, ...extraItemsAsInvoiceItems];
      const extraItemsTotal = extraItems.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
      const subtotal = parseFloat((servicesSubtotal + extraItemsTotal).toFixed(2));
      const taxRate = parseFloat(salonSettings.billing?.taxRate || autoData.breakdown?.taxRate || 0) || 0;
      const taxableBase = Math.max(0, subtotal - membershipDiscount);
      const tax = parseFloat((taxableBase * (taxRate / 100)).toFixed(2));
      const total = Math.max(0, parseFloat((taxableBase + tax).toFixed(2)));

      const formData = {
        customer_id: customerId,
        invoice_date: invoiceDate,
        items: combinedItems,
        subtotal,
        tax,
        discount: membershipDiscount,
        total,
        notes: (() => {
          const base = document.getElementById("invoiceNotes").value || '';
          const msg = `After applying membership, service total is ${utils.formatCurrency(membershipAdjustedServiceTotal, currency)}.`;
          return base ? `${base}\n${msg}` : msg;
        })(),
        status: invoice?.status || "pending",
      };

      try {
        if (isEdit) {
          await api.billing.update(invoice.id, formData);
          utils.showToast("Invoice updated successfully", "success");
        } else {
          await api.billing.create(formData);
          utils.showToast("Invoice created successfully", "success");
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
      const currency = salonSettings.billing?.currency || "USD";

      // Fallback: fetch customer if not populated
      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'N/A';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) {}
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
      const currency = salonSettings.billing?.currency || "USD";
      const currencySymbol = utils.getCurrencySymbol(currency);

      // Fallback: fetch customer if not populated
      if (!invoice.customer_name && invoice.customer_id) {
        try {
          const cust = await api.customers.getById(invoice.customer_id);
          invoice.customer_name = cust?.name || invoice.customer_name || 'N/A';
          invoice.customer_phone = cust?.phone || invoice.customer_phone || '';
        } catch (_) {}
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
        <div class="invoice-header">
          <h2>${salonSettings.salon?.name || 'Salon Management System'}</h2>
          <p>${salonSettings.salon?.address || ''}</p>
          <p>Phone: ${salonSettings.salon?.phone || ''} | Email: ${salonSettings.salon?.email || ''}</p>
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
              <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
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
              <td colspan="3" class="text-right"><strong>Grand Total:</strong></td>
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
