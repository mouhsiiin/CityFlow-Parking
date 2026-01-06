# Security & Monitoring Documentation

Complete guide for the security monitoring system (Mini SOC) in CityFlow Smart Parking & EV Charging System.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Security Event Types](#security-event-types)
- [Alert Rules](#alert-rules)
- [API Endpoints](#api-endpoints)
- [Security Dashboard](#security-dashboard)
- [Testing Scenarios](#testing-scenarios)
- [Architecture](#architecture)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)

## Overview

CityFlow includes an educational security monitoring system (Mini SOC - Security Operations Center) that provides:
- Real-time log monitoring
- Security event detection
- Automated alerting
- Security health scoring
- Interactive dashboard

This is designed as an **educational tool** to demonstrate security monitoring concepts in a blockchain-based application.

## Features

### 1. Security Event Logging
- Automatic logging of all API requests and responses
- Event categorization by type and severity
- Detailed metadata: IP address, user agent, endpoint, response time
- Timestamp tracking for all events

### 2. Automated Alert System
- Real-time alert generation based on predefined rules
- Alert severity levels: Low, Medium, High, Critical
- Alert acknowledgment and resolution tracking
- Alert history and statistics

### 3. Security Dashboard
- Real-time system health monitoring
- Event statistics and trends
- Active alerts display
- Top IP addresses and endpoints tracking
- Visual event distribution charts

### 4. Security Health Score
- Automatic calculation based on recent events
- Factors: failed logins, unauthorized access, alerts, errors
- Score range: 0-100 (higher is better)
- Real-time score updates

## Quick Start

### 1. Start the Backend

```bash
cd backend
./start.sh

# Or manually:
go build -o bin/api ./cmd/api
./bin/api
```

### 2. Create Admin User

```bash
# Register admin user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityflow.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "admin"
  }'

# Login to get token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityflow.com",
    "password": "admin123"
  }'
```

Save the returned token for use in subsequent requests.

### 3. Access Security Dashboard

#### Option A: HTML Dashboard

```bash
# Open in browser
open backend/security-dashboard.html

# Or use curl to fetch it
curl http://localhost:8080/security-dashboard.html
```

The dashboard will:
1. Prompt for admin token
2. Load security data automatically
3. Refresh every 30 seconds
4. Display real-time alerts and events

#### Option B: Use API Endpoints

```bash
# Replace TOKEN with your admin JWT token
export TOKEN="your_jwt_token_here"

# Get dashboard overview
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/security/dashboard

# Get recent events
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/security/events?limit=50

# Get active alerts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/security/alerts?status=active

# Check system health
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/security/health
```

### 4. Run Test Script

Generate test security events:

```bash
cd backend
chmod +x test-security-monitoring.sh
./test-security-monitoring.sh
```

This will:
- Create 5+ failed login attempts (triggers brute force alert)
- Create unauthorized access attempts
- Create successful logins
- Create various API events

## Security Event Types

The system tracks the following event types:

| Event Type | Description | Severity |
|------------|-------------|----------|
| `LOGIN_SUCCESS` | Successful user authentication | Info |
| `LOGIN_FAILURE` | Failed login attempts | Warning |
| `UNAUTHORIZED_ACCESS` | Attempts to access protected resources without auth | Warning |
| `SUSPICIOUS_ACTIVITY` | Unusual API behavior patterns | High |
| `RATE_LIMIT_EXCEEDED` | Rate limit violations | Medium |
| `DATA_ACCESS` | General data access events | Info |
| `DATA_MODIFICATION` | Data modification operations | Medium |
| `API_ERROR` | API errors (5xx status codes) | High |
| `ADMIN_ACTION` | Administrative operations | Info |

## Alert Rules

The system includes predefined alert rules that automatically trigger:

### 1. Brute Force Detection
**Trigger**: 5+ failed login attempts within 5 minutes  
**Severity**: High  
**Description**: Possible brute force attack detected

```json
{
  "rule": "brute_force_detection",
  "threshold": 5,
  "timeWindow": "5 minutes",
  "action": "Create alert and notify admin"
}
```

### 2. Unauthorized Access Pattern
**Trigger**: 3+ unauthorized access attempts within 5 minutes  
**Severity**: Medium  
**Description**: Multiple unauthorized access attempts

```json
{
  "rule": "unauthorized_access_pattern",
  "threshold": 3,
  "timeWindow": "5 minutes",
  "action": "Create alert"
}
```

### 3. Rate Limit Abuse
**Trigger**: 10+ rate limit exceeded events within 1 minute  
**Severity**: Medium  
**Description**: Possible API abuse or DoS attempt

```json
{
  "rule": "rate_limit_abuse",
  "threshold": 10,
  "timeWindow": "1 minute",
  "action": "Create alert and potentially block IP"
}
```

## API Endpoints

All security endpoints require admin authentication. Include `Authorization: Bearer <token>` header.

### GET `/api/v1/security/dashboard`
Get comprehensive security dashboard data.

**Query Parameters**:
- `since` (optional): ISO 8601 timestamp, defaults to 24 hours ago

**Response**:
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalEvents": 150,
      "eventsByType": {
        "LOGIN_SUCCESS": 45,
        "LOGIN_FAILURE": 5,
        "UNAUTHORIZED_ACCESS": 2
      },
      "eventsBySeverity": {
        "info": 100,
        "warning": 30,
        "high": 15,
        "critical": 5
      },
      "failedLogins": 5,
      "unauthorizedAccess": 2,
      "topIpAddresses": [
        {"ip": "192.168.1.100", "count": 50}
      ],
      "topEndpoints": [
        {"endpoint": "/api/v1/auth/login", "count": 50}
      ],
      "alertCount": 3,
      "activeAlerts": 1
    },
    "alerts": []
  }
}
```

### GET `/api/v1/security/events`
Get recent security events with optional filtering.

**Query Parameters**:
- `limit` (optional): Number of events (default: 100, max: 1000)
- `type` (optional): Filter by event type
- `severity` (optional): Filter by severity level

**Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/security/events?limit=50&type=LOGIN_FAILURE&severity=warning"
```

### GET `/api/v1/security/events/range`
Get events within a specific time range.

**Query Parameters**:
- `start` (required): Start time in RFC3339 format
- `end` (required): End time in RFC3339 format

**Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/security/events/range?start=2026-01-01T00:00:00Z&end=2026-01-05T23:59:59Z"
```

### GET `/api/v1/security/alerts`
Get security alerts.

**Query Parameters**:
- `status` (optional): Filter by status (active, acknowledged, resolved)
- `severity` (optional): Filter by severity (low, medium, high, critical)

### PUT `/api/v1/security/alerts/:id/acknowledge`
Acknowledge a security alert.

**Body**:
```json
{
  "acknowledgedBy": "admin@cityflow.com",
  "notes": "Investigating the issue"
}
```

### GET `/api/v1/security/stats`
Get aggregated security statistics.

**Query Parameters**:
- `period` (optional): Time period (hour, day, week, month)

### GET `/api/v1/security/health`
Get system security health score and status.

**Response**:
```json
{
  "status": "success",
  "data": {
    "score": 85,
    "status": "good",
    "metrics": {
      "failedLogins": 2,
      "unauthorizedAccess": 0,
      "activeAlerts": 1,
      "errorRate": 0.5
    },
    "recommendations": [
      "Monitor failed login attempts"
    ]
  }
}
```

## Security Dashboard

The HTML dashboard (`backend/security-dashboard.html`) provides:

### Features
- **System Health**: Visual health score indicator
- **Event Statistics**: Total events, events by type and severity
- **Active Alerts**: Real-time alert notifications
- **Recent Events**: Last 50 security events with details
- **Top IP Addresses**: Most active IPs
- **Event Distribution**: Visual chart of event types
- **Auto-Refresh**: Updates every 30 seconds

### Usage
1. Open `security-dashboard.html` in a web browser
2. Enter admin JWT token when prompted
3. Dashboard loads automatically
4. View real-time security data
5. Click on alerts to acknowledge or resolve

## Testing Scenarios

### Scenario 1: Brute Force Attack Detection

Simulate multiple failed login attempts:

```bash
# Run 5+ failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  sleep 1
done

# Check for alerts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/security/alerts?status=active
```

Expected: Brute force alert should be generated after 5 failed attempts.

### Scenario 2: Unauthorized Access Monitoring

Attempt to access protected resources without authentication:

```bash
# Attempt to access protected resources
curl http://localhost:8080/api/v1/parking/spots
curl http://localhost:8080/api/v1/users/123
curl http://localhost:8080/api/v1/wallet

# Check events
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/security/events?type=UNAUTHORIZED_ACCESS"
```

Expected: Unauthorized access events should be logged.

### Scenario 3: Admin Activity Tracking

Perform admin actions and track them:

```bash
# Perform admin actions
curl -X POST http://localhost:8080/api/v1/parking/spots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'

# View admin actions
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/security/events?type=ADMIN_ACTION"
```

Expected: Admin actions should be logged with full details.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Security Monitor                      │
│  - Event logging                                        │
│  - Alert rule engine                                    │
│  - Health score calculator                              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  API Middleware                          │
│  - Intercepts all requests                              │
│  - Logs security events                                 │
│  - Checks authentication                                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────────┐
│               Backend API Handlers                       │
│  - Authentication handlers                              │
│  - Security API endpoints                               │
│  - Admin operations                                     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Blockchain Storage                        │
│  - Event persistence (optional)                         │
│  - Audit trail                                          │
│  - Immutable records                                    │
└─────────────────────────────────────────────────────────┘
```

### Event Flow

1. **Request Received** → API middleware intercepts
2. **Event Created** → Details extracted (IP, endpoint, user, etc.)
3. **Event Logged** → Stored in memory/blockchain
4. **Rules Evaluated** → Alert rules checked
5. **Alert Generated** → If threshold exceeded
6. **Health Updated** → Security score recalculated
7. **Dashboard Updated** → Real-time display refreshed

### Data Storage

- **In-Memory**: Fast access for real-time monitoring (current implementation)
- **Blockchain**: Optional immutable audit trail
- **External SIEM**: Can be integrated for production use

## Integration Guide

### Frontend Integration

#### 1. Install Security Components

The frontend includes security monitoring components:
- `SecurityDashboard`: Admin dashboard view
- `SecurityAlerts`: Alert notification system
- `SecurityEventLog`: Event viewer

#### 2. Add Security Routes

```typescript
// src/App.tsx
import SecurityDashboard from './pages/SecurityDashboard';

<Route path="/admin/security" element={
  <ProtectedRoute adminOnly>
    <SecurityDashboard />
  </ProtectedRoute>
} />
```

#### 3. Use Security Context

```typescript
// src/context/SecurityContext.tsx
import { useSecurityContext } from '../context/SecurityContext';

function SecurityComponent() {
  const { events, alerts, healthScore } = useSecurityContext();
  
  return (
    <div>
      <h2>Security Health: {healthScore}</h2>
      <AlertList alerts={alerts} />
      <EventList events={events} />
    </div>
  );
}
```

### Backend Integration

Security monitoring is automatically enabled. To customize:

```go
// internal/security/monitor.go
securityMonitor := security.NewMonitor(
  security.WithAlertRules(customRules),
  security.WithRetentionPeriod(7 * 24 * time.Hour),
  security.WithHealthScoreCalc(customCalculator),
)
```

## Best Practices

### For Development
1. **Enable Detailed Logging**: Set log level to DEBUG
2. **Test All Scenarios**: Use test script to verify alert rules
3. **Review Events Regularly**: Check dashboard for anomalies
4. **Customize Alert Rules**: Adjust thresholds based on your needs

### For Production (Future Enhancements)
1. **Persistent Storage**: Implement database for event storage
2. **External SIEM Integration**: Connect to enterprise SIEM systems
3. **Email/SMS Alerts**: Add notification channels
4. **Rate Limiting**: Implement IP-based rate limiting
5. **Geolocation**: Add IP geolocation for better context
6. **Machine Learning**: Implement anomaly detection
7. **Compliance Reports**: Generate audit reports for compliance
8. **Multi-tenancy**: Support multiple organizations

## Security Considerations

### Current Limitations (Educational)
- Events stored in memory (lost on restart)
- No IP blocking mechanism
- Basic alert rules only
- No external notifications
- Limited to single instance

### Production Requirements
- Persistent event storage
- Distributed monitoring across instances
- External notification system (email, SMS, Slack)
- IP blocking and rate limiting
- Integration with enterprise SIEM
- Compliance reporting (GDPR, SOC2, etc.)
- Encrypted event storage
- Role-based access control for security data

## Troubleshooting

### Dashboard Shows "Token not found"
1. Ensure you're logged in as admin
2. Token must be stored in localStorage
3. Token must have admin privileges
4. Token must not be expired

### No Events Showing
1. Ensure backend is running
2. Generate test events: `./test-security-monitoring.sh`
3. Check API logs: `tail -f logs/api.log`
4. Verify admin authentication

### Alerts Not Triggering
1. Ensure enough events to exceed threshold
2. Check time window (events must be within window)
3. Review alert rules configuration
4. Check backend logs for errors

## Testing Checklist

- [ ] Backend running and accessible
- [ ] Admin user created and can login
- [ ] Security dashboard loads successfully
- [ ] Test script runs without errors
- [ ] Failed login events are logged
- [ ] Brute force alert triggers after 5 failed logins
- [ ] Unauthorized access events logged
- [ ] Security health score updates
- [ ] Dashboard auto-refreshes
- [ ] Alerts can be acknowledged

## Educational Value

This security monitoring system demonstrates:
- **Security Operations**: Basic SOC functionality
- **Event Logging**: Comprehensive audit trail
- **Alerting**: Rule-based alert generation
- **Monitoring**: Real-time system health monitoring
- **Blockchain Integration**: Potential for immutable audit logs
- **API Security**: Protection of sensitive endpoints
- **Dashboard Development**: Real-time data visualization

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Monitoring Best Practices](https://www.sans.org/security-resources/)
- [SIEM Fundamentals](https://www.splunk.com/en_us/data-insider/what-is-siem.html)