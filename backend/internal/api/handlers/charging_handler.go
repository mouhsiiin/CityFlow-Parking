package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/fabric"
)

// ChargingHandler handles charging station and session endpoints
type ChargingHandler struct {
	fabricClient *fabric.Client
}

// NewChargingHandler creates a new charging handler
func NewChargingHandler(fabricClient *fabric.Client) *ChargingHandler {
	return &ChargingHandler{
		fabricClient: fabricClient,
	}
}

// CreateStationRequest represents create charging station request
type CreateStationRequest struct {
	StationNumber string  `json:"stationNumber" binding:"required"`
	Location      string  `json:"location" binding:"required"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	PowerOutput   int     `json:"powerOutput" binding:"required"`
	PricePerKwh   float64 `json:"pricePerKwh" binding:"required"`
	ConnectorType string  `json:"connectorType" binding:"required"`
	OperatorID    string  `json:"operatorId"`
}

// UpdateStationRequest represents update charging station request
type UpdateStationRequest struct {
	StationNumber string  `json:"stationNumber"`
	Location      string  `json:"location"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	PowerOutput   int     `json:"powerOutput"`
	PricePerKwh   float64 `json:"pricePerKwh"`
	ConnectorType string  `json:"connectorType"`
}

// StartSessionRequest represents start charging session request
type StartSessionRequest struct {
	StationID string `json:"stationId" binding:"required"`
}

// UpdateSessionRequest represents update session progress request
type UpdateSessionRequest struct {
	EnergyConsumed float64 `json:"energyConsumed" binding:"required"`
}

// StopSessionRequest represents stop charging session request
type StopSessionRequest struct {
	SessionID   string  `json:"sessionId" binding:"required"`
	TotalEnergy float64 `json:"totalEnergy" binding:"required"`
}

// ==================== Charging Station Endpoints ====================

// CreateStation creates a new charging station
func (h *ChargingHandler) CreateStation(c *gin.Context) {
	var req CreateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	stationId := "station_" + uuid.New().String()

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction(
		"CreateChargingStation",
		stationId,
		req.StationNumber,
		req.Location,
		fmt.Sprintf("%f", req.Latitude),
		fmt.Sprintf("%f", req.Longitude),
		fmt.Sprintf("%d", req.PowerOutput),
		fmt.Sprintf("%f", req.PricePerKwh),
		req.ConnectorType,
		req.OperatorID,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Charging station created successfully",
		"stationId": stationId,
	})
}

// GetStation returns a charging station by ID
func (h *ChargingHandler) GetStation(c *gin.Context) {
	stationId := c.Param("id")

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetChargingStation", stationId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Charging station not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"station": json.RawMessage(result)})
}

// UpdateStation updates a charging station
func (h *ChargingHandler) UpdateStation(c *gin.Context) {
	stationId := c.Param("id")

	var req UpdateStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction(
		"UpdateChargingStation",
		stationId,
		req.StationNumber,
		req.Location,
		fmt.Sprintf("%f", req.Latitude),
		fmt.Sprintf("%f", req.Longitude),
		fmt.Sprintf("%d", req.PowerOutput),
		fmt.Sprintf("%f", req.PricePerKwh),
		req.ConnectorType,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Charging station updated successfully"})
}

// DeleteStation marks a charging station as out of service
func (h *ChargingHandler) DeleteStation(c *gin.Context) {
	stationId := c.Param("id")

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction("DeleteChargingStation", stationId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Charging station deleted successfully"})
}

// GetAllStations returns all charging stations
func (h *ChargingHandler) GetAllStations(c *gin.Context) {
	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetAllChargingStations")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stations": json.RawMessage(result)})
}

// GetAvailableStations returns available stations at a location
func (h *ChargingHandler) GetAvailableStations(c *gin.Context) {
	location := c.Query("location")
	if location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location is required"})
		return
	}

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetAvailableStations", location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stations": json.RawMessage(result)})
}

// SearchStations searches for charging stations
func (h *ChargingHandler) SearchStations(c *gin.Context) {
	location := c.Query("location")
	connectorType := c.Query("connectorType")
	minPower := c.Query("minPower")
	maxPower := c.Query("maxPower")

	contract := h.fabricClient.GetChargingContract()
	var result []byte
	var err error

	if location != "" {
		result, err = contract.EvaluateTransaction("QueryStationsByLocation", location)
	} else if connectorType != "" {
		result, err = contract.EvaluateTransaction("QueryStationsByConnectorType", connectorType)
	} else if minPower != "" && maxPower != "" {
		result, err = contract.EvaluateTransaction("QueryStationsByPowerOutput", minPower, maxPower)
	} else {
		result, err = contract.EvaluateTransaction("GetAllChargingStations")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stations": json.RawMessage(result)})
}

// ==================== Charging Session Endpoints ====================

// StartSession starts a new charging session
func (h *ChargingHandler) StartSession(c *gin.Context) {
	var req StartSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	sessionId := "charging_session_" + uuid.New().String()

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction(
		"CreateChargingSession",
		sessionId,
		user.UserID,
		req.StationID,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Charging session started successfully",
		"sessionId": sessionId,
	})
}

// GetSession returns a charging session by ID
func (h *ChargingHandler) GetSession(c *gin.Context) {
	sessionId := c.Param("id")

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetChargingSession", sessionId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Charging session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": json.RawMessage(result)})
}

// UpdateSession updates session progress
func (h *ChargingHandler) UpdateSession(c *gin.Context) {
	sessionId := c.Param("id")

	var req UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction(
		"UpdateSessionProgress",
		sessionId,
		fmt.Sprintf("%f", req.EnergyConsumed),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session updated successfully"})
}

// StopSession stops a charging session and processes payment
func (h *ChargingHandler) StopSession(c *gin.Context) {
	var req StopSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get session to calculate cost
	contract := h.fabricClient.GetChargingContract()
	sessionResult, err := contract.EvaluateTransaction("GetChargingSession", req.SessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session not found"})
		return
	}

	var session struct {
		UserID      string  `json:"userId"`
		PricePerKwh float64 `json:"pricePerKwh"`
	}
	json.Unmarshal(sessionResult, &session)

	totalCost := req.TotalEnergy * session.PricePerKwh

	// Process payment
	paymentId := "payment_" + uuid.New().String()
	walletContract := h.fabricClient.GetWalletContract()
	walletResult, err := walletContract.EvaluateTransaction("GetWalletByUserId", session.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet not found"})
		return
	}

	var wallet struct {
		WalletID string `json:"walletId"`
	}
	json.Unmarshal(walletResult, &wallet)

	_, err = walletContract.SubmitTransaction(
		"ProcessPayment",
		paymentId,
		wallet.WalletID,
		fmt.Sprintf("%f", totalCost),
		"charging",
		req.SessionID,
		"Charging session payment",
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment failed: " + err.Error()})
		return
	}

	// Stop session
	result, err := contract.SubmitTransaction(
		"StopChargingSession",
		req.SessionID,
		fmt.Sprintf("%f", req.TotalEnergy),
		paymentId,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Charging session stopped successfully",
		"session":   json.RawMessage(result),
		"paymentId": paymentId,
	})
}

// CancelSession cancels a charging session
func (h *ChargingHandler) CancelSession(c *gin.Context) {
	sessionId := c.Param("id")

	contract := h.fabricClient.GetChargingContract()
	_, err := contract.SubmitTransaction("CancelSession", sessionId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Session cancelled successfully"})
}

// GetUserSessions returns all sessions for the current user
func (h *ChargingHandler) GetUserSessions(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetUserSessions", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": json.RawMessage(result)})
}

// GetActiveSessions returns active sessions for the current user
func (h *ChargingHandler) GetActiveSessions(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetActiveSessions", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": json.RawMessage(result)})
}

// GetSessionHistory returns session history for the current user
func (h *ChargingHandler) GetSessionHistory(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetSessionHistory", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sessions": json.RawMessage(result)})
}

// GetEnergyStats returns energy consumption statistics
func (h *ChargingHandler) GetEnergyStats(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetChargingContract()
	result, err := contract.EvaluateTransaction("GetTotalEnergyConsumed", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"totalEnergyConsumed": string(result)})
}
