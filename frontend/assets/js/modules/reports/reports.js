// // Reports module - Now uses Enterprise BI Dashboard
// export async function render(container) {
//   // Initialize the integrated BI Dashboard
//   if (window.BIDashboard) {
//     window.BIDashboard.init();
//   } else {
//     container.innerHTML = `
//       <div class="card">
//         <h3>Error</h3>
//         <p class="error-message">BI Dashboard component not loaded. Please refresh the page.</p>
//       </div>
//     `;
//   }
// }

// function attachEventListeners(container) {
//   container.querySelector('#revenueReportBtn').addEventListener('click', () => generateRevenueReport(container));
//   container.querySelector('#appointmentsReportBtn').addEventListener('click', () => generateAppointmentsReport(container));
//   container.querySelector('#profitReportBtn').addEventListener('click', () => generateProfitReport(container));
//   container.querySelector('#servicesReportBtn').addEventListener('click', () => generateServicesReport(container));
// }

// async function generateRevenueReport(container) {
//   const startDate = container.querySelector('#reportStartDate').value;
//   const endDate = container.querySelector('#reportEndDate').value;

//   if (!startDate || !endDate) {
//     utils.showToast('Please select start and end dates', 'error');
//     return;
//   }

//   try {
//     const resultsDiv = container.querySelector('#reportResults');
//     resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';

//     const report = await api.reports.getRevenue(startDate, endDate);

//     resultsDiv.innerHTML = `
//       <div class="card mt-3">
//         <h4>Revenue Report</h4>
//         <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
//         <hr>
//         <div class="dashboard-cards" style="margin-bottom: 0;">
//           <div class="card">
//             <div class="card-title">Total Revenue</div>
//             <div class="card-value">${utils.formatCurrency(report.totalRevenue)}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Paid</div>
//             <div class="card-value">${utils.formatCurrency(report.paidRevenue)}</div>
//             <div class="card-subtitle">${report.paidInvoices} invoices</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Pending</div>
//             <div class="card-value">${utils.formatCurrency(report.pendingRevenue)}</div>
//             <div class="card-subtitle">${report.pendingInvoices} invoices</div>
//           </div>
//         </div>
//       </div>
//     `;
//   } catch (error) {
//     console.error('Error generating revenue report:', error);
//     utils.showToast('Failed to generate report', 'error');
//   }
// }

// async function generateAppointmentsReport(container) {
//   const startDate = container.querySelector('#reportStartDate').value;
//   const endDate = container.querySelector('#reportEndDate').value;

//   if (!startDate || !endDate) {
//     utils.showToast('Please select start and end dates', 'error');
//     return;
//   }

//   try {
//     const resultsDiv = container.querySelector('#reportResults');
//     resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';

//     const report = await api.reports.getAppointments(startDate, endDate);

//     resultsDiv.innerHTML = `
//       <div class="card mt-3">
//         <h4>Appointments Report</h4>
//         <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
//         <hr>
//         <div class="dashboard-cards" style="margin-bottom: 0;">
//           <div class="card">
//             <div class="card-title">Total Appointments</div>
//             <div class="card-value">${report.totalAppointments}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Completed</div>
//             <div class="card-value">${report.statusCounts.completed || 0}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Cancelled</div>
//             <div class="card-value">${report.statusCounts.cancelled || 0}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">No Shows</div>
//             <div class="card-value">${report.statusCounts['no-show'] || 0}</div>
//           </div>
//         </div>
//       </div>
//     `;
//   } catch (error) {
//     console.error('Error generating appointments report:', error);
//     utils.showToast('Failed to generate report', 'error');
//   }
// }

// async function generateProfitReport(container) {
//   const startDate = container.querySelector('#reportStartDate').value;
//   const endDate = container.querySelector('#reportEndDate').value;

//   if (!startDate || !endDate) {
//     utils.showToast('Please select start and end dates', 'error');
//     return;
//   }

//   try {
//     const resultsDiv = container.querySelector('#reportResults');
//     resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';

//     const report = await api.reports.getProfit(startDate, endDate);

//     const profitClass = report.profit >= 0 ? 'text-success' : 'text-danger';

//     resultsDiv.innerHTML = `
//       <div class="card mt-3">
//         <h4>Profit Report</h4>
//         <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
//         <hr>
//         <div class="dashboard-cards" style="margin-bottom: 0;">
//           <div class="card">
//             <div class="card-title">Total Revenue</div>
//             <div class="card-value">${utils.formatCurrency(report.totalRevenue)}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Total Expenses</div>
//             <div class="card-value">${utils.formatCurrency(report.totalExpenses)}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Profit/Loss</div>
//             <div class="card-value ${profitClass}">${utils.formatCurrency(report.profit)}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Profit Margin</div>
//             <div class="card-value">${report.profitMargin}%</div>
//           </div>
//         </div>
//       </div>
//     `;
//   } catch (error) {
//     console.error('Error generating profit report:', error);
//     utils.showToast('Failed to generate report', 'error');
//   }
// }

// async function generateServicesReport(container) {
//   const startDate = container.querySelector('#reportStartDate').value;
//   const endDate = container.querySelector('#reportEndDate').value;

//   if (!startDate || !endDate) {
//     utils.showToast('Please select start and end dates', 'error');
//     return;
//   }

//   try {
//     const resultsDiv = container.querySelector('#reportResults');
//     resultsDiv.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';

//     const report = await api.reports.getServicePerformance(startDate, endDate);

//     // Safety check for summary
//     const summary = report.summary || {
//       totalRevenue: 0,
//       topService: 'N/A',
//       activeServices: 0,
//       avgDuration: 0
//     };

//     const performance = report.performance || [];

//     const servicesTable = performance.length > 0 ? `
//   <table class="table">
//     <thead>
//       <tr>
//         <th>Service</th>
//         <th>Bookings</th>
//         <th>Avg Duration</th>
//         <th>Revenue</th>
//       </tr>
//     </thead>
//     <tbody>
//       ${performance.map(s => `
//         <tr>
//           <td>${s.serviceName || 'N/A'}</td>
//           <td>${s.bookings || 0}</td>
//           <td>${s.avgDuration || 0} min</td>
//           <td>${utils.formatCurrency(Number(s.revenue) || 0)}</td>
//         </tr>
//       `).join('')}
//     </tbody>
//   </table>
// ` : '<p class="text-center p-3">No data available for this period</p>';


//     resultsDiv.innerHTML = `
//       <div class="card mt-3">
//         <h4>Service Performance Report</h4>
//         <p><strong>Period:</strong> ${utils.formatDate(startDate)} - ${utils.formatDate(endDate)}</p>
//         <hr>
        
//         <div class="dashboard-cards" style="margin-bottom: 20px;">
//           <div class="card">
//             <div class="card-title">Total Service Revenue</div>
//             <div class="card-value">${utils.formatCurrency(summary.totalRevenue)}</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Top Service</div>
//             <div class="card-value" style="font-size: 1.2rem;">${summary.topService}</div>
//             <div class="card-subtitle">By revenue</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Active Services</div>
//             <div class="card-value">${summary.activeServices}</div>
//             <div class="card-subtitle">Services booked</div>
//           </div>
//           <div class="card">
//             <div class="card-title">Avg Duration</div>
//             <div class="card-value">${summary.avgDuration} min</div>
//           </div>
//         </div>

//         <div class="table-responsive">
//           ${servicesTable}
//         </div>
//       </div>
//     `;
//   } catch (error) {
//     console.error('Error generating services report:', error);
//     utils.showToast('Failed to generate report', 'error');
//   }
// }

// Reports module - Now uses Enterprise BI Dashboard
export async function render(container) {
  // Initialize the integrated BI Dashboard
  if (window.BIDashboard) {
    window.BIDashboard.init();
  } else {
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p class="error-message">BI Dashboard component not loaded. Please refresh the page.</p>
      </div>
    `;
  }
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