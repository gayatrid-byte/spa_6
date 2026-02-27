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
      'USD': '$',
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

/* ----------------------
   ENHANCEMENTS: Preloader, Theme Toggle, Scroll Reveal, Floating, Letter Anim
   These run at runtime and do not require any HTML changes.
   ---------------------- */
(function () {
  // mark JS ready
  document.documentElement.classList.add('js-initialised');

  // ------------------ Preloader ------------------
  function createPreloader() {
    try {
      const overlay = document.createElement('div');
      overlay.className = 'preloader-overlay';

      const ring = document.createElement('div');
      ring.className = 'preloader-ring';

      const glow = document.createElement('div');
      glow.className = 'preloader-glow';

      overlay.appendChild(glow);
      overlay.appendChild(ring);
      document.body.appendChild(overlay);

      // ensure small delay so CSS paints to avoid flicker
      requestAnimationFrame(() => overlay.style.opacity = '1');

      // Remove after load
      window.addEventListener('load', () => {
        overlay.classList.add('hide');
        setTimeout(() => { overlay.remove(); }, 700);
      }, { once: true });
    } catch (e) {
      // silent
    }
  }

  // ------------------ Theme Toggle ------------------
  function initThemeToggle() {
    try {
      const current = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day');
      if (current === 'night') document.body.classList.add('theme-night');

      const btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.setAttribute('aria-label', 'Toggle day night theme');
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '8px';
      btn.style.padding = '8px';
  

      function refresh() {
        if (document.body.classList.contains('theme-night')) {
          btn.title = 'Switch to Day mode';
          localStorage.setItem('theme', 'night');
          btn.style.color = 'var(--accent-gold)';
        } else {
          btn.title = 'Switch to Night mode';
          localStorage.setItem('theme', 'day');
          btn.style.color = 'var(--primary-teal)';
        }
      }

      btn.addEventListener('click', (e) => {
        document.body.classList.toggle('theme-night');
        // small rotate animation for affordance
        const icon = btn.querySelector('.toggle-icon');
        if (icon) {
          icon.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';
          icon.style.transform = 'rotate(180deg)';
          setTimeout(() => { icon.style.transform = ''; }, 460);
        }
        refresh();
      });

      // place toggle in top-header if present, otherwise fixed top-right
      const header = document.querySelector('.top-header');
      if (header) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.appendChild(btn);
        header.appendChild(container);
      } else {
        btn.style.position = 'fixed';
        btn.style.right = '18px';
        btn.style.top = '14px';
        btn.style.zIndex = 4500;
        document.body.appendChild(btn);
      }

      refresh();
    } catch (e) {}
  }

  // ------------------ Scroll Reveal ------------------
  function initScrollReveal() {
    try {
      const items = [].slice.call(document.querySelectorAll('.reveal, [data-reveal]'));
      if (!items.length) return;
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(ent => {
          if (ent.isIntersecting) {
            ent.target.classList.add('visible');
            obs.unobserve(ent.target);
          }
        });
      }, { threshold: 0.12 });

      items.forEach(el => io.observe(el));
    } catch (e) {}
  }

  // ------------------ Floating subtle ------------------
  function initFloating() {
    try {
      const sel = '.dashboard-cards .card, .stat-card, .summary-card, .card';
      const list = document.querySelectorAll(sel);
      list.forEach((el, i) => {
        // staggered start to avoid sync
        el.classList.add('float-subtle');
        el.style.animationDelay = (i % 6) * 0.2 + 's';
      });
    } catch (e) {}
  }

  // ------------------ Image zoom auto-apply ------------------
  function initImageZoom() {
    try {
      const imgs = document.querySelectorAll('.card img, .login-box img, [data-img-zoom], img.profile-photo');
      imgs.forEach(img => img.classList.add('img-zoom'));
    } catch (e) {}
  }

  // ------------------ Letter-by-letter for headlines ------------------
  function initCharAnim() {
    try {
      const targets = document.querySelectorAll('[data-chars]');
      targets.forEach(el => {
        const text = el.textContent.trim();
        if (!text) return;
        // preserve accessibility via aria-label
        el.setAttribute('aria-label', text);
        el.innerHTML = '';
        const frag = document.createDocumentFragment();
        Array.from(text).forEach((ch, idx) => {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          span.style.transitionDelay = (idx * 40) + 'ms';
          frag.appendChild(span);
        });
        el.appendChild(frag);

        // reveal on load or when visible
        const reveal = () => {
          el.querySelectorAll('.char').forEach(s => s.classList.add('visible'));
        };

        // if element already visible in viewport, trigger
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) reveal();
        else {
          const o = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => { if (en.isIntersecting) { reveal(); obs.disconnect(); } });
          }, { threshold: 0.1 });
          o.observe(el);
        }
      });
    } catch (e) {}
  }

  // ------------------ SVG/ICON pulse opt-in ------------------
  function initIconPulse() {
    try {
      const els = document.querySelectorAll('[data-icon-pulse]');
      els.forEach(el => el.classList.add('icon-pulse'));
    } catch (e) {}
  }

  // ------------------ SVG defs & Emoji -> Inline SVG replacement ------------------
  function createSvgDefs() {
    try {
      if (document.getElementById('brand-svg-defs')) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute'; svg.style.width = 0; svg.style.height = 0; svg.style.overflow = 'hidden';
      svg.id = 'brand-svg-defs';
      svg.innerHTML = `
        <defs>
          <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--primary-teal)" />
            <stop offset="100%" stop-color="var(--primary-dark)" />
          </linearGradient>
          <filter id="icon-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.18)" />
          </filter>
        </defs>
      `;
      document.body.appendChild(svg);
    } catch (e) {}
  }

  function emojiToSvgMap(name) {
    const stroke = 'currentColor';
    const common = 'stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" fill="none"';
    const icons = {
      'target': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" ${common}></circle><circle cx="12" cy="12" r="5" ${common}></circle><circle cx="12" cy="12" r="2" ${common}></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2" ${common}></path></svg>`,
      'clock': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" ${common}></circle><path d="M12 7v5l3 3" ${common}></path></svg>`,
      'calendar': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" ${common}></rect><path d="M16 3v4M8 3v4" ${common}></path></svg>`,
      'wallet': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" ${common}></rect><path d="M16 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" ${common}></path></svg>`,
      'crown': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M2 7l6 6 4-4 10 10" ${common}></path></svg>`,
      'chart': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="12" width="4" height="8" ${common}></rect><rect x="9" y="8" width="4" height="12" ${common}></rect><rect x="15" y="4" width="4" height="16" ${common}></rect></svg>`,
      'receipt': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" ${common}></rect><path d="M8 6h8M8 10h8M8 14h6" ${common}></path></svg>`,
      'check-circle': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" ${common}></circle><path d="M9 12l2 2 4-4" ${common}></path></svg>`,
      'x-circle': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" ${common}></circle><path d="M15 9l-6 6M9 9l6 6" ${common}></path></svg>`,
      'bell': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" ${common}></path></svg>`,
      'trophy': `<svg class="inline-icon" width="20" height="20" viewBox="0 0 24 24"><path d="M8 21h8M12 17V7" ${common}></path><path d="M7 3h10l-1 6a4 4 0 01-8 0L7 3z" ${common}></path></svg>`
    };
    return icons[name] || null;
  }

  function replaceEmojis(node) {
    try {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
      const toReplace = [];
      while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue;
        if (!text) continue;
        const match = text.match(/[🎯⏳📅💰👑📊🧾✅❌🔔🏆]/);
        if (match) toReplace.push(walker.currentNode);
      }

      toReplace.forEach(textNode => {
        const frag = document.createDocumentFragment();
        const parts = textNode.nodeValue.split(/([🎯⏳📅💰👑📊🧾✅❌🔔🏆])/);
        parts.forEach(part => {
          if (!part) return;
          if (part.match(/[🎯⏳📅💰👑📊🧾✅❌🔔🏆]/)) {
            const svgStr = emojiToSvgMap(part);
            if (svgStr) {
              const wrapper = document.createElement('span');
              wrapper.className = 'inline-icon-wrap';
              wrapper.innerHTML = svgStr;
              frag.appendChild(wrapper);
              return;
            }
          }
          frag.appendChild(document.createTextNode(part));
        });
        textNode.parentNode.replaceChild(frag, textNode);
      });
    } catch (e) {}
  }

  // Initialize all in a safe sequence
  document.addEventListener('DOMContentLoaded', () => {
    createPreloader();
    initThemeToggle();
    initScrollReveal();
    initFloating();
    initImageZoom();
    initCharAnim();
    initIconPulse();
    // accessibility: remove preloader if script runs late
    setTimeout(() => {
      const p = document.querySelector('.preloader-overlay');
      if (p) { p.classList.add('hide'); setTimeout(() => p.remove(), 700); }
    }, 4000);
  });

})();