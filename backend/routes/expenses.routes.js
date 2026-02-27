const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseReport
} = require('../controllers/expenses.controller');

router.get('/', authenticate, getAllExpenses);
router.get('/report', authenticate, getExpenseReport);
router.get('/:id', authenticate, getExpenseById);
router.post('/', authenticate, createExpense);
router.put('/:id', authenticate, updateExpense);
router.delete('/:id', authenticate, deleteExpense);

module.exports = router;