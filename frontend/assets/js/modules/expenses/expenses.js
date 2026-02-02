// Expenses module
let expenses = [];

export async function render(container) {
  try {
    expenses = await api.expenses.getAll();
    
    container.innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2 class="table-title">Expenses</h2>
          <div class="d-flex gap-2">
            <select id="filterCategory" class="form-control">
              <option value="">All Categories</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Supplies">Supplies</option>
              <option value="Salaries">Salaries</option>
              <option value="Marketing">Marketing</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
            <button id="addExpenseBtn" class="btn btn-primary">Add Expense</button>
          </div>
        </div>
        
        <div id="expensesTable">
          ${renderExpensesTable(expenses)}
        </div>
      </div>
    `;
    
    // Attach event listeners
    attachEventListeners(container);
  } catch (error) {
    console.error('Error loading expenses:', error);
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>Failed to load expenses: ${error.message}</p>
      </div>
    `;
  }
}

function renderExpensesTable(expensesList) {
  if (expensesList.length === 0) {
    return '<p class="text-center">No expenses found</p>';
  }
  
  return `
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Payment Method</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${expensesList.map(exp => `
          <tr>
            <td>${exp.category}</td>
            <td>${exp.description || 'N/A'}</td>
            <td>${utils.formatCurrency(exp.amount)}</td>
            <td>${utils.formatDate(exp.expense_date)}</td>
            <td>${exp.payment_method || 'N/A'}</td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="window.expensesModule.editExpense(${exp.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="window.expensesModule.deleteExpense(${exp.id})">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function attachEventListeners(container) {
  // Filter by category
  const filterSelect = container.querySelector('#filterCategory');
  filterSelect.addEventListener('change', async function() {
    const category = this.value;
    try {
      const filtered = category ? await api.expenses.getAll({ category }) : await api.expenses.getAll();
      container.querySelector('#expensesTable').innerHTML = renderExpensesTable(filtered);
    } catch (error) {
      console.error('Filter error:', error);
    }
  });
  
  // Add expense
  const addBtn = container.querySelector('#addExpenseBtn');
  addBtn.addEventListener('click', () => showExpenseForm());
}

function showExpenseForm(expense = null) {
  const isEdit = !!expense;
  
  const formHTML = `
    <form id="expenseForm">
      <div class="form-group">
        <label for="expenseCategory">Category *</label>
        <select id="expenseCategory" name="category" required>
          <option value="">Select category</option>
          <option value="Rent" ${expense?.category === 'Rent' ? 'selected' : ''}>Rent</option>
          <option value="Utilities" ${expense?.category === 'Utilities' ? 'selected' : ''}>Utilities</option>
          <option value="Supplies" ${expense?.category === 'Supplies' ? 'selected' : ''}>Supplies</option>
          <option value="Salaries" ${expense?.category === 'Salaries' ? 'selected' : ''}>Salaries</option>
          <option value="Marketing" ${expense?.category === 'Marketing' ? 'selected' : ''}>Marketing</option>
          <option value="Maintenance" ${expense?.category === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
          <option value="Other" ${expense?.category === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="expenseAmount">Amount ($) *</label>
        <input type="number" id="expenseAmount" name="amount" value="${expense?.amount || 0}" min="0" step="0.01" required>
      </div>
      
      <div class="form-group">
        <label for="expenseDescription">Description</label>
        <input type="text" id="expenseDescription" name="description" value="${expense?.description || ''}">
      </div>
      
      <div class="form-group">
        <label for="expenseDate">Date *</label>
        <input type="date" id="expenseDate" name="expense_date" value="${expense?.expense_date || utils.getTodayDate()}" required>
      </div>
      
      <div class="form-group">
        <label for="expensePaymentMethod">Payment Method</label>
        <select id="expensePaymentMethod" name="payment_method">
          <option value="">Select method</option>
          <option value="Cash" ${expense?.payment_method === 'Cash' ? 'selected' : ''}>Cash</option>
          <option value="Credit Card" ${expense?.payment_method === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
          <option value="Bank Transfer" ${expense?.payment_method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
          <option value="Check" ${expense?.payment_method === 'Check' ? 'selected' : ''}>Check</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="expenseNotes">Notes</label>
        <textarea id="expenseNotes" name="notes" rows="3">${expense?.notes || ''}</textarea>
      </div>
      
      <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Expense</button>
    </form>
  `;
  
  window.appUtils.showModal(isEdit ? 'Edit Expense' : 'Add Expense', formHTML);
  
  // Attach form submit handler
  document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
      category: document.getElementById('expenseCategory').value,
      amount: parseFloat(document.getElementById('expenseAmount').value),
      description: document.getElementById('expenseDescription').value,
      expense_date: document.getElementById('expenseDate').value,
      payment_method: document.getElementById('expensePaymentMethod').value,
      notes: document.getElementById('expenseNotes').value
    };
    
    try {
      if (isEdit) {
        await api.expenses.update(expense.id, formData);
        utils.showToast('Expense updated successfully', 'success');
      } else {
        await api.expenses.create(formData);
        utils.showToast('Expense created successfully', 'success');
      }
      
      window.appUtils.closeModal();
      const contentArea = document.getElementById('contentArea');
      await render(contentArea);
    } catch (error) {
      utils.showToast(error.message || 'Operation failed', 'error');
    }
  });
}

// Export functions for global access
window.expensesModule = {
  editExpense: async function(id) {
    const expense = await api.expenses.getById(id);
    showExpenseForm(expense);
  },
  
  deleteExpense: async function(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.expenses.delete(id);
        utils.showToast('Expense deleted successfully', 'success');
        const contentArea = document.getElementById('contentArea');
        await render(contentArea);
      } catch (error) {
        utils.showToast(error.message || 'Delete failed', 'error');
      }
    }
  }
};