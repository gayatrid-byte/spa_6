# ⚡ ENTERPRISE BI SYSTEM - QUICK START GUIDE

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm/yarn
- Modern web browser

---

## 📋 Installation Steps

### Step 1: Initialize BI Warehouse (1 minute)

```bash
# Connect to MySQL
mysql -u root -p

# Run BI warehouse script
source /path/to/spa_6/database/schema/bi_warehouse_advanced.sql;

# Verify setup
SHOW TABLES LIKE 'dim_%'; -- Should show 4 dimension tables
SHOW TABLES LIKE 'fact_%'; -- Should show 4 fact tables
SHOW TABLES LIKE 'mv_%'; -- Should show materialized views
```

### Step 2: Start Backend Server (1 minute)

```bash
cd spa_6/backend

# Install dependencies (if not already done)
npm install

# Start server
npm start

# Verify:
# - Server should run on http://localhost:3000
# - BI routes registered at /api/bi
```

### Step 3: Access Dashboard (1 minute)

```
Open browser and navigate to:
→ http://localhost:3000/bi-dashboard.html

Login with:
Email: owner@salon.com
Password: (from your system)
```

### Step 4: Verify API Endpoints (2 minutes)

```bash
# Get JWT Token first from login, then:

# Test Revenue API
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12"

# Expected Response:
# {
#   "summary": {
#     "total_revenue": "45000.00",
#     "transaction_count": 120,
#     ...
#   },
#   "payment_breakdown": [...],
#   "daily_trend": [...]
# }
```

---

## 💡 Core Modules Explained

### 1️⃣ Revenue Intelligence
**Best For**: Understanding where your money comes from

**Key Metrics**:
- Total Revenue, Growth %, Payment Methods
- Revenue by Service, Revenue by Staff
- Daily/Weekly/Monthly Trends

**How to Use**:
```
1. Go to Dashboard → Revenue Module
2. Select Date Range (defaults to last 30 days)
3. View KPI Cards for quick metrics
4. Check Daily Trend chart
5. See Top Services in table
6. Export report if needed
```

### 2️⃣ Booking Analytics
**Best For**: Analyzing appointment patterns and efficiency

**Key Metrics**:
- Total Bookings, Completion Rate, Cancellation Rate
- Bookings by Type (Walk-in vs Calling)
- Slot Utilization by Hour
- Service Demand

**How to Use**:
```
1. Navigate to Bookings Module
2. View completion/cancellation rates
3. Check peak hours for scheduling
4. Identify most popular services
5. Analyze walk-in vs appointment ratio
```

### 3️⃣ Customer Intelligence
**Best For**: Segmenting customers and planning retention

**Key Metrics**:
- Total/New/Active Customers
- Retention Rate, Churn Rate
- Customer Lifetime Value (CLV)
- Customer Segments (VIP, Premium, Regular, Budget)
- Top 10 Customers by Revenue

**How to Use**:
```
1. Open Customers Module
2. Identify VIP customers (CLV > 10,000)
3. Check retention/churn rates
4. Plan loyalty programs for At-Risk segment
5. Focus marketing on high-value customers
```

### 4️⃣ Staff Performance
**Best For**: Evaluating employee productivity and fairness

**Key Metrics**:
- Revenue per Staff Member
- Bookings per Staff
- Completion Rates
- Utilization Percentage
- Service Specialization
- Revenue Contribution %

**How to Use**:
```
1. Go to Staff Module
2. Compare revenue between staff members
3. Check utilization rates
4. Identify star performers
5. Plan training for underperformers
```

### 5️⃣ Membership Analytics
**Best For**: Tracking subscription health and renewals

**Key Metrics**:
- Active/New/Expired/Cancelled Memberships
- Renewal Rate %
- Monthly Recurring Revenue (MRR)
- Average Membership Value
- Member Segments

**How to Use**:
```
1. Navigate to Memberships Module
2. Monitor MRR trend
3. Check renewal rates
4. Identify at-risk memberships expiring soon
5. Plan renewal campaigns
```

### 6️⃣ Expense & Profit
**Best For**: Financial health and profitability analysis

**Key Metrics**:
- Total Revenue vs Expenses
- Net Profit, Profit Margin %
- Operating Ratio %
- Expenses by Category
- Expense per Revenue Unit

**How to Use**:
```
1. Open Profit Module
2. Compare revenue vs expenses
3. Check profit margins trending
4. Analyze expense categories
5. Identify cost-saving opportunities
```

### 7️⃣ Service Performance
**Best For**: Optimizing service offerings

**Key Metrics**:
- Service Revenue & Popularity
- Peak Service Times
- Staff Proficiency by Service
- Revenue per Hour per Service
- Service Category Distribution

**How to Use**:
```
1. Go to Services Module
2. Identify top revenue-generating services
3. Check peak demand times
4. See which staff excels at which service
5. Plan service scheduling based on demand
```

### 8️⃣ AI Forecasting
**Best For**: Predictive planning and forecasting

**Key Metrics**:
- 7-day & 14-day Moving Averages
- 30-day Revenue Forecast
- Trend Direction (Up/Down/Stable)
- Confidence Range (±15%)

**How to Use**:
```
1. Navigate to AI Forecast Module
2. View historical performance chart
3. Check forecasted values for next 30 days
4. Analyze trend direction
5. Use forecast for budget planning
```

---

## 📊 Dashboard Sections

### Top Navigation Bar
- **Logo**: Enterprise BI System
- **Menu**: Dashboard, Reports, Templates, Settings
- **User Info**: Current logged-in user
- **Logout**: Exit system

### Left Sidebar
- **Modules**: Quick access to all 8 modules
- **Date Filter**: Select custom date range
- **Export Options**: PDF, Excel, CSV exports
- **Active Indicators**: Show current selection

### Main Content Area
1. **KPI Cards** (Top)
   - Large metric values
   - Percentage changes
   - Color-coded status

2. **Charts** (Middle)
   - Main trend chart (left)
   - Distribution chart (right)
   - Fully interactive with hover details

3. **Data Table** (Bottom)
   - Detailed breakdown
   - Search & sort functionality
   - Pagination for large datasets
   - Export selected data

### Template Showcase
- **8 Premium Templates**: One for each module
- **Live Demo Links**: Interactive previews
- **Hover Effects**: Modern transitions
- **Responsive Grid**: 4 per row on desktop, 1 on mobile

---

## 🔧 Configuration & Customization

### Changing Date Range
```javascript
// In sidebar:
1. Set Start Date
2. Set End Date
3. Click "Apply" button

// Programmatically:
dashboardState.startDate = '2026-01-13';
dashboardState.endDate = '2026-02-12';
await loadDashboard();
```

### Adjusting Chart Types
```javascript
// Click the dropdown in chart header:
- Daily (default)
- Weekly aggregation
- Monthly aggregation

// Or manually:
document.getElementById('chartPeriod').value = 'weekly';
updateCharts();
```

### Export Report
```
Click Export Buttons:
1. PDF - Professional formatted report
2. Excel - Data with formulas and charts
3. CSV - Raw data for import to other tools

// Files download to default browser location
```

---

## 📈 Real-World Usage Scenarios

### Scenario 1: Monthly Business Meeting Pre-
```
1. Open Revenue Module
2. Set date to current month
3. Check KPI Cards for quick overview
4. Export as PDF for presentation
5. Share metrics with team
```

### Scenario 2: Staff Performance Review
```
1. Go to Staff Performance Module
2. Filter by staff member
3. Review metrics vs company average
4. Check service specializations
5. Plan training needs
```

### Scenario 3: Customer Retention Planning
```
1. Navigate to Customer Intelligence
2. Identify At-Risk segment (high churn)
3. Filter by last visit date
4. Plan targeted loyalty campaign
5. Track results in next period
```

### Scenario 4: Pricing Strategy
```
1. Check Service Performance module
2. Analyze revenue per hour
3. Compare service margins
4. Identify underpriced services
5. Adjust pricing strategy
```

### Scenario 5: Budget Planning
```
1. Open Profit & Expense module
2. Review expense breakdown
3. Check 12-month trend
4. Use AI Forecast for next quarter
5. Plan annual budget
```

---

## 📱 Mobile Access

### Responsive Design
Dashboard is fully responsive:
- **Desktop (1920px+)**: Full sidebar + all features
- **Tablet (768px+)**: Side-by-side layout
- **Mobile (480px+)**: Stacked layout, tables scrollable

### Mobile Tips
```
1. Use landscape mode for charts
2. Swipe left/right to navigate modules
3. Tap cards to see expanded view
4. Use filters to reduce data shown
5. Export to view on desktop if needed
```

---

## 🔐 Security & Access Control

### User Roles & Permissions
```
Owner (Full Access):
- All metrics and reports
- Financial data
- Staff performance
- System settings

Manager (Limited Access):
- Revenue and booking metrics
- Customer data
- Staff performance (own team)
- Cannot see expenses

Staff (View Only):
- Own performance metrics
- Customer feedback
- Booking schedule
```

### Best Practices
1. Never share JWT tokens
2. Logout after each session
3. Use strong passwords
4. Enable 2FA if available
5. Audit sensitive data access

---

## ⚡ Performance Tips

### Dashboard Loading
- First load: 1-2 seconds
- Switch module: <1 second
- Chart render: <500ms

### Optimization Tips
```
1. Use date filters to reduce data
2. Close unused sidebar sections
3. Clear browser cache monthly
4. Use modern browser (Chrome/Firefox/Safari)
5. Ensure stable internet connection
```

### Database Performance
- Materialized views auto-update
- Indexes optimized for common queries
- Pagination limits large datasets
- Caching for frequently accessed data

---

## 🆘 Troubleshooting

### Issue: "No Data Available"
**Solutions**:
- ✓ Verify date range has transactions
- ✓ Check if salon has any bookings
- ✓ Ensure user is assigned to correct salon
- ✓ Refresh page (Ctrl+R)

### Issue: "API Error 401"
**Solutions**:
- ✓ Login again to refresh token
- ✓ Clear browser cookies
- ✓ Restart backend server
- ✓ Check network tab for errors

### Issue: "Charts Not Loading"
**Solutions**:
- ✓ Update Chart.js library
- ✓ Check console for JavaScript errors
- ✓ Disable browser extensions
- ✓ Try different browser

### Issue: "Slow Performance"
**Solutions**:
- ✓ Close other browser tabs
- ✓ Clear cache: Ctrl+Shift+Delete
- ✓ Check internet speed
- ✓ Reduce date range
- ✓ Restart server

### Issue: "Export Not Working"
**Solutions**:
- ✓ Check browser privacy settings
- ✓ Allow pop-ups for domain
- ✓ Update browser to latest version
- ✓ Try different export format

---

## 📞 Support

**For Technical Issues**:
1. Check documentation first
2. Review browser console (F12)
3. Check server logs
4. Review database queries
5. Contact development team

**Useful Logs**:
```bash
# Backend logs
tail -f /path/to/app/logs/server.log

# Database logs
mysql -u root -p -e "SHOW LOGS;"

# Browser console
F12 → Console tab
```

---

## 🎓 Advanced Features

### Custom Calculations
Add your own KPI calculations in Module Controllers

### API Integration
Use BI API endpoints in external systems:
```javascript
// Embed in other applications
const response = await fetch('/api/bi/revenue?...', {
  headers: { 'Authorization': 'Bearer TOKEN' }
});
```

### Scheduled Reports
Set up automatic email reports:
```
Coming Soon: Report Scheduling Feature
- Daily reports
- Weekly summaries
- Monthly executives summaries
```

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready ✅  
**Difficulty**: Beginner to Intermediate
