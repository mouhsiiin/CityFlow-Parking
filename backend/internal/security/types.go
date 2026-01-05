package security

import "time"

// EventType represents the type of security event
type EventType string

const (
	EventLoginSuccess      EventType = "LOGIN_SUCCESS"
	EventLoginFailure      EventType = "LOGIN_FAILURE"
	EventUnauthorizedAccess EventType = "UNAUTHORIZED_ACCESS"
	EventSuspiciousActivity EventType = "SUSPICIOUS_ACTIVITY"
	EventRateLimitExceeded EventType = "RATE_LIMIT_EXCEEDED"
	EventDataAccess        EventType = "DATA_ACCESS"
	EventDataModification  EventType = "DATA_MODIFICATION"
	EventAPIError          EventType = "API_ERROR"
	EventAdminAction       EventType = "ADMIN_ACTION"
)

// Severity represents the severity level of an event
type Severity string

const (
	SeverityInfo     Severity = "INFO"
	SeverityWarning  Severity = "WARNING"
	SeverityCritical Severity = "CRITICAL"
	SeverityHigh     Severity = "HIGH"
	SeverityMedium   Severity = "MEDIUM"
	SeverityLow      Severity = "LOW"
)

// SecurityEvent represents a security event
type SecurityEvent struct {
	ID          string                 `json:"id"`
	Timestamp   time.Time              `json:"timestamp"`
	EventType   EventType              `json:"eventType"`
	Severity    Severity               `json:"severity"`
	UserID      string                 `json:"userId,omitempty"`
	IPAddress   string                 `json:"ipAddress"`
	UserAgent   string                 `json:"userAgent,omitempty"`
	Endpoint    string                 `json:"endpoint"`
	Method      string                 `json:"method"`
	StatusCode  int                    `json:"statusCode"`
	Message     string                 `json:"message"`
	Details     map[string]interface{} `json:"details,omitempty"`
	ResponseTime int64                 `json:"responseTime"` // in milliseconds
}

// Alert represents a security alert
type Alert struct {
	ID          string    `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	AlertType   string    `json:"alertType"`
	Severity    Severity  `json:"severity"`
	Message     string    `json:"message"`
	EventCount  int       `json:"eventCount"`
	TimeWindow  string    `json:"timeWindow"`
	Acknowledged bool     `json:"acknowledged"`
}

// SecurityStats represents security statistics
type SecurityStats struct {
	TotalEvents        int                    `json:"totalEvents"`
	EventsByType       map[EventType]int      `json:"eventsByType"`
	EventsBySeverity   map[Severity]int       `json:"eventsBySeverity"`
	FailedLogins       int                    `json:"failedLogins"`
	UnauthorizedAccess int                    `json:"unauthorizedAccess"`
	TopIPAddresses     []IPStats              `json:"topIpAddresses"`
	TopEndpoints       []EndpointStats        `json:"topEndpoints"`
	AlertCount         int                    `json:"alertCount"`
	ActiveAlerts       int                    `json:"activeAlerts"`
}

// IPStats represents statistics for an IP address
type IPStats struct {
	IPAddress  string `json:"ipAddress"`
	EventCount int    `json:"eventCount"`
	FailedAuth int    `json:"failedAuth"`
}

// EndpointStats represents statistics for an endpoint
type EndpointStats struct {
	Endpoint   string  `json:"endpoint"`
	HitCount   int     `json:"hitCount"`
	AvgResponseTime int64 `json:"avgResponseTime"`
	ErrorCount int     `json:"errorCount"`
}
