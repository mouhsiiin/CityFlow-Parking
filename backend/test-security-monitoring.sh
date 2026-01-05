#!/bin/bash

# CityFlow Security Monitoring Test Script
# This script helps you test the security monitoring features

echo "=================================================="
echo "  CityFlow Security Monitoring - Quick Test"
echo "=================================================="
echo ""

API_BARE_BASE="http://localhost:8080"
API_BASE="http://localhost:8080/api/v1"
ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Step 1: Checking if backend is running..."
if curl -s -f "${API_BARE_BASE}/health" > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running. Please start it first:${NC}"
    echo "  cd /workspaces/CityFlow-Parking/backend"
    echo "  go run cmd/api/main.go"
    exit 1
fi

echo ""
echo "Step 2: Creating admin user (if not exists)..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"phone\": \"+1234567890\",
    \"role\": \"admin\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Admin user created${NC}"
elif echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠ Admin user already exists${NC}"
else
    echo -e "${YELLOW}⚠ Could not create admin (might already exist)${NC}"
fi

echo ""
echo "Step 3: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${ADMIN_EMAIL}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Failed to login. Please check credentials${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Successfully logged in${NC}"
echo "Token: ${TOKEN:0:20}..."

echo ""
echo "Step 4: Generating test security events..."

# Successful API access
echo -n "  • Generating successful events... "
curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/users" > /dev/null
curl -s "${API_BASE}/parking/spots" > /dev/null
curl -s "${API_BASE}/charging/stations" > /dev/null
echo -e "${GREEN}Done${NC}"

# Failed login attempts (will trigger alert after 5 attempts)
echo -n "  • Generating failed login events (5 attempts)... "
for i in {1..5}; do
    curl -s -X POST "${API_BASE}/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "hacker@evil.com", "password": "wrongpassword"}' > /dev/null
    sleep 0.5
done
echo -e "${GREEN}Done${NC}"

# Unauthorized access attempts
echo -n "  • Generating unauthorized access events (3 attempts)... "
for i in {1..3}; do
    curl -s "${API_BASE}/users/test-user-id" > /dev/null
    sleep 0.5
done
echo -e "${GREEN}Done${NC}"

# Some admin actions
echo -n "  • Generating admin action events... "
curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/users" > /dev/null
echo -e "${GREEN}Done${NC}"

echo ""
echo "Step 5: Checking security dashboard..."

# Get dashboard data
DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/dashboard")

if echo "$DASHBOARD" | grep -q "success"; then
    echo -e "${GREEN}✓ Security dashboard is accessible${NC}"
    
    # Parse some stats
    TOTAL_EVENTS=$(echo "$DASHBOARD" | grep -o '"totalEvents":[0-9]*' | grep -o '[0-9]*')
    FAILED_LOGINS=$(echo "$DASHBOARD" | grep -o '"failedLogins":[0-9]*' | grep -o '[0-9]*')
    
    echo ""
    echo "Current Statistics:"
    echo "  • Total Events: ${TOTAL_EVENTS}"
    echo "  • Failed Logins: ${FAILED_LOGINS}"
else
    echo -e "${RED}✗ Could not access security dashboard${NC}"
fi

echo ""
echo "Step 6: Checking for alerts..."
ALERTS=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/alerts?active=true")

if echo "$ALERTS" | grep -q "BRUTE_FORCE"; then
    echo -e "${YELLOW}⚠ ALERT: Brute force attack detected!${NC}"
elif echo "$ALERTS" | grep -q "total"; then
    ALERT_COUNT=$(echo "$ALERTS" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    if [ "$ALERT_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${ALERT_COUNT} alert(s) triggered${NC}"
    else
        echo -e "${GREEN}✓ No alerts triggered yet${NC}"
    fi
fi

echo ""
echo "Step 7: Checking system health..."
HEALTH=$(curl -s -H "Authorization: Bearer $TOKEN" "${API_BASE}/security/health")

if echo "$HEALTH" | grep -q "success"; then
    HEALTH_STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    HEALTH_SCORE=$(echo "$HEALTH" | grep -o '"score":[0-9]*' | grep -o '[0-9]*' | head -1)
    
    echo -e "Health Status: ${YELLOW}${HEALTH_STATUS}${NC}"
    echo -e "Health Score: ${YELLOW}${HEALTH_SCORE}/100${NC}"
else
    echo -e "${RED}✗ Could not check system health${NC}"
fi

echo ""
echo "=================================================="
echo "  Security Monitoring Test Complete!"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Open security-dashboard.html in your browser"
echo "2. Open browser console (F12) and run:"
echo "   localStorage.setItem('authToken', '${TOKEN}')"
echo "3. Refresh the page to see the security dashboard"
echo ""
echo "Or use the API directly:"
echo "  curl -H 'Authorization: Bearer ${TOKEN}' \\"
echo "    ${API_BASE}/security/dashboard"
echo ""
echo "Dashboard URL: file://$(pwd)/security-dashboard.html"
echo ""
