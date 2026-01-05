package security

import (
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Monitor handles security event monitoring
type Monitor struct {
	events     []SecurityEvent
	alerts     []Alert
	mu         sync.RWMutex
	maxEvents  int
	alertRules []AlertRule
}

// AlertRule defines a rule for generating alerts
type AlertRule struct {
	Name          string
	EventType     EventType
	Threshold     int
	TimeWindow    time.Duration
	Severity      Severity
	AlertType     string
}

// NewMonitor creates a new security monitor
func NewMonitor(maxEvents int) *Monitor {
	m := &Monitor{
		events:    make([]SecurityEvent, 0),
		alerts:    make([]Alert, 0),
		maxEvents: maxEvents,
	}

	// Initialize default alert rules
	m.alertRules = []AlertRule{
		{
			Name:       "Failed Login Attempts",
			EventType:  EventLoginFailure,
			Threshold:  5,
			TimeWindow: 5 * time.Minute,
			Severity:   SeverityHigh,
			AlertType:  "BRUTE_FORCE_ATTEMPT",
		},
		{
			Name:       "Unauthorized Access Attempts",
			EventType:  EventUnauthorizedAccess,
			Threshold:  3,
			TimeWindow: 5 * time.Minute,
			Severity:   SeverityCritical,
			AlertType:  "UNAUTHORIZED_ACCESS_PATTERN",
		},
		{
			Name:       "Rate Limit Exceeded",
			EventType:  EventRateLimitExceeded,
			Threshold:  10,
			TimeWindow: 1 * time.Minute,
			Severity:   SeverityMedium,
			AlertType:  "RATE_LIMIT_ABUSE",
		},
	}

	return m
}

// LogEvent logs a security event
func (m *Monitor) LogEvent(event SecurityEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Generate ID if not provided
	if event.ID == "" {
		event.ID = uuid.New().String()
	}

	// Set timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Add event
	m.events = append(m.events, event)

	// Trim events if exceeding max
	if len(m.events) > m.maxEvents {
		m.events = m.events[len(m.events)-m.maxEvents:]
	}

	// Check alert rules
	m.checkAlertRules(event)
}

// checkAlertRules checks if any alert rules are triggered
func (m *Monitor) checkAlertRules(newEvent SecurityEvent) {
	now := time.Now()

	for _, rule := range m.alertRules {
		if rule.EventType != newEvent.EventType {
			continue
		}

		// Count matching events within time window
		count := 0
		cutoff := now.Add(-rule.TimeWindow)

		for i := len(m.events) - 1; i >= 0; i-- {
			event := m.events[i]
			if event.Timestamp.Before(cutoff) {
				break
			}
			if event.EventType == rule.EventType {
				count++
			}
		}

		// Generate alert if threshold exceeded
		if count >= rule.Threshold {
			alert := Alert{
				ID:          uuid.New().String(),
				Timestamp:   now,
				AlertType:   rule.AlertType,
				Severity:    rule.Severity,
				Message:     fmt.Sprintf("%s: %d events in %s", rule.Name, count, rule.TimeWindow),
				EventCount:  count,
				TimeWindow:  rule.TimeWindow.String(),
				Acknowledged: false,
			}
			m.alerts = append(m.alerts, alert)
		}
	}
}

// GetRecentEvents returns recent security events
func (m *Monitor) GetRecentEvents(limit int, eventType EventType, severity Severity) []SecurityEvent {
	m.mu.RLock()
	defer m.mu.RUnlock()

	filtered := make([]SecurityEvent, 0)

	// Iterate in reverse to get most recent first
	for i := len(m.events) - 1; i >= 0 && len(filtered) < limit; i-- {
		event := m.events[i]

		// Apply filters
		if eventType != "" && event.EventType != eventType {
			continue
		}
		if severity != "" && event.Severity != severity {
			continue
		}

		filtered = append(filtered, event)
	}

	return filtered
}

// GetEventsByTimeRange returns events within a time range
func (m *Monitor) GetEventsByTimeRange(start, end time.Time) []SecurityEvent {
	m.mu.RLock()
	defer m.mu.RUnlock()

	filtered := make([]SecurityEvent, 0)

	for _, event := range m.events {
		if event.Timestamp.After(start) && event.Timestamp.Before(end) {
			filtered = append(filtered, event)
		}
	}

	return filtered
}

// GetAlerts returns all alerts
func (m *Monitor) GetAlerts(onlyActive bool) []Alert {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if !onlyActive {
		return m.alerts
	}

	active := make([]Alert, 0)
	for _, alert := range m.alerts {
		if !alert.Acknowledged {
			active = append(active, alert)
		}
	}

	return active
}

// AcknowledgeAlert marks an alert as acknowledged
func (m *Monitor) AcknowledgeAlert(alertID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, alert := range m.alerts {
		if alert.ID == alertID {
			m.alerts[i].Acknowledged = true
			return nil
		}
	}

	return fmt.Errorf("alert not found: %s", alertID)
}

// GetStats returns security statistics
func (m *Monitor) GetStats(since time.Time) SecurityStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := SecurityStats{
		EventsByType:     make(map[EventType]int),
		EventsBySeverity: make(map[Severity]int),
		TopIPAddresses:   make([]IPStats, 0),
		TopEndpoints:     make([]EndpointStats, 0),
	}

	ipMap := make(map[string]*IPStats)
	endpointMap := make(map[string]*EndpointStats)

	for _, event := range m.events {
		if event.Timestamp.Before(since) {
			continue
		}

		stats.TotalEvents++
		stats.EventsByType[event.EventType]++
		stats.EventsBySeverity[event.Severity]++

		if event.EventType == EventLoginFailure {
			stats.FailedLogins++
		}
		if event.EventType == EventUnauthorizedAccess {
			stats.UnauthorizedAccess++
		}

		// Track IP statistics
		if event.IPAddress != "" {
			if _, exists := ipMap[event.IPAddress]; !exists {
				ipMap[event.IPAddress] = &IPStats{
					IPAddress: event.IPAddress,
				}
			}
			ipMap[event.IPAddress].EventCount++
			if event.EventType == EventLoginFailure || event.EventType == EventUnauthorizedAccess {
				ipMap[event.IPAddress].FailedAuth++
			}
		}

		// Track endpoint statistics
		if event.Endpoint != "" {
			if _, exists := endpointMap[event.Endpoint]; !exists {
				endpointMap[event.Endpoint] = &EndpointStats{
					Endpoint: event.Endpoint,
				}
			}
			endpointMap[event.Endpoint].HitCount++
			if event.StatusCode >= 400 {
				endpointMap[event.Endpoint].ErrorCount++
			}
			// Calculate running average
			current := endpointMap[event.Endpoint].AvgResponseTime
			count := endpointMap[event.Endpoint].HitCount
			endpointMap[event.Endpoint].AvgResponseTime = (current*(int64(count-1)) + event.ResponseTime) / int64(count)
		}
	}

	// Convert maps to slices
	for _, ipStats := range ipMap {
		stats.TopIPAddresses = append(stats.TopIPAddresses, *ipStats)
	}
	for _, endpointStats := range endpointMap {
		stats.TopEndpoints = append(stats.TopEndpoints, *endpointStats)
	}

	// Alert statistics
	stats.AlertCount = len(m.alerts)
	for _, alert := range m.alerts {
		if !alert.Acknowledged {
			stats.ActiveAlerts++
		}
	}

	return stats
}

// GetEventCount returns the total number of events
func (m *Monitor) GetEventCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.events)
}
