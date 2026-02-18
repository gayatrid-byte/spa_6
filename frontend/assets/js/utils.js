// // Utility functions
// const utils = {
//   // Format date to readable string
//   formatDate(dateString) {
//     const options = { year: 'numeric', month: 'short', day: 'numeric' };
//     return new Date(dateString).toLocaleDateString('en-US', options);
//   },

//   // Format time to readable string
//   formatTime(timeString) {
//     const [hours, minutes] = timeString.split(':');
//     const hour = parseInt(hours);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     const formattedHour = hour % 12 || 12;
//     return `${formattedHour}:${minutes} ${ampm}`;
//   },

//   // Format currency
//   formatCurrency(amount, currency = 'USD') {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: currency
//     }).format(amount);
//   },

//   // Get today's date in YYYY-MM-DD format
//   getTodayDate() {
//     return new Date().toISOString().split('T')[0];
//   },

//   // Get date X days ago
//   getDateDaysAgo(days) {
//     const date = new Date();
//     date.setDate(date.getDate() - days);
//     return date.toISOString().split('T')[0];
//   },

//   // Show toast notification
//   showToast(message, type = 'info') {
//     const existingToast = document.querySelector('.toast');
//     if (existingToast) {
//       existingToast.remove();
//     }

//     const toast = document.createElement('div');
//     toast.className = `toast ${type}`;
//     toast.textContent = message;
//     document.body.appendChild(toast);

//     setTimeout(() => {
//       toast.remove();
//     }, 3000);
//   },

//   // Show loading indicator
//   showLoading() {
//     const loader = document.createElement('div');
//     loader.className = 'loader-overlay';
//     loader.innerHTML = '<div class="spinner"></div>';
//     document.body.appendChild(loader);
//     return loader;
//   },

//   // Hide loading indicator
//   hideLoading(loader) {
//     if (loader) {
//       loader.remove();
//     }
//   },

//   // Debounce function
//   debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//       const later = () => {
//         clearTimeout(timeout);
//         func(...args);
//       };
//       clearTimeout(timeout);
//       timeout = setTimeout(later, wait);
//     };
//   },

//   // Generate unique ID
//   generateId() {
//     return Date.now().toString(36) + Math.random().toString(36).substr(2);
//   },

//   // Validate email
//   isValidEmail(email) {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
//   },

//   // Validate phone number
//   isValidPhone(phone) {
//     const re = /^[\d\s\-\+\(\)]+$/;
//     return re.test(phone);
//   }
// };

// Utility functions
const utils = {
  // Format date to readable string
  formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  },

  // Format time to readable string
  formatTime(timeString) {
    if (!timeString) return '';
    const parts = String(timeString).split(':');
    if (parts.length < 2) return '';
    const [hours, minutes] = parts;
    const hour = parseInt(hours, 10);
    if (Number.isNaN(hour)) return '';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const mins = (minutes || '').padStart(2, '0');
    return `${formattedHour}:${mins} ${ampm}`;
  },

  // Format currency with support for multiple currencies
  formatCurrency(amount, currency = 'INR') {
    const currencySymbols = {
      'USD': '₹',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£'
    };

    const options = {
      style: 'currency',
      currency: currency
    };

    // Special handling for INR
    if (currency === 'INR') {
      // Format Indian Rupees with Indian numbering system
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }

    return new Intl.NumberFormat('en-US', options).format(amount);
  },

  // Get currency symbol
  getCurrencySymbol(currency = 'INR') {
    const symbols = {
      'USD': '₹',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || '₹';
  },

  // Get today's date in YYYY-MM-DD format
  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  },

  // Get date X days ago
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  },

  // Show toast notification
  showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  // Print HTML content
  printHTML(htmlContent, title = 'Document') {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #008080; color: white; border: none; cursor: pointer;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // Auto-print after loading
    printWindow.onload = function () {
      printWindow.focus();
    };
  },

  // Show loading indicator
  showLoading() {
    const loader = document.createElement('div');
    loader.className = 'loader-overlay';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
    return loader;
  },

  // Hide loading indicator
  hideLoading(loader) {
    if (loader) {
      loader.remove();
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Validate email
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone number
  isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone);
  },

  // Get CSS class for status badges
  getStatusClass(status) {
    if (!status) return 'secondary';
    const s = status.toLowerCase();
    switch (s) {
      case 'active':
      case 'paid':
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'pending':
      case 'upcoming':
      case 'scheduled':
        return 'primary';
      case 'cancelled':
      case 'expired':
        return 'danger';
      case 'suspended':
        return 'warning';
      default:
        return 'secondary';
    }
  }
};