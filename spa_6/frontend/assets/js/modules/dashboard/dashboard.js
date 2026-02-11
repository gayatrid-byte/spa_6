// Dashboard module
export async function render(container) {
  try {
    const stats = await api.dashboard.getStats();
    
    container.innerHTML = `
      <div class="dashboard-cards">
        <div class="card">
          <div class="card-icon">📅</div>
          <div class="card-title">Today's Appointments</div>
          <div class="card-value">${stats.todayAppointments}</div>
          <div class="card-subtitle">Scheduled appointments</div>
        </div>
        
        <div class="card">
          <div class="card-icon">💰</div>
          <div class="card-title">Today's Revenue</div>
          <div class="card-value">${utils.formatCurrency(stats.todayRevenue)}</div>
          <div class="card-subtitle">Completed services</div>
        </div>
        
        <div class="card">
          <div class="card-icon">📈</div>
          <div class="card-title">Monthly Revenue</div>
          <div class="card-value">${utils.formatCurrency(stats.monthlyRevenue)}</div>
          <div class="card-subtitle">This month</div>
        </div>
        
        <div class="card">
          <div class="card-icon">👥</div>
          <div class="card-title">Total Customers</div>
          <div class="card-value">${stats.totalCustomers}</div>
          <div class="card-subtitle">Active customers</div>
        </div>
        
        <div class="card">
          <div class="card-icon">💸</div>
          <div class="card-title">Monthly Expenses</div>
          <div class="card-value">${utils.formatCurrency(stats.monthlyExpenses)}</div>
          <div class="card-subtitle">This month</div>
        </div>
        
        <div class="card">
          <div class="card-icon">📊</div>
          <div class="card-title">Monthly Profit</div>
          <div class="card-value">${utils.formatCurrency(stats.monthlyProfit)}</div>
          <div class="card-subtitle">Revenue - Expenses</div>
        </div>
        
        <div class="card">
          <div class="card-icon">⏳</div>
          <div class="card-title">Pending Payments</div>
          <div class="card-value">${utils.formatCurrency(stats.pendingPayments)}</div>
          <div class="card-subtitle">Unpaid invoices</div>
        </div>
        
        <div class="card">
          <div class="card-icon">🎯</div>
          <div class="card-title">Profit Margin</div>
          <div class="card-value">${stats.monthlyRevenue > 0 ? ((stats.monthlyProfit / stats.monthlyRevenue) * 100).toFixed(1) : 0}%</div>
          <div class="card-subtitle">Of total revenue</div>
        </div>
      </div>
      
      <div class="card">
        <h3>Recent Appointments</h3>
        <div class="mt-3">
          ${stats.recentAppointments.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${stats.recentAppointments.map(app => `
                  <tr>
                    <td>${app.customer_name || 'N/A'}</td>
                    <td>${app.service_name || 'N/A'}</td>
                    <td>${utils.formatDate(app.appointment_date)}</td>
                    <td>${utils.formatTime(app.appointment_time)}</td>
                    <td><span class="badge badge-${getAppointmentStatusClass(app.status)}">${app.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p class="text-center">No recent appointments</p>'}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading dashboard:', error);
    container.innerHTML = `
      <div class="card">
        <h3>Error</h3>
        <p>Failed to load dashboard data: ${error.message}</p>
      </div>
    `;
  }
}

function getAppointmentStatusClass(status) {
  const statusClasses = {
    'scheduled': 'info',
    'completed': 'success',
    'cancelled': 'danger',
    'no-show': 'warning'
  };
  return statusClasses[status] || 'info';
}