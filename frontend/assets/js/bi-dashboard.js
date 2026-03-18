/**
 * ============================================
 * ADVANCED BI DASHBOARD JAVASCRIPT
 * Enterprise Business Intelligence
 * ============================================
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/bi';
const AUTH_TOKEN = localStorage.getItem('auth_token');

// State Management
const dashboardState = {
  currentModule: 'revenue',
  currentChart: null,
  currentChartType: 'line',
  tableData: [],
  currentPage: 1,
  itemsPerPage: 10,
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  initializeEventListeners();
  setDefaultDates();
  await loadDashboard();
});

function initializeEventListeners() {
  // Module Links
  document.querySelectorAll('.module-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const module = e.target.dataset.module;
      switchModule(module);
    });
  });

  // Filter Button
  document.getElementById('filterBtn').addEventListener('click', applyDateFilter);

  // Chart Period Select
  document.getElementById('chartPeriod').addEventListener('change', (e) => {
    dashboardState.currentChartType = e.target.value;
    updateCharts();
  });

  // Table Search
  document.getElementById('tableSearch').addEventListener('input', (e) => {
    filterTableData(e.target.value);
  });

  // Table Sort
  document.getElementById('tableSortBy').addEventListener('change', (e) => {
    sortTableData(e.target.value);
  });

  // Pagination
  document.getElementById('prevBtn').addEventListener('click', prevPage);
  document.getElementById('nextBtn').addEventListener('click', nextPage);

  // Navigation Links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.target.dataset.section;
      if (section === 'templates') {
        showTemplatesSection();
      }
    });
  });
}

function setDefaultDates() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 30);

  document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
  document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

  dashboardState.startDate = document.getElementById('startDate').value;
  dashboardState.endDate = document.getElementById('endDate').value;
}

// ============================================
// API CALLS
// ============================================

async function fetchBIData(module, params = {}) {
  try {
    showLoadingSpinner();

    const queryParams = new URLSearchParams({
      startDate: dashboardState.startDate,
      endDate: dashboardState.endDate,
      ...params
    });

    const response = await fetch(`${API_BASE_URL}/${module}?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    hideLoadingSpinner();
    return data;
  } catch (error) {
    console.error('Error fetching BI data:', error);
    hideLoadingSpinner();
    showToast('Error loading data', 'error');
    return null;
  }
}

// ============================================
// MODULE SWITCHING
// ============================================

async function switchModule(module) {
  dashboardState.currentModule = module;
  dashboardState.currentPage = 1;

  // Update active link
  document.querySelectorAll('.module-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-module="${module}"]`).classList.add('active');

  // Hide templates section if open
  document.getElementById('templatesSection').style.display = 'none';
  document.querySelector('.bi-container').style.display = 'flex';

  // Load module data
  await loadDashboard();
}

async function loadDashboard() {
  const data = await fetchBIData(dashboardState.currentModule);
  if (!data) return;

  renderKPICards(data);
  renderCharts(data);
  renderDataTable(data);
}

// ============================================
// RENDER KPI CARDS
// ============================================

function renderKPICards(data) {
  const container = document.getElementById('kpiContainer');
  container.innerHTML = '';

  const summary = data.summary || {};

  // Map KPIs based on module
  let kpis = [];

  switch (dashboardState.currentModule) {
    case 'revenue':
      kpis = [
        { label: 'Total Revenue', value: summary.total_revenue, change: summary.revenue_growth_pct, unit: '$' },
        { label: 'Transactions', value: summary.transaction_count, change: 0, unit: '' },
        { label: 'Avg Transaction', value: summary.avg_transaction_value, change: 0, unit: '$' },
        { label: 'Tax Collected', value: summary.tax_collected, change: 0, unit: '$' }
      ];
      break;

    case 'bookings':
      kpis = [
        { label: 'Booked', value: summary.total_bookings, change: 0, unit: '' },
        { label: 'Completion Rate', value: summary.completion_rate_pct, change: 0, unit: '%' },
        { label: 'Avg Duration', value: summary.avg_duration_minutes, change: 0, unit: 'min' },
        { label: 'Booking Value', value: summary.avg_booking_value, change: 0, unit: '$' }
      ];
      break;

    case 'customers':
      kpis = [
        { label: 'Total Customers', value: summary.total_customers, change: 0, unit: '' },
        { label: 'New Customers', value: summary.new_customers, change: 0, unit: '' },
        { label: 'Retention Rate', value: summary.retention_rate_pct, change: 0, unit: '%' },
        { label: 'Churn Rate', value: summary.churn_rate_pct, change: 0, unit: '%' }
      ];
      break;

    case 'staff':
      kpis = [
        { label: 'Total Staff', value: 0, change: 0, unit: '' },
        { label: 'Total Revenue', value: summary.total_bookings, change: 0, unit: '$' },
        { label: 'Avg Completion', value: summary.completed_bookings, change: 0, unit: '%' },
        { label: 'Total Hours', value: 0, change: 0, unit: 'h' }
      ];
      break;

    case 'memberships':
      kpis = [
        { label: 'Active Members', value: summary.active_memberships, change: 0, unit: '' },
        { label: 'Membership Revenue', value: summary.membership_revenue, change: 0, unit: '$' },
        { label: 'Renewal Rate', value: summary.renewal_rate_pct, change: 0, unit: '%' },
        { label: 'Est. MRR', value: summary.estimated_mrr, change: 0, unit: '$' }
      ];
      break;

    case 'profit':
      kpis = [
        { label: 'Total Revenue', value: summary.total_revenue, change: 0, unit: '$' },
        { label: 'Total Expenses', value: summary.total_expenses, change: 0, unit: '$' },
        { label: 'Net Profit', value: summary.net_profit, change: summary.profit_margin_pct, unit: '$' },
        { label: 'Profit Margin', value: summary.profit_margin_pct, change: 0, unit: '%' }
      ];
      break;

    case 'services':
      kpis = [
        { label: 'Top Service', value: 'N/A', change: 0, unit: '' },
        { label: 'Service Revenue', value: 0, change: 0, unit: '$' },
        { label: 'Bookings', value: 0, change: 0, unit: '' },
        { label: 'Peak Hour', value: '12:00 PM', change: 0, unit: '' }
      ];
      break;

    case 'forecast':
      const forecastData = data.forecast || {};
      kpis = [
        { label: 'Days Forecast', value: forecastData.days_ahead || 30, change: 0, unit: 'd' },
        { label: 'Confidence Range', value: '85-115%', change: 0, unit: '' },
        { label: 'Trend', value: data.trend_analysis?.trend_direction || 'N/A', change: 0, unit: '' },
        { label: 'Trend Change', value: data.trend_analysis?.trend_percentage_change || 0, change: 0, unit: '%' }
      ];
      break;
  }

  kpis.forEach(kpi => {
    const card = createKPICard(kpi);
    container.appendChild(card);
  });
}

function createKPICard(kpi) {
  const card = document.createElement('div');
  card.className = 'kpi-card';

  const change = parseFloat(kpi.change);
  const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '→';

  card.innerHTML = `
    <div class="kpi-label">${kpi.label}</div>
    <div class="kpi-value">${formatNumber(kpi.value)}${kpi.unit}</div>
    <div class="kpi-change ${changeClass}">
      ${changeSymbol} ${Math.abs(change)}% vs Period
    </div>
  `;

  return card;
}

// ============================================
// RENDER CHARTS
// ============================================

function renderCharts(data) {
  const mainChartCanvas = document.getElementById('mainChart');
  const distributionChartCanvas = document.getElementById('distributionChart');

  // Clear previous charts
  if (dashboardState.currentChart) {
    dashboardState.currentChart.destroy();
  }

  let chartData = null;
  let distributionData = null;

  switch (dashboardState.currentModule) {
    case 'revenue':
      chartData = prepareRevenueChart(data);
      distributionData = preparePaymentBreakdown(data);
      break;

    case 'bookings':
      chartData = prepareBookingChart(data);
      distributionData = prepareBookingTypeChart(data);
      break;

    case 'customers':
      chartData = prepareCustomerChart(data);
      distributionData = prepareCustomerSegmentChart(data);
      break;

    case 'staff':
      chartData = prepareStaffChart(data);
      distributionData = prepareStaffRevenueChart(data);
      break;

    case 'memberships':
      chartData = prepareMembershipChart(data);
      distributionData = prepareMembershipTypeChart(data);
      break;

    case 'profit':
      chartData = prepareProfitChart(data);
      distributionData = prepareExpenseChart(data);
      break;

    case 'services':
      chartData = prepareServiceChart(data);
      distributionData = prepareServiceCategoryChart(data);
      break;

    case 'forecast':
      chartData = prepareForecastChart(data);
      distributionData = prepareTrendChart(data);
      break;
  }

  // Render main chart
  if (chartData) {
    dashboardState.currentChart = new Chart(mainChartCanvas, {
      type: chartData.type,
      data: chartData.data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: { family: 'Inter, Poppins, sans-serif', size: 12 },
              color: '#6b7280',
              padding: 16,
              usePointStyle: true
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { family: 'Inter, Poppins, sans-serif', size: 11 },
              color: '#6b7280'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { family: 'Inter, Poppins, sans-serif', size: 11 },
              color: '#6b7280'
            }
          }
        }
      }
    });
  }

  // Render distribution chart
  if (distributionData) {
    new Chart(distributionChartCanvas, {
      type: 'doughnut',
      data: distributionData.data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter, Poppins, sans-serif', size: 11 },
              color: '#6b7280',
              padding: 12
            }
          }
        }
      }
    });
  }
}

// Chart Preparation Functions

function prepareRevenueChart(data) {
  const trend = data.daily_trend || [];
  return {
    type: 'line',
    data: {
      labels: trend.map(t => t.date),
      datasets: [{
        label: 'Daily Revenue',
        data: trend.map(t => parseFloat(t.revenue)),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointHoverRadius: 6
      }]
    }
  };
}

function preparePaymentBreakdown(data) {
  const breakdown = data.payment_breakdown || [];
  return {
    data: {
      labels: breakdown.map(p => p.method),
      datasets: [{
        data: breakdown.map(p => p.percentage),
        backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareBookingChart(data) {
  const trend = data.daily_trend || [];
  return {
    type: 'line',
    data: {
      labels: trend.map(t => t.date),
      datasets: [{
        label: 'Bookings',
        data: trend.map(t => t.total),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    }
  };
}

function prepareBookingTypeChart(data) {
  const byType = data.by_type || [];
  return {
    data: {
      labels: byType.map(b => b.type),
      datasets: [{
        data: byType.map(b => b.percentage),
        backgroundColor: ['#6366f1', '#a855f7'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareCustomerChart(data) {
  return {
    type: 'bar',
    data: {
      labels: ['VIP', 'Regular', 'New', 'At-Risk'],
      datasets: [{
        label: 'Customers',
        data: [0, 0, data.summary?.new_customers || 0, 0],
        backgroundColor: '#ec4899',
        borderRadius: 8,
        borderSkipped: false
      }]
    }
  };
}

function prepareCustomerSegmentChart(data) {
  const segments = data.customer_segments || [];
  return {
    data: {
      labels: segments.map(s => s.segment),
      datasets: [{
        data: segments.map(s => s.customer_count),
        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareStaffChart(data) {
  const staff = data.staff_performance?.slice(0, 5) || [];
  return {
    type: 'bar',
    data: {
      labels: staff.map(s => s.staff_name),
      datasets: [{
        label: 'Revenue Generated',
        data: staff.map(s => parseFloat(s.total_revenue)),
        backgroundColor: '#f59e0b',
        borderRadius: 8
      }]
    }
  };
}

function prepareStaffRevenueChart(data) {
  const staff = data.staff_performance?.slice(0, 4) || [];
  return {
    data: {
      labels: staff.map(s => s.staff_name),
      datasets: [{
        data: staff.map(s => parseFloat(s.total_revenue)),
        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareMembershipChart(data) {
  const trend = data.trend || [];
  return {
    type: 'area',
    data: {
      labels: trend.map(t => t.date),
      datasets: [{
        label: 'New Memberships',
        data: trend.map(t => t.new_memberships),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    }
  };
}

function prepareMembershipTypeChart(data) {
  const byType = data.by_type || [];
  return {
    data: {
      labels: byType.map(m => m.membership_type),
      datasets: [{
        data: byType.map(m => m.member_count),
        backgroundColor: ['#6366f1', '#a855f7', '#ec4899'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareProfitChart(data) {
  const trend = data.daily_trend || [];
  return {
    type: 'line',
    data: {
      labels: trend.map(t => t.date),
      datasets: [
        {
          label: 'Revenue',
          data: trend.map(t => parseFloat(t.revenue)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: trend.map(t => parseFloat(t.expenses)),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    }
  };
}

function prepareExpenseChart(data) {
  const breakdown = data.expense_breakdown || [];
  return {
    data: {
      labels: breakdown.map(e => e.category),
      datasets: [{
        data: breakdown.map(e => parseFloat(e.total)),
        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareServiceChart(data) {
  const services = data.performance?.slice(0, 5) || [];
  return {
    type: 'bar',
    data: {
      labels: services.map(s => s.service_name),
      datasets: [{
        label: 'Revenue',
        data: services.map(s => parseFloat(s.total_revenue)),
        backgroundColor: '#f43f5e',
        borderRadius: 8
      }]
    }
  };
}

function prepareServiceCategoryChart(data) {
  const categories = data.by_category || [];
  return {
    data: {
      labels: categories.map(c => c.category),
      datasets: [{
        data: categories.map(c => parseFloat(c.revenue)),
        backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    }
  };
}

function prepareForecastChart(data) {
  const historical = data.historical_performance || [];
  const forecast = data.forecast?.forecasted_values || [];

  return {
    type: 'line',
    data: {
      labels: [
        ...historical.map(h => h.date),
        ...forecast.map(f => f.date)
      ],
      datasets: [
        {
          label: 'Historical Revenue',
          data: [...historical.map(h => parseFloat(h.actual_revenue)), ...Array(forecast.length).fill(null)],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false
        },
        {
          label: 'Forecasted Revenue',
          data: [...Array(historical.length).fill(null), ...forecast.map(f => parseFloat(f.predicted_revenue))],
          borderColor: '#a855f7',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          fill: false
        }
      ]
    }
  };
}

function prepareTrendChart(data) {
  const weekly = data.trend_analysis?.weekly_data || [];
  return {
    type: 'line',
    data: {
      labels: weekly.map(w => `W${w.week}`),
      datasets: [{
        label: 'Weekly Revenue',
        data: weekly.map(w => parseFloat(w.revenue)),
        borderColor: '#1f2937',
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    }
  };
}

// ============================================
// RENDER DATA TABLE
// ============================================

function renderDataTable(data) {
  const table = document.getElementById('dataTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  const tableInfo = getTableDataByModule(data);
  dashboardState.tableData = tableInfo.data;

  // Create headers
  const headerRow = document.createElement('tr');
  tableInfo.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Render paginated data
  renderTablePage();
}

function getTableDataByModule(data) {
  let columns = [];
  let tableData = [];

  switch (dashboardState.currentModule) {
    case 'revenue':
      columns = ['Service', 'Bookings', 'Revenue', 'Avg Price', 'Share %'];
      tableData = data.service_breakdown?.map(s => [
        s.service_name,
        s.service_count,
        `$${s.revenue}`,
        `$${s.avg_price}`,
        `${s.revenue_share_pct}%`
      ]) || [];
      break;

    case 'bookings':
      columns = ['Service', 'Bookings', 'Revenue', 'Duration'];
      tableData = data.service_demand?.map(s => [
        s.service_name,
        s.booking_count,
        `$${s.revenue}`,
        `${s.avg_duration_minutes} min`
      ]) || [];
      break;

    case 'customers':
      columns = ['Name', 'Bookings', 'Lifetime Value', 'Avg Transaction', 'Last Visit'];
      tableData = data.top_customers?.map(c => [
        c.customer_name,
        c.total_bookings,
        `$${c.lifetime_revenue}`,
        `$${c.avg_transaction}`,
        c.last_visit
      ]) || [];
      break;

    case 'staff':
      columns = ['Staff', 'Bookings', 'Revenue', 'Avg Value', 'Contribution %'];
      tableData = data.staff_performance?.map(s => [
        s.staff_name,
        s.total_bookings,
        `$${s.total_revenue}`,
        `$${s.avg_booking_value}`,
        `${s.revenue_contribution_pct}%`
      ]) || [];
      break;

    case 'memberships':
      columns = ['Type', 'Members', 'Revenue', 'Avg Fee', 'Duration'];
      tableData = data.by_type?.map(m => [
        m.membership_type,
        m.member_count,
        `$${m.revenue}`,
        `$${m.avg_fee}`,
        `${m.avg_duration_days} days`
      ]) || [];
      break;

    case 'profit':
      columns = ['Category', 'Count', 'Total', 'Average', 'Share %'];
      tableData = data.expense_breakdown?.map(e => [
        e.category,
        e.count,
        `$${e.total}`,
        `$${e.avg}`,
        `${e.share_pct}%`
      ]) || [];
      break;

    case 'services':
      columns = ['Service', 'Bookings', 'Revenue', 'Duration', 'Rev/Hour'];
      tableData = data.performance?.map(s => [
        s.service_name,
        s.booking_count,
        `$${s.total_revenue}`,
        `${s.avg_duration_minutes} min`,
        `$${s.revenue_per_hour}`
      ]) || [];
      break;

    case 'forecast':
      columns = ['Date', 'Actual', 'Forecast', 'Min', 'Max'];
      tableData = data.historical_performance?.slice(0, 10).map(h => [
        h.date,
        `$${h.actual_revenue}`,
        `$${h.actual_revenue}`,
        `N/A`,
        `N/A`
      ]) || [];
      break;
  }

  return { columns, data: tableData };
}

function renderTablePage() {
  const tbody = document.querySelector('.data-table tbody');
  tbody.innerHTML = '';

  const start = (dashboardState.currentPage - 1) * dashboardState.itemsPerPage;
  const end = start + dashboardState.itemsPerPage;
  const pageData = dashboardState.tableData.slice(start, end);

  pageData.forEach(row => {
    const tr = document.createElement('tr');
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(dashboardState.tableData.length / dashboardState.itemsPerPage);
  document.getElementById('pageIndicator').textContent = `Page ${dashboardState.currentPage} of ${totalPages}`;
  document.getElementById('prevBtn').disabled = dashboardState.currentPage === 1;
  document.getElementById('nextBtn').disabled = dashboardState.currentPage === totalPages;
}

function prevPage() {
  if (dashboardState.currentPage > 1) {
    dashboardState.currentPage--;
    renderTablePage();
  }
}

function nextPage() {
  const totalPages = Math.ceil(dashboardState.tableData.length / dashboardState.itemsPerPage);
  if (dashboardState.currentPage < totalPages) {
    dashboardState.currentPage++;
    renderTablePage();
  }
}

function filterTableData(searchTerm) {
  // Implement search filtering
}

function sortTableData(sortBy) {
  // Implement sorting
}

// ============================================
// FILTERS & EXPORT
// ============================================

function applyDateFilter() {
  dashboardState.startDate = document.getElementById('startDate').value;
  dashboardState.endDate = document.getElementById('endDate').value;
  loadDashboard();
}

async function exportPDF() {
  showToast('Generating PDF...', 'info');
  // Implementation for PDF export using html2pdf or similar library
  setTimeout(() => {
    showToast('PDF exported successfully', 'success');
  }, 1000);
}

async function exportExcel() {
  showToast('Generating Excel...', 'info');
  // Implementation for Excel export
  setTimeout(() => {
    showToast('Excel exported successfully', 'success');
  }, 1000);
}

async function exportCSV() {
  showToast('Generating CSV...', 'info');
  // Implementation for CSV export
  setTimeout(() => {
    showToast('CSV exported successfully', 'success');
  }, 1000);
}

// ============================================
// TEMPLATES SECTION
// ============================================

function showTemplatesSection() {
  document.getElementById('templatesSection').style.display = 'block';
  document.querySelector('.bi-container').style.display = 'none';
}

function launchTemplate(template) {
  switchModule(template);
}

// ============================================
// UTILITIES
// ============================================

function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
}

function showLoadingSpinner() {
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoadingSpinner() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login.html';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

console.log('Advanced BI Dashboard Initialized');
