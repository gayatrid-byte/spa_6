const Expense = require('../models/expense.model');

async function getAllExpenses(req, res) {
  try {
    const salonId = req.user.salon_id;
    const filters = req.query;
    
    const expenses = await Expense.getAll(salonId, filters);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getExpenseById(req, res) {
  try {
    const { id } = req.params;
    const expense = await Expense.getById(id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createExpense(req, res) {
  try {
    const expenseData = {
      ...req.body,
      salon_id: req.user.salon_id
    };
    
    const expenseId = await Expense.create(expenseData);
    const expense = await Expense.getById(expenseId);
    
    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const updated = await Expense.update(id, req.body);
    
    if (!updated) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    const expense = await Expense.getById(id);
    
    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Expense.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getExpenseReport(req, res) {
  try {
    const salonId = req.user.salon_id;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const categoryTotals = await Expense.getCategoryTotals(salonId, startDate, endDate);
    
    res.json({
      startDate,
      endDate,
      categoryTotals,
      total: categoryTotals.reduce((sum, cat) => sum + parseFloat(cat.total), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseReport
};