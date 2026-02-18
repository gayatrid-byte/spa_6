let membershipInvoices = [];
let customers = [];
let salonSettings = {};

export async function render(container) {
  try {
    const [payments, customersData, settings] = await Promise.all([
      api.memberships.getPayments(),
      api.customers.getAll(),
      api.settings.get()
    ]);

    membershipInvoices = payments;
    customers = customersData;
    salonSettings = settings;

    container.innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>Membership Invoices</h2>
          <button id="addMembershipInvoiceBtn" class="btn btn-primary">
            Create Membership Invoice
          </button>
        </div>

        ${renderTable()}
      </div>
    `;

    document
      .getElementById("addMembershipInvoiceBtn")
      .addEventListener("click", showMembershipForm);

  } catch (error) {
    container.innerHTML = `<div class="card">Failed to load membership invoices</div>`;
  }
}

function renderTable() {
  const currency = salonSettings.billing?.currency || "INR";

  if (!membershipInvoices.length) {
    return "<p>No membership invoices found</p>";
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Subtotal</th>
          <th>Tax</th>
          <th>Discount</th>
          <th>Total</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${membershipInvoices.map(inv => `
          <tr>
            <td>MEM-${inv.id}</td>
            <td>${inv.customer_name}</td>
            <td>${utils.formatCurrency(inv.amount, currency)}</td>
            <td>0</td>
            <td>0</td>
            <td>${utils.formatCurrency(inv.amount, currency)}</td>
            <td>
              <button onclick="window.membershipBilling.print(${inv.id})" 
                      class="btn btn-sm btn-success">
                Print
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function showMembershipForm() {
  const plans = await api.memberships.getPlans();

  const formHTML = `
    <form id="membershipInvoiceForm">
      <div class="form-group">
        <label>Customer</label>
        <select id="customerSelect" required>
          <option value="">Select Customer</option>
          ${customers.map(c =>
            `<option value="${c.id}">${c.name}</option>`
          ).join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Membership Plan</label>
        <select id="planSelect" required>
          <option value="">Select Plan</option>
          ${plans.map(p =>
            `<option value="${p.id}" data-price="${p.price}">
              ${p.name} - ${p.price}
            </option>`
          ).join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Payment Method</label>
        <select id="paymentMethod">
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
      </div>

      <button type="submit" class="btn btn-primary">
        Create Membership Invoice
      </button>
    </form>
  `;

  window.appUtils.showModal("Create Membership Invoice", formHTML);

  document
    .getElementById("membershipInvoiceForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const planSelect = document.getElementById("planSelect");
      const planId = planSelect.value;
      const amount = planSelect.selectedOptions[0].dataset.price;

      await api.memberships.createPayment({
        customer_id: document.getElementById("customerSelect").value,
        plan_id: planId,
        amount: amount,
        payment_method: document.getElementById("paymentMethod").value
      });

      utils.showToast("Membership invoice created", "success");
      window.location.hash = "membership-billing";
    });
}

window.membershipBilling = {
  print: async function(id) {
    const invoice = await api.memberships.getPaymentById(id);
    const currency = salonSettings.billing?.currency || "INR";

    const printHTML = `
      <h2>Membership Invoice</h2>
      <p><strong>Invoice:</strong> MEM-${invoice.id}</p>
      <p><strong>Customer:</strong> ${invoice.customer_name}</p>
      <p><strong>Amount:</strong> ${utils.formatCurrency(invoice.amount, currency)}</p>
      <p><strong>Payment Method:</strong> ${invoice.payment_method}</p>
      <hr>
      <h3>Total: ${utils.formatCurrency(invoice.amount, currency)}</h3>
    `;

    utils.printHTML(printHTML, `Membership-${invoice.id}`);
  }
};
