package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/fabric"
)

// ParkingHandler handles parking spot and booking endpoints
type ParkingHandler struct {
	fabricClient *fabric.Client
}

// NewParkingHandler creates a new parking handler
func NewParkingHandler(fabricClient *fabric.Client) *ParkingHandler {
	return &ParkingHandler{
		fabricClient: fabricClient,
	}
}

// CreateSpotRequest represents create parking spot request
type CreateSpotRequest struct {
	SpotNumber    string  `json:"spotNumber" binding:"required"`
	Location      string  `json:"location" binding:"required"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	SpotType      string  `json:"spotType" binding:"required"`
	PricePerHour  float64 `json:"pricePerHour" binding:"required"`
	HasEVCharging bool    `json:"hasEVCharging"`
	OperatorID    string  `json:"operatorId"`
}

// UpdateSpotRequest represents update parking spot request
type UpdateSpotRequest struct {
	SpotNumber    string  `json:"spotNumber"`
	Location      string  `json:"location"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	SpotType      string  `json:"spotType"`
	PricePerHour  float64 `json:"pricePerHour"`
	HasEVCharging bool    `json:"hasEVCharging"`
}

// CreateBookingRequest represents create booking request
type CreateBookingRequest struct {
	SpotID    string  `json:"spotId" binding:"required"`
	StartTime string  `json:"startTime" binding:"required"`
	EndTime   string  `json:"endTime" binding:"required"`
	TotalCost float64 `json:"totalCost" binding:"required"`
}

// ExtendBookingRequest represents extend booking request
type ExtendBookingRequest struct {
	BookingID      string  `json:"bookingId" binding:"required"`
	NewEndTime     string  `json:"newEndTime" binding:"required"`
	AdditionalCost float64 `json:"additionalCost" binding:"required"`
}

// CheckInRequest represents check-in request
type CheckInRequest struct {
	BookingID string `json:"bookingId" binding:"required"`
}

// CheckOutRequest represents check-out request
type CheckOutRequest struct {
	BookingID string `json:"bookingId" binding:"required"`
}

// ==================== Parking Spot Endpoints ====================

// CreateSpot creates a new parking spot
func (h *ParkingHandler) CreateSpot(c *gin.Context) {
	var req CreateSpotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	spotId := "spot_" + uuid.New().String()

	contract := h.fabricClient.GetParkingContract()
	_, err := contract.SubmitTransaction(
		"CreateParkingSpot",
		spotId,
		req.SpotNumber,
		req.Location,
		fmt.Sprintf("%f", req.Latitude),
		fmt.Sprintf("%f", req.Longitude),
		req.SpotType,
		fmt.Sprintf("%f", req.PricePerHour),
		strconv.FormatBool(req.HasEVCharging),
		req.OperatorID,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Parking spot created successfully",
		"spotId":  spotId,
	})
}

// GetSpot returns a parking spot by ID
func (h *ParkingHandler) GetSpot(c *gin.Context) {
	spotId := c.Param("id")

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetParkingSpot", spotId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Parking spot not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"spot": json.RawMessage(result)})
}

// UpdateSpot updates a parking spot
func (h *ParkingHandler) UpdateSpot(c *gin.Context) {
	spotId := c.Param("id")

	var req UpdateSpotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetParkingContract()
	_, err := contract.SubmitTransaction(
		"UpdateParkingSpot",
		spotId,
		req.SpotNumber,
		req.Location,
		fmt.Sprintf("%f", req.Latitude),
		fmt.Sprintf("%f", req.Longitude),
		req.SpotType,
		fmt.Sprintf("%f", req.PricePerHour),
		strconv.FormatBool(req.HasEVCharging),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Parking spot updated successfully"})
}

// DeleteSpot marks a parking spot as maintenance
func (h *ParkingHandler) DeleteSpot(c *gin.Context) {
	spotId := c.Param("id")

	contract := h.fabricClient.GetParkingContract()
	_, err := contract.SubmitTransaction("DeleteParkingSpot", spotId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Parking spot deleted successfully"})
}

// GetAllSpots returns all parking spots
func (h *ParkingHandler) GetAllSpots(c *gin.Context) {
	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetAllParkingSpots")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"spots": json.RawMessage(result)})
}

// GetAvailableSpots returns available spots at a location
func (h *ParkingHandler) GetAvailableSpots(c *gin.Context) {
	location := c.Query("location")
	if location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Location is required"})
		return
	}

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetAvailableSpots", location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"spots": json.RawMessage(result)})
}

// SearchSpots searches for parking spots
func (h *ParkingHandler) SearchSpots(c *gin.Context) {
	location := c.Query("location")
	spotType := c.Query("type")
	minPrice := c.Query("minPrice")
	maxPrice := c.Query("maxPrice")

	contract := h.fabricClient.GetParkingContract()
	var result []byte
	var err error

	if location != "" {
		result, err = contract.EvaluateTransaction("QuerySpotsByLocation", location)
	} else if spotType != "" {
		result, err = contract.EvaluateTransaction("QuerySpotsByType", spotType)
	} else if minPrice != "" && maxPrice != "" {
		result, err = contract.EvaluateTransaction("QuerySpotsByPriceRange", minPrice, maxPrice)
	} else {
		result, err = contract.EvaluateTransaction("GetAllParkingSpots")
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"spots": json.RawMessage(result)})
}

// ==================== Booking Endpoints ====================

// CreateBooking creates a new parking booking
func (h *ParkingHandler) CreateBooking(c *gin.Context) {
	var req CreateBookingRequest
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

	bookingId := "booking_" + uuid.New().String()
	paymentId := "payment_" + uuid.New().String()

	// Process payment first
	walletContract := h.fabricClient.GetWalletContract()
	walletResult, err := walletContract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet not found. Please create a wallet first."})
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
		fmt.Sprintf("%f", req.TotalCost),
		"parking",
		bookingId,
		"Parking booking payment",
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment failed: " + err.Error()})
		return
	}

	// Create booking
	contract := h.fabricClient.GetParkingContract()
	_, err = contract.SubmitTransaction(
		"CreateBooking",
		bookingId,
		user.UserID,
		req.SpotID,
		req.StartTime,
		req.EndTime,
		fmt.Sprintf("%f", req.TotalCost),
		paymentId,
	)
	if err != nil {
		// Refund payment if booking fails
		refundId := "refund_" + uuid.New().String()
		walletContract.SubmitTransaction("RefundPayment", paymentId, fmt.Sprintf("%f", req.TotalCost), refundId)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Booking created successfully",
		"bookingId": bookingId,
		"paymentId": paymentId,
	})
}

// GetBooking returns a booking by ID
func (h *ParkingHandler) GetBooking(c *gin.Context) {
	bookingId := c.Param("id")

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetBooking", bookingId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"booking": json.RawMessage(result)})
}

// CheckIn handles booking check-in
func (h *ParkingHandler) CheckIn(c *gin.Context) {
	var req CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetParkingContract()
	_, err := contract.SubmitTransaction("CheckInBooking", req.BookingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Checked in successfully"})
}

// CheckOut handles booking check-out
func (h *ParkingHandler) CheckOut(c *gin.Context) {
	var req CheckOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.SubmitTransaction("CheckOutBooking", req.BookingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Checked out successfully",
		"booking": json.RawMessage(result),
	})
}

// ExtendBooking extends a booking
func (h *ParkingHandler) ExtendBooking(c *gin.Context) {
	var req ExtendBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Process additional payment
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	walletContract := h.fabricClient.GetWalletContract()
	walletResult, err := walletContract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet not found"})
		return
	}

	var wallet struct {
		WalletID string `json:"walletId"`
	}
	json.Unmarshal(walletResult, &wallet)

	paymentId := "payment_" + uuid.New().String()
	_, err = walletContract.SubmitTransaction(
		"ProcessPayment",
		paymentId,
		wallet.WalletID,
		fmt.Sprintf("%f", req.AdditionalCost),
		"parking",
		req.BookingID,
		"Booking extension payment",
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment failed: " + err.Error()})
		return
	}

	contract := h.fabricClient.GetParkingContract()
	_, err = contract.SubmitTransaction(
		"ExtendBooking",
		req.BookingID,
		req.NewEndTime,
		fmt.Sprintf("%f", req.AdditionalCost),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking extended successfully"})
}

// CancelBooking cancels a booking
func (h *ParkingHandler) CancelBooking(c *gin.Context) {
	bookingId := c.Param("id")

	contract := h.fabricClient.GetParkingContract()
	_, err := contract.SubmitTransaction("CancelBooking", bookingId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking cancelled successfully"})
}

// GetUserBookings returns all bookings for the current user
func (h *ParkingHandler) GetUserBookings(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetUserBookings", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": json.RawMessage(result)})
}

// GetActiveBookings returns active bookings for the current user
func (h *ParkingHandler) GetActiveBookings(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetActiveBookings", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": json.RawMessage(result)})
}

// GetBookingHistory returns booking history for the current user
func (h *ParkingHandler) GetBookingHistory(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetParkingContract()
	result, err := contract.EvaluateTransaction("GetBookingHistory", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"bookings": json.RawMessage(result)})
}
