// Reports module
export async function render(container) {
  container.innerHTML = `
    <div class="card">
      <h3>Reports</h3>
      <p class="mb-3">Generate reports for your salon business</p>
      
      <div class="form-group">
        <label for="reportStartDate">Start Date</label>
        <input type="date" id="reportStartDate" value="${utils.getDateDaysAgo(30)}">
      </div>
      
      <div class="form-group">
        <label for="reportEndDate">End Date</label>
        <input type="date" id="reportEndDate" value="${utils.getTodayDate()}">
      </div>
      
      <div class="d-flex gap-2 mt-3">
        <button id="revenueReportBtn" class="btn btn-primary">Revenue Report</button>
        <button id="appointmentsReportBtn" class="btn btn-primary">Appointments Report</button>
        <button id="profitReportBtn" class="btn btn-primary">Profit Report</button>
        <button id="servicesReportBtn" class="btn btn-primary">Services Report</button>
      </div>
      
      <div id="reportResults" class="mt-3"></div>
    </div>
  `;
  
  // Attach event listeners
  attachEventListeners(container);
}

function attachEventListeners(container) {
  container.querySelector('#revenueReportBtn').addEventListener('click', () => generateRevenueReport(container));
  container.querySelector('#appointmentsReportBtn').addEventListener('click', () => generateAppointmentsReport(container));
  container.querySelector('#profitReportBtn').addEventListener('click', () => generateProfitReport(container));
  container.querySelector('#servicesReportBtn').addEventListener('click', () => generateServicesReport(container));
}

async function generateRevenueReport(container) {
  const startDate = container.querySelector('#reportStartDate').value;
  const endDate = container.querySelector('#reportEndDate').value;
  
  if (!startDate || !endDate) {
    utils.showToast('Please select start and end dates', 'error');
    return;
  }
  
  try {
    const resultsDiv = container.querySelector('#reportResults');
    resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
    
    const report = await api.reports.getRevenue(startDate, endDate);
    
    resultsDiv.innerHTML = `
      <div class="card mt-3">
        <h4>Revenue Report</h4>
        <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
        <hr>
        <div class="dashboard-cards" style="margin-bottom: 0;">
          <div class="card">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">${utils.formatCurrency(report.totalRevenue)}</div>
          </div>
          <div class="card">
            <div class="card-title">Paid</div>
            <div class="card-value">${utils.formatCurrency(report.paidRevenue)}</div>
            <div class="card-subtitle">${report.paidInvoices} invoices</div>
          </div>
          <div class="card">
            <div class="card-title">Pending</div>
            <div class="card-value">${utils.formatCurrency(report.pendingRevenue)}</div>
            <div class="card-subtitle">${report.pendingInvoices} invoices</div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating revenue report:', error);
    utils.showToast('Failed to generate report', 'error');
  }
}

async function generateAppointmentsReport(container) {
  const startDate = container.querySelector('#reportStartDate').value;
  const endDate = container.querySelector('#reportEndDate').value;
  
  if (!startDate || !endDate) {
    utils.showToast('Please select start and end dates', 'error');
    return;
  }
  
  try {
    const resultsDiv = container.querySelector('#reportResults');
    resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
    
    const report = await api.reports.getAppointments(startDate, endDate);
    
    resultsDiv.innerHTML = `
      <div class="card mt-3">
        <h4>Appointments Report</h4>
        <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
        <hr>
        <div class="dashboard-cards" style="margin-bottom: 0;">
          <div class="card">
            <div class="card-title">Total Appointments</div>
            <div class="card-value">${report.totalAppointments}</div>
          </div>
          <div class="card">
            <div class="card-title">Completed</div>
            <div class="card-value">${report.statusCounts.completed || 0}</div>
          </div>
          <div class="card">
            <div class="card-title">Cancelled</div>
            <div class="card-value">${report.statusCounts.cancelled || 0}</div>
          </div>
          <div class="card">
            <div class="card-title">No Shows</div>
            <div class="card-value">${report.statusCounts['no-show'] || 0}</div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating appointments report:', error);
    utils.showToast('Failed to generate report', 'error');
  }
}

async function generateProfitReport(container) {
  const startDate = container.querySelector('#reportStartDate').value;
  const endDate = container.querySelector('#reportEndDate').value;
  
  if (!startDate || !endDate) {
    utils.showToast('Please select start and end dates', 'error');
    return;
  }
  
  try {
    const resultsDiv = container.querySelector('#reportResults');
    resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
    
    const report = await api.reports.getProfit(startDate, endDate);
    
    const profitClass = report.profit >= 0 ? 'text-success' : 'text-danger';
    
    resultsDiv.innerHTML = `
      <div class="card mt-3">
        <h4>Profit Report</h4>
        <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
        <hr>
        <div class="dashboard-cards" style="margin-bottom: 0;">
          <div class="card">
            <div class="card-title">Total Revenue</div>
            <div class="card-value">${utils.formatCurrency(report.totalRevenue)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses</div>
            <div class="card-value">${utils.formatCurrency(report.totalExpenses)}</div>
          </div>
          <div class="card">
            <div class="card-title">Profit/Loss</div>
            <div class="card-value ${profitClass}">${utils.formatCurrency(report.profit)}</div>
          </div>
          <div class="card">
            <div class="card-title">Profit Margin</div>
            <div class="card-value">${report.profitMargin}%</div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error generating profit report:', error);
    utils.showToast('Failed to generate report', 'error');
  }
}

async function generateServicesReport(container) {
  const startDate = container.querySelector('#reportStartDate').value;
  const endDate = container.querySelector('#reportEndDate').value;
  
  if (!startDate || !endDate) {
    utils.showToast('Please select start and end dates', 'error');
    return;
  }
  
  try {
    const resultsDiv = container.querySelector('#reportResults');
    resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';
    
    const report = await api.reports.getServicePerformance(startDate, endDate);
    
    const servicesTable = report.performance.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Bookings</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${report.performance.map(s => `
            <tr>
              <td>${s.serviceName}</td>
              <td>${s.bookings}</td>
              <td>${utils.formatCurrency(s.revenue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p class="text-center">No data available</p>';
    
    resultsDiv.innerHTML = `
      <div class="card mt-3">
        <h4>Service Performance Report</h4>
        <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
        <hr>
        ${servicesTable}
      </div>
    `;
  } catch (error) {
    console.error('Error generating services report:', error);
    utils.showToast('Failed to generate report', 'error');
  }
}