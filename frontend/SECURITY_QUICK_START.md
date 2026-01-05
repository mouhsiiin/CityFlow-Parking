# Security Monitoring - Quick Start Guide

## For Admin Users

### Accessing Security Monitoring

#### Option 1: From Admin Dashboard
1. Navigate to `/admin`
2. Scroll to "Security Monitoring" section
3. Click "View Full Dashboard" button

#### Option 2: Direct Access
- Navigate directly to `/admin/security`

---

## Dashboard Overview

### Main Sections

#### 1. **System Health Card**
```
┌─────────────────────────────────────┐
│ 🛡️  System Security Health          │
│                                     │
│ Status: [HEALTHY]  Score: 95/100  │
│ Last checked: Jan 5, 2026 10:30 AM │
└─────────────────────────────────────┘
```

#### 2. **Statistics Cards**
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Events │ Failed       │ Unauthorized │ Active       │
│     1,234    │ Logins: 12   │ Access: 3    │ Alerts: 2    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

#### 3. **Time Range Selector**
```
[ Last Hour ] [ Last 24h ] [ Last 7d ] [ Last 30d ]
   Active
```

#### 4. **Tab Navigation**
```
[ Overview ] [ Events ] [ Alerts ]
   Active
```

---

## Using the Overview Tab

Shows:
- ✅ System health summary
- ✅ Events breakdown by type
- ✅ Recent alerts (top 5)
- ✅ Key statistics

**Best for**: Quick daily check-ins

---

## Using the Events Tab

Features:
- 📋 Complete events table
- 🔍 Filter by event type
- 🔍 Filter by severity
- 📅 Time range selection

**Table Columns**:
| Timestamp | Type | Severity | Message | User | IP Address |

**Best for**: Investigating specific incidents

### Event Filters

**Event Types**:
- Login Attempt
- Unauthorized Access
- Data Access
- System Event
- API Call

**Severity Levels**:
- Critical (🔴)
- High (🟠)
- Medium (🟡)
- Low (🔵)

---

## Using the Alerts Tab

Features:
- 🚨 All security alerts
- ⚡ Severity-based sorting
- ✔️ One-click acknowledgment
- 📝 Detailed alert information

**Alert Information**:
- Severity badge
- Alert type
- Message
- Detailed description
- Timestamp
- Affected resource
- Acknowledgment status

**Actions**:
- Click "Acknowledge" to mark as reviewed
- Acknowledged alerts show who and when

**Best for**: Managing and responding to security incidents

---

## Widget on Admin Dashboard

### Quick Access Widget

Located on the main admin dashboard (`/admin`):

```
┌────────────────────────────────────────────┐
│ Security Monitoring                        │
│ [View Full Dashboard]                      │
├────────────────────────────────────────────┤
│                                            │
│ System Health: [HEALTHY] 95/100          │
│                                            │
│ Active Alerts (2)                         │
│ ┌──────────────────────────────────────┐ │
│ │ HIGH: Multiple Failed Login Attempts │ │
│ │ 3 failed attempts from 192.168.1.10  │ │
│ └──────────────────────────────────────┘ │
│                                            │
│ Statistics (Last 24h)                     │
│ Total Events: 1,234                       │
│ Failed Logins: 12                         │
│ Unauthorized Access: 3                    │
│ Active Alerts: 2                          │
│                                            │
│ [View Full Security Dashboard]            │
└────────────────────────────────────────────┘
```

---

## Common Workflows

### Daily Security Check
1. Open admin dashboard
2. Check security widget health score
3. Review any active alerts
4. If alerts present, click "View Full Dashboard"
5. Investigate and acknowledge alerts

### Investigating Suspicious Activity
1. Navigate to `/admin/security`
2. Click "Events" tab
3. Select appropriate time range
4. Apply filters:
   - Event Type: "Login Attempt" or "Unauthorized Access"
   - Severity: "High" or "Critical"
5. Review matching events
6. Note user IDs and IP addresses
7. Take appropriate action

### Managing Alerts
1. Go to "Alerts" tab
2. Review unacknowledged alerts (shown first)
3. Click on alert for full details
4. Investigate the issue
5. Click "Acknowledge" when reviewed
6. Document actions taken (if needed)

---

## Alert Priority Response Times

| Severity | Response Time | Action Required |
|----------|---------------|-----------------|
| 🔴 Critical | Immediate | Investigate now |
| 🟠 High | Within 1 hour | Priority investigation |
| 🟡 Medium | Within 24 hours | Scheduled review |
| 🔵 Low | Next review cycle | Monitor and document |

---

## Key Features

### ✅ Auto-Refresh
- Data updates every 30 seconds automatically
- No page reload needed
- Manual refresh available via "Refresh" button

### ✅ Real-Time Monitoring
- Live security event tracking
- Immediate alert notifications
- Up-to-date statistics

### ✅ Filtering & Search
- Filter by event type
- Filter by severity
- Time range selection
- Quick navigation

### ✅ Color Coding
- Instant visual severity identification
- Consistent across all views
- Easy to spot critical issues

---

## Tips for Effective Monitoring

### 📊 Daily Routine
1. Check health score first thing
2. Review any new alerts
3. Scan failed login attempts
4. Look for patterns in unauthorized access

### 🔍 Investigation Best Practices
1. Start with high severity events
2. Look for repeated patterns
3. Check specific user activity
4. Note IP addresses
5. Document findings

### 🎯 Alert Management
1. Always investigate before acknowledging
2. Document actions taken
3. Escalate critical issues immediately
4. Regular review of acknowledged alerts

### 📈 Trend Analysis
1. Use different time ranges
2. Compare week-over-week patterns
3. Identify busy periods
4. Spot anomalies early

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Refresh Data | `Ctrl/Cmd + R` (browser) |
| Switch Tabs | Click tab or `Tab` key |
| Navigate Back | `Alt + ←` (browser) |

---

## Mobile Access

The security dashboard is responsive and works on mobile devices:
- Tablet: Full functionality
- Phone: Optimized layout with stacked cards
- Touch-friendly buttons and controls

---

## Getting Help

### Common Issues

**Q: Dashboard shows "Loading" indefinitely**
A: Check your admin permissions and network connection

**Q: Can't acknowledge alerts**
A: Verify you have admin role and are authenticated

**Q: No data showing**
A: Ensure backend security monitoring service is running

**Q: Events table is empty**
A: Try different time ranges or remove filters

### Support Resources

1. Check documentation: `SECURITY_MONITORING_GUIDE.md`
2. Review integration summary: `SECURITY_INTEGRATION_SUMMARY.md`
3. Contact system administrator
4. Check browser console for errors

---

## Security Best Practices

1. **Regular Monitoring**: Check dashboard at least daily
2. **Prompt Response**: Address critical alerts immediately
3. **Documentation**: Keep records of security incidents
4. **Stay Updated**: Review security updates and patches
5. **Report Issues**: Escalate concerning patterns
6. **Access Control**: Protect admin credentials
7. **Audit Logs**: Regularly review system access logs

---

**Remember**: Security monitoring is most effective when done consistently and proactively!

---

Last Updated: January 5, 2026
