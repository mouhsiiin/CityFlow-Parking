# Security Monitoring System (Mini SOC)

## Overview

CityFlow-Parking now includes an educational security monitoring system (Mini SOC) that provides real-time log monitoring, security event detection, and alerting capabilities.

## Features

### 1. **Security Event Logging**
- Automatic logging of all API requests and responses
- Event categorization by type and severity
- Detailed event metadata (IP address, user agent, endpoint, response time)

### 2. **Event Types Tracked**
- `LOGIN_SUCCESS` - Successful user authentication
- `LOGIN_FAILURE` - Failed login attempts
- `UNAUTHORIZED_ACCESS` - Attempts to access protected resources
- `SUSPICIOUS_ACTIVITY` - Unusual API behavior
- `RATE_LIMIT_EXCEEDED` - Rate limit violations
- `DATA_ACCESS` - General data access events
- `DATA_MODIFICATION` - Data modification operations
- `API_ERROR` - API errors (5xx status codes)
- `ADMIN_ACTION` - Administrative operations

### 3. **Automated Alert Rules**
The system includes predefined alert rules that trigger when thresholds are exceeded:

- **Brute Force Detection**: 5+ failed login attempts within 5 minutes
- **Unauthorized Access Pattern**: 3+ unauthorized access attempts within 5 minutes
- **Rate Limit Abuse**: 10+ rate limit exceeded events within 1 minute

### 4. **Security Dashboard**
A real-time HTML dashboard (`security-dashboard.html`) that displays:
- System health status and score
- Event statistics and trends
- Active security alerts
- Recent security events (last 50)
- Top IP addresses by activity
- Event type distribution chart

### 5. **API Endpoints**

All security endpoints require admin authentication.

#### GET `/api/v1/security/dashboard`
Get overall security dashboard data including stats and active alerts.

**Query Parameters:**
- `since` (optional) - ISO 8601 timestamp, defaults to 24 hours ago

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalEvents": 150,
      "eventsByType": {...},
      "eventsBySeverity": {...},
      "failedLogins": 5,
      "unauthorizedAccess": 2,
      "topIpAddresses": [...],
      "topEndpoints": [...],
      "alertCount": 3,
      "activeAlerts": 1
    },
    "alerts": [...]
  }
}
```

#### GET `/api/v1/security/events`
Get recent security events with optional filtering.

**Query Parameters:**
- `limit` (optional) - Number of events to return (default: 100)
- `type` (optional) - Filter by event type
- `severity` (optional) - Filter by severity level

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/security/events?limit=50&type=LOGIN_FAILURE"
```

#### GET `/api/v1/security/events/range`
Get events within a specific time range.

**Query Parameters:**
- `start` (required) - Start time in RFC3339 format
- `end` (required) - End time in RFC3339 format

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/security/events/range?start=2026-01-01T00:00:00Z&end=2026-01-05T23:59:59Z"
```

#### GET `/api/v1/security/alerts`
Get security alerts.

**Query Parameters:**
- `active` (optional) - Set to "true" to get only unacknowledged alerts

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/security/alerts?active=true"
```

#### PUT `/api/v1/security/alerts/:id/acknowledge`
Acknowledge a security alert.

**Example:**
```bash
curl -X PUT -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8080/api/v1/security/alerts/ALERT_ID/acknowledge"
```

#### GET `/api/v1/security/stats`
Get detailed security statistics.

**Query Parameters:**
- `since` (optional) - ISO 8601 timestamp for stats calculation

#### GET `/api/v1/security/health`
Get overall system security health assessment.

**Response:**
```json
{
  "status": "success",
  "data": {
    "health": {
      "status": "healthy",
      "score": 95,
      "lastChecked": "2026-01-05T10:00:00Z"
    },
    "metrics": {
      "totalEvents": 1250,
      "failedLogins": 3,
      "unauthorizedAccess": 1,
      "activeAlerts": 0
    }
  }
}
```

## Usage

### 1. Start the Backend
The security monitoring system is automatically integrated into the backend API:

```bash
cd /workspaces/CityFlow-Parking/backend
go run cmd/api/main.go
```

### 2. Login as Admin
First, create an admin account or login with existing admin credentials:

```bash
# Register admin (if not exists)
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityflow.com",
    "password": "SecurePassword123!",
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
    "password": "SecurePassword123!"
  }'
```

Save the returned JWT token - you'll need it for accessing security endpoints.

### 3. Access the Dashboard

#### Option A: Using the HTML Dashboard
1. Open `security-dashboard.html` in your browser
2. Make sure your admin JWT token is stored in localStorage with key `authToken`
3. You can set it via browser console:
```javascript
localStorage.setItem('authToken', 'YOUR_JWT_TOKEN_HERE');
```
4. Refresh the page to load security data
5. Dashboard auto-refreshes every 10 seconds

#### Option B: Using API Directly
```bash
# Get dashboard overview
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/security/dashboard

# Get recent events
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/security/events?limit=20

# Check system health
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/v1/security/health
```

### 4. Generate Test Events
To see the monitoring system in action, generate some test activity:

```bash
# Successful login (creates LOGIN_SUCCESS event)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cityflow.com", "password": "SecurePassword123!"}'

# Failed login attempts (creates LOGIN_FAILURE events)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cityflow.com", "password": "wrongpassword"}'

# Unauthorized access (creates UNAUTHORIZED_ACCESS event)
curl http://localhost:8080/api/v1/users/some-user-id

# After 5+ failed logins within 5 minutes, an alert will be generated!
```

## Architecture

### Components

1. **Security Monitor** (`internal/security/monitor.go`)
   - In-memory event storage (configurable limit: 10,000 events)
   - Alert rule engine
   - Statistics aggregation

2. **Security Middleware** (`internal/security/middleware.go`)
   - Intercepts all HTTP requests
   - Logs events automatically
   - Categorizes by status code and endpoint

3. **Security Handler** (`internal/api/handlers/security.go`)
   - REST API endpoints for querying security data
   - Admin-only access control

4. **Security Dashboard** (`security-dashboard.html`)
   - Real-time visualization
   - Auto-refresh capability
   - Responsive design

### Event Flow

```
HTTP Request → Security Middleware → Log Event → Monitor
                       ↓                           ↓
                   Execute Handler         Check Alert Rules
                       ↓                           ↓
                   HTTP Response          Generate Alerts (if threshold met)
```

## Security Considerations

⚠️ **Important Notes:**

1. **Educational Purpose**: This is designed for learning and testing, not production use.
2. **In-Memory Storage**: Events are stored in memory and will be lost on restart.
3. **No Persistence**: For production, integrate with a proper SIEM or log aggregation system.
4. **Admin Only**: All security endpoints require admin authentication.
5. **CORS**: Ensure CORS is properly configured for the dashboard.

## Future Enhancements (Production-Ready Features)

For a production environment, consider adding:

- Persistent storage (database or log files)
- Integration with external SIEM systems (Splunk, ELK Stack)
- Email/SMS alerting
- Geolocation tracking for IPs
- Machine learning for anomaly detection
- Long-term trend analysis
- Compliance reporting (GDPR, SOC 2)
- Integration with threat intelligence feeds
- Webhook notifications for critical alerts
- Advanced rate limiting and IP blocking

## Troubleshooting

### Dashboard shows "Token not found"
Store your admin JWT token in localStorage:
```javascript
localStorage.setItem('authToken', 'YOUR_JWT_TOKEN');
```

### No events showing
1. Ensure the backend is running
2. Generate some API activity
3. Check browser console for errors
4. Verify admin authentication

### Alerts not triggering
Ensure you meet the threshold requirements:
- 5+ failed logins within 5 minutes
- 3+ unauthorized access within 5 minutes
- 10+ rate limits within 1 minute

## Testing Checklist

- [ ] Backend starts successfully with security monitoring
- [ ] Can login as admin and receive JWT token
- [ ] Security dashboard loads in browser
- [ ] Events appear in dashboard after API activity
- [ ] Failed login attempts are logged
- [ ] Alerts trigger after threshold is met
- [ ] System health status updates correctly
- [ ] API endpoints return proper data
- [ ] Auto-refresh works correctly

## Contact

For questions or issues with the security monitoring system, please refer to the main project documentation or create an issue in the repository.

---

**Last Updated**: January 5, 2026
**Version**: 1.0.0 (Educational/Testing)
