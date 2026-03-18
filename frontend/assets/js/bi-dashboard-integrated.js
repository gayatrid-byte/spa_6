/**
 * ============================================
 * BI DASHBOARD - INTEGRATED VERSION
 * Premium Dark Theme & Real Data Handling
 * ============================================
 */

const BIDashboard = {
  // State Management
  state: {
    currentModule: 'revenue',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    chartInstances: {},
    currentPage: 1,
    itemsPerPage: 10,
    cachedData: null
  },

  // Initialize Dashboard
  init() {
    this.configureChartDefaults();
    this.renderHTML();
    this.attachEventListeners();
    this.loadModuleData('revenue');
  },

  // Global Chart Configuration for Dark Theme
  configureChartDefaults() {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = '#94a3b8'; // text-muted
      Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)'; // grid lines
      Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";

      Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
      Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
      Chart.defaults.plugins.tooltip.bodyColor = '#f1f5f9';
      Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
      Chart.defaults.plugins.tooltip.borderWidth = 1;
      Chart.defaults.plugins.tooltip.padding = 10;
      Chart.defaults.plugins.tooltip.cornerRadius = 8;

      Chart.defaults.plugins.legend.labels.color = '#f1f5f9';
    }
  },

  // Render Dashboard HTML
  renderHTML() {
    const container = document.getElementById('contentArea');
    if (!container) return;

    const html = `
      <div class="bi-dashboard-integrated animate-fade-in">
        <!-- Section 0: Sticky Filter Bar -->
        <div class="bi-controls">
          <div class="control-group">
            <label><i class="fas fa-calendar-alt"></i> Range:</label>
            <input type="date" id="biStartDate" value="${this.state.startDate}" class="date-input">
            <span class="text-muted">to</span>
            <input type="date" id="biEndDate" value="${this.state.endDate}" class="date-input">
          </div>
          
          <button class="btn btn-primary" id="biApplyFilter" style="background: var(--bi-primary); border: none;">
            <i class="fas fa-magic"></i> Apply Filter
          </button>

          <div class="preset-filters" style="margin-left: auto; display: inline-flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" data-range="today">Today</button>
            <button class="btn btn-outline btn-sm" data-range="week">7 Days</button>
            <button class="btn btn-outline btn-sm" data-range="month">30 Days</button>
          </div>
        </div>

        <!-- Module Tabs -->
        <div class="bi-module-nav" style="margin-bottom: 30px; border-bottom: 2px solid var(--bi-border); padding-bottom: 10px;">
          <button class="tab-btn active" data-module="revenue"><i class="fas fa-chart-line"></i> Revenue</button>
          <button class="tab-btn" data-module="bookings"><i class="fas fa-calendar-check"></i> Bookings</button>
          <button class="tab-btn" data-module="customers"><i class="fas fa-users"></i> Customers</button>
          <button class="tab-btn" data-module="staff"><i class="fas fa-user-tie"></i> Staff</button>
          <button class="tab-btn" data-module="memberships"><i class="fas fa-id-card"></i> Memberships</button>
          <button class="tab-btn" data-module="profit"><i class="fas fa-wallet"></i> Profit Analysis</button>
          <button class="tab-btn" data-module="services"><i class="fas fa-cut"></i> Services</button>
          <button class="tab-btn" data-module="forecast"><i class="fas fa-brain"></i> AI Forecast</button>
        </div>

        <!-- Section 1: KPI Grid (8 Cards) -->
        <div class="kpi-grid-8" id="kpiContainer">
          <!-- KPI cards (8) will be rendered here -->
        </div>

        <!-- Section 2: Main Revenue Trading Graph (Full Width) -->
        <div class="main-chart-card">
          <div class="chart-header">
            <h3><i class="fas fa-chart-area" style="color: var(--bi-primary);"></i> Revenue Analysis (Trading Mode)</h3>
            <div class="chart-toggles">
              <button class="btn btn-sm btn-outline active">Revenue</button>
              <button class="btn btn-sm btn-outline">Profit</button>
            </div>
          </div>
          <div class="chart-wrapper">
             <canvas id="chart1"></canvas>
             <div id="chart1NoData" class="hidden-overlay">No Trade Data Available</div>
          </div>
        </div>

        <!-- Section 3: Mini Side Charts (3 Detailing Graphs) -->
        <div class="mini-charts-row">
           <div class="mini-chart-card">
              <h4><i class="fas fa-chart-pie"></i> Revenue Split</h4>
              <div style="height: 200px; position: relative;">
                <canvas id="miniDonutChart"></canvas>
              </div>
           </div>
           <div class="mini-chart-card">
              <h4><i class="fas fa-credit-card"></i> Payment Methods</h4>
              <div style="height: 200px; position: relative;">
                <canvas id="miniBarChart"></canvas>
              </div>
           </div>
           <div class="mini-chart-card">
              <h4><i class="fas fa-bolt"></i> Daily Momentum</h4>
              <div id="sparklineContainer" style="height: 200px; display: flex; align-items: flex-end; gap: 4px; padding-bottom: 20px;">
                <!-- Sparklines injected here -->
              </div>
           </div>
        </div>

        <!-- Section 4: Advanced Detailed Table -->
        <div class="data-table-section">
          <div class="chart-header">
            <h3 id="tableTitle"><i class="fas fa-list-ul"></i> Transaction Ledger</h3>
            <div class="d-flex gap-2">
              <input type="text" id="tableSearch" placeholder="Search transactions..." class="form-control form-control-sm" style="width: 250px; background: rgba(0,0,0,0.2); border: 1px solid var(--bi-border); color: white;">
              <button class="btn btn-outline btn-sm" onclick="BIDashboard.exportData()"><i class="fas fa-download"></i> Export BI</button>
            </div>
          </div>
          <div class="table-wrapper" style="overflow-x: auto;">
            <table class="data-table">
              <thead id="tableHead"></thead>
              <tbody id="tableBody"></tbody>
            </table>
          </div>
          <div class="pagination mt-3" id="pagination"></div>
        </div>

        <!-- Section 5: Profit Analysis Block (Highlight) -->
        <div class="profit-highlight" id="profitHighlightBlock">
             <span class="label">ESTIMATED NET PROFIT</span>
             <h2 id="highlightProfit">₹0.00</h2>
             <div class="profit-grid">
                <div class="profit-item">
                   <div class="text-muted small">TOTAL REVENUE</div>
                   <div class="fw-bold" id="highlightRevenue">₹0.00</div>
                </div>
                <div class="profit-item">
                   <div class="text-muted small">TOTAL EXPENSES</div>
                   <div class="fw-bold" id="highlightExpenses" style="color: #fb7185;">₹0.00</div>
                </div>
             </div>
             <div class="mt-3">
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 10px 20px; font-size: 0.9rem;">
                  <i class="fas fa-arrow-up"></i> Performance is up 18.5% from last month
                </span>
             </div>
        </div>
      </div>

      <div id="loadingSpinner" class="loading-spinner hidden">
        <div class="spinner"></div>
        <p>Crunching enterprise data...</p>
      </div>
    `;

    container.innerHTML = html;
  },

  // Attach Event Listeners
  attachEventListeners() {
    // Module tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('.tab-btn');
        if (!target) return;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.loadModuleData(target.dataset.module);
      });
    });

    // Apply Filter Button
    const applyBtn = document.getElementById('biApplyFilter');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const start = document.getElementById('biStartDate').value;
        const end = document.getElementById('biEndDate').value;
        if (!start || !end) return this.showToast('Please select both dates', 'warning');
        this.state.startDate = start;
        this.state.endDate = end;
        this.loadModuleData(this.state.currentModule);
      });
    }

    // Preset filters
    document.querySelectorAll('[data-range]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const range = e.target.dataset.range;
        const today = new Date();
        let start = new Date();

        switch (range) {
          case 'today':
            start = today;
            break;
          case 'week':
            start.setDate(today.getDate() - 7);
            break;
          case 'month':
            start.setDate(today.getDate() - 30);
            break;
        }

        this.state.startDate = start.toISOString().split('T')[0];
        this.state.endDate = today.toISOString().split('T')[0];

        // Update inputs
        document.getElementById('biStartDate').value = this.state.startDate;
        document.getElementById('biEndDate').value = this.state.endDate;

        // Reload
        this.loadModuleData(this.state.currentModule);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.data-table tbody tr');
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }
  },

  // Load Module Data from API
  async loadModuleData(module) {
    this.state.currentModule = module;
    this.state.currentPage = 1; // Reset pagination
    this.showLoadingSpinner();

    try {
      const token = localStorage.getItem('token');
      const url = `/api/bi/${module}?startDate=${this.state.startDate}&endDate=${this.state.endDate}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      this.state.cachedData = data;

      this.renderKPICards(data, module);
      this.renderCharts(data, module);
      this.renderDataTable(data, module);

      // Update Profit Highlight Block
      if (data.summary) {
        if (document.getElementById('highlightProfit')) {
          document.getElementById('highlightProfit').textContent = `₹${this.formatNumber(data.summary.net_profit || 0)}`;
          document.getElementById('highlightRevenue').textContent = `₹${this.formatNumber(data.summary.total_revenue || 0)}`;
          document.getElementById('highlightExpenses').textContent = `₹${this.formatNumber(data.summary.total_expenses || 0)}`;
        }
      }

    } catch (error) {
      console.error('Fetch error:', error);
      this.showToast('Failed to load dashboard data', 'error');
    } finally {
      this.hideLoadingSpinner();
    }
  },

  // Render KPI Cards
  renderKPICards(data, module) {
    const container = document.getElementById('kpiContainer');
    if (!container) return;
    container.innerHTML = '';

    const summary = data.summary || {};
    let kpis = [];

    switch (module) {
      case 'revenue':
        kpis = [
          { label: 'Total Revenue', value: summary.total_revenue, unit: '₹', icon: 'fa-funnel-dollar' },
          { label: 'Customer Rev', value: summary.customer_revenue, unit: '₹', icon: 'fa-user-tag' },
          { label: 'Membership Rev', value: summary.membership_revenue, unit: '₹', icon: 'fa-id-card' },
          { label: 'Net Profit', value: summary.net_profit, unit: '₹', icon: 'fa-wallet' },
          { label: 'Total Invoices', value: summary.transaction_count, unit: '', icon: 'fa-receipt' },
          { label: 'Avg Invoice', value: summary.avg_invoice, unit: '₹', icon: 'fa-calculator' },
          { label: 'Tax Collected', value: summary.tax_collected, unit: '₹', icon: 'fa-hand-holding-usd' },
          { label: 'Discount Given', value: summary.discount_given, unit: '₹', icon: 'fa-percent' }
        ];
        break;
      case 'bookings':
        kpis = [
          { label: 'Booked', value: summary.total_bookings, unit: '', icon: 'fa-calendar' },
          { label: 'Completed', value: summary.completed_bookings, unit: '', icon: 'fa-check-circle' },
          { label: 'Cancelled', value: summary.cancelled_bookings, unit: '', icon: 'fa-times-circle' },
          { label: 'Completion Rate', value: summary.completion_rate, unit: '%', icon: 'fa-percentage' },
          { label: 'Cancellation %', value: summary.cancellation_rate, unit: '%', icon: 'fa-ban' },
          { label: 'Peak Hour', value: summary.peak_booking_hour, unit: '', icon: 'fa-clock', isText: true }
        ];
        break;
      case 'customers':
        kpis = [
          { label: 'Total Customers', value: summary.total_customers, unit: '', icon: 'fa-users' },
          { label: 'New Customers', value: summary.new_customers, unit: '', icon: 'fa-user-plus' },
          { label: 'Active', value: summary.active_customers, unit: '', icon: 'fa-user-check' },
          { label: 'Repeat Ratio %', value: summary.repeat_customer_ratio, unit: '%', icon: 'fa-redo' },
          { label: 'Retention %', value: summary.retention_rate, unit: '%', icon: 'fa-hand-holding-heart' },
          { label: 'Avg LTV', value: summary.avg_lifetime_value, unit: '₹', icon: 'fa-chart-pie' }
        ];
        break;
      case 'staff':
        kpis = [
          { label: 'Total Staff', value: (data.staff_performance || []).length, unit: '', icon: 'fa-users' },
          { label: 'Active Staff', value: (data.staff_performance || []).filter(s => s.total_bookings > 0).length, unit: '', icon: 'fa-user-tie' },
          { label: 'Total Revenue', value: data.staff_performance?.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0) || 0, unit: '₹', icon: 'fa-coins' },
          { label: 'Avg per Staff', value: (data.staff_performance?.length ? (data.staff_performance.reduce((sum, s) => sum + parseFloat(s.total_revenue), 0) / data.staff_performance.length) : 0), unit: '₹', icon: 'fa-bar-chart' },
          { label: 'Top Performer', value: (data.staff_performance?.[0]?.staff_name || 'N/A'), unit: '', icon: 'fa-star', isText: true }
        ];
        break;
      case 'memberships':
        kpis = [
          { label: 'Active Memberships', value: summary.active_memberships, unit: '', icon: 'fa-id-card' },
          { label: 'Expiring Soon', value: summary.expiring_soon, unit: '', icon: 'fa-exclamation-triangle' },
          { label: 'New This Period', value: summary.new_memberships, unit: '', icon: 'fa-plus-circle' },
          { label: 'Revenue', value: summary.membership_revenue, unit: '₹', icon: 'fa-wallet' },
          { label: 'Avg Value', value: summary.avg_membership_value, unit: '₹', icon: 'fa-calculator' }
        ];
        break;
      case 'profit':
        kpis = [
          { label: 'Total Revenue', value: summary.total_revenue, unit: '₹', icon: 'fa-chart-line' },
          { label: 'Total Expenses', value: summary.total_expenses, unit: '₹', icon: 'fa-money-bill-wave' },
          { label: 'Gross Profit', value: summary.net_profit, unit: '₹', icon: 'fa-chart-bar' },
          { label: 'Profit Margin %', value: summary.profit_margin_pct, unit: '%', icon: 'fa-percentage' }
        ];
        break;
      case 'services':
        kpis = [
          { label: 'Total Services', value: summary.total_services_count, unit: '', icon: 'fa-cut' },
          { label: 'Top Selling', value: summary.top_selling, unit: '', icon: 'fa-trophy', isText: true },
          { label: 'Most Profitable', value: summary.most_profitable, unit: '', icon: 'fa-crown', isText: true },
          { label: 'Avg Price', value: summary.avg_service_price, unit: '₹', icon: 'fa-tag' }
        ];
        break;
      case 'forecast':
        const monthlyRevenue = (data.monthly_trend?.[data.monthly_trend.length - 1]?.revenue || 0);
        const nextMonthForecast = (data.revenue_forecast?.[29]?.predicted_revenue || 0);
        const growthRate = data.revenue_forecast?.[0]?.growth_rate_pct || 0;
        kpis = [
          { label: 'Next Month Forecast', value: nextMonthForecast, unit: '₹', icon: 'fa-chart-area' },
          { label: 'Expected Bookings', value: data.monthly_trend?.[data.monthly_trend.length - 1]?.bookings || 0, unit: '', icon: 'fa-calendar-check' },
          { label: 'Growth Rate %', value: growthRate, unit: '%', icon: 'fa-arrow-up' }
        ];
        break;
      default:
        // Fallback or other modules
        kpis = [
          { label: 'Metric 1', value: 0 },
          { label: 'Metric 2', value: 0 },
          { label: 'Metric 3', value: 0 },
          { label: 'Metric 4', value: 0 }
        ];
    }

    kpis.forEach(kpi => {
      const card = document.createElement('div');
      card.className = 'kpi-mini-card animate-up';
      const formattedValue = kpi.isText ? kpi.value : this.formatNumber(kpi.value);
      card.innerHTML = `
        <div class="kpi-label"><i class="fas ${kpi.icon || 'fa-chart-bar'}"></i> ${kpi.label}</div>
        <div class="kpi-value">${kpi.unit === '₹' ? '₹' : ''}${formattedValue}${kpi.unit === '%' ? '%' : ''}</div>
        <div class="kpi-trend up"><i class="fas fa-caret-up"></i> 12% vs last month</div>
      `;
      container.appendChild(card);
    });
  },

  // Render Charts with Dark Theme Config
  renderCharts(data, module) {
    // Destroy existing charts
    Object.values(this.state.chartInstances).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.state.chartInstances = {};

    // 1. Main Full Width Chart
    const chart1Config = this.getChart1Config(data, module);
    this.renderSingleChart('chart1', null, 'chart1NoData', chart1Config);

    // 2. Mini Donut Revenue Split
    this.renderMiniDonut(data, module);

    // 3. Mini Payment Methods
    this.renderMiniBar(data, module);

    // 4. Sparkline Daily Momentum
    this.renderSparklines(data, module);
  },

  renderMiniDonut(data, module) {
    const canvas = document.getElementById('miniDonutChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let labels = ['Customer', 'Membership'];
    let values = [
      parseFloat(data.summary?.customer_revenue || 0),
      parseFloat(data.summary?.membership_revenue || 0)
    ];

    if (values[0] === 0 && values[1] === 0) return;

    this.state.chartInstances['miniDonut'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: ['#7c3aed', '#10b981'],
          borderColor: '#1e293b',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, color: '#94a3b8' } } }
      }
    });
  },

  renderMiniBar(data, module) {
    const canvas = document.getElementById('miniBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const breakdown = data.payment_breakdown || [];
    if (breakdown.length === 0) return;

    this.state.chartInstances['miniBar'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: breakdown.map(b => b.payment_method.toUpperCase()),
        datasets: [{
          label: 'Amount (₹)',
          data: breakdown.map(b => parseFloat(b.amount)),
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } }
        }
      }
    });
  },

  renderSparklines(data, module) {
    const container = document.getElementById('sparklineContainer');
    if (!container) return;
    container.innerHTML = '';

    const trend = data.daily_trend || [];
    if (trend.length === 0) return;

    const maxVal = Math.max(...trend.map(t => parseFloat(t.total_revenue || 0))) || 1;

    trend.forEach(t => {
      const height = (parseFloat(t.total_revenue || 0) / maxVal) * 100;
      const bar = document.createElement('div');
      bar.style.flex = '1';
      bar.style.height = `${Math.max(height, 5)}%`;
      bar.style.background = 'var(--bi-primary)';
      bar.style.borderRadius = '2px';
      bar.style.opacity = '0.7';
      bar.title = `₹${this.formatNumber(t.total_revenue)} on ${t.date}`;
      container.appendChild(bar);
    });
  },

  // Get Chart 1 Configuration
  getChart1Config(data, module) {
    if (module !== 'revenue') return this.getLegacyChartConfig(data, module);

    const trend = data.daily_trend || [];
    const labels = trend.map(t => new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));

    // Create Gradients
    const canvas = document.getElementById('chart1');
    const ctx = canvas.getContext('2d');
    const grad1 = ctx.createLinearGradient(0, 0, 0, 400);
    grad1.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    grad1.addColorStop(1, 'rgba(124, 58, 237, 0)');

    const grad2 = ctx.createLinearGradient(0, 0, 0, 400);
    grad2.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    grad2.addColorStop(1, 'rgba(16, 185, 129, 0)');

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Revenue',
            data: trend.map(t => parseFloat(t.total_revenue)),
            borderColor: '#7c3aed',
            backgroundColor: grad1,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3
          },
          {
            label: 'Customer Rev',
            data: trend.map(t => parseFloat(t.customer_revenue)),
            borderColor: '#3b82f6',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0
          },
          {
            label: 'Membership Rev',
            data: trend.map(t => parseFloat(t.membership_revenue)),
            borderColor: '#10b981',
            backgroundColor: grad2,
            fill: false,
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#f1f5f9', font: { weight: '600' } } },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#f1f5f9',
            padding: 12,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', callback: value => '₹' + this.formatNumber(value) }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          }
        }
      }
    };
  },

  renderSingleChart(canvasId, titleId, noDataId, config) {
    const canvas = document.getElementById(canvasId);
    const noDataEl = document.getElementById(noDataId);
    if (!canvas) return;

    if (config && config.data && config.data.datasets.length > 0 && config.data.labels.length > 0) {
      const hasData = config.data.datasets.some(ds => ds.data.some(v => v !== null && v !== 0));
      if (hasData) {
        canvas.style.display = 'block';
        if (noDataEl) noDataEl.style.display = 'none';
        const ctx = canvas.getContext('2d');
        this.state.chartInstances[canvasId] = new Chart(ctx, config);
      } else {
        canvas.style.display = 'none';
        if (noDataEl) noDataEl.style.display = 'block';
      }
    } else {
      canvas.style.display = 'none';
      if (noDataEl) noDataEl.style.display = 'block';
    }
  },

  getLegacyChartConfig(data, module) {
    let config = null;
    const colorPrimary = '#7c3aed';
    const colorSecondary = '#06b6d4';

    switch (module) {
      case 'bookings':
        const bookingTrend = data.daily_trend || [];
        config = {
          type: 'line',
          data: {
            labels: bookingTrend.map(d => {
              const date = new Date(d.date);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets: [{
              label: 'Bookings',
              data: bookingTrend.map(d => parseInt(d.bookings || 0)),
              borderColor: colorSecondary,
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;

      case 'customers':
        const topCust = (data.top_customers || []).slice(0, 10);
        config = {
          type: 'bar',
          data: {
            labels: topCust.map(c => c.name),
            datasets: [{
              label: 'Total Spent',
              data: topCust.map(c => parseFloat(c.total_spent)),
              backgroundColor: colorPrimary,
              borderRadius: 4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;

      case 'profit':
        const breakdown = data.expense_breakdown || [];
        config = {
          type: 'doughnut',
          data: {
            labels: breakdown.map(b => b.category),
            datasets: [{
              data: breakdown.map(b => parseFloat(b.amount)),
              backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#7c3aed'],
              borderColor: '#1e293b',
              borderWidth: 2
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        };
        break;

      case 'staff':
        const staff = data.staff_performance || [];
        config = {
          type: 'bar',
          data: {
            labels: staff.map(s => s.staff_name),
            datasets: [{
              label: 'Revenue',
              data: staff.map(s => parseFloat(s.total_revenue || 0)),
              backgroundColor: colorSecondary,
              borderRadius: 4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;

      case 'services':
        const services = (data.performance || []).slice(0, 10);
        config = {
          type: 'bar',
          data: {
            labels: services.map(s => s.name),
            datasets: [{
              label: 'Revenue',
              data: services.map(s => parseFloat(s.total_revenue)),
              backgroundColor: colorPrimary,
              borderRadius: 4
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;

      case 'memberships':
        const tiers = data.by_tier || [];
        config = {
          type: 'doughnut',
          data: {
            labels: tiers.map(t => t.plan_name),
            datasets: [{
              data: tiers.map(t => t.count),
              backgroundColor: ['#7c3aed', '#06b6d4', '#10b981'],
              borderColor: '#1e293b',
              borderWidth: 2
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;

      case 'forecast':
        const hist = data.historical_revenue || [];
        const fore = data.revenue_forecast || [];
        config = {
          type: 'line',
          data: {
            labels: [...hist.map(h => h.date), ...fore.map(f => f.date)],
            datasets: [
              { label: 'History', data: hist.map(h => parseFloat(h.revenue)), borderColor: '#94a3b8' },
              { label: 'Forecast', data: [...new Array(hist.length).fill(null), ...fore.map(f => parseFloat(f.predicted_revenue))], borderColor: '#10b981', borderDash: [5, 5] }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false }
        };
        break;
    }
    return config;
  },

  // Get Chart 2 Configuration
  getChart2Config(data, module) {
    let config = null;

    switch (module) {
      case 'revenue':
        const payment = data.payment_breakdown || [];
        config = {
          title: 'Payment Methods',
          type: 'doughnut',
          data: {
            labels: payment.map(p => p.payment_method),
            datasets: [{
              data: payment.map(p => parseFloat(p.amount)),
              backgroundColor: ['#10b981', '#f59e0b', '#3b82f6'],
              borderColor: '#1e293b',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { position: 'right' } }
          }
        };
        break;

      case 'bookings':
        const byType = data.by_type || [];
        config = {
          title: 'Bookings by Type',
          type: 'pie', // Pie for variety
          data: {
            labels: byType.map(t => t.booking_type),
            datasets: [{
              data: byType.map(t => t.count),
              backgroundColor: ['#7c3aed', '#ec4899', '#f59e0b'],
              borderColor: '#1e293b',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
          }
        };
        break;

      case 'staff':
        const staff = (data.staff_performance || []).slice(0, 5);
        config = {
          title: 'Top 5 Staff by Bookings',
          type: 'bar',
          data: {
            labels: staff.map(s => s.staff_name),
            datasets: [{
              label: 'Bookings',
              data: staff.map(s => s.total_bookings),
              backgroundColor: '#f59e0b',
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y', // Horizontal bar
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { grid: { display: true, color: 'rgba(255,255,255,0.05)' } } }
          }
        };
        break;

      case 'services':
        // Top categories
        // We need to aggregate services by category since API returns services
        const servs = data.performance || [];
        const catMap = {};
        servs.forEach(s => {
          const cat = s.category_name || 'Uncategorized';
          catMap[cat] = (catMap[cat] || 0) + parseFloat(s.total_revenue);
        });

        config = {
          title: 'Revenue by Category',
          type: 'doughnut',
          data: {
            labels: Object.keys(catMap),
            datasets: [{
              data: Object.values(catMap),
              backgroundColor: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981'],
              borderColor: '#1e293b',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'right' } }
          }
        };
        break;
      default:
        config = { type: 'pie', data: { labels: [], datasets: [] }, options: { responsive: true } };
    }

    return config;
  },

  // Render Data Table
  renderDataTable(data, module) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    let columns = [];
    let rows = [];

    // Table Mapping
    switch (module) {
      case 'revenue':
        columns = ['Date', 'Total Rev', 'Cust Rev', 'Mem Rev'];
        rows = (data.daily_trend || []).map(r => ({
          col1: new Date(r.date).toLocaleDateString(),
          col2: this.formatNumber(r.total_revenue),
          col3: this.formatNumber(r.customer_revenue),
          col4: this.formatNumber(r.membership_revenue)
        }));
        break;

      case 'bookings':
        columns = ['Date', 'Bookings', 'Completed', 'Cancelled'];
        rows = (data.daily_trend || []).map(r => ({
          col1: new Date(r.date).toLocaleDateString(),
          col2: r.bookings,
          col3: r.completed,
          col4: r.cancelled
        }));
        break;

      case 'customers':
        columns = ['Name', 'Phone', 'Bookings', 'Total Spent (₹)'];
        rows = (data.top_customers || []).map(c => ({
          col1: c.name,
          col2: c.phone || 'N/A',
          col3: c.booking_count,
          col4: this.formatNumber(c.total_spent)
        }));
        break;

      case 'staff':
        columns = ['Staff Name', 'Bookings', 'Revenue (₹)', 'Avg Val (₹)', 'Hours', 'Rev/Hour'];
        rows = (data.staff_performance || []).map(s => ({
          col1: s.staff_name,
          col2: s.total_bookings,
          col3: this.formatNumber(s.total_revenue),
          col4: this.formatNumber(s.avg_booking_value),
          col5: s.hours_worked,
          col6: this.formatNumber(s.revenue_per_hour)
        }));
        break;

      case 'profit':
        columns = ['Expense Category', 'Amount (₹)'];
        rows = (data.expense_breakdown || []).map(e => ({
          col1: e.category,
          col2: this.formatNumber(e.amount)
        }));
        break;

      case 'services':
        columns = ['Service', 'Category', 'Bookings', 'Revenue (₹)', 'Avg Price'];
        rows = (data.performance || []).map(s => ({
          col1: s.name,
          col2: s.category_name,
          col3: s.booking_count,
          col4: this.formatNumber(s.total_revenue),
          col5: this.formatNumber(s.avg_price)
        }));
        break;

      case 'memberships':
        columns = ['Customer', 'Plan', 'Start Date', 'End Date', 'Days Left', 'Wallet Balance (₹)'];
        rows = (data.member_details || []).map(m => ({
          col1: m.customer_name,
          col2: m.plan_name,
          col3: new Date(m.start_date).toLocaleDateString(),
          col4: new Date(m.end_date).toLocaleDateString(),
          col5: m.days_left >= 0 ? m.days_left : 'Expired',
          col6: this.formatNumber(m.wallet_balance)
        }));
        break;

      case 'forecast':
        columns = ['Date', 'Predicted Revenue (₹)', 'Growth (%)'];
        rows = (data.revenue_forecast || []).map(f => ({
          col1: new Date(f.date).toLocaleDateString(),
          col2: this.formatNumber(f.predicted_revenue),
          col3: f.growth_rate_pct
        }));
        break;
      default:
        columns = ['Data', 'Value'];
        rows = [{ col1: 'No detailed table', col2: 'for this module' }];
    }

    // Render Headers
    if (columns.length > 0) {
      thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
    }

    // Frontend Pagination logic
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const paginatedRows = rows.slice(start, start + this.state.itemsPerPage);

    // Render Body
    if (paginatedRows.length > 0) {
      paginatedRows.forEach(row => {
        const tds = Object.values(row).map(val => `<td>${val}</td>`).join('');
        tbody.innerHTML += `<tr>${tds}</tr>`;
      });
    } else if (rows.length > 0) {
      tbody.innerHTML = `<tr><td colspan="${columns.length || 1}" style="text-align:center; padding: 20px;">No more data on this page</td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="${columns.length || 1}" style="text-align:center; padding: 20px;">No data available for this period</td></tr>`;
    }

    this.renderPagination(rows.length);
  },

  // Render Table Pagination
  renderPagination(totalRows) {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(totalRows / this.state.itemsPerPage);
    if (totalPages <= 1) return;

    const nav = document.createElement('nav');
    nav.className = 'd-flex gap-2 align-items-center justify-content-center w-100';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${this.state.currentPage === i ? 'btn-primary' : 'btn-outline'}`;
      btn.textContent = i;
      btn.onclick = () => {
        this.state.currentPage = i;
        this.renderDataTable(this.state.cachedData, this.state.currentModule);
      };
      nav.appendChild(btn);
    }
    container.appendChild(nav);
  },

  // Export Data to CSV, Excel, or PDF
  exportData() {
    const module = this.state.currentModule;
    const startDate = this.state.startDate;
    const endDate = this.state.endDate;
    const data = this.state.cachedData;

    // Generate filename with date range
    const fileName = `${module}_${startDate.replace(/-/g, '')}_to_${endDate.replace(/-/g, '')}`;

    // Create export menu
    const exportMenu = document.createElement('div');
    exportMenu.style.cssText = `
      position: fixed;
      top: 200px;
      right: 50px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      padding: 10px;
      z-index: 10000;
      min-width: 150px;
    `;

    const formats = ['CSV', 'Excel', 'PDF'];
    formats.forEach(format => {
      const btn = document.createElement('button');
      btn.textContent = `Export ${format}`;
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        background: #7c3aed;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      btn.onmouseover = () => btn.style.background = '#6d28d9';
      btn.onmouseout = () => btn.style.background = '#7c3aed';
      btn.onclick = () => {
        exportMenu.remove();
        this.performExport(format, fileName, data, module);
      };
      exportMenu.appendChild(btn);
    });

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin: 5px 0;
      background: #64748b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    closeBtn.onclick = () => exportMenu.remove();
    exportMenu.appendChild(closeBtn);

    document.body.appendChild(exportMenu);
  },

  // Perform the actual export
  performExport(format, fileName, data, module) {
    this.showToast(`Preparing ${format} export...`, 'info');

    try {
      if (format === 'CSV') {
        this.exportToCSV(fileName, data, module);
      } else if (format === 'Excel') {
        this.exportToExcel(fileName, data, module);
      } else if (format === 'PDF') {
        this.exportToPDF(fileName, data, module);
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Error during export', 'error');
    }
  },

  // Export to CSV
  exportToCSV(fileName, data, module) {
    const tbody = document.getElementById('tableBody');
    const thead = document.getElementById('tableHead');

    if (!tbody || !thead) {
      this.showToast('No table data to export', 'error');
      return;
    }

    // Get headers
    const headers = [];
    thead.querySelectorAll('th').forEach(th => headers.push(th.textContent));

    // Get rows
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td').forEach(td => row.push(td.textContent));
      if (row.length > 0) rows.push(row);
    });

    // Add summary if available
    let csvContent = [];
    csvContent.push(`# Report: ${module}`);
    csvContent.push(`# Generated: ${new Date().toLocaleString()}`);
    csvContent.push(`# Date Range: ${this.state.startDate} to ${this.state.endDate}`);
    csvContent.push('');
    csvContent.push('## Summary KPIs');
    const summary = data.summary || {};
    Object.entries(summary).forEach(([key, value]) => {
      csvContent.push(`${key},${value}`);
    });
    csvContent.push('');
    csvContent.push('## Detailed Data');
    csvContent.push(headers.join(','));
    rows.forEach(row => csvContent.push(row.join(',')));

    // Create blob and download
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
    this.showToast('CSV exported successfully', 'success');
  },

  // Export to Excel
  exportToExcel(fileName, data, module) {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['Report', module],
        ['Generated', new Date().toLocaleString()],
        ['Date Range', `${this.state.startDate} to ${this.state.endDate}`],
        [''],
        ['KPI Summary']
      ];
      const summary = data.summary || {};
      Object.entries(summary).forEach(([key, value]) => {
        summaryData.push([key, value]);
      });
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Sheet 2: Raw Data (from table)
      const tbody = document.getElementById('tableBody');
      const thead = document.getElementById('tableHead');
      const headers = [];
      thead.querySelectorAll('th').forEach(th => headers.push(th.textContent));

      const rowsData = [headers];
      tbody.querySelectorAll('tr').forEach(tr => {
        const row = [];
        tr.querySelectorAll('td').forEach(td => row.push(td.textContent));
        if (row.length > 0) rowsData.push(row);
      });
      const dataSheet = XLSX.utils.aoa_to_sheet(rowsData);
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

      // Sheet 3: Pivot Table (aggregated by first column)
      if (rowsData.length > 1) {
        const pivotData = {};
        rowsData.slice(1).forEach(row => {
          const key = row[0];
          if (!pivotData[key]) {
            pivotData[key] = { count: 0 };
          }
          pivotData[key].count += 1;
        });
        const pivotSheet = XLSX.utils.aoa_to_sheet([
          ['Item', 'Count'],
          ...Object.entries(pivotData).map(([key, val]) => [key, val.count])
        ]);
        XLSX.utils.book_append_sheet(workbook, pivotSheet, 'Pivot');
      }

      XLSX.writeFile(workbook, `${fileName}.xlsx`);
      this.showToast('Excel exported successfully', 'success');
    } catch (error) {
      console.error('Excel export error:', error);
      this.showToast('Error exporting Excel', 'error');
    }
  },

  // Export to PDF
  exportToPDF(fileName, data, module) {
    try {
      const element = document.querySelector('.bi-dashboard-integrated');
      if (!element) {
        this.showToast('No dashboard content to export', 'error');
        return;
      }

      const opt = {
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
      this.showToast('PDF exported successfully', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      this.showToast('Error exporting PDF', 'error');
    }
  },

  // Utility: Format Number
  formatNumber(num) {
    if (num === undefined || num === null) return '0.00';
    const n = parseFloat(num);
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    if (!container) {
      const div = document.createElement('div');
      div.id = 'toastContainer';
      div.className = 'toast-container';
      document.body.appendChild(div);
    }
    window.appUtils?.showToast ? window.appUtils.showToast(message, type) : console.log(message);
  }
};

// Export for use in main app
window.BIDashboard = BIDashboard;
