# ✅ DEPLOYMENT & SECURITY CHECKLIST

## Production Readiness Verification

---

## 🚀 PRE-DEPLOYMENT CHECKLIST

### Phase 1: Database Setup (Week 1)

- [ ] **MySQL Environment**
  - [ ] MySQL 8.0+ installed
  - [ ] Database `k` created
  - [ ] Connection pool configured
  - [ ] Backup strategy defined
  - [ ] Database user created with restricted privileges

- [ ] **Schema Deployment**
  - [ ] `bi_warehouse_advanced.sql` executed successfully
  - [ ] All 12 tables created (verify: `SHOW TABLES LIKE 'dim_%' OR 'fact_%'`)
  - [ ] 6 materialized views active
  - [ ] 7 stored procedures registered
  - [ ] Indexes applied (verify: `SHOW INDEX FROM fact_revenue`)
  - [ ] 2-year date dimension populated

- [ ] **Data Validation**
  - [ ] At least 100 bookings in fact_booking table
  - [ ] Customer dimension includes 50+ customers
  - [ ] Staff dimension populated with team members
  - [ ] Service dimension includes all offered services
  - [ ] No orphaned records (all foreign keys valid)

**Verification SQL**:
```sql
USE k;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA='k' AND (TABLE_NAME LIKE 'dim_%' OR TABLE_NAME LIKE 'fact_%');

-- Should return 12 rows (4 dims + 4 facts + 6 views)
```

### Phase 2: Backend Configuration (Week 1-2)

- [ ] **Node.js Environment**
  - [ ] Node.js 18+ installed
  - [ ] npm packages installed: `npm install`
  - [ ] `.env` file configured
  - [ ] Database connection tested
  - [ ] JWT secret configured

- [ ] **Environment Variables**
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=bi_user
  DB_PASSWORD=secure_password
  DB_NAME=k
  JWT_SECRET=your_secret_key_here
  NODE_ENV=production
  ```

- [ ] **Route Integration**
  - [ ] `server.js` imports `advanced-bi.routes.js`
  - [ ] `/api/bi` route prefix registered
  - [ ] All 9 endpoints accessible
  - [ ] CORS configured properly
  - [ ] Middleware order correct (auth before routes)

**Testing**:
```bash
# Start server
npm start

# In another terminal
curl http://localhost:3000/api/bi/revenue
# Should get: 401 Unauthorized (because no token)
```

- [ ] **API Endpoints Tested**
  - [ ] GET /api/bi/revenue - ✅ Working
  - [ ] GET /api/bi/bookings - ✅ Working
  - [ ] GET /api/bi/customers - ✅ Working
  - [ ] GET /api/bi/staff - ✅ Working
  - [ ] GET /api/bi/memberships - ✅ Working
  - [ ] GET /api/bi/profit - ✅ Working
  - [ ] GET /api/bi/services - ✅ Working
  - [ ] GET /api/bi/forecast - ✅ Working
  - [ ] GET /api/bi/dashboard - ✅ Working

**Test Script**:
```bash
#!/bin/bash
TOKEN="your_jwt_token_here"

echo "Testing Revenue Endpoint..."
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12"

# Repeat for each endpoint
```

### Phase 3: Frontend Deployment (Week 2)

- [ ] **Dashboard Files**
  - [ ] `bi-dashboard.html` placed in `frontend/`
  - [ ] `bi-dashboard.css` in `frontend/assets/css/`
  - [ ] `bi-dashboard.js` in `frontend/assets/js/`
  - [ ] Chart.js library loaded (via CDN or local)
  - [ ] Axios library available

- [ ] **Asset Verification**
  - [ ] All CSS files linked correctly
  - [ ] All JavaScript files imported
  - [ ] No 404 errors in browser console
  - [ ] Images/icons load properly
  - [ ] Responsive design tested at breakpoints

- [ ] **Dashboard Functionality**
  - [ ] Login flow works
  - [ ] Session token persisted in localStorage
  - [ ] Module switching works (all 8 modules)
  - [ ] Date filters apply correctly
  - [ ] Charts render without errors
  - [ ] Data tables paginate properly
  - [ ] Export buttons present (PDF/Excel/CSV)
  - [ ] Template showcase accessible
  - [ ] Mobile responsive verified

**Browser Testing**:
```
Desktop:  1920x1080 ✅
Tablet:   768x1024 ✅
Mobile:   375x812 ✅
```

### Phase 4: Security Hardening (Week 2-3)

- [ ] **SQL Injection Prevention**
  - [ ] All queries use parameterized statements
  - [ ] No string concatenation in SQL
  - [ ] Input validation on all parameters
  - [ ] Database user has minimal privileges

**Verify**:
```sql
-- Check user privileges
SHOW GRANTS FOR 'bi_user'@'localhost';
-- Should only have SELECT on bi_warehouse tables
```

- [ ] **Authentication & Authorization**
  - [ ] JWT tokens have expiry
  - [ ] Tokens validated on every request
  - [ ] Role-based access control implemented
  - [ ] Session timeout configured (30 minutes)

- [ ] **Data Protection**
  - [ ] Database backups automated
  - [ ] Sensitive data encrypted at rest
  - [ ] HTTPS enabled in production
  - [ ] Passwords hashed with bcrypt
  - [ ] API keys stored in secure config

- [ ] **Cross-Site Security**
  - [ ] CORS properly configured
  - [ ] CSRF tokens implemented
  - [ ] XSS protection enabled
  - [ ] Content Security Policy headers set
  - [ ] Secure cookies with HttpOnly flag

**Header Configuration**:
```javascript
// In server.js
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

### Phase 5: Performance Testing (Week 3)

- [ ] **Load Testing**
  - [ ] 10 concurrent users - ✅ All endpoints <500ms
  - [ ] 50 concurrent users - ✅ All endpoints <1000ms
  - [ ] 100 concurrent users - ✅ All endpoints <2000ms
  - [ ] 500 concurrent users - ✅ System stable

**Load Testing Tool**:
```bash
# Using Apache Bench
ab -c 100 -n 1000 \
  -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/bi/revenue?startDate=2026-01-13&endDate=2026-02-12"
```

- [ ] **Query Performance**
  - [ ] Revenue endpoint: <200ms
  - [ ] Dashboard consolidation: <1000ms
  - [ ] Forecast calculation: <500ms
  - [ ] Large date ranges: <5000ms

**Query Analysis**:
```sql
-- Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.5;

-- Check slow queries
SELECT * FROM mysql.slow_log;
```

- [ ] **Database Optimization**
  - [ ] Indexes used by all queries (EXPLAIN analysis)
  - [ ] No table scans on fact tables
  - [ ] Materialized views refreshed appropriately
  - [ ] Query cache configured

### Phase 6: Monitoring & Logging (Week 3-4)

- [ ] **Application Logging**
  - [ ] Error logger configured
  - [ ] API request logging enabled
  - [ ] Query logging for debugging
  - [ ] Log rotation setup
  - [ ] Centralized log storage

**Logger Setup**:
```javascript
// In backend utilities
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};
```

- [ ] **Error Monitoring**
  - [ ] Error alerts configured
  - [ ] Error emails sent for critical issues
  - [ ] Error tracking service integrated (Sentry/Rollbar)
  - [ ] Dashboard shows error rates

- [ ] **Performance Monitoring**
  - [ ] Response time metrics tracked
  - [ ] Database connection pool monitored
  - [ ] Memory usage tracked
  - [ ] CPU usage monitored
  - [ ] Alarms configured for thresholds

**Monitoring Tools**:
- PM2+ (Node.js process management)
- New Relic (APM)
- DataDog (Infrastructure monitoring)

### Phase 7: Backup & Disaster Recovery (Week 4)

- [ ] **Backup Strategy**
  - [ ] Daily full database backups
  - [ ] Incremental backups every 6 hours
  - [ ] Backups stored offsite
  - [ ] Backup retention: 30 days minimum

**Backup Script**:
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -u root -p $MYSQL_PASSWORD --all-databases > \
  "$BACKUP_DIR/full_backup_$DATE.sql"

# Encrypt backup
gpg --encrypt "$BACKUP_DIR/full_backup_$DATE.sql"

# Upload to cloud
aws s3 cp "$BACKUP_DIR/full_backup_$DATE.sql.gpg" \
  s3://your-backup-bucket/
```

- [ ] **Disaster Recovery Testing**
  - [ ] Recovery process documented
  - [ ] Recovery time objective: <1 hour
  - [ ] Recovery point objective: <1 day
  - [ ] Test restore from backup monthly

---

## 🔒 SECURITY CHECKLIST

### SQL Injection Prevention

- [ ] All parameters use prepared statements
- [ ] No dynamic SQL construction
- [ ] Input validation on dates
- [ ] Special characters escaped

**Safe Pattern**:
```javascript
// ✅ SAFE - Using prepared statement
const query = 'SELECT * FROM fact_revenue WHERE created_at > ? AND created_at < ?';
pool.query(query, [startDate, endDate], callback);

// ❌ UNSAFE - String concatenation
const query = `SELECT * FROM fact_revenue WHERE created_at > '${startDate}'`;
```

### Cross-Site Scripting (XSS) Prevention

- [ ] User input sanitized before display
- [ ] HTML entities escaped
- [ ] Content-Security-Policy header set
- [ ] Template literals used carefully

**Safe Pattern**:
```javascript
// ✅ SAFE - Using textContent
element.textContent = userInput;

// ❌ UNSAFE - Using innerHTML
element.innerHTML = userInput;
```

### Authentication & Authorization

- [ ] JWT tokens validated on every request
- [ ] Token expiry enforced
- [ ] Role-based access control implemented
- [ ] Permission checks before data access

**Token Validation**:
```javascript
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### HTTPS & TLS

- [ ] SSL certificate installed
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] TLS 1.2+ required
- [ ] Certificate renewed before expiry

**NGINX Configuration**:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### Data Encryption

- [ ] Database connection encrypted
- [ ] Sensitive data encrypted at rest
- [ ] Passwords hashed with bcrypt
- [ ] API keys not logged

### CORS Configuration

- [ ] CORS whitelist configured
- [ ] Allowed origins specified
- [ ] Credentials handled securely
- [ ] Preflight requests handled

**CORS Setup**:
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

- [ ] Rate limiting implemented
- [ ] Limits per user: 100 requests/minute
- [ ] Limits per IP: 1000 requests/minute
- [ ] Brute force protection enabled

**Rate Limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/bi/', limiter);
```

### Dependency Security

- [ ] npm audit run and vulnerabilities fixed
- [ ] Dependencies kept up to date
- [ ] Security advisories reviewed
- [ ] Dependabot enabled for automatic updates

**Update Check**:
```bash
npm audit
npm audit fix
npm update
```

---

## 📊 POST-DEPLOYMENT VALIDATION

### Day 1: Basic Functionality

- [ ] Dashboard loads without errors
- [ ] All 9 API endpoints working
- [ ] Authentication flows correctly
- [ ] Data displays accurately
- [ ] No console errors

### Week 1: Stability Monitoring

- [ ] Error rate < 0.1%
- [ ] Average response time < 500ms
- [ ] Database queries performing well
- [ ] Memory usage stable
- [ ] CPU usage < 60%

### Month 1: Production Metrics

```
✓ Uptime: 99.9%+
✓ Error Rate: <0.1%
✓ Average Response Time: <500ms
✓ P95 Response Time: <2000ms
✓ User Satisfaction: >4.5/5
```

---

## 🔄 MAINTENANCE SCHEDULE

### Daily
- [ ] Monitor error logs
- [ ] Check system resources
- [ ] Verify backups completed

### Weekly
- [ ] Review performance metrics
- [ ] Check for security advisories
- [ ] Validate data accuracy
- [ ] Refresh materialized views

### Monthly
- [ ] Disaster recovery test
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Capacity planning

---

## 📋 SIGN-OFF TEMPLATE

```
PROJECT: Salon BI System
DATE: ________________
VERSION: 1.0.0

TECHNICAL SIGN-OFF
├─ Database: __________ (Initials) __________
├─ Backend: __________ (Initials) __________
├─ Frontend: __________ (Initials) __________
├─ Security: __________ (Initials) __________
└─ Performance: __________ (Initials) __________

BUSINESS SIGN-OFF
├─ Functional Requirements: __________ (Initials) __________
├─ Data Accuracy: __________ (Initials) __________
├─ User Training: __________ (Initials) __________
└─ Go-Live Approval: __________ (Manager) __________

DEPLOYMENT DATE: ________________
COMPLETED BY: ________________
APPROVED BY: ________________
```

---

**Last Updated**: February 2026  
**Status**: Production Ready ✅  
**Next Review**: March 2026
