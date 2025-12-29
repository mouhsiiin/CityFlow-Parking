package contract

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ChargingStation represents an EV charging station
type ChargingStation struct {
	DocType       string    `json:"docType"`
	StationID     string    `json:"stationId"`
	StationNumber string    `json:"stationNumber"`
	Location      string    `json:"location"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	PowerOutput   int       `json:"powerOutput"` // kW
	PricePerKwh   float64   `json:"pricePerKwh"`
	ConnectorType string    `json:"connectorType"` // CCS, CHAdeMO, Type2
	Status        string    `json:"status"`        // available, in-use, maintenance, out-of-service
	Features      []string  `json:"features"`
	OperatorID    string    `json:"operatorId"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// ChargingSession represents an EV charging session
type ChargingSession struct {
	DocType        string     `json:"docType"`
	SessionID      string     `json:"sessionId"`
	UserID         string     `json:"userId"`
	StationID      string     `json:"stationId"`
	StartTime      time.Time  `json:"startTime"`
	EndTime        *time.Time `json:"endTime,omitempty"`
	Duration       int        `json:"duration"` // minutes
	EnergyConsumed float64    `json:"energyConsumed"` // kWh
	PricePerKwh    float64    `json:"pricePerKwh"`
	CurrentCost    float64    `json:"currentCost"`
	TotalCost      float64    `json:"totalCost"`
	Status         string     `json:"status"` // starting, active, completed, cancelled
	PaymentID      string     `json:"paymentId"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// ChargingContract provides functions for managing charging stations and sessions
type ChargingContract struct {
	contractapi.Contract
}

// ==================== Charging Station Management ====================

// CreateChargingStation creates a new charging station
func (c *ChargingContract) CreateChargingStation(ctx contractapi.TransactionContextInterface, stationId, stationNumber, location string, latitude, longitude float64, powerOutput int, pricePerKwh float64, connectorType, operatorId string) error {
	exists, err := c.StationExists(ctx, stationId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("charging station %s already exists", stationId)
	}

	now := time.Now()
	station := ChargingStation{
		DocType:       "chargingStation",
		StationID:     stationId,
		StationNumber: stationNumber,
		Location:      location,
		Latitude:      latitude,
		Longitude:     longitude,
		PowerOutput:   powerOutput,
		PricePerKwh:   pricePerKwh,
		ConnectorType: connectorType,
		Status:        "available",
		Features:      []string{},
		OperatorID:    operatorId,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	stationJSON, err := json.Marshal(station)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(stationId, stationJSON)
}

// GetChargingStation retrieves a charging station by ID
func (c *ChargingContract) GetChargingStation(ctx contractapi.TransactionContextInterface, stationId string) (*ChargingStation, error) {
	stationJSON, err := ctx.GetStub().GetState(stationId)
	if err != nil {
		return nil, fmt.Errorf("failed to read charging station: %v", err)
	}
	if stationJSON == nil {
		return nil, fmt.Errorf("charging station %s does not exist", stationId)
	}

	var station ChargingStation
	err = json.Unmarshal(stationJSON, &station)
	if err != nil {
		return nil, err
	}

	return &station, nil
}

// UpdateChargingStation updates a charging station
func (c *ChargingContract) UpdateChargingStation(ctx contractapi.TransactionContextInterface, stationId, stationNumber, location string, latitude, longitude float64, powerOutput int, pricePerKwh float64, connectorType string) error {
	station, err := c.GetChargingStation(ctx, stationId)
	if err != nil {
		return err
	}

	station.StationNumber = stationNumber
	station.Location = location
	station.Latitude = latitude
	station.Longitude = longitude
	station.PowerOutput = powerOutput
	station.PricePerKwh = pricePerKwh
	station.ConnectorType = connectorType
	station.UpdatedAt = time.Now()

	stationJSON, err := json.Marshal(station)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(stationId, stationJSON)
}

// UpdateStationStatus updates the status of a charging station
func (c *ChargingContract) UpdateStationStatus(ctx contractapi.TransactionContextInterface, stationId, status string) error {
	station, err := c.GetChargingStation(ctx, stationId)
	if err != nil {
		return err
	}

	station.Status = status
	station.UpdatedAt = time.Now()

	stationJSON, err := json.Marshal(station)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(stationId, stationJSON)
}

// DeleteChargingStation marks a charging station as out of service
func (c *ChargingContract) DeleteChargingStation(ctx contractapi.TransactionContextInterface, stationId string) error {
	return c.UpdateStationStatus(ctx, stationId, "out-of-service")
}

// GetAllChargingStations returns all charging stations
func (c *ChargingContract) GetAllChargingStations(ctx contractapi.TransactionContextInterface) ([]*ChargingStation, error) {
	queryString := `{"selector":{"docType":"chargingStation"}}`
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var stations []*ChargingStation
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var station ChargingStation
		err = json.Unmarshal(queryResponse.Value, &station)
		if err != nil {
			return nil, err
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

// GetAvailableStations returns available charging stations at a location
func (c *ChargingContract) GetAvailableStations(ctx contractapi.TransactionContextInterface, location string) ([]*ChargingStation, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingStation","location":"%s","status":"available"}}`, location)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var stations []*ChargingStation
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var station ChargingStation
		err = json.Unmarshal(queryResponse.Value, &station)
		if err != nil {
			return nil, err
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

// QueryStationsByLocation returns stations by location
func (c *ChargingContract) QueryStationsByLocation(ctx contractapi.TransactionContextInterface, location string) ([]*ChargingStation, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingStation","location":"%s"}}`, location)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var stations []*ChargingStation
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var station ChargingStation
		err = json.Unmarshal(queryResponse.Value, &station)
		if err != nil {
			return nil, err
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

// QueryStationsByPowerOutput returns stations within a power output range
func (c *ChargingContract) QueryStationsByPowerOutput(ctx contractapi.TransactionContextInterface, minPower, maxPower int) ([]*ChargingStation, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingStation","powerOutput":{"$gte":%d,"$lte":%d}}}`, minPower, maxPower)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var stations []*ChargingStation
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var station ChargingStation
		err = json.Unmarshal(queryResponse.Value, &station)
		if err != nil {
			return nil, err
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

// QueryStationsByConnectorType returns stations by connector type
func (c *ChargingContract) QueryStationsByConnectorType(ctx contractapi.TransactionContextInterface, connectorType string) ([]*ChargingStation, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingStation","connectorType":"%s"}}`, connectorType)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var stations []*ChargingStation
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var station ChargingStation
		err = json.Unmarshal(queryResponse.Value, &station)
		if err != nil {
			return nil, err
		}
		stations = append(stations, &station)
	}

	return stations, nil
}

// StationExists checks if a charging station exists
func (c *ChargingContract) StationExists(ctx contractapi.TransactionContextInterface, stationId string) (bool, error) {
	stationJSON, err := ctx.GetStub().GetState(stationId)
	if err != nil {
		return false, err
	}
	return stationJSON != nil, nil
}

// ==================== Charging Session Management ====================

// CreateChargingSession creates a new charging session
func (c *ChargingContract) CreateChargingSession(ctx contractapi.TransactionContextInterface, sessionId, userId, stationId string) error {
	// Verify station exists and is available
	station, err := c.GetChargingStation(ctx, stationId)
	if err != nil {
		return err
	}
	if station.Status != "available" {
		return fmt.Errorf("charging station %s is not available", stationId)
	}

	now := time.Now()
	session := ChargingSession{
		DocType:        "chargingSession",
		SessionID:      sessionId,
		UserID:         userId,
		StationID:      stationId,
		StartTime:      now,
		Duration:       0,
		EnergyConsumed: 0,
		PricePerKwh:    station.PricePerKwh,
		CurrentCost:    0,
		TotalCost:      0,
		Status:         "active",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}

	// Update station status to in-use
	err = c.UpdateStationStatus(ctx, stationId, "in-use")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(sessionId, sessionJSON)
}

// GetChargingSession retrieves a charging session by ID
func (c *ChargingContract) GetChargingSession(ctx contractapi.TransactionContextInterface, sessionId string) (*ChargingSession, error) {
	sessionJSON, err := ctx.GetStub().GetState(sessionId)
	if err != nil {
		return nil, fmt.Errorf("failed to read charging session: %v", err)
	}
	if sessionJSON == nil {
		return nil, fmt.Errorf("charging session %s does not exist", sessionId)
	}

	var session ChargingSession
	err = json.Unmarshal(sessionJSON, &session)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

// UpdateSessionProgress updates the progress of a charging session
func (c *ChargingContract) UpdateSessionProgress(ctx contractapi.TransactionContextInterface, sessionId string, energyConsumed float64) error {
	session, err := c.GetChargingSession(ctx, sessionId)
	if err != nil {
		return err
	}

	if session.Status != "active" {
		return fmt.Errorf("session %s is not active", sessionId)
	}

	now := time.Now()
	session.EnergyConsumed = energyConsumed
	session.CurrentCost = energyConsumed * session.PricePerKwh
	session.Duration = int(now.Sub(session.StartTime).Minutes())
	session.UpdatedAt = now

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(sessionId, sessionJSON)
}

// StopChargingSession stops a charging session
func (c *ChargingContract) StopChargingSession(ctx contractapi.TransactionContextInterface, sessionId string, totalEnergy float64, paymentId string) (*ChargingSession, error) {
	session, err := c.GetChargingSession(ctx, sessionId)
	if err != nil {
		return nil, err
	}

	if session.Status != "active" {
		return nil, fmt.Errorf("session %s is not active", sessionId)
	}

	now := time.Now()
	session.EndTime = &now
	session.EnergyConsumed = totalEnergy
	session.TotalCost = totalEnergy * session.PricePerKwh
	session.Duration = int(now.Sub(session.StartTime).Minutes())
	session.Status = "completed"
	session.PaymentID = paymentId
	session.UpdatedAt = now

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return nil, err
	}

	// Update station status to available
	err = c.UpdateStationStatus(ctx, session.StationID, "available")
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(sessionId, sessionJSON)
	if err != nil {
		return nil, err
	}

	return session, nil
}

// CancelSession cancels a charging session
func (c *ChargingContract) CancelSession(ctx contractapi.TransactionContextInterface, sessionId string) error {
	session, err := c.GetChargingSession(ctx, sessionId)
	if err != nil {
		return err
	}

	if session.Status == "completed" || session.Status == "cancelled" {
		return fmt.Errorf("session %s cannot be cancelled", sessionId)
	}

	now := time.Now()
	session.EndTime = &now
	session.Status = "cancelled"
	session.UpdatedAt = now

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}

	// Update station status to available
	err = c.UpdateStationStatus(ctx, session.StationID, "available")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(sessionId, sessionJSON)
}

// GetUserSessions returns all charging sessions for a user
func (c *ChargingContract) GetUserSessions(ctx contractapi.TransactionContextInterface, userId string) ([]*ChargingSession, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingSession","userId":"%s"}}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var sessions []*ChargingSession
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var session ChargingSession
		err = json.Unmarshal(queryResponse.Value, &session)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, nil
}

// GetStationSessions returns all sessions for a charging station
func (c *ChargingContract) GetStationSessions(ctx contractapi.TransactionContextInterface, stationId string) ([]*ChargingSession, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingSession","stationId":"%s"}}`, stationId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var sessions []*ChargingSession
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var session ChargingSession
		err = json.Unmarshal(queryResponse.Value, &session)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, nil
}

// GetActiveSessions returns active sessions for a user
func (c *ChargingContract) GetActiveSessions(ctx contractapi.TransactionContextInterface, userId string) ([]*ChargingSession, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingSession","userId":"%s","status":"active"}}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var sessions []*ChargingSession
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var session ChargingSession
		err = json.Unmarshal(queryResponse.Value, &session)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, nil
}

// GetSessionHistory returns completed/cancelled sessions for a user
func (c *ChargingContract) GetSessionHistory(ctx contractapi.TransactionContextInterface, userId string) ([]*ChargingSession, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"chargingSession","userId":"%s","status":{"$in":["completed","cancelled"]}}}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var sessions []*ChargingSession
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var session ChargingSession
		err = json.Unmarshal(queryResponse.Value, &session)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, &session)
	}

	return sessions, nil
}

// GetTotalEnergyConsumed returns total energy consumed by a user
func (c *ChargingContract) GetTotalEnergyConsumed(ctx contractapi.TransactionContextInterface, userId string) (float64, error) {
	sessions, err := c.GetUserSessions(ctx, userId)
	if err != nil {
		return 0, err
	}

	var totalEnergy float64
	for _, session := range sessions {
		if session.Status == "completed" {
			totalEnergy += session.EnergyConsumed
		}
	}

	return totalEnergy, nil
}
