// In-memory settings store shared across controllers/models
// Note: In production, move this to a persistent DB table.

const store = {
  salon: {
    name: 'My Salon',
    address: '',
    phone: '',
    email: '',
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      Saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  },
  billing: {
    taxRate: 0,
    currency: 'USD',
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1001
  }
};

function getSettings() {
  return store;
}

function updateSettings(partial) {
  if (partial.salon) {
    store.salon = { ...store.salon, ...partial.salon };
  }
  if (partial.billing) {
    store.billing = { ...store.billing, ...partial.billing };
  }
  // Normalize currency
  const validCurrencies = ['USD', 'INR', 'EUR', 'GBP'];
  if (store.billing.currency && !validCurrencies.includes(store.billing.currency)) {
    store.billing.currency = 'USD';
  }
  return store;
}

function generateInvoiceNumber() {
  const prefix = store.billing.invoicePrefix || 'INV';
  const seq = store.billing.nextInvoiceNumber || 1001;
  const number = `${prefix}-${seq}`;
  // Increment sequence for next time
  store.billing.nextInvoiceNumber = seq + 1;
  return number;
}

module.exports = {
  getSettings,
  updateSettings,
  generateInvoiceNumber
};
