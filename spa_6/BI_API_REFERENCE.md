# 🔌 ENTERPRISE BI API REFERENCE

## Complete Developer Guide

---

## 📚 Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [Request/Response Format](#requestresponse-format)
4. [All API Endpoints](#all-api-endpoints)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [Performance Considerations](#performance-considerations)

---

## 🔧 Base Configuration

### API Base URL
```
Production: http://localhost:3000/api/bi
Sandbox: http://localhost:3000/api/bi (same for dev)
```

### Supported Methods
- GET (Query & Retrieve)
- OPTIONS (CORS preflight)

### Content Type
```
Accept: application/json
Content-Type: application/json
```

### Timeout
- Default: 30 seconds
- Long queries: up to 60 seconds

---

## 🔐 Authentication

### JWT Token Authentication

**Header Format**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Obtained From**:
```
POST /api/auth/login
{
  "email": "owner@salon.com",
  "password": "your_password"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiry": "2026-02-13T12:00:00Z",
  "salon_id": 1,
  "role": "owner"
}
```

**Token Validation**:
- Issued at: Timestamp of login
- Expires in: 24 hours
- Refresh: Login again to get new token

---

## 📤 Request/Response Format

### Query Parameters

**Date Format**:
```
YYYY-MM-DD (ISO 8601)
Examples:
- 2026-01-15
- 2026-02-12
```

**Required Parameters**:
```
startDate=YYYY-MM-DD
endDate=YYYY-MM-DD
```

**Query Example**:
```
GET /api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12
```

### Response Format

**Success (200 OK)**:
```json
{
  "period": {
    "startDate": "2026-01-13",
    "endDate": "2026-02-12"
  },
  "summary": { ... },
  "data": { ... }
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2026-02-12T10:30:00Z"
}
```

---

## 💰 Endpoint 1: Revenue Intelligence

### Endpoint
```
GET /api/bi/revenue
```

### Parameters
```
startDate (required) - YYYY-MM-DD
endDate (required) - YYYY-MM-DD
```

### Response Structure
```json
{
  "period": {
    "startDate": "2026-01-13",
    "endDate": "2026-02-12"
  },
  "summary": {
    "total_revenue": "45000.00",
    "transaction_count": 120,
    "avg_transaction_value": "375.00",
    "max_transaction": "2500.00",
    "min_transaction": "50.00",
    "paid_invoices": 115,
    "paid_revenue": "44000.00",
    "tax_collected": "4400.00",
    "revenue_growth_pct": "8.5"
  },
  "payment_breakdown": [
    {
      "method": "cash",
      "amount": "15000.00",
      "count": 45,
      "percentage": "33.33"
    },
    {
      "method": "card",
      "amount": "20000.00",
      "count": 60,
      "percentage": "44.44"
    },
    {
      "method": "online",
      "amount": "10000.00",
      "count": 10,
      "percentage": "22.22"
    }
  ],
  "service_breakdown": [
    {
      "service_id": 1,
      "service_name": "Haircut",
      "service_count": 30,
      "revenue": "6000.00",
      "avg_price": "200.00",
      "revenue_share_pct": "13.33"
    }
  ],
  "staff_performance": [
    {
      "staff_id": 1,
      "staff_name": "John Doe",
      "bookings": 45,
      "revenue": "12000.00",
      "avg_value": "266.67",
      "contribution_pct": "26.67"
    }
  ],
  "daily_trend": [
    {
      "date": "2026-01-13",
      "day_name": "Monday",
      "revenue": "1500.00",
      "transactions": 6,
      "unique_customers": 4
    }
  ]
}
```

### Curl Example
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12"
```

### JavaScript Example
```javascript
const response = await fetch('/api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.summary.total_revenue);
```

---

## 📅 Endpoint 2: Booking Analytics

### Endpoint
```
GET /api/bi/bookings
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "summary": {
    "total_bookings": 120,
    "completed_bookings": 110,
    "cancelled_bookings": 10,
    "completion_rate_pct": "91.67",
    "cancellation_rate_pct": "8.33",
    "avg_duration_minutes": 45,
    "total_booking_value": "45000.00",
    "avg_booking_value": "375.00"
  },
  "by_status": [
    { "status": "completed", "count": 110, "percentage": "91.67" },
    { "status": "cancelled", "count": 10, "percentage": "8.33" }
  ],
  "by_type": [
    {
      "type": "walk_in",
      "count": 60,
      "revenue": "22500.00",
      "percentage": "50.00"
    },
    {
      "type": "calling",
      "count": 60,
      "revenue": "22500.00",
      "percentage": "50.00"
    }
  ],
  "daily_trend": [...],
  "service_demand": [...],
  "slot_utilization": [
    {
      "hour": 10,
      "time_slot": "10:00 - 11:00",
      "bookings": 15,
      "percentage": "12.50"
    }
  ]
}
```

---

## 👥 Endpoint 3: Customer Intelligence

### Endpoint
```
GET /api/bi/customers
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "summary": {
    "total_customers": 500,
    "new_customers": 45,
    "customers_with_bookings": 480,
    "total_customer_revenue": "180000.00",
    "avg_customer_lifetime_value": "360.00",
    "retention_rate_pct": "88.5",
    "churn_rate_pct": "11.5"
  },
  "customer_segments": [
    {
      "segment": "VIP (> 10,000)",
      "customer_count": 20,
      "avg_clv": "15000.00",
      "segment_revenue": "300000.00"
    },
    {
      "segment": "Premium (5000-10000)",
      "customer_count": 50,
      "avg_clv": "7500.00",
      "segment_revenue": "375000.00"
    }
  ],
  "booking_frequency": [
    {
      "frequency": "One-time",
      "customer_count": 150,
      "percentage": "30.0"
    }
  ],
  "top_customers": [...]
}
```

---

## 👔 Endpoint 4: Staff Performance

### Endpoint
```
GET /api/bi/staff
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "staff_performance": [
    {
      "staff_id": 1,
      "staff_name": "John Doe",
      "total_bookings": 45,
      "completed_bookings": 43,
      "completion_rate_pct": "95.56",
      "total_revenue": "12000.00",
      "avg_booking_value": "266.67",
      "total_hours_worked": "36.50",
      "avg_booking_duration": "48.89",
      "revenue_contribution_pct": "26.67"
    }
  ],
  "staff_utilization": [
    {
      "staff_id": 1,
      "staff_name": "John Doe",
      "hours_worked": "36.50",
      "utilization_rate_pct": "76.04",
      "working_days": 20
    }
  ],
  "service_specialization": [
    {
      "staff_id": 1,
      "staff_name": "John Doe",
      "top_service": "Haircut",
      "service_count": 30,
      "service_revenue": "6000.00",
      "service_revenue_share_pct": "50.0"
    }
  ],
  "daily_trend": [...]
}
```

---

## 🎫 Endpoint 5: Membership Analytics

### Endpoint
```
GET /api/bi/memberships
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "summary": {
    "total_memberships": 250,
    "active_memberships": 230,
    "expired_memberships": 15,
    "cancelled_memberships": 5,
    "active_rate_pct": "92.0",
    "membership_revenue": "23000.00",
    "renewal_rate_pct": "85.0",
    "estimated_mrr": "1920.00"
  },
  "trend": [
    {
      "date": "2026-01-13",
      "day_name": "Monday",
      "new_memberships": 3,
      "renewal_memberships": 2,
      "daily_revenue": "500.00"
    }
  ],
  "by_type": [
    {
      "membership_type": "monthly",
      "member_count": 150,
      "revenue": "15000.00",
      "avg_fee": "100.00",
      "avg_duration_days": 30
    }
  ]
}
```

---

## 📊 Endpoint 6: Expense & Profit Analysis

### Endpoint
```
GET /api/bi/profit
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "summary": {
    "total_revenue": "45000.00",
    "total_expenses": "15000.00",
    "net_profit": "30000.00",
    "profit_margin_pct": "66.67",
    "expense_ratio_pct": "33.33",
    "expense_per_revenue_unit": "0.3333",
    "avg_daily_expenses": "500.00"
  },
  "expense_breakdown": [
    {
      "category": "Salaries",
      "count": 10,
      "total": "8000.00",
      "avg": "800.00",
      "share_pct": "53.33"
    }
  ],
  "daily_trend": [
    {
      "date": "2026-01-13",
      "day_name": "Monday",
      "revenue": "1500.00",
      "expenses": "500.00",
      "profit": "1000.00",
      "margin_pct": "66.67"
    }
  ]
}
```

---

## ✂️ Endpoint 7: Service Performance

### Endpoint
```
GET /api/bi/services
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "performance": [
    {
      "service_id": 1,
      "service_name": "Haircut",
      "category": "Hair",
      "booking_count": 30,
      "total_revenue": "6000.00",
      "avg_service_price": "200.00",
      "avg_duration_minutes": 30,
      "revenue_share_pct": "13.33",
      "revenue_per_hour": "400.00"
    }
  ],
  "by_category": [
    {
      "category": "Hair",
      "booking_count": 60,
      "revenue": "12000.00",
      "share_pct": "26.67"
    }
  ],
  "peak_times": [
    {
      "service_name": "Haircut",
      "hour": 12,
      "time_slot": "12:00",
      "booking_count": 5
    }
  ],
  "staff_proficiency": [...]
}
```

---

## 🤖 Endpoint 8: AI Forecasting

### Endpoint
```
GET /api/bi/forecast?days=30
```

### Parameters
```
days (optional) - Number of days to forecast (1-90, default: 30)
```

### Response Structure
```json
{
  "historical_performance": [
    {
      "date": "2026-01-13",
      "actual_revenue": "1500.00",
      "transactions": 6,
      "moving_avg_7day": "1450.00",
      "moving_avg_14day": "1420.00"
    }
  ],
  "forecast": {
    "days_ahead": 30,
    "forecasted_values": [
      {
        "date": "2026-02-13",
        "predicted_revenue": "1480.00",
        "confidence_range": {
          "min": "1258.00",
          "max": "1702.00"
        }
      }
    ],
    "methodology": "Exponential Smoothing with 7-day Moving Average (α=0.3)",
    "confidence_level": "85-115% range at 95% confidence"
  },
  "trend_analysis": {
    "weekly_data": [
      {
        "week": 6,
        "revenue": "10500.00",
        "transactions": 42,
        "avg_transaction": "250.00"
      }
    ],
    "trend_direction": "Upward",
    "trend_percentage_change": "8.5"
  }
}
```

---

## 🎛️ Endpoint 9: Consolidated Dashboard

### Endpoint
```
GET /api/bi/dashboard
```

### Response Structure
```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "consolidated_kpis": {
    "total_revenue": "45000.00",
    "total_expenses": "15000.00",
    "net_profit": "30000.00",
    "profit_margin_pct": "66.67",
    "total_bookings": 120,
    "completed_bookings": 110,
    "unique_customers": 480,
    "staff_count": 8
  }
}
```

---

## 🚨 Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data returned successfully |
| 400 | Bad Request | Missing required parameters |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Server Error | Database or server error |

### Error Response Format
```json
{
  "error": "Missing required parameter: startDate",
  "status": 400,
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/bi/revenue"
}
```

### Common Errors

**Missing Date Parameters**:
```json
{
  "error": "startDate and endDate are required (YYYY-MM-DD format)",
  "status": 400
}
```

**Invalid Date Format**:
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "status": 400
}
```

**Unauthorized**:
```json
{
  "error": "Missing or invalid authorization token",
  "status": 401
}
```

**Not Found**:
```json
{
  "error": "BI endpoint not found",
  "status": 404,
  "available_endpoints": [
    "GET /api/bi/revenue",
    "GET /api/bi/bookings",
    ...
  ]
}
```

---

## 💻 Code Examples

### JavaScript/Fetch API

**Get Revenue Data**:
```javascript
async function getRevenueData(startDate, endDate, token) {
  try {
    const response = await fetch(
      `/api/bi/revenue?startDate=${startDate}&endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching revenue data:', error);
    throw error;
  }
}

// Usage
const revenue = await getRevenueData('2026-01-13', '2026-02-12', token);
console.log(`Total Revenue: $${revenue.summary.total_revenue}`);
```

### Axios Example

```javascript
const axios = require('axios');

const biClient = axios.create({
  baseURL: 'http://localhost:3000/api/bi',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

async function getAllData(startDate, endDate) {
  const endpoints = ['revenue', 'bookings', 'customers', 'staff'];
  const requests = endpoints.map(endpoint =>
    biClient.get(`/${endpoint}?startDate=${startDate}&endDate=${endDate}`)
  );
  
  const responses = await Promise.all(requests);
  return responses.map(r => r.data);
}
```

### Node.js Backend Integration

```javascript
const fetch = require('node-fetch');

async function getBIData(module, startDate, endDate, token) {
  const url = `http://localhost:3000/api/bi/${module}?startDate=${startDate}&endDate=${endDate}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Usage in Express route
app.get('/dashboard-data', async (req, res) => {
  try {
    const revenueData = await getBIData('revenue', startDate, endDate, req.token);
    const bookingData = await getBIData('bookings', startDate, endDate, req.token);
    
    res.json({
      revenue: revenueData,
      bookings: bookingData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### React Component Example

```javascript
import { useState, useEffect } from 'react';

function RevenueChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];

        const response = await fetch(
          `/api/bi/revenue?startDate=${startDate}&endDate=${endDate}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Total Revenue: ${data.summary.total_revenue}</h2>
      <p>Growth: {data.summary.revenue_growth_pct}%</p>
    </div>
  );
}
```

---

## ⚡ Performance Considerations

### Rate Limiting
- **Current**: No rate limiting (for internal use)
- **Recommended**: 100 requests per minute per user

### Caching Strategy
```
Cache-Control: max-age=300
// Cache results for 5 minutes
```

### Pagination
```
// Large datasets: Use LIMIT clause
// Default: 10 items per page
// Maximum: 100 items per page
```

### Query Optimization
- Use date ranges to minimize data size
- Summary data loads faster than detailed tables
- Combine multiple endpoints in parallel when possible

### Response Times (Benchmarks)
| Query | Expected Time |
|-------|---------------|
| Revenue Summary | <100ms |
| Revenue with Drill-down | 200-500ms |
| All Charts | 500-1000ms |
| Full Dashboard | 1000-2000ms |
| Large Date Range | 2000-5000ms |

---

## 📋 Request/Response Validation

### Always Validate
```javascript
// Check response structure
if (!data.summary ||  !data.period) {
  throw new Error('Invalid response structure');
}

// Check date range
const start = new Date(data.period.startDate);
const end = new Date(data.period.endDate);
if (start > end) {
  throw new Error('Invalid date range');
}
```

### Handle Large Numbers
```javascript
// Parse decimal numbers carefully
const revenue = parseFloat(data.summary.total_revenue);
console.log(revenue.toFixed(2)); // Always display 2 decimals
```

---

**API Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready ✅
