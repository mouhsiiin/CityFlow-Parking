package security

import (
	"time"

	"github.com/gin-gonic/gin"
)

// MonitoringMiddleware creates middleware for security monitoring
func MonitoringMiddleware(monitor *Monitor) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Record start time
		startTime := time.Now()

		// Process request
		c.Next()

		// Calculate response time
		responseTime := time.Since(startTime).Milliseconds()

		// Get user ID from context if available
		userID := ""
		if uid, exists := c.Get("userID"); exists {
			userID = uid.(string)
		}

		// Determine event type and severity based on status code and endpoint
		statusCode := c.Writer.Status()
		eventType := EventDataAccess
		severity := SeverityInfo

		// Categorize by status code
		switch {
		case statusCode >= 500:
			eventType = EventAPIError
			severity = SeverityCritical
		case statusCode == 401:
			eventType = EventUnauthorizedAccess
			severity = SeverityWarning
		case statusCode == 403:
			eventType = EventUnauthorizedAccess
			severity = SeverityHigh
		case statusCode >= 400:
			eventType = EventSuspiciousActivity
			severity = SeverityWarning
		}

		// Check for specific endpoints
		endpoint := c.Request.URL.Path
		if endpoint == "/api/v1/auth/login" {
			if statusCode == 200 {
				eventType = EventLoginSuccess
				severity = SeverityInfo
			} else if statusCode == 401 {
				eventType = EventLoginFailure
				severity = SeverityWarning
			}
		}

		// Admin actions
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "DELETE" {
			if userID != "" {
				role, exists := c.Get("role")
				if exists && role == "admin" {
					eventType = EventAdminAction
					severity = SeverityInfo
				} else {
					eventType = EventDataModification
					severity = SeverityInfo
				}
			}
		}

		// Log the event
		event := SecurityEvent{
			Timestamp:    time.Now(),
			EventType:    eventType,
			Severity:     severity,
			UserID:       userID,
			IPAddress:    c.ClientIP(),
			UserAgent:    c.Request.UserAgent(),
			Endpoint:     endpoint,
			Method:       c.Request.Method,
			StatusCode:   statusCode,
			ResponseTime: responseTime,
			Message:      generateEventMessage(eventType, endpoint, statusCode, userID),
		}

		monitor.LogEvent(event)
	}
}

// generateEventMessage creates a descriptive message for the event
func generateEventMessage(eventType EventType, endpoint string, statusCode int, userID string) string {
	switch eventType {
	case EventLoginSuccess:
		return "User logged in successfully"
	case EventLoginFailure:
		return "Failed login attempt"
	case EventUnauthorizedAccess:
		return "Unauthorized access attempt to " + endpoint
	case EventAPIError:
		return "API error occurred"
	case EventAdminAction:
		return "Admin action performed"
	case EventDataModification:
		return "Data modification on " + endpoint
	default:
		return "API access"
	}
}
