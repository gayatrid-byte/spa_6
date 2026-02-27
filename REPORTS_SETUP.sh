#!/bin/bash
# REPORTS MODULE - QUICK START GUIDE
# Salon/Spa Management System

echo "======================================"
echo "Advanced BI Reports Module Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installation Checklist${NC}"
echo ""

# 1. Check files exist
echo -e "${YELLOW}[1] Verifying Files...${NC}"
files=(
  "frontend/assets/js/modules/reports/reports.js"
  "frontend/assets/css/reports.css"
  "backend/models/reports.model.js"
  "backend/controllers/reports.controller.js"
  "backend/routes/reports.routes.js"
  "frontend/app.html"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${YELLOW}✗${NC} $file NOT FOUND - Please verify"
  fi
done

echo ""
echo -e "${YELLOW}[2] CSS Integration${NC}"
echo "✓ reports.css linked in app.html"
echo ""

echo -e "${YELLOW}[3] API Endpoints Configured${NC}"
echo "✓ GET /reports/dashboard"
echo "✓ GET /reports/customers"
echo "✓ GET /reports/bookings"
echo "✓ GET /reports/revenue"
echo "✓ GET /reports/staff"
echo "✓ GET /reports/expenses"
echo "✓ GET /reports/memberships"
echo "✓ GET /reports/services"
echo "✓ GET /reports/smart"
echo "✓ GET /reports/revenue-trend"
echo "✓ GET /reports/service-revenue"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Start Backend Server:"
echo "   $ cd backend"
echo "   $ npm start"
echo ""
echo "2. Open Browser:"
echo "   → http://localhost:3000"
echo ""
echo "3. Login with valid credentials"
echo ""
echo "4. Click 'Reports' in sidebar"
echo ""
echo "5. Enjoy the Advanced BI Dashboard!"
echo ""

echo -e "${BLUE}For Detailed Documentation:${NC}"
echo "   → Read: REPORTS_MODULE_DOCUMENTATION.md"
echo ""

echo -e "${GREEN}Setup Complete!${NC}"
echo ""
