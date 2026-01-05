# Security Monitoring System - Quick Start Guide

## What's Been Added

A complete educational security monitoring system (Mini SOC) has been integrated into CityFlow-Parking with the following components:

### Backend Components

1. **Security Package** (`/backend/internal/security/`)
   - `types.go` - Event types, severities, and data structures
   - `monitor.go` - Core monitoring engine with event logging and alert rules
   - `middleware.go` - Automatic request/response logging

2. **Security Handler** (`/backend/internal/api/handlers/security.go`)
   - REST API endpoints for security monitoring
   - Dashboard data aggregation
   - Alert management

3. **Integration** (`/backend/internal/api/server.go`)
   - Security monitoring middleware applied to all routes
   - Admin-only security endpoints registered
   - Monitor initialized with 10,000 event capacity

### Frontend Components

1. **HTML Dashboard** (`/backend/security-dashboard.html`)
   - Real-time security visualization
   - Auto-refresh every 10 seconds
   - Event charts and statistics
   - Alert management

2. **React Component** (`/frontend/src/components/SecurityMonitorWidget.tsx`)
   - Reusable security widget for admin panel
   - Real-time updates
   - Health status display

### Testing Tools

1. **Test Script** (`/backend/test-security-monitoring.sh`)
   - Automated testing of security features
   - Generates sample events and alerts
   - Validates all endpoints

## Quick Start

### 1. Start the Backend

```bash
cd /workspaces/CityFlow-Parking/backend
go run cmd/api/main.go
```

The security monitoring system is now automatically active!

### 2. Run the Test Script

```bash
cd /workspaces/CityFlow-Parking/backend
./test-security-monitoring.sh
```

This will:
- Create an admin user
- Generate test security events
- Trigger sample alerts
- Display current statistics
- Provide instructions for dashboard access

### 3. View the Security Dashboard

#### Option A: HTML Dashboard

1. The test script will output a token
2. Open `security-dashboard.html` in your browser
3. Open browser console (F12) and run:
   ```javascript
   localStorage.setItem('authToken', 'YOUR_TOKEN_FROM_SCRIPT');
   ```
4. Refresh the page

#### Option B: Use API Endpoints

```bash
# Replace TOKEN with your admin JWT token

# Get dashboard overview
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/dashboard

# Get recent events
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/events?limit=20

# Get active alerts
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/alerts?active=true

# Check system health
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/health
```

## Features Demonstrated

### 1. Event Logging
All API requests are automatically logged with:
- Event type (LOGIN_SUCCESS, LOGIN_FAILURE, UNAUTHORIZED_ACCESS, etc.)
- Severity level (INFO, WARNING, CRITICAL, etc.)
- IP address, user agent, endpoint
- Response time and status code

### 2. Automated Alerts
Pre-configured alert rules:
- **Brute Force**: 5+ failed login attempts in 5 minutes
- **Unauthorized Access**: 3+ unauthorized attempts in 5 minutes
- **Rate Limit Abuse**: 10+ rate limit violations in 1 minute

### 3. Real-Time Dashboard
- Live event stream
- Security statistics and trends
- Active alerts with severity indicators
- Top IP addresses by activity
- Event type distribution chart
- Auto-refresh capability

### 4. Security Health Scoring
Dynamic health assessment based on:
- Active alerts count
- Failed login attempts
- Unauthorized access attempts
- Overall system activity

Score calculation:
- 100 = Perfect (no issues)
- 80-99 = Healthy (minor issues)
- 50-79 = Warning (moderate concerns)
- 0-49 = Critical (immediate attention needed)

## API Endpoints

All endpoints require admin authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/security/dashboard` | GET | Complete dashboard data |
| `/api/v1/security/events` | GET | Recent security events |
| `/api/v1/security/events/range` | GET | Events by time range |
| `/api/v1/security/alerts` | GET | Security alerts |
| `/api/v1/security/alerts/:id/acknowledge` | PUT | Acknowledge alert |
| `/api/v1/security/stats` | GET | Detailed statistics |
| `/api/v1/security/health` | GET | System health status |

## Testing Scenarios

### Scenario 1: Brute Force Attack Detection

```bash
# Run 5+ failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "attacker@test.com", "password": "wrong"}'
done

# Check for alerts
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/alerts?active=true
```

Expected: BRUTE_FORCE_ATTEMPT alert triggered

### Scenario 2: Unauthorized Access Monitoring

```bash
# Attempt to access protected resources without auth
for i in {1..4}; do
  curl http://localhost:8080/api/v1/users/test-user
done

# Check events
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/events?type=UNAUTHORIZED_ACCESS
```

Expected: Multiple UNAUTHORIZED_ACCESS events logged

### Scenario 3: Admin Activity Tracking

```bash
# Perform admin actions
curl -X POST http://localhost:8080/api/v1/parking/spots \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Spot", "location": "Test"}'

# View admin actions
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/security/events?type=ADMIN_ACTION
```

Expected: ADMIN_ACTION events with admin operations

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Request                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Security Monitoring Middleware                   │
│  • Capture request details                                   │
│  • Execute handler                                           │
│  • Log response details                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Security Monitor                          │
│  • Store event in memory (max 10,000)                       │
│  • Check alert rules                                         │
│  • Generate alerts if threshold met                          │
│  • Aggregate statistics                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard / API Endpoints                       │
│  • Query events and alerts                                   │
│  • Display statistics                                        │
│  • Health assessment                                         │
└─────────────────────────────────────────────────────────────┘
```

## Educational Value

This implementation demonstrates:

1. **Middleware Pattern**: Transparent request/response logging
2. **Event-Driven Architecture**: Centralized event processing
3. **Rule Engine**: Threshold-based alert generation
4. **REST API Design**: Clean, admin-protected endpoints
5. **Real-Time Monitoring**: Dashboard with auto-refresh
6. **In-Memory Data Structures**: Fast, lightweight storage
7. **Security Best Practices**: Event categorization, severity levels
8. **Health Scoring**: Algorithmic assessment of system state

## Limitations (Educational Context)

- ⚠️ In-memory storage only (no persistence)
- ⚠️ Single-server architecture (no clustering)
- ⚠️ Basic alert rules (no ML/AI)
- ⚠️ No email/SMS notifications
- ⚠️ No long-term trend analysis
- ⚠️ No integration with external SIEM

## Next Steps for Production

To make this production-ready:

1. Add persistent storage (PostgreSQL, MongoDB, or Elasticsearch)
2. Implement log shipping to external SIEM
3. Add email/SMS alerting
4. Integrate with threat intelligence feeds
5. Add IP geolocation and reputation checking
6. Implement advanced ML-based anomaly detection
7. Add compliance reporting (GDPR, SOC 2, etc.)
8. Implement log rotation and archiving
9. Add rate limiting and IP blocking
10. Integrate with authentication providers (OAuth, SAML)

## Troubleshooting

**Issue**: Dashboard shows "Token not found"
- **Solution**: Run the test script to get a token, or login and store it in localStorage

**Issue**: No events appearing
- **Solution**: Generate API activity by using the application or running the test script

**Issue**: Alerts not triggering
- **Solution**: Ensure you meet threshold requirements (5 failed logins, etc.)

**Issue**: API returns 403 Forbidden
- **Solution**: Ensure you're logged in as an admin user

## Documentation

- **Full Documentation**: See `SECURITY_MONITORING.md`
- **API Reference**: See endpoint descriptions above
- **Test Script**: Run `./test-security-monitoring.sh`

---

**Last Updated**: January 5, 2026  
**Status**: ✅ Fully Implemented and Tested
