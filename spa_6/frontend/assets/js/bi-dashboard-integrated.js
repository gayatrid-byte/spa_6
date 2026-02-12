/**
 * ============================================
 * BI DASHBOARD - INTEGRATED VERSION
 * Loads within Reports Page at #contentArea
 * ============================================
 */

const BIDashboard = {
  // State Management
  state: {
    currentModule: 'revenue',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    chartInstances: {},
    currentPage: 1,
    itemsPerPage: 10
  },

  // Initialize Dashboard
  init() {
    this.renderHTML();
    this.attachEventListeners();
    this.loadModuleData('revenue');
  },

  // Render Dashboard HTML
  renderHTML() {
    const html = `
      <div class="bi-dashboard-integrated">
        <!-- Control Panel -->
        <div class="bi-controls">
          <div class="control-group">
            <label>Start Date:</label>
            <input type="date" id="biStartDate" value="${this.state.startDate}" class="date-input">
          </div>
          <div class="control-group">
            <label>End Date:</label>
            <input type="date" id="biEndDate" value="${this.state.endDate}" class="date-input">
          </div>
          <button class="btn btn-primary" id="biApplyFilter">Apply Filter</button>
        </div>

        <!-- Module Navigation -->
        <div class="bi-module-nav">
          <button class="tab-btn active" data-module="revenue">💰 Revenue</button>
          <button class="tab-btn" data-module="bookings">📅 Bookings</button>
          <button class="tab-btn" data-module="customers">👥 Customers</button>
          <button class="tab-btn" data-module="staff">👔 Staff</button>
          <button class="tab-btn" data-module="memberships">🎫 Memberships</button>
          <button class="tab-btn" data-module="profit">📊 Profit</button>
          <button class="tab-btn" data-module="services">✂️ Services</button>
          <button class="tab-btn" data-module="forecast">🤖 Forecast</button>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid" id="kpiContainer">
          <!-- KPI cards will be rendered here -->
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="chart-container">
            <h3 id="chart1Title">Chart 1</h3>
            <canvas id="chart1"></canvas>
          </div>
          <div class="chart-container">
            <h3 id="chart2Title">Chart 2</h3>
            <canvas id="chart2"></canvas>
          </div>
        </div>

        <!-- Data Table -->
        <div class="data-table-section">
          <h3 id="tableTitle">Data Table</h3>
          <div class="table-wrapper">
            <table class="data-table" id="dataTable">
              <thead id="tableHead"></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
          <div class="pagination" id="pagination"></div>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div id="loadingSpinner" class="loading-spinner hidden">
        <div class="spinner"></div>
        <p>Loading data...</p>
      </div>

      <!-- Toast Notifications -->
      <div id="toastContainer" class="toast-container"></div>
    `;

    document.getElementById('contentArea').innerHTML = html;
  },

  // Attach Event Listeners
  attachEventListeners() {
    // Module tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const module = e.target.dataset.module;
        this.loadModuleData(module);
      });
    });

    // Filter button
    document.getElementById('biApplyFilter').addEventListener('click', () => {
      this.state.startDate = document.getElementById('biStartDate').value;
      this.state.endDate = document.getElementById('biEndDate').value;
      this.loadModuleData(this.state.currentModule);
    });
  },

  // Load Module Data from API
  async loadModuleData(module) {
    this.state.currentModule = module;
    this.showLoadingSpinner();

    try {
      const token = localStorage.getItem('token');
      const url = `/api/bi/${module}?startDate=${this.state.startDate}&endDate=${this.state.endDate}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();

      this.renderKPICards(data, module);
      this.renderCharts(data, module);
      this.renderDataTable(data, module);

      this.hideLoadingSpinner();
    } catch (error) {
      console.error('Error loading module data:', error);
      this.showToast(`Error loading ${module} data`, 'error');
      this.hideLoadingSpinner();
    }
  },

  // Render KPI Cards
  renderKPICards(data, module) {
    const container = document.getElementById('kpiContainer');
    container.innerHTML = '';

    const summary = data.summary || {};
    let kpis = [];

    // Module-specific KPI mapping
    switch (module) {
      case 'revenue':
        kpis = [
          { label: 'Total Revenue', value: summary.total_revenue, unit: '₹' },
          { label: 'Transactions', value: summary.transaction_count, unit: '' },
          { label: 'Avg Value', value: summary.avg_transaction_value, unit: '₹' },
          { label: 'Growth', value: summary.revenue_growth_pct || '0', unit: '%' }
        ];
        break;
      case 'bookings':
        kpis = [
          { label: 'Total Bookings', value: summary.total_bookings, unit: '' },
          { label: 'Completed', value: summary.completed_bookings, unit: '' },
          { label: 'Completion Rate', value: summary.completion_rate_pct, unit: '%' },
          { label: 'Avg Value', value: summary.avg_booking_value, unit: '₹' }
        ];
        break;
      case 'customers':
        kpis = [
          { label: 'Total Customers', value: summary.total_customers, unit: '' },
          { label: 'New Customers', value: summary.new_customers, unit: '' },
          { label: 'Retention Rate', value: summary.retention_rate_pct, unit: '%' },
          { label: 'Avg CLV', value: summary.avg_customer_lifetime_value, unit: '₹' }
        ];
        break;
      case 'staff':
        // Use staff_performance array length for total staff
        const staffCount = Array.isArray(data.staff_performance) ? data.staff_performance.length : 0;
        kpis = [
          { label: 'Total Staff', value: staffCount, unit: '' },
          { label: 'Avg Bookings', value: summary.avg_bookings || '0', unit: '' },
          { label: 'Utilization', value: summary.avg_utilization || '0', unit: '%' },
          { label: 'Avg Revenue', value: summary.avg_revenue || '0', unit: '₹' }
        ];
        break;
      default:
        kpis = [
          { label: 'Metric 1', value: summary.total || '0', unit: '' },
          { label: 'Metric 2', value: summary.count || '0', unit: '' },
          { label: 'Metric 3', value: summary.avg || '0', unit: '' },
          { label: 'Metric 4', value: summary.pct || '0', unit: '%' }
        ];
    }

    kpis.forEach(kpi => {
      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${this.formatNumber(kpi.value)}${kpi.unit}</div>
      `;
      container.appendChild(card);
    });
  },

  // Render Charts
  renderCharts(data, module) {
    // Destroy existing charts
    Object.values(this.state.chartInstances).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.state.chartInstances = {};

    // Prepare chart data based on module
    const chart1Config = this.getChart1Config(data, module);
    const chart2Config = this.getChart2Config(data, module);

    // Render Chart 1
    if (chart1Config && document.getElementById('chart1')) {
      const ctx1 = document.getElementById('chart1').getContext('2d');
      this.state.chartInstances.chart1 = new Chart(ctx1, chart1Config);
      document.getElementById('chart1Title').textContent = chart1Config.title || 'Chart 1';
    }

    // Render Chart 2
    if (chart2Config && document.getElementById('chart2')) {
      const ctx2 = document.getElementById('chart2').getContext('2d');
      this.state.chartInstances.chart2 = new Chart(ctx2, chart2Config);
      document.getElementById('chart2Title').textContent = chart2Config.title || 'Chart 2';
    }
  },

  // Get Chart 1 Configuration
  getChart1Config(data, module) {
    let config = {};

    switch (module) {
      case 'revenue':
        const dailyTrend = data.daily_trend || [];
        config = {
          title: 'Daily Revenue Trend',
          type: 'line',
          data: {
            labels: dailyTrend.map(d => d.date || d.day_name),
            datasets: [{
              label: 'Daily Revenue',
              data: dailyTrend.map(d => parseFloat(d.revenue || 0)),
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
          }
        };
        break;

      case 'bookings':
        const bookingTrend = data.daily_trend || [];
        config = {
          title: 'Daily Bookings',
          type: 'line',
          data: {
            labels: bookingTrend.map(d => d.date || d.day_name),
            datasets: [{
              label: 'Bookings',
              data: bookingTrend.map(d => parseInt(d.bookings || 0)),
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              borderWidth: 2,
              tension: 0.4
            }]
          },
          options: { responsive: true, plugins: { legend: { display: false } } }
        };
        break;

      case 'customers':
        const segments = data.customer_segments || [];
        config = {
          title: 'Customer Segments',
          type: 'doughnut',
          data: {
            labels: segments.map(s => s.segment),
            datasets: [{
              data: segments.map(s => s.customer_count),
              backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: { responsive: true }
        };
        break;

      default:
        config = {
          title: 'Data Visualization',
          type: 'bar',
          data: { labels: ['No Data'], datasets: [] },
          options: { responsive: true }
        };
    }

    return config;
  },

  // Get Chart 2 Configuration
  getChart2Config(data, module) {
    let config = {};

    switch (module) {
      case 'revenue':
        const paymentBreakdown = data.payment_breakdown || [];
        config = {
          title: 'Payment Method Breakdown',
          type: 'doughnut',
          data: {
            labels: paymentBreakdown.map(p => p.method),
            datasets: [{
              data: paymentBreakdown.map(p => parseFloat(p.percentage || 0)),
              backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: { responsive: true }
        };
        break;

      case 'bookings':
        const byType = data.by_type || [];
        config = {
          title: 'Bookings by Type',
          type: 'pie',
          data: {
            labels: byType.map(t => t.type),
            datasets: [{
              data: byType.map(t => t.count),
              backgroundColor: ['#4f46e5', '#06b6d4'],
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: { responsive: true }
        };
        break;

      default:
        config = null;
    }

    return config;
  },

  // Render Data Table
  renderDataTable(data, module) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    let columns = [];
    let rows = [];


    // Module-specific table rendering
    switch (module) {

      case 'revenue':
        // Show Daily Revenue Trend table by default
        columns = ['Date', 'Revenue', 'Transactions', 'Avg Value'];
        rows = (data.daily_trend || []).slice(0, this.state.itemsPerPage);
        thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
        rows.forEach(row => {
          tbody.innerHTML += `<tr>
            <td>${row.date}</td>
            <td>₹${this.formatNumber(row.revenue)}</td>
            <td>${row.transactions}</td>
            <td>₹${this.formatNumber(row.avg_value)}</td>
          </tr>`;
        });

        // Add Payment Method Breakdown table below if data exists
        if (Array.isArray(data.payment_breakdown) && data.payment_breakdown.length > 0) {
          tbody.innerHTML += `<tr><td colspan="4"><strong>Payment Method Breakdown</strong></td></tr>`;
          thead.innerHTML += `<tr><th>Method</th><th>Amount</th><th>Count</th><th>Percentage</th></tr>`;
          data.payment_breakdown.forEach(row => {
            tbody.innerHTML += `<tr>
              <td>${row.method}</td>
              <td>₹${this.formatNumber(row.amount)}</td>
              <td>${row.count}</td>
              <td>${row.percentage}%</td>
            </tr>`;
          });
        }
        break;

      case 'bookings':
        // Show Daily Bookings Trend table by default
        columns = ['Date', 'Bookings', 'Completed', 'Cancelled'];
        rows = (data.daily_trend || []).slice(0, this.state.itemsPerPage);
        thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
        rows.forEach(row => {
          tbody.innerHTML += `<tr>
            <td>${row.date}</td>
            <td>${row.bookings}</td>
            <td>${row.completed}</td>
            <td>${row.cancelled}</td>
          </tr>`;
        });

        // Add Bookings by Type table below if data exists
        if (Array.isArray(data.by_type) && data.by_type.length > 0) {
          tbody.innerHTML += `<tr><td colspan="4"><strong>Bookings by Type</strong></td></tr>`;
          thead.innerHTML += `<tr><th>Type</th><th>Count</th><th>Revenue</th><th>Percentage</th></tr>`;
          data.by_type.forEach(row => {
            tbody.innerHTML += `<tr>
              <td>${row.type}</td>
              <td>${row.count}</td>
              <td>₹${this.formatNumber(row.revenue)}</td>
              <td>${row.percentage}%</td>
            </tr>`;
          });
        }
        break;

      case 'customers':
        columns = ['Customer Name', 'Phone', 'Total Bookings', 'Lifetime Revenue', 'Avg Transaction', 'Last Visit'];
        rows = (data.top_customers || []).slice(0, this.state.itemsPerPage);
        thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
        rows.forEach(row => {
          tbody.innerHTML += `<tr>
            <td>${row.customer_name}</td>
            <td>${row.phone}</td>
            <td>${row.total_bookings}</td>
            <td>₹${this.formatNumber(row.lifetime_revenue)}</td>
            <td>₹${this.formatNumber(row.avg_transaction)}</td>
            <td>${row.last_visit || ''}</td>
          </tr>`;
        });
        break;

      case 'staff':
        columns = ['Staff Name', 'Bookings', 'Revenue', 'Avg Value'];
        rows = (data.staff_performance || []).slice(0, this.state.itemsPerPage);
        thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
        if (rows.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4">No staff data available</td></tr>';
        } else {
          rows.forEach(row => {
            tbody.innerHTML += `<tr>
              <td>${row.staff_name}</td>
              <td>${row.bookings}</td>
              <td>₹${this.formatNumber(row.revenue)}</td>
              <td>₹${this.formatNumber(row.avg_value)}</td>
            </tr>`;
          });
        }
        break;

      default:
        thead.innerHTML = '<tr><th>Data</th></tr>';
        tbody.innerHTML = '<tr><td>No data available</td></tr>';
    }

    // Pagination
    this.renderPagination(rows.length);
  },

  // Render Pagination
  renderPagination(totalItems) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / this.state.itemsPerPage) || 1;
    
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = `pagination-btn ${i === this.state.currentPage ? 'active' : ''}`;
      btn.addEventListener('click', () => {
        this.state.currentPage = i;
        this.loadModuleData(this.state.currentModule);
      });
      paginationDiv.appendChild(btn);
    }
  },

  // Utility: Format Number
  formatNumber(num) {
    if (!num) return '0';
    const n = parseFloat(num);
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  },

  // Show Loading Spinner
  showLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.remove('hidden');
  },

  // Hide Loading Spinner
  hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.classList.add('hidden');
  },

  // Show Toast Notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }
};

// Export for use in main app
window.BIDashboard = BIDashboard;
