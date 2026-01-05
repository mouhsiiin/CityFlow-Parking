package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/security"
)

// SecurityHandler handles security monitoring endpoints
type SecurityHandler struct {
	monitor *security.Monitor
}

// NewSecurityHandler creates a new security handler
func NewSecurityHandler(monitor *security.Monitor) *SecurityHandler {
	return &SecurityHandler{
		monitor: monitor,
	}
}

// GetDashboard returns security dashboard data
func (h *SecurityHandler) GetDashboard(c *gin.Context) {
	// Default to last 24 hours
	since := time.Now().Add(-24 * time.Hour)

	// Parse 'since' query parameter if provided
	if sinceParam := c.Query("since"); sinceParam != "" {
		if parsedTime, err := time.Parse(time.RFC3339, sinceParam); err == nil {
			since = parsedTime
		}
	}

	stats := h.monitor.GetStats(since)
	alerts := h.monitor.GetAlerts(true) // Only active alerts

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"stats":  stats,
			"alerts": alerts,
		},
	})
}

// GetEvents returns security events
func (h *SecurityHandler) GetEvents(c *gin.Context) {
	// Parse query parameters
	limit := 100
	if limitParam := c.Query("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
			limit = parsedLimit
		}
	}

	eventType := security.EventType(c.Query("type"))
	severity := security.Severity(c.Query("severity"))

	events := h.monitor.GetRecentEvents(limit, eventType, severity)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"events": events,
			"total":  len(events),
		},
	})
}

// GetEventsByTimeRange returns events within a time range
func (h *SecurityHandler) GetEventsByTimeRange(c *gin.Context) {
	startParam := c.Query("start")
	endParam := c.Query("end")

	if startParam == "" || endParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "start and end time parameters are required",
		})
		return
	}

	start, err := time.Parse(time.RFC3339, startParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "invalid start time format, use RFC3339",
		})
		return
	}

	end, err := time.Parse(time.RFC3339, endParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "invalid end time format, use RFC3339",
		})
		return
	}

	events := h.monitor.GetEventsByTimeRange(start, end)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"events": events,
			"total":  len(events),
			"range": gin.H{
				"start": start,
				"end":   end,
			},
		},
	})
}

// GetAlerts returns security alerts
func (h *SecurityHandler) GetAlerts(c *gin.Context) {
	onlyActive := c.Query("active") == "true"
	alerts := h.monitor.GetAlerts(onlyActive)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"alerts": alerts,
			"total":  len(alerts),
		},
	})
}

// AcknowledgeAlert acknowledges a security alert
func (h *SecurityHandler) AcknowledgeAlert(c *gin.Context) {
	alertID := c.Param("id")

	if alertID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "alert ID is required",
		})
		return
	}

	err := h.monitor.AcknowledgeAlert(alertID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Alert acknowledged",
	})
}

// GetStats returns security statistics
func (h *SecurityHandler) GetStats(c *gin.Context) {
	// Default to last 24 hours
	since := time.Now().Add(-24 * time.Hour)

	// Parse 'since' query parameter if provided
	if sinceParam := c.Query("since"); sinceParam != "" {
		if parsedTime, err := time.Parse(time.RFC3339, sinceParam); err == nil {
			since = parsedTime
		}
	}

	stats := h.monitor.GetStats(since)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"stats": stats,
			"since": since,
		},
	})
}

// GetSystemHealth returns overall system security health
func (h *SecurityHandler) GetSystemHealth(c *gin.Context) {
	stats := h.monitor.GetStats(time.Now().Add(-1 * time.Hour))
	alerts := h.monitor.GetAlerts(true)

	// Determine health status
	healthStatus := "healthy"
	healthScore := 100

	// Deduct points for issues
	if stats.ActiveAlerts > 0 {
		healthScore -= stats.ActiveAlerts * 10
		healthStatus = "warning"
	}

	if stats.FailedLogins > 10 {
		healthScore -= 20
		healthStatus = "warning"
	}

	if stats.UnauthorizedAccess > 5 {
		healthScore -= 30
		healthStatus = "critical"
	}

	if healthScore < 0 {
		healthScore = 0
	}

	if healthScore < 50 {
		healthStatus = "critical"
	} else if healthScore < 80 {
		healthStatus = "warning"
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"health": gin.H{
				"status":      healthStatus,
				"score":       healthScore,
				"lastChecked": time.Now(),
			},
			"metrics": gin.H{
				"totalEvents":        stats.TotalEvents,
				"failedLogins":       stats.FailedLogins,
				"unauthorizedAccess": stats.UnauthorizedAccess,
				"activeAlerts":       len(alerts),
			},
		},
	})
}
