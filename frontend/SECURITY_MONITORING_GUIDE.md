# Security Monitoring Integration Guide

This guide provides comprehensive documentation for the security monitoring and alerting system integrated into the CityFlow Parking admin dashboard.

## Overview

The security monitoring system provides real-time visibility into system security events, alerts, and overall system health. It's designed exclusively for admin users to monitor and respond to security incidents.

## Architecture

### Frontend Components

1. **SecurityDashboard** (`/src/pages/SecurityDashboard.tsx`)
   - Full-featured security monitoring dashboard
   - Three main tabs: Overview, Events, and Alerts
   - Real-time data updates every 30 seconds
   - Time range filtering (1h, 24h, 7d, 30d)
   - Event filtering by type and severity

2. **SecurityMonitorWidget** (`/src/components/SecurityMonitorWidget.tsx`)
   - Compact widget for the main admin dashboard
   - Displays system health, active alerts, and key statistics
   - Quick navigation to full security dashboard

### API Integration

The security monitoring integrates with the following backend endpoints:

```
GET  /api/v1/security/dashboard       - Get overview data (stats + alerts)
GET  /api/v1/security/events          - Get security events (with filtering)
GET  /api/v1/security/events/range    - Get events within time range
GET  /api/v1/security/alerts          - Get security alerts
PUT  /api/v1/security/alerts/:id/acknowledge - Acknowledge an alert
GET  /api/v1/security/stats           - Get security statistics
GET  /api/v1/security/health          - Get system security health
```

### Type Definitions

#### Security Event
```typescript
interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: EventType;
  severity: Severity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  result?: string;
  message: string;
  metadata?: Record<string, any>;
}
```

#### Security Alert
```typescript
interface SecurityAlert {
  id: string;
  timestamp: string;
  alertType: string;
  severity: Severity;
  message: string;
  details: string;
  affectedResource?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}
```

#### Security Statistics
```typescript
interface SecurityStats {
  totalEvents: number;
  failedLogins: number;
  unauthorizedAccess: number;
  activeAlerts: number;
  eventsByType: Record<string, number>;
  eventsBySeverity?: Record<string, number>;
  recentActivity?: number;
}
```

#### System Health
```typescript
interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  lastChecked: string;
}
```

## Features

### 1. System Health Monitoring

- **Health Score**: 0-100 scale indicating overall system security
- **Status Indicators**:
  - 🟢 Healthy (80-100): System operating normally
  - 🟡 Warning (50-79): Minor security concerns detected
  - 🔴 Critical (<50): Serious security issues require attention

### 2. Real-time Alerts

- Active alerts displayed with severity levels
- Color-coded badges (Critical, High, Medium, Low)
- One-click acknowledgment
- Alert details include:
  - Timestamp
  - Alert type
  - Detailed message
  - Affected resources
  - Acknowledgment status

### 3. Security Events Log

- Comprehensive event tracking
- Filterable by:
  - Event type (login_attempt, unauthorized_access, data_access, etc.)
  - Severity level
  - Time range
- Table view with columns:
  - Timestamp
  - Event Type
  - Severity
  - Message
  - User ID
  - IP Address

### 4. Statistics Dashboard

- **Total Events**: Count of all security events in time range
- **Failed Logins**: Failed authentication attempts
- **Unauthorized Access**: Access control violations
- **Active Alerts**: Current alerts requiring attention
- **Events by Type**: Breakdown of event categories

### 5. Time Range Selection

Users can view data for different time periods:
- Last Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days

## Usage

### Accessing Security Dashboard

1. **Admin Dashboard Widget**:
   - Navigate to `/admin`
   - View security summary in the Security Monitoring section
   - Click "View Full Dashboard" to access detailed view

2. **Direct Access**:
   - Navigate to `/admin/security`
   - Requires admin authentication

### Monitoring Workflow

1. **Regular Monitoring**:
   - Check system health score
   - Review active alerts
   - Monitor key statistics

2. **Investigating Events**:
   - Switch to "Events" tab
   - Apply filters to narrow down suspicious activity
   - Review event details including user, IP, and timestamp

3. **Managing Alerts**:
   - Switch to "Alerts" tab
   - Review unacknowledged alerts
   - Click "Acknowledge" to mark alerts as reviewed
   - High-severity alerts should be investigated immediately

4. **Time Range Analysis**:
   - Use time range selector to view historical data
   - Compare patterns across different periods
   - Identify trends in security events

## API Service Methods

The `adminService` provides the following security-related methods:

```typescript
// Get security dashboard overview
adminService.getSecurityDashboard(since?: string)

// Get security events with optional filters
adminService.getSecurityEvents({
  limit?: number,
  type?: string,
  severity?: string
})

// Get events within specific time range
adminService.getSecurityEventsByTimeRange(start: string, end: string)

// Get security alerts
adminService.getSecurityAlerts(activeOnly: boolean = true)

// Acknowledge an alert
adminService.acknowledgeSecurityAlert(alertId: string)

// Get security statistics
adminService.getSecurityStats(since?: string)

// Get system health status
adminService.getSystemHealth()
```

## Event Types

The system tracks the following event types:

- **login_attempt**: User authentication attempts
- **unauthorized_access**: Access control violations
- **data_access**: Data resource access events
- **system_event**: System-level security events
- **api_call**: API endpoint access
- **transaction**: Blockchain transaction events

## Severity Levels

Events and alerts are classified by severity:

- **Critical**: Immediate attention required, system security compromised
- **High**: Significant security concern, should be addressed promptly
- **Medium**: Moderate security issue, monitor and investigate
- **Low**: Informational, routine security events

## Auto-refresh

- Dashboard data automatically refreshes every 30 seconds
- Ensures admins have up-to-date security information
- No manual refresh required
- Can be manually refreshed using the "Refresh" button

## Color Coding

### Health Status
- 🟢 Green: Healthy status
- 🟡 Yellow: Warning status
- 🔴 Red: Critical status

### Severity Levels
- 🔴 Red: Critical/High severity
- 🟡 Yellow: Medium severity
- 🔵 Blue: Low severity
- ⚪ Gray: Informational

## Best Practices

1. **Regular Monitoring**:
   - Check security dashboard at least once daily
   - Review active alerts immediately
   - Investigate all high/critical severity events

2. **Alert Management**:
   - Acknowledge alerts only after investigation
   - Document actions taken in response to alerts
   - Escalate critical issues to system administrators

3. **Pattern Recognition**:
   - Use time range filters to identify trends
   - Compare event patterns across different periods
   - Look for anomalies in failed login attempts

4. **Response Procedures**:
   - Critical alerts: Immediate investigation required
   - High alerts: Investigate within 1 hour
   - Medium alerts: Investigate within 24 hours
   - Low alerts: Review during regular monitoring

## Troubleshooting

### No Data Displayed

- Verify admin authentication
- Check backend API connectivity
- Ensure security monitoring service is running
- Review browser console for errors

### Refresh Issues

- Check network connectivity
- Verify API endpoint availability
- Clear browser cache if needed
- Check authentication token validity

### Alert Acknowledgment Failures

- Verify admin permissions
- Check alert ID validity
- Ensure backend API is accessible
- Review error messages in console

## Integration Checklist

- ✅ Security types added to type definitions
- ✅ Admin service methods implemented
- ✅ SecurityDashboard page created
- ✅ SecurityMonitorWidget component updated
- ✅ Route added to App.tsx (`/admin/security`)
- ✅ Widget integrated in AdminDashboard
- ✅ Export added to pages index

## Future Enhancements

Potential improvements to consider:

1. **Export Functionality**: Export events/alerts to CSV or PDF
2. **Advanced Filtering**: More granular filtering options
3. **Notification System**: Push notifications for critical alerts
4. **Graphical Visualizations**: Charts and graphs for trend analysis
5. **Alert Rules**: Customizable alerting thresholds
6. **User Activity Tracking**: Detailed audit logs per user
7. **Geographic Analysis**: Map-based visualization of security events
8. **AI-powered Anomaly Detection**: Machine learning for threat detection

## Support

For issues or questions regarding security monitoring:

1. Check this documentation first
2. Review backend security handler implementation
3. Check API endpoint responses
4. Review browser console for frontend errors
5. Contact system administrator for backend issues

---

**Last Updated**: January 5, 2026
**Version**: 1.0.0
