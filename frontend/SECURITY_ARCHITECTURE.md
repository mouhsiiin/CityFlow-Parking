# Security Monitoring Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ADMIN USER                                  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐         ┌─────────────────────────────┐ │
│  │  AdminDashboard      │         │  SecurityDashboard          │ │
│  │  (/admin)            │◄────────┤  (/admin/security)          │ │
│  │                      │         │                             │ │
│  │  ┌────────────────┐ │         │  ┌────────────────────────┐ │ │
│  │  │ SecurityMonitor│ │         │  │ Overview Tab           │ │ │
│  │  │ Widget         │ │         │  │ - Health Status        │ │ │
│  │  │                │ │         │  │ - Statistics          │ │ │
│  │  │ - Health Score │ │         │  │ - Recent Alerts       │ │ │
│  │  │ - Active Alerts│ │         │  └────────────────────────┘ │ │
│  │  │ - Stats Summary│ │         │                             │ │
│  │  │ - Quick Nav    │ │         │  ┌────────────────────────┐ │ │
│  │  └────────────────┘ │         │  │ Events Tab             │ │ │
│  └──────────────────────┘         │  │ - Events Table         │ │ │
│                                   │  │ - Type Filter          │ │ │
│                                   │  │ - Severity Filter      │ │ │
│                                   │  │ - Time Range Filter    │ │ │
│                                   │  └────────────────────────┘ │ │
│                                   │                             │ │
│                                   │  ┌────────────────────────┐ │ │
│                                   │  │ Alerts Tab             │ │ │
│                                   │  │ - Alert List           │ │ │
│                                   │  │ - Acknowledge Action   │ │ │
│                                   │  │ - Details View         │ │ │
│                                   │  └────────────────────────┘ │ │
│                                   └─────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              AdminService (API Client)                      │  │
│  │                                                             │  │
│  │  • getSecurityDashboard(since?)                            │  │
│  │  • getSecurityEvents(params?)                              │  │
│  │  • getSecurityEventsByTimeRange(start, end)                │  │
│  │  • getSecurityAlerts(activeOnly)                           │  │
│  │  • acknowledgeSecurityAlert(alertId)                       │  │
│  │  • getSecurityStats(since?)                                │  │
│  │  • getSystemHealth()                                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  ▼ HTTP/HTTPS
                                  │
┌─────────────────────────────────┼───────────────────────────────────┐
│                      BACKEND (Go/Gin)                               │
├─────────────────────────────────┼───────────────────────────────────┤
│                                 │                                   │
│  ┌──────────────────────────────▼────────────────────────────────┐ │
│  │              API Routes (/api/v1/security)                    │ │
│  │                                                               │ │
│  │  GET  /dashboard           → GetDashboard()                  │ │
│  │  GET  /events              → GetEvents()                     │ │
│  │  GET  /events/range        → GetEventsByTimeRange()         │ │
│  │  GET  /alerts              → GetAlerts()                     │ │
│  │  PUT  /alerts/:id/ack      → AcknowledgeAlert()             │ │
│  │  GET  /stats               → GetStats()                      │ │
│  │  GET  /health              → GetSystemHealth()               │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                   │
│  ┌───────────────────────────────▼───────────────────────────────┐ │
│  │              SecurityHandler                                  │ │
│  │              (handlers/security.go)                           │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                   │
│  ┌───────────────────────────────▼───────────────────────────────┐ │
│  │              Security Monitor                                 │ │
│  │              (internal/security/monitor.go)                   │ │
│  │                                                               │ │
│  │  • Event Collection                                          │ │
│  │  • Alert Generation                                          │ │
│  │  • Statistics Calculation                                    │ │
│  │  • Health Scoring                                            │ │
│  └───────────────────────────────┬───────────────────────────────┘ │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Security Event Store   │
                    │   (In-Memory/Database)   │
                    └──────────────────────────┘
```

## Data Flow

### 1. Dashboard Load
```
User visits /admin/security
         │
         ▼
SecurityDashboard loads
         │
         ▼
Calls adminService methods
         │
         ├─► getSecurityDashboard()
         ├─► getSystemHealth()
         └─► getSecurityEvents()
         │
         ▼
API requests sent to backend
         │
         ▼
Backend /api/v1/security/* endpoints
         │
         ▼
SecurityHandler methods
         │
         ▼
Security Monitor queries
         │
         ▼
Data returned to frontend
         │
         ▼
State updated, UI renders
```

### 2. Auto-Refresh Cycle
```
Every 30 seconds
         │
         ▼
fetchSecurityData() called
         │
         ▼
API requests sent
         │
         ▼
New data retrieved
         │
         ▼
State updated
         │
         ▼
UI re-renders with fresh data
```

### 3. Alert Acknowledgment
```
User clicks "Acknowledge"
         │
         ▼
handleAcknowledgeAlert(alertId)
         │
         ▼
adminService.acknowledgeSecurityAlert(alertId)
         │
         ▼
PUT /api/v1/security/alerts/:id/acknowledge
         │
         ▼
SecurityHandler.AcknowledgeAlert()
         │
         ▼
Security Monitor updates alert
         │
         ▼
Success response
         │
         ▼
Dashboard data reloaded
         │
         ▼
UI shows acknowledged status
```

## Component Hierarchy

```
App.tsx
└── Route: /admin/security (AdminRoute)
    └── SecurityDashboard
        ├── Header
        │   ├── Title
        │   └── Actions (Refresh, Back)
        │
        ├── Time Range Selector
        │   └── Buttons [1h, 24h, 7d, 30d]
        │
        ├── System Health Card
        │   ├── Health Status Badge
        │   └── Health Score
        │
        ├── Statistics Cards Grid
        │   ├── Total Events Card
        │   ├── Failed Logins Card
        │   ├── Unauthorized Access Card
        │   └── Active Alerts Card
        │
        ├── Tab Navigation
        │   ├── Overview Tab
        │   ├── Events Tab
        │   └── Alerts Tab
        │
        └── Tab Content
            ├── Overview Content
            │   ├── Events by Type Chart
            │   └── Recent Alerts List
            │
            ├── Events Content
            │   ├── Filter Controls
            │   └── Events Table
            │
            └── Alerts Content
                └── Alerts List with Actions

App.tsx
└── Route: /admin (AdminRoute)
    └── AdminDashboard
        ├── Statistics Cards
        │   ├── Parking Spots Stats
        │   ├── Charging Stations Stats
        │   └── Occupancy Rate
        │
        ├── Management Actions
        │   ├── Parking Management Card
        │   └── Charging Management Card
        │
        └── Security Monitoring Section
            ├── Section Header
            ├── SecurityMonitorWidget
            │   ├── System Health Card
            │   ├── Active Alerts Card
            │   └── Statistics Card
            └── View Full Dashboard Button
```

## State Management

```
SecurityDashboard Component State:
├── loading: boolean
├── error: string | null
├── stats: SecurityStats | null
├── health: SecurityHealth | null
├── alerts: SecurityAlert[]
├── events: SecurityEvent[]
├── selectedTab: 'overview' | 'events' | 'alerts'
├── timeRange: '1h' | '24h' | '7d' | '30d'
└── eventFilter: { type: string, severity: string }

SecurityMonitorWidget Component State:
├── loading: boolean
├── stats: SecurityStats | null
├── health: SecurityHealth | null
└── alerts: SecurityAlert[]
```

## Type System

```
Security Types Hierarchy:

EventType (enum)
├── 'login_attempt'
├── 'unauthorized_access'
├── 'data_access'
├── 'system_event'
└── 'api_call'

Severity (enum)
├── 'low'
├── 'medium'
├── 'high'
└── 'critical'

SecurityEvent (interface)
├── id: string
├── timestamp: string
├── eventType: EventType
├── severity: Severity
├── userId?: string
├── ipAddress?: string
├── message: string
└── metadata?: Record<string, any>

SecurityAlert (interface)
├── id: string
├── timestamp: string
├── alertType: string
├── severity: Severity
├── message: string
├── details: string
├── acknowledged: boolean
└── acknowledgedBy?: string

SecurityStats (interface)
├── totalEvents: number
├── failedLogins: number
├── unauthorizedAccess: number
├── activeAlerts: number
└── eventsByType: Record<string, number>

SecurityHealth (interface)
├── status: 'healthy' | 'warning' | 'critical'
├── score: number (0-100)
└── lastChecked: string
```

## Security Flow

```
Authentication & Authorization:

User Request
     │
     ▼
Frontend Route Guard (AdminRoute)
     │
     ├─► User role check
     │   ├─► If not admin: Redirect to /dashboard
     │   └─► If admin: Continue
     │
     ▼
API Request with Bearer Token
     │
     ▼
Backend Middleware
     │
     ├─► AuthMiddleware()
     │   └─► Verify JWT token
     │
     └─► AdminMiddleware()
         └─► Verify admin role
     │
     ▼
SecurityHandler
     │
     ▼
Process Request
     │
     ▼
Return Response
```

## Color Coding System

```
Health Status Colors:
┌──────────────────────────────────┐
│ Score 80-100 → 🟢 Green (Healthy) │
│ Score 50-79  → 🟡 Yellow (Warning)│
│ Score 0-49   → 🔴 Red (Critical)  │
└──────────────────────────────────┘

Severity Colors:
┌────────────────────────────────┐
│ Critical → 🔴 Red              │
│ High     → 🟠 Orange           │
│ Medium   → 🟡 Yellow           │
│ Low      → 🔵 Blue             │
│ Info     → ⚪ Gray             │
└────────────────────────────────┘
```

## API Response Format

```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalEvents": 1234,
      "failedLogins": 12,
      "unauthorizedAccess": 3,
      "activeAlerts": 2,
      "eventsByType": {
        "login_attempt": 450,
        "unauthorized_access": 3,
        "data_access": 780,
        "system_event": 1
      }
    },
    "alerts": [
      {
        "id": "alert-123",
        "timestamp": "2026-01-05T10:30:00Z",
        "alertType": "multiple_failed_logins",
        "severity": "high",
        "message": "Multiple failed login attempts detected",
        "details": "3 failed attempts from IP 192.168.1.10",
        "acknowledged": false
      }
    ]
  }
}
```

---

**Last Updated**: January 5, 2026
**Version**: 1.0.0
