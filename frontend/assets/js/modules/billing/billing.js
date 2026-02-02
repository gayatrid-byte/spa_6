let invoices = [];
let customers = [];
let salonSettings = {};

export async function render(container) {
  try {
    // Load necessary data
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
    
    // Attach event listeners
    attachEventListeners(container);
  } catch (error) {
    console.error('Error loading billing:', error);
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>Failed to load invoices: ${error.message}</p>
      </div>
    `;
  }
}

function renderInvoicesTable(invoicesList) {
  if (invoicesList.length === 0) {
    return '<p class="text-center">No invoices found</p>';
  }
  
  const currency = salonSettings.billing?.currency || 'USD';
  
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
        ${invoicesList.map(inv => `
          <tr>
            <td>${inv.invoice_number}</td>
            <td>${inv.customer_name || 'N/A'}</td>
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
        `).join('')}
      </tbody>
    </table>
  `;
}

function attachEventListeners(container) {
  // Filter by status
  const filterSelect = container.querySelector('#filterStatus');
  filterSelect.addEventListener('change', async function() {
    const status = this.value;
    try {
      const filtered = status ? await api.billing.getAll({ status }) : await api.billing.getAll();
      container.querySelector('#invoicesTable').innerHTML = renderInvoicesTable(filtered);
    } catch (error) {
      console.error('Filter error:', error);
    }
  });
  
  // Add invoice
  const addBtn = container.querySelector('#addInvoiceBtn');
  addBtn.addEventListener('click', () => showInvoiceForm());
}

async function showInvoiceForm(invoice = null) {
  const isEdit = !!invoice;
  
  let invoiceItems = invoice?.items || [];
  let customerLastBooking = null;
  
  // If editing or customer is selected, get last booking
  if (invoice?.customer_id) {
    try {
      const appointments = await api.bookings.getAll({ customer_id: invoice.customer_id });
      if (appointments.length > 0) {
        customerLastBooking = appointments[0]; // Most recent
      }
    } catch (error) {
      console.error('Error getting last booking:', error);
    }
  }
  
  const formHTML = `
    <form id="invoiceForm">
      <div class="form-group">
        <label for="invoiceCustomer">Customer *</label>
        <select id="invoiceCustomer" name="customer_id" required onchange="window.billingModule.handleCustomerChange(this.value)">
          <option value="">Select customer</option>
          ${customers.map(c => `<option value="${c.id}" ${invoice?.customer_id === c.id ? 'selected' : ''}>${c.name} - ${c.phone || 'No phone'}</option>`).join('')}
        </select>
      </div>
      
      ${customerLastBooking ? `
        <div class="customer-last-booking card mb-2" style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
          <small><strong>Last Booking:</strong> ${utils.formatDate(customerLastBooking.booking_date)}
          ${customerLastBooking.start_time ? ` at ${utils.formatTime(customerLastBooking.start_time)}` : ''}</small>
          <br>
          <small><strong>Services:</strong> ${customerLastBooking.total_services || 0}</small>
        </div>
      ` : ''}
      
      <div id="customerLastBookingInfo"></div>
      
      <div class="form-group">
        <label for="invoiceDate">Date *</label>
        <input type="date" id="invoiceDate" name="invoice_date" value="${invoice?.invoice_date || utils.getTodayDate()}" required>
        <small id="autoItemsHint" class="text-muted">Selecting customer and date will auto-load services & discounts for that day.</small>
      </div>
      
      <div class="form-group">
        <label>Invoice Items</label>
        <div id="invoiceItems">
          ${invoiceItems.map((item, index) => `
            <div class="invoice-item d-flex gap-2 mb-2">
              <input type="text" placeholder="Description" value="${item.description}" class="item-desc" style="flex: 2">
              <input type="number" placeholder="Qty" value="${item.quantity}" class="item-qty" style="flex: 1" min="1">
              <input type="number" placeholder="Price" value="${item.price}" class="item-price" style="flex: 1" step="0.01" min="0">
              <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
            </div>
          `).join('')}
        </div>
        <button type="button" id="addItemBtn" class="btn btn-sm btn-outline mt-1">+ Add Item</button>
        <div id="autoDiscountInfo" class="mt-2" style="display:none;">
          <small class="text-info">Auto-applied: <span id="autoDiscountBreakdown"></span></small>
        </div>
      </div>
      
      <div class="d-flex gap-2 mt-2">
        <div class="form-group" style="flex: 1">
          <label for="invoiceTax">Tax (%)</label>
          <input type="number" id="invoiceTax" name="tax" value="${invoice?.tax || salonSettings.billing?.taxRate || 0}" step="0.1" min="0">
        </div>
        <div class="form-group" style="flex: 1">
          <label for="invoiceDiscount">Discount</label>
          <input type="number" id="invoiceDiscount" name="discount" value="${invoice?.discount || 0}" step="0.01" min="0">
        </div>
      </div>
      
      <div class="form-group">
        <label for="invoiceNotes">Notes</label>
        <textarea id="invoiceNotes" name="notes" rows="2">${invoice?.notes || ''}</textarea>
      </div>
      
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Invoice</button>
        ${isEdit ? `<button type="button" class="btn btn-success" onclick="window.billingModule.printInvoice(${invoice.id})">Print Invoice</button>` : ''}
      </div>
    </form>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Invoice' : 'Create Invoice', formHTML);
    // Trigger auto-load when date changes
    document.getElementById('invoiceDate').addEventListener('change', async function() {
      const customerId = parseInt(document.getElementById('invoiceCustomer').value);
      const date = this.value;
      if (customerId && date) {
        await window.billingModule.loadAutoItems(customerId, date);
      }
    });
  
  // Add item button
  document.getElementById('addItemBtn').addEventListener('click', function() {
    const itemsContainer = document.getElementById('invoiceItems');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item d-flex gap-2 mb-2';
    newItem.innerHTML = `
      <input type="text" placeholder="Description" class="item-desc" style="flex: 2">
      <input type="number" placeholder="Qty" class="item-qty" style="flex: 1" min="1" value="1">
      <input type="number" placeholder="Price" class="item-price" style="flex: 1" step="0.01" min="0">
      <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
    itemsContainer.appendChild(newItem);
  });
  
  // Load customer last booking function
  window.loadCustomerLastBooking = async function(customerId) {
    if (!customerId) return;
    
    try {
      const appointments = await api.bookings.getAll({ customer_id: customerId });
      const lastBookingInfo = document.getElementById('customerLastBookingInfo');
      
      if (appointments.length > 0) {
        const lastBooking = appointments[0]; // Most recent
        lastBookingInfo.innerHTML = `
          <div class="customer-last-booking card mb-2" style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <small><strong>Last Booking:</strong> ${utils.formatDate(lastBooking.booking_date)}${lastBooking.start_time ? ` at ${utils.formatTime(lastBooking.start_time)}` : ''}</small>
            <br>
            <small><strong>Total Services:</strong> ${lastBooking.total_services || 0}</small>
            <br>
            <small><strong>Status:</strong> <span class="badge badge-${getAppointmentStatusClass(lastBooking.status)}">${lastBooking.status}</span></small>
          </div>
        `;
      } else {
        lastBookingInfo.innerHTML = `
          <div class="customer-last-booking card mb-2" style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <small><strong>No previous bookings found for this customer.</strong></small>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading customer last booking:', error);
    }
  };

  // Handle customer change: load last booking and auto-items if date selected
  window.billingModule.handleCustomerChange = async function(customerId) {
    await window.loadCustomerLastBooking(customerId);
    const date = document.getElementById('invoiceDate').value;
    if (customerId && date) {
      await window.billingModule.loadAutoItems(customerId, date);
    }
  };
  
  // Attach form submit handler
  document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Collect items
    const items = [];
    document.querySelectorAll('.invoice-item').forEach(item => {
      const desc = item.querySelector('.item-desc').value;
      const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
      const price = parseFloat(item.querySelector('.item-price').value) || 0;
      
      if (desc && qty > 0) {
        items.push({
          description: desc,
          quantity: qty,
          price: price,
          total: qty * price
        });
      }
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(document.getElementById('invoiceTax').value) || 0;
    const tax = (subtotal * taxRate) / 100;
    const discount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
    const total = subtotal + tax - discount;
    
    const formData = {
      customer_id: parseInt(document.getElementById('invoiceCustomer').value),
      invoice_date: document.getElementById('invoiceDate').value,
      items: items,
      subtotal: subtotal,
      tax: tax,
      discount: discount,
      total: total,
      notes: document.getElementById('invoiceNotes').value,
      status: invoice?.status || 'pending'
    };
    
    try {
      if (isEdit) {
        await api.billing.update(invoice.id, formData);
        utils.showToast('Invoice updated successfully', 'success');
      } else {
        await api.billing.create(formData);
        utils.showToast('Invoice created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Operation failed', 'error');
    }
  });
}

function getInvoiceStatusClass(status) {
  const statusClasses = {
    'pending': 'warning',
    'paid': 'success',
    'cancelled': 'danger'
  };
  return statusClasses[status] || 'info';
}

function getAppointmentStatusClass(status) {
  const statusClasses = {
    'scheduled': 'info',
    'completed': 'success',
    'cancelled': 'danger',
    'no-show': 'warning'
  };
  return statusClasses[status] || 'info';
}

// Export functions for global access
window.billingModule = {
  async loadAutoItems(customerId, date) {
    try {
      const data = await api.billing.getAutoItems({ customer_id: customerId, date });
      const itemsContainer = document.getElementById('invoiceItems');
      // Replace items with auto-loaded ones (keep manual ability to add afterwards)
      itemsContainer.innerHTML = data.items.map(item => `
        <div class="invoice-item d-flex gap-2 mb-2">
          <input type="text" placeholder="Description" value="${item.description}" class="item-desc" style="flex: 2">
          <input type="number" placeholder="Qty" value="${item.quantity}" class="item-qty" style="flex: 1" min="1">
          <input type="number" placeholder="Price" value="${item.price}" class="item-price" style="flex: 1" step="0.01" min="0">
          <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
        </div>
      `).join('');

      // Set discount and show breakdown info
      const discountInput = document.getElementById('invoiceDiscount');
      discountInput.value = (data.auto_discount || 0);
      const autoInfo = document.getElementById('autoDiscountInfo');
      const breakdownEl = document.getElementById('autoDiscountBreakdown');
      const b = data.breakdown || {};
      breakdownEl.textContent = `Free: ${utils.formatCurrency(b.freeDeduction || 0, salonSettings.billing?.currency || 'USD')}, `+
        `Plan %: ${utils.formatCurrency(b.planDiscount || 0, salonSettings.billing?.currency || 'USD')}, `+
        `Wallet: ${utils.formatCurrency(b.walletApplied || 0, salonSettings.billing?.currency || 'USD')}, `+
        `Tax ${b.taxRate || 0}%`;
      autoInfo.style.display = 'block';
    } catch (error) {
      console.error('Auto-items load error:', error);
      utils.showToast(error.message || 'Failed to load items', 'error');
    }
  },
  viewInvoice: async function(id) {
    try {
      const invoice = await api.billing.getById(id);
      const currency = salonSettings.billing?.currency || 'USD';
      const itemsHTML = invoice.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${utils.formatCurrency(item.price, currency)}</td>
          <td>${utils.formatCurrency(item.total, currency)}</td>
        </tr>
      `).join('');
      
      const invoiceHTML = `
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
      
      window.appUtils.showModal('Invoice Details', invoiceHTML);
    } catch (error) {
      utils.showToast(error.message || 'Failed to load invoice', 'error');
    }
  },
  
  printInvoice: async function(id) {
    try {
      const invoice = await api.billing.getById(id);
      const currency = salonSettings.billing?.currency || 'USD';
      const currencySymbol = utils.getCurrencySymbol(currency);
      
      const itemsHTML = invoice.items.map(item => `
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
    } catch (error) {
      utils.showToast(error.message || 'Failed to print invoice', 'error');
    }
  },
  
  updateStatus: async function(id, status) {
    if (!status) return;
    
    try {
      await api.billing.updateStatus(id, status);
      utils.showToast('Status updated successfully', 'success');
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Update failed', 'error');
    }
  }
};