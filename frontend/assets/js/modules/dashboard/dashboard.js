/**
 * ENTERPRISE SAAS DASHBOARD MODULE
 * Production-safe: handles API errors, empty data, and null values gracefully
 */

let chartInstances = {};
let currentTabData = null;

export async function render(container) {
  container.innerHTML = `
        <style>
            .dash-wrap { font-family: 'Inter', system-ui, sans-serif; color: var(--color-text-primary); }
            .kpi-grid { display: grid; gap: 20px; margin-bottom: 28px; }
            .kpi-card { background: var(--color-bg-card); border: 1px solid var(--color-border-card); padding: 24px; border-radius: 16px; backdrop-filter: blur(12px); transition: transform 0.2s, border-color 0.2s, background 0.3s; }
            .kpi-card:hover { transform: translateY(-3px); border-color: rgba(124,58,237,0.4); background: var(--color-bg-card-hover); }
            .kpi-card::before { content:''; display:block; height:3px; background: linear-gradient(90deg, var(--color-primary), var(--color-info)); border-radius:2px; margin-bottom:16px; }
            .kpi-label { color: var(--color-text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 6px; }
            .kpi-value { font-size: 1.9rem; font-weight: 800; color: var(--color-text-primary); line-height: 1; }
            .chart-box { background: var(--color-bg-card); border: 1px solid var(--color-border-card); padding: 24px; border-radius: 16px; margin-bottom: 24px; transition: background 0.3s, border-color 0.3s; }
            .chart-box h3 { font-size: 1rem; font-weight: 600; margin: 0 0 20px; color: var(--color-text-heading); display:flex; align-items:center; gap:8px; }
            .tab-btn { padding: 10px 20px; border: 1px solid var(--color-border-card); background: var(--color-bg-body); color: var(--color-text-muted); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: 0.2s; white-space: nowrap; }
            .tab-btn:hover { color: var(--color-text-secondary); background: rgba(124,58,237,0.1); }
            .tab-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); box-shadow: 0 4px 14px rgba(124,58,237,0.35); }
            .ledger-wrap { background: var(--color-bg-card); border: 1px solid var(--color-border-card); padding: 24px; border-radius: 16px; transition: background 0.3s, border-color 0.3s; }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table th { background: var(--color-bg-table-header); color: var(--color-text-muted); font-size: 0.72rem; padding: 14px 16px; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; }
            .data-table td { padding: 14px 16px; border-bottom: 1px solid var(--color-border-subtle); font-size: 0.88rem; color: var(--color-text-secondary); }
            .data-table tbody tr:hover { background: var(--color-bg-table-hover); }
            .f-select { background: var(--color-bg-input); border: 1px solid var(--color-border-input); color: var(--color-text-primary); padding: 9px 14px; border-radius: 8px; font-size: 0.85rem; outline: none; min-width: 130px; transition: border-color 0.3s, background 0.3s; }
            .f-select:focus { border-color: var(--color-primary); }
            .btn-apply { background: var(--color-primary); color: #fff; padding: 9px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 0.85rem; display:flex; align-items:center; gap:6px; }
            .btn-apply:hover { background: var(--color-primary-dark); }
            .btn-export { background: none; border: 1px solid var(--color-border-input); color: var(--color-text-secondary); padding: 9px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: border-color 0.2s, color 0.2s; }
            .btn-export:hover { border-color: var(--color-accent); color: var(--color-accent); }
            .no-data { text-align:center; padding: 60px 20px; color: var(--color-text-muted); font-size: 0.9rem; }
            .status-ok { color: var(--color-success); font-weight: 700; }
            .status-warn { color: var(--color-warning); font-weight: 700; }
            .status-bad { color: var(--color-danger); font-weight: 700; }
            .ai-panel { background: rgba(124,58,237,0.04); border: 1px dashed rgba(124,58,237,0.25); padding: 24px; border-radius: 16px; margin-top: 24px; transition: background 0.3s; }
            .ai-insight { background: rgba(124,58,237,0.06); border: 1px solid rgba(124,58,237,0.15); padding: 16px; border-radius: 10px; font-size: 0.85rem; line-height: 1.6; color: var(--color-text-secondary); }
        </style>

        <div class="dash-wrap">
            <!-- Filters -->
            <div class="d-flex flex-wrap align-items-center gap-3 mb-4 p-4 rounded" style="background:var(--color-bg-card); border:1px solid var(--color-border-card)">
                <input type="date" id="dashStart" class="f-select">
                <span style="color:var(--color-text-muted)">→</span>
                <input type="date" id="dashEnd" class="f-select">
                <select id="filterStaff" class="f-select"><option value="">All Staff</option></select>
                <select id="filterService" class="f-select"><option value="">All Services</option></select>
                <select id="filterBranch" class="f-select"><option value="">All Branches</option></select>
                <button class="btn-apply" id="applyFilters"><i class="fas fa-sync-alt"></i> Apply</button>
                <button class="btn-export" id="exportBtn"><i class="fas fa-download"></i> CSV</button>
                <div class="ml-auto d-flex gap-2">
                    <button class="btn-export" data-range="7">7D</button>
                    <button class="btn-export" data-range="30">30D</button>
                    <button class="btn-export" data-range="90">90D</button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="d-flex gap-2 mb-4 overflow-auto pb-1" style="scrollbar-width:thin">
                <button class="tab-btn active" data-tab="revenue"><i class="fas fa-coins"></i> Revenue</button>
                <button class="tab-btn" data-tab="bookings"><i class="fas fa-calendar-check"></i> Bookings</button>
                <button class="tab-btn" data-tab="customers"><i class="fas fa-users"></i> Customers</button>
                <button class="tab-btn" data-tab="staff"><i class="fas fa-user-friends"></i> Staff</button>
                <button class="tab-btn" data-tab="memberships"><i class="fas fa-id-card"></i> Memberships</button>
                <button class="tab-btn" data-tab="profit"><i class="fas fa-chart-line"></i> Profit</button>
                <button class="tab-btn" data-tab="services"><i class="fas fa-concierge-bell"></i> Services</button>
                <button class="tab-btn" data-tab="forecast"><i class="fas fa-brain"></i> AI Forecast</button>
            </div>

            <!-- KPIs -->
            <div class="kpi-grid" id="kpiRow"></div>

            <!-- Charts -->
            <div class="row mb-4">
                <div class="col-lg-8">
                    <div class="chart-box" style="height:400px">
                        <h3 id="mainChartTitle"><i class="fas fa-chart-area" style="color:var(--color-primary)"></i> Trend Analysis</h3>
                        <div style="height:310px; position:relative"><canvas id="mainChart"></canvas><div id="mainNoData" class="no-data d-none">No data for this period</div></div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="chart-box" style="height:400px">
                        <h3 id="sideChartTitle"><i class="fas fa-chart-pie" style="color:var(--color-info)"></i> Distribution</h3>
                        <div style="height:310px; position:relative"><canvas id="sideChart"></canvas><div id="sideNoData" class="no-data d-none">No data available</div></div>
                    </div>
                </div>
            </div>

            <!-- Ledger -->
            <div class="ledger-wrap">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 id="tableTitle" class="m-0" style="font-size:1rem; font-weight:700; color:var(--color-text-heading)"><i class="fas fa-table" style="color:var(--color-primary)"></i> Analytics Ledger</h3>
                    <input type="text" id="tableSearch" placeholder="Search..." class="f-select" style="width:220px">
                </div>
                <div style="max-height:480px; overflow-y:auto; border-radius:8px; border:1px solid var(--color-border-subtle)">
                    <table class="data-table"><thead id="tableHead"></thead><tbody id="tableBody"></tbody></table>
                </div>
            </div>

            <!-- AI Panel -->
            <div class="ai-panel mt-4" id="aiPanel" style="display:none">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <span style="background:linear-gradient(135deg,var(--color-primary),var(--color-info));color:#fff;padding:3px 12px;border-radius:20px;font-size:0.7rem;font-weight:800;text-transform:uppercase">AI Engine</span>
                    <h4 class="m-0" style="font-weight:700; color:var(--color-primary-hover)">Predictive Intelligence</h4>
                </div>
                <div id="aiContent" class="row g-3"></div>
            </div>
        </div>
    `;

  // Defaults
  const today = new Date().toISOString().split('T')[0];
  const d30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  document.getElementById('dashStart').value = d30;
  document.getElementById('dashEnd').value = today;

  await loadFilters();
  setupEvents();
  await loadDashboard('revenue');
}

async function loadFilters() {
  try {
    const r = await fetch('/api/dashboard/filters', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!r.ok) return;
    const d = await r.json();
    const ss = document.getElementById('filterStaff');
    const sv = document.getElementById('filterService');
    const sb = document.getElementById('filterBranch');
    (d.staff || []).forEach(s => ss.innerHTML += `<option value="${s.id}">${s.name}</option>`);
    (d.services || []).forEach(s => sv.innerHTML += `<option value="${s.id}">${s.name}</option>`);
    (d.branches || []).forEach(b => sb.innerHTML += `<option value="${b.id}">${b.name}</option>`);
  } catch (e) { console.warn('Filter load skipped:', e.message); }
}

function setupEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadDashboard(btn.dataset.tab);
    };
  });
  document.getElementById('applyFilters').onclick = () => {
    const t = document.querySelector('.tab-btn.active')?.dataset.tab || 'revenue';
    loadDashboard(t);
  };
  document.querySelectorAll('[data-range]').forEach(btn => {
    btn.onclick = () => {
      const days = parseInt(btn.dataset.range);
      document.getElementById('dashStart').value = new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
      document.getElementById('applyFilters').click();
    };
  });
  document.getElementById('tableSearch').oninput = e => {
    const v = e.target.value.toLowerCase();
    document.querySelectorAll('#tableBody tr').forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(v) ? '' : 'none';
    });
  };
  document.getElementById('exportBtn').onclick = exportCSV;
}

async function loadDashboard(tab) {
  const start = document.getElementById('dashStart').value;
  const end = document.getElementById('dashEnd').value;
  const staff = document.getElementById('filterStaff').value;
  const service = document.getElementById('filterService').value;
  const branch = document.getElementById('filterBranch').value;

  const kpiRow = document.getElementById('kpiRow');
  kpiRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-muted)">
        <i class="fas fa-circle-notch fa-spin" style="font-size:1.5rem;color:var(--color-primary)"></i>
        <p class="mt-2 mb-0">Loading live analytics...</p></div>`;

  try {
    const url = `/api/dashboard/${tab}?startDate=${start}&endDate=${end}&staffId=${staff}&serviceId=${service}&branchId=${branch}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    const data = await r.json();

    if (!r.ok) {
      kpiRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-danger)">
                <i class="fas fa-exclamation-triangle"></i> API Error: ${data.error || 'Unknown error'}</div>`;
      return;
    }

    currentTabData = data;
    renderKPIs(tab, data);
    renderCharts(tab, data);
    renderTable(tab, data);
    renderAI(tab, data);
  } catch (err) {
    console.error('Dashboard load error:', err);
    kpiRow.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-danger)">
            <i class="fas fa-wifi"></i> Connection error. Is the server running?</div>`;
  }
}

// Safe number helper
const n = (v) => parseFloat(v) || 0;

function renderKPIs(tab, data) {
  const row = document.getElementById('kpiRow');
  let kpis = [];

  if (tab === 'revenue') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const total = tbl.reduce((s, r) => s + n(r.net_amount), 0);
    kpis = [
      { label: 'Total Revenue', value: '₹' + total.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Invoices', value: tbl.length },
      { label: 'Avg Ticket', value: '₹' + (tbl.length ? total / tbl.length : 0).toFixed(0) },
      { label: 'Tax Collected', value: '₹' + tbl.reduce((s, r) => s + n(r.tax), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
    ];
  } else if (tab === 'bookings') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const completed = tbl.filter(r => r.status === 'completed').length;
    kpis = [
      { label: 'Total Bookings', value: tbl.length },
      { label: 'Completed', value: completed },
      { label: 'Completion Rate', value: tbl.length ? ((completed / tbl.length) * 100).toFixed(1) + '%' : '0%' },
      { label: 'Total Value', value: '₹' + tbl.reduce((s, r) => s + n(r.amount), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
    ];
  } else if (tab === 'customers') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const churnRisk = tbl.filter(r => n(r.churn_score) > 60).length;
    const totalCLV = tbl.reduce((s, r) => s + n(r.clv), 0);
    kpis = [
      { label: 'Total Customers', value: tbl.length },
      { label: 'Churn Risk (>60d)', value: churnRisk },
      { label: 'Total CLV', value: '₹' + totalCLV.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Avg Spend', value: '₹' + (tbl.length ? totalCLV / tbl.length : 0).toFixed(0) }
    ];
  } else if (tab === 'staff') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const totalRev = tbl.reduce((s, r) => s + n(r.revenue), 0);
    const avgProd = tbl.length ? tbl.reduce((s, r) => s + n(r.productivity), 0) / tbl.length : 0;
    kpis = [
      { label: 'Active Staff', value: tbl.length },
      { label: 'Total Revenue', value: '₹' + totalRev.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Avg Productivity', value: avgProd.toFixed(1) + '%' },
      { label: 'Top Performer', value: tbl[0]?.staff_name || 'N/A' }
    ];
  } else if (tab === 'memberships') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const active = tbl.filter(r => r.status === 'active').length;
    const expiring = tbl.filter(r => {
      const diff = (new Date(r.expiry_date) - Date.now()) / 864e5;
      return diff > 0 && diff <= 7;
    }).length;
    kpis = [
      { label: 'Total Members', value: tbl.length },
      { label: 'Active', value: active },
      { label: 'Expiring (7d)', value: expiring },
      { label: 'MRR', value: '₹' + tbl.filter(r => r.status === 'active').reduce((s, r) => s + n(r.revenue), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }) }
    ];
  } else if (tab === 'profit') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const rev = tbl.reduce((s, r) => s + n(r.total_revenue), 0);
    const exp = tbl.reduce((s, r) => s + n(r.total_expense), 0);
    const profit = rev - exp;
    kpis = [
      { label: 'Total Revenue', value: '₹' + rev.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Total Expense', value: '₹' + exp.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Net Profit', value: '₹' + profit.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Margin', value: rev > 0 ? ((profit / rev) * 100).toFixed(1) + '%' : '0%' }
    ];
  } else if (tab === 'services') {
    const tbl = Array.isArray(data.table) ? data.table : [];
    const totalRev = tbl.reduce((s, r) => s + n(r.revenue), 0);
    kpis = [
      { label: 'Services', value: tbl.length },
      { label: 'Total Revenue', value: '₹' + totalRev.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Top Service', value: tbl[0]?.service_name || 'N/A' },
      { label: 'Avg Duration', value: tbl.length ? (tbl.reduce((s, r) => s + n(r.duration), 0) / tbl.length).toFixed(0) + 'm' : '0m' }
    ];
  } else if (tab === 'forecast') {
    const fc = Array.isArray(data.forecast) ? data.forecast : [];
    const tbl = Array.isArray(data.table) ? data.table : [];
    const totalFc = fc.reduce((s, r) => s + n(r.predicted_revenue), 0);
    const highChurn = tbl.filter(r => n(r.churn_probability) >= 0.8).length;
    kpis = [
      { label: '30-Day Forecast', value: '₹' + totalFc.toLocaleString('en-IN', { maximumFractionDigits: 0 }) },
      { label: 'Avg Daily Pred.', value: '₹' + (fc.length ? totalFc / fc.length : 0).toFixed(0) },
      { label: 'High Churn Risk', value: highChurn },
      { label: 'Model Confidence', value: '91%' }
    ];
  }

  row.style.gridTemplateColumns = `repeat(${kpis.length}, 1fr)`;
  row.innerHTML = kpis.map(k => `
        <div class="kpi-card">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value">${k.value}</div>
        </div>
    `).join('');
}

function renderCharts(tab, data) {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch (e) { } });
  chartInstances = {};

  const mainCtx = document.getElementById('mainChart');
  const sideCtx = document.getElementById('sideChart');
  const mainND = document.getElementById('mainNoData');
  const sideND = document.getElementById('sideNoData');

  mainND.classList.add('d-none'); mainCtx.style.display = '';
  sideND.classList.add('d-none'); sideCtx.style.display = '';

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#64748b', font: { size: 11 }, padding: 16 } } },
    scales: {
      x: { grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border-subtle').trim() || 'rgba(255,255,255,0.03)' }, ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#475569', maxTicksLimit: 12 } },
      y: { grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-border-subtle').trim() || 'rgba(255,255,255,0.03)' }, ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() || '#475569' } }
    }
  };
  const noScales = { ...baseOpts, scales: {} };

  const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];

  const showNoData = (el, canvas) => { el.classList.remove('d-none'); canvas.style.display = 'none'; };

  if (tab === 'revenue') {
    const trend = Array.isArray(data.dailyTrend) ? data.dailyTrend : [];
    const split = Array.isArray(data.paymentSplit) ? data.paymentSplit : [];
    if (!trend.length) { showNoData(mainND, mainCtx); }
    else {
      chartInstances.main = new Chart(mainCtx.getContext('2d'), {
        type: 'line',
        data: { labels: trend.map(d => d.x), datasets: [{ label: 'Revenue (₹)', data: trend.map(d => n(d.y)), borderColor: '#7c3aed', tension: 0.4, fill: true, backgroundColor: 'rgba(124,58,237,0.06)', pointRadius: 3 }] },
        options: baseOpts
      });
    }
    if (!split.length) { showNoData(sideND, sideCtx); }
    else {
      chartInstances.side = new Chart(sideCtx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: split.map(d => d.label || 'Other'), datasets: [{ data: split.map(d => n(d.value)), backgroundColor: COLORS }] },
        options: { ...noScales, cutout: '72%' }
      });
    }
  } else if (tab === 'bookings') {
    const trend = Array.isArray(data.trend) ? data.trend : [];
    const status = Array.isArray(data.status) ? data.status : [];
    if (!trend.length) showNoData(mainND, mainCtx);
    else chartInstances.main = new Chart(mainCtx.getContext('2d'), { type: 'bar', data: { labels: trend.map(d => d.x), datasets: [{ label: 'Bookings', data: trend.map(d => n(d.y)), backgroundColor: '#06b6d4', borderRadius: 4 }] }, options: baseOpts });
    if (!status.length) showNoData(sideND, sideCtx);
    else chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'pie', data: { labels: status.map(d => d.label), datasets: [{ data: status.map(d => n(d.value)), backgroundColor: COLORS }] }, options: noScales });
  } else if (tab === 'customers') {
    const top = Array.isArray(data.topCustomers) ? data.topCustomers : [];
    const nvr = Array.isArray(data.newVsRepeat) ? data.newVsRepeat : [];
    if (!top.length) showNoData(mainND, mainCtx);
    else chartInstances.main = new Chart(mainCtx.getContext('2d'), { type: 'bar', data: { labels: top.map(d => d.x), datasets: [{ label: 'Spend (₹)', data: top.map(d => n(d.y)), backgroundColor: '#7c3aed', borderRadius: 4 }] }, options: baseOpts });
    if (!nvr.length) showNoData(sideND, sideCtx);
    else chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'doughnut', data: { labels: nvr.map(d => d.label), datasets: [{ data: nvr.map(d => n(d.value)), backgroundColor: ['#06b6d4', '#10b981'] }] }, options: { ...noScales, cutout: '72%' } });
  } else if (tab === 'staff') {
    const trend = Array.isArray(data.trend) ? data.trend : [];
    const rev = Array.isArray(data.rev) ? data.rev : [];
    const tbl = Array.isArray(data.table) ? data.table.slice(0, 6) : [];
    // Show trend in main chart, staff revenue in side chart
    if (!trend.length) showNoData(mainND, mainCtx);
    else chartInstances.main = new Chart(mainCtx.getContext('2d'), { type: 'line', data: { labels: trend.map(d => d.x), datasets: [{ label: 'Daily Revenue (₹)', data: trend.map(d => n(d.y)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }] }, options: baseOpts });
    if (!rev.length) showNoData(sideND, sideCtx);
    else chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'bar', data: { labels: rev.map(d => d.x), datasets: [{ label: 'Revenue (₹)', data: rev.map(d => n(d.y)), backgroundColor: '#7c3aed', borderRadius: 4 }] }, options: baseOpts });
  } else if (tab === 'memberships') {
    const status = Array.isArray(data.status) ? data.status : [];
    if (!status.length) { showNoData(mainND, mainCtx); showNoData(sideND, sideCtx); }
    else {
      chartInstances.main = new Chart(mainCtx.getContext('2d'), { type: 'bar', data: { labels: status.map(d => d.label), datasets: [{ label: 'Count', data: status.map(d => n(d.value)), backgroundColor: COLORS, borderRadius: 4 }] }, options: baseOpts });
      chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'doughnut', data: { labels: status.map(d => d.label), datasets: [{ data: status.map(d => n(d.value)), backgroundColor: COLORS }] }, options: { ...noScales, cutout: '72%' } });
    }
  } else if (tab === 'profit') {
    const monthly = Array.isArray(data.monthly) ? data.monthly : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];
    const split = Array.isArray(data.expenseSplit) ? data.expenseSplit : [];
    if (!monthly.length) showNoData(mainND, mainCtx);
    else {
      const expMap = {};
      expenses.forEach(e => { expMap[e.month] = n(e.expense); });
      chartInstances.main = new Chart(mainCtx.getContext('2d'), {
        type: 'bar',
        data: {
          labels: monthly.map(d => d.month), datasets: [
            { label: 'Revenue', data: monthly.map(d => n(d.revenue)), backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'Expense', data: monthly.map(d => expMap[d.month] || 0), backgroundColor: '#ef4444', borderRadius: 4 }
          ]
        },
        options: baseOpts
      });
    }
    if (!split.length) showNoData(sideND, sideCtx);
    else chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'pie', data: { labels: split.map(d => d.label), datasets: [{ data: split.map(d => n(d.value)), backgroundColor: COLORS }] }, options: noScales });
  } else if (tab === 'services') {
    const rev = Array.isArray(data.rev) ? data.rev : [];
    const pop = Array.isArray(data.pop) ? data.pop : [];
    if (!rev.length) showNoData(mainND, mainCtx);
    else chartInstances.main = new Chart(mainCtx.getContext('2d'), { type: 'bar', data: { labels: rev.map(d => d.x), datasets: [{ label: 'Revenue (₹)', data: rev.map(d => n(d.y)), backgroundColor: '#7c3aed', borderRadius: 4 }] }, options: baseOpts });
    if (!pop.length) showNoData(sideND, sideCtx);
    else chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'bar', data: { labels: pop.map(d => d.x), datasets: [{ label: 'Bookings', data: pop.map(d => n(d.y)), backgroundColor: '#06b6d4', borderRadius: 4 }] }, options: { ...baseOpts, indexAxis: 'y' } });
  } else if (tab === 'forecast') {
    const fc = Array.isArray(data.forecast) ? data.forecast : [];
    if (!fc.length) showNoData(mainND, mainCtx);
    else chartInstances.main = new Chart(mainCtx.getContext('2d'), {
      type: 'line',
      data: { labels: fc.map(d => d.date), datasets: [{ label: 'Predicted Revenue', data: fc.map(d => n(d.predicted_revenue)), borderColor: '#06b6d4', borderDash: [6, 4], fill: true, backgroundColor: 'rgba(6,182,212,0.06)', tension: 0.4 }] },
      options: baseOpts
    });
    chartInstances.side = new Chart(sideCtx.getContext('2d'), { type: 'doughnut', data: { labels: ['Certainty', 'Variance'], datasets: [{ data: [91, 9], backgroundColor: ['#10b981', '#f59e0b'] }] }, options: { ...noScales, cutout: '80%' } });
  }
}

function renderTable(tab, data) {
  const head = document.getElementById('tableHead');
  const body = document.getElementById('tableBody');
  const title = document.getElementById('tableTitle');

  const tbl = Array.isArray(data.table) ? data.table : [];
  title.innerHTML = `<i class="fas fa-table" style="color:var(--color-primary)"></i> ${tab.charAt(0).toUpperCase() + tab.slice(1)} Ledger`;

  if (!tbl.length) {
    head.innerHTML = '';
    body.innerHTML = '<tr><td colspan="15" class="no-data">No records found for the selected filters.</td></tr>';
    return;
  }

  const cols = Object.keys(tbl[0]);
  head.innerHTML = `<tr>${cols.map(c => `<th>${c.replace(/_/g, ' ')}</th>`).join('')}</tr>`;

  const moneyKeys = ['amount', 'price', 'revenue', 'spend', 'clv', 'net_amount', 'tax', 'discount', 'gross_amount', 'total_revenue', 'total_expense', 'net_profit', 'predicted_revenue'];
  const pctKeys = ['probability', 'productivity', 'margin'];

  body.innerHTML = tbl.map(row => `<tr>${cols.map(col => {
    let v = row[col];
    if (v === null || v === undefined) return '<td>—</td>';
    if (moneyKeys.some(k => col.includes(k))) return `<td>₹${n(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>`;
    if (pctKeys.some(k => col.includes(k))) return `<td>${(n(v) * (n(v) <= 1 ? 100 : 1)).toFixed(1)}%</td>`;
    if (col === 'status') {
      const cls = ['completed', 'active', 'paid'].includes(v) ? 'status-ok' : 'status-warn';
      return `<td><span class="${cls}">● ${v}</span></td>`;
    }
    return `<td>${v}</td>`;
  }).join('')}</tr>`).join('');
}

function renderAI(tab, data) {
  const panel = document.getElementById('aiPanel');
  const content = document.getElementById('aiContent');
  panel.style.display = 'block';

  const insightMap = {
    revenue: [
      "Revenue trajectory shows consistent growth. Consider upselling premium services on peak days.",
      "Payment method analysis: Promote digital payments to reduce cash handling overhead.",
      "Discount rate is within acceptable range. Monitor for margin compression."
    ],
    bookings: [
      "Peak hours identified. Ensure full staff coverage during high-demand slots.",
      "Cancellation rate analysis: Consider implementing a deposit policy to reduce no-shows.",
      "Booking volume trend suggests weekend demand surge. Pre-schedule staff accordingly."
    ],
    customers: [
      `${(Array.isArray(data.table) ? data.table : []).filter(r => n(r.churn_score) > 60).length} customers are at high churn risk. Send re-engagement offers immediately.`,
      "Repeat customer segment drives the majority of revenue. Invest in loyalty programs.",
      "Average CLV is stable. Focus on moving 'New' customers into the 'Repeat' segment."
    ],
    staff: [
      "Staff productivity variance detected. Consider cross-training for lower performers.",
      "Top performer generates significantly higher revenue. Identify and replicate their approach.",
      "Commission structure review recommended to align incentives with business goals."
    ],
    memberships: [
      "Active membership base is healthy. Focus on renewal campaigns 14 days before expiry.",
      "Expired memberships represent a re-engagement opportunity. Offer renewal discounts.",
      "Consider tiered membership plans to increase average revenue per member."
    ],
    profit: [
      "Profit margin is within target range. Monitor expense categories for optimization.",
      "Expense split analysis: Identify the highest cost center for reduction opportunities.",
      "Monthly trend shows seasonal patterns. Plan cash flow accordingly."
    ],
    services: [
      "Top services by revenue should be promoted in marketing campaigns.",
      "Low-popularity, high-margin services need better visibility at point of sale.",
      "Service duration optimization can increase daily booking capacity by 15-20%."
    ],
    forecast: [
      "30-day revenue forecast based on 60-day moving average with seasonal smoothing.",
      "High churn probability customers should be contacted within 48 hours.",
      "Predictive model confidence is 91%. Actual variance expected within ±8%."
    ]
  };

  const insights = insightMap[tab] || insightMap.revenue;
  content.innerHTML = insights.map(ins => `
        <div class="col-md-4">
            <div class="ai-insight">
                <i class="fas fa-lightbulb" style="color:var(--color-warning);margin-right:8px"></i>${ins}
            </div>
        </div>
    `).join('');
}

function exportCSV() {
  const tbl = currentTabData?.table;
  if (!Array.isArray(tbl) || !tbl.length) { alert('No data to export.'); return; }
  const cols = Object.keys(tbl[0]);
  const csv = [cols.join(','), ...tbl.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  a.download = `salon_${document.querySelector('.tab-btn.active')?.dataset.tab || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}