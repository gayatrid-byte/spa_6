// Bookings BI Report Module
// Professional Enterprise BI Analytics Structure
// Author: Senior Power BI Architect

import { exportPDF, exportExcel, exportCSV } from './export-utils.js';


// Utility: Format hour for display
function formatHour(hour) {
  if (hour === null || hour === undefined) return '-';
  const h = parseInt(hour, 10);
  return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
}

export async function renderBookingsReport(container, filters = {}) {
  // Show loading
  container.innerHTML = '<div class="card"><div class="text-center p-5"><div class="spinner"></div><p>Loading booking analytics...</p></div></div>';

  // Set default date range (last 30 days)
  const today = new Date();
  const startDate = filters.startDate || new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29).toISOString().slice(0, 10);
  const endDate = filters.endDate || today.toISOString().slice(0, 10);

  // Fetch live analytics from backend
  let data;
  try {
    const res = await fetch(`/api/advanced-reports/bookings?start=${startDate}&end=${endDate}`);
    data = await res.json();
    if (!data || !data.summary) throw new Error('No data');
  } catch (e) {
    container.innerHTML = `<div class="card"><h3>Error</h3><p>Failed to load booking analytics: ${e.message}</p></div>`;
    return;
  }

  // Build KPI values
  const s = data.summary;
  // Find peak hour
  let peakHour = '-';
  if (data.hourly_distribution && data.hourly_distribution.length) {
    const max = data.hourly_distribution.reduce((a, b) => (b.booking_count > a.booking_count ? b : a), data.hourly_distribution[0]);
    peakHour = formatHour(max.hour);
  }

  // Render BI report structure
  container.innerHTML = `
    <div class="bi-report-container">
      <div class="kpi-strip grid grid-cols-6 gap-3 mb-4">
        <div class="kpi-card"><div class="kpi-label">Total Bookings</div><div class="kpi-value">${s.total_bookings}</div></div>
        <div class="kpi-card"><div class="kpi-label">Completed</div><div class="kpi-value">${s.completed_bookings}</div></div>
        <div class="kpi-card"><div class="kpi-label">Cancelled</div><div class="kpi-value">${s.cancelled_bookings}</div></div>
        <div class="kpi-card"><div class="kpi-label">Avg Value</div><div class="kpi-value">-</div></div>
        <div class="kpi-card"><div class="kpi-label">Peak Hour</div><div class="kpi-value">${peakHour}</div></div>
        <div class="kpi-card"><div class="kpi-label">Conversion Rate</div><div class="kpi-value">${s.completion_rate_pct}%</div></div>
      </div>

      <div class="primary-chart card mb-4">
        <h4>Booking Trend</h4>
        <canvas id="bookingTrendChart"></canvas>
      </div>

      <div class="secondary-charts grid grid-cols-3 gap-3 mb-4">
        <div class="card">
          <h5>Status Distribution</h5>
          <canvas id="bookingStatusDonut"></canvas>
        </div>
        <div class="card">
          <h5>Peak Booking Hour</h5>
          <canvas id="peakHourBar"></canvas>
        </div>
        <div class="card">
          <h5>Repeat Booking Ratio</h5>
          <canvas id="repeatBookingBar"></canvas>
        </div>
      </div>

      <div class="micro-detail-table card mb-4">
        <div class="table-header d-flex justify-content-between align-items-center">
          <h4>Booking Details</h4>
          <input type="text" id="bookingTableSearch" placeholder="Search..." class="search-input">
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Staff</th>
                <th>Time</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody id="bookingTableBody">
              <!-- Data Rows: TODO: fetch and render detail rows -->
            </tbody>
          </table>
        </div>
      </div>

      <div class="export-insight-panel d-flex gap-3">
        <div class="export-group card">
          <h5>Export</h5>
          <button class="export-btn" id="exportPDF">PDF</button>
          <button class="export-btn" id="exportExcel">Excel</button>
          <button class="export-btn" id="exportCSV">CSV</button>
        </div>
        <div class="insight-group card flex-1">
          <h5>Insights</h5>
          <ul class="insight-list" id="bookingInsights">
            <li>Max booking time slot: <span id="insight-peak-slot">${peakHour}</span></li>
            <li>Cancellation %: <span id="insight-cancel-rate">${s.cancellation_rate_pct}%</span></li>
            <li>Repeat booking ratio: <span id="insight-repeat-ratio">-</span></li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // Render charts (example for status donut)
  if (window.Chart && data.chart_data && data.chart_data.booking_status_breakdown) {
    const ctx = document.getElementById('bookingStatusDonut').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.chart_data.booking_status_breakdown.map(x => x.status),
        datasets: [{
          data: data.chart_data.booking_status_breakdown.map(x => x.count),
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6366f1']
        }]
      },
      options: { plugins: { legend: { labels: { color: '#e2e8f0' } } } }
    });
  }
  // TODO: Render other charts and table rows with live data
}
