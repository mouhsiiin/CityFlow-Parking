package contract

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ParkingSpot represents a parking spot
type ParkingSpot struct {
	DocType       string   `json:"docType"`
	SpotID        string   `json:"spotId"`
	SpotNumber    string   `json:"spotNumber"`
	Location      string   `json:"location"`
	Latitude      float64  `json:"latitude"`
	Longitude     float64  `json:"longitude"`
	SpotType      string   `json:"spotType"` // standard, premium, disabled
	PricePerHour  float64  `json:"pricePerHour"`
	Status        string   `json:"status"` // available, occupied, reserved, maintenance
	HasEVCharging bool     `json:"hasEVCharging"`
	Features      []string `json:"features"`
	OperatorID    string   `json:"operatorId"`
	CreatedAt     string   `json:"createdAt"`
	UpdatedAt     string   `json:"updatedAt"`
}

// Booking represents a parking booking
type Booking struct {
	DocType        string  `json:"docType"`
	BookingID      string  `json:"bookingId"`
	UserID         string  `json:"userId"`
	SpotID         string  `json:"spotId"`
	StartTime      string  `json:"startTime"`
	EndTime        string  `json:"endTime"`
	ActualCheckIn  string  `json:"actualCheckIn,omitempty"`
	ActualCheckOut string  `json:"actualCheckOut,omitempty"`
	Duration       int     `json:"duration"` // hours
	PricePerHour   float64 `json:"pricePerHour"`
	TotalCost      float64 `json:"totalCost"`
	Status         string  `json:"status"` // pending, confirmed, active, completed, cancelled
	QRCode         string  `json:"qrCode"`
	PaymentID      string  `json:"paymentId"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

// ParkingContract provides functions for managing parking spots and bookings
type ParkingContract struct {
	contractapi.Contract
}

// InitLedger initializes the chaincode
func (c *ParkingContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Initialize ledger - no sample data needed for production
	return nil
}

// ==================== Parking Spot Management ====================

// CreateParkingSpot creates a new parking spot
func (c *ParkingContract) CreateParkingSpot(ctx contractapi.TransactionContextInterface, spotId, spotNumber, location string, latitude, longitude float64, spotType string, pricePerHour float64, hasEVCharging bool, operatorId string) error {
	exists, err := c.SpotExists(ctx, spotId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("parking spot %s already exists", spotId)
	}

	now := time.Now().Format(time.RFC3339)
	spot := ParkingSpot{
		DocType:       "parkingSpot",
		SpotID:        spotId,
		SpotNumber:    spotNumber,
		Location:      location,
		Latitude:      latitude,
		Longitude:     longitude,
		SpotType:      spotType,
		PricePerHour:  pricePerHour,
		Status:        "available",
		HasEVCharging: hasEVCharging,
		Features:      []string{},
		OperatorID:    operatorId,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	spotJSON, err := json.Marshal(spot)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(spotId, spotJSON)
}

// GetParkingSpot retrieves a parking spot by ID
func (c *ParkingContract) GetParkingSpot(ctx contractapi.TransactionContextInterface, spotId string) (*ParkingSpot, error) {
	spotJSON, err := ctx.GetStub().GetState(spotId)
	if err != nil {
		return nil, fmt.Errorf("failed to read parking spot: %v", err)
	}
	if spotJSON == nil {
		return nil, fmt.Errorf("parking spot %s does not exist", spotId)
	}

	var spot ParkingSpot
	err = json.Unmarshal(spotJSON, &spot)
	if err != nil {
		return nil, err
	}

	return &spot, nil
}

// UpdateParkingSpot updates a parking spot
func (c *ParkingContract) UpdateParkingSpot(ctx contractapi.TransactionContextInterface, spotId, spotNumber, location string, latitude, longitude float64, spotType string, pricePerHour float64, hasEVCharging bool) error {
	spot, err := c.GetParkingSpot(ctx, spotId)
	if err != nil {
		return err
	}

	spot.SpotNumber = spotNumber
	spot.Location = location
	spot.Latitude = latitude
	spot.Longitude = longitude
	spot.SpotType = spotType
	spot.PricePerHour = pricePerHour
	spot.HasEVCharging = hasEVCharging
	spot.UpdatedAt = time.Now().Format(time.RFC3339)

	spotJSON, err := json.Marshal(spot)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(spotId, spotJSON)
}

// UpdateSpotStatus updates the status of a parking spot
func (c *ParkingContract) UpdateSpotStatus(ctx contractapi.TransactionContextInterface, spotId, status string) error {
	spot, err := c.GetParkingSpot(ctx, spotId)
	if err != nil {
		return err
	}

	spot.Status = status
	spot.UpdatedAt = time.Now().Format(time.RFC3339)

	spotJSON, err := json.Marshal(spot)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(spotId, spotJSON)
}

// DeleteParkingSpot marks a parking spot as unavailable (soft delete)
func (c *ParkingContract) DeleteParkingSpot(ctx contractapi.TransactionContextInterface, spotId string) error {
	return c.UpdateSpotStatus(ctx, spotId, "maintenance")
}

// GetAllParkingSpots returns all parking spots
func (c *ParkingContract) GetAllParkingSpots(ctx contractapi.TransactionContextInterface) ([]*ParkingSpot, error) {
	// Use key range query instead of rich query for LevelDB compatibility
	resultsIterator, err := ctx.GetStub().GetStateByRange("spot_", "spot_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var spots []*ParkingSpot
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var spot ParkingSpot
		err = json.Unmarshal(queryResponse.Value, &spot)
		if err != nil {
			continue // Skip invalid records
		}
		
		// Verify it's a parking spot
		if spot.DocType == "parkingSpot" {
			spots = append(spots, &spot)
		}
	}

	return spots, nil
}

// GetAvailableSpots returns available parking spots at a location
func (c *ParkingContract) GetAvailableSpots(ctx contractapi.TransactionContextInterface, location string) ([]*ParkingSpot, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("spot_", "spot_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var spots []*ParkingSpot
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var spot ParkingSpot
		err = json.Unmarshal(queryResponse.Value, &spot)
		if err != nil {
			continue
		}
		
		if spot.DocType == "parkingSpot" && spot.Location == location && spot.Status == "available" {
			spots = append(spots, &spot)
		}
	}

	return spots, nil
}

// QuerySpotsByLocation returns spots by location
func (c *ParkingContract) QuerySpotsByLocation(ctx contractapi.TransactionContextInterface, location string) ([]*ParkingSpot, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("spot_", "spot_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var spots []*ParkingSpot
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var spot ParkingSpot
		err = json.Unmarshal(queryResponse.Value, &spot)
		if err != nil {
			continue
		}
		
		if spot.DocType == "parkingSpot" && spot.Location == location {
			spots = append(spots, &spot)
		}
	}

	return spots, nil
}

// QuerySpotsByType returns spots by type
func (c *ParkingContract) QuerySpotsByType(ctx contractapi.TransactionContextInterface, spotType string) ([]*ParkingSpot, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("spot_", "spot_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var spots []*ParkingSpot
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var spot ParkingSpot
		err = json.Unmarshal(queryResponse.Value, &spot)
		if err != nil {
			continue
		}
		
		if spot.DocType == "parkingSpot" && spot.SpotType == spotType {
			spots = append(spots, &spot)
		}
	}

	return spots, nil
}

// QuerySpotsByPriceRange returns spots within a price range
func (c *ParkingContract) QuerySpotsByPriceRange(ctx contractapi.TransactionContextInterface, minPrice, maxPrice float64) ([]*ParkingSpot, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("spot_", "spot_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var spots []*ParkingSpot
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var spot ParkingSpot
		err = json.Unmarshal(queryResponse.Value, &spot)
		if err != nil {
			continue
		}
		
		if spot.DocType == "parkingSpot" && spot.PricePerHour >= minPrice && spot.PricePerHour <= maxPrice {
			spots = append(spots, &spot)
		}
	}

	return spots, nil
}

// SpotExists checks if a parking spot exists
func (c *ParkingContract) SpotExists(ctx contractapi.TransactionContextInterface, spotId string) (bool, error) {
	spotJSON, err := ctx.GetStub().GetState(spotId)
	if err != nil {
		return false, err
	}
	return spotJSON != nil, nil
}

// ==================== Booking Management ====================

// CreateBooking creates a new parking booking
func (c *ParkingContract) CreateBooking(ctx contractapi.TransactionContextInterface, bookingId, userId, spotId string, startTimeStr, endTimeStr string, totalCost float64, paymentId string) error {
	// Parse times
	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		return fmt.Errorf("invalid start time format: %v", err)
	}
	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		return fmt.Errorf("invalid end time format: %v", err)
	}

	// Verify spot exists and is available
	spot, err := c.GetParkingSpot(ctx, spotId)
	if err != nil {
		return err
	}
	if spot.Status != "available" {
		return fmt.Errorf("parking spot %s is not available", spotId)
	}

	duration := int(endTime.Sub(startTime).Hours())
	now := time.Now().Format(time.RFC3339)

	booking := Booking{
		DocType:        "booking",
		BookingID:      bookingId,
		UserID:         userId,
		SpotID:         spotId,
		StartTime:      startTimeStr,
		EndTime:        endTimeStr,
		ActualCheckIn:  "",
		ActualCheckOut: "",
		Duration:       duration,
		PricePerHour:   spot.PricePerHour,
		TotalCost:      totalCost,
		Status:         "confirmed",
		QRCode:         fmt.Sprintf("QR_%s_%s", bookingId, spotId),
		PaymentID:      paymentId,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return err
	}

	// Update spot status to reserved
	err = c.UpdateSpotStatus(ctx, spotId, "reserved")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(bookingId, bookingJSON)
}

// GetBooking retrieves a booking by ID
func (c *ParkingContract) GetBooking(ctx contractapi.TransactionContextInterface, bookingId string) (*Booking, error) {
	bookingJSON, err := ctx.GetStub().GetState(bookingId)
	if err != nil {
		return nil, fmt.Errorf("failed to read booking: %v", err)
	}
	if bookingJSON == nil {
		return nil, fmt.Errorf("booking %s does not exist", bookingId)
	}

	var booking Booking
	err = json.Unmarshal(bookingJSON, &booking)
	if err != nil {
		return nil, err
	}

	return &booking, nil
}

// UpdateBookingStatus updates the status of a booking
func (c *ParkingContract) UpdateBookingStatus(ctx contractapi.TransactionContextInterface, bookingId, status string) error {
	booking, err := c.GetBooking(ctx, bookingId)
	if err != nil {
		return err
	}

	booking.Status = status
	booking.UpdatedAt = time.Now().Format(time.RFC3339)

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(bookingId, bookingJSON)
}

// CheckInBooking records check-in for a booking
func (c *ParkingContract) CheckInBooking(ctx contractapi.TransactionContextInterface, bookingId string) error {
	booking, err := c.GetBooking(ctx, bookingId)
	if err != nil {
		return err
	}

	if booking.Status != "confirmed" {
		return fmt.Errorf("booking %s is not in confirmed status", bookingId)
	}

	now := time.Now().Format(time.RFC3339)
	booking.ActualCheckIn = now
	booking.Status = "active"
	booking.UpdatedAt = now

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return err
	}

	// Update spot status to occupied
	err = c.UpdateSpotStatus(ctx, booking.SpotID, "occupied")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(bookingId, bookingJSON)
}

// CheckOutBooking records check-out for a booking
func (c *ParkingContract) CheckOutBooking(ctx contractapi.TransactionContextInterface, bookingId string) (*Booking, error) {
	booking, err := c.GetBooking(ctx, bookingId)
	if err != nil {
		return nil, err
	}

	if booking.Status != "active" {
		return nil, fmt.Errorf("booking %s is not active", bookingId)
	}

	now := time.Now()
	nowStr := now.Format(time.RFC3339)
	booking.ActualCheckOut = nowStr
	booking.Status = "completed"
	booking.UpdatedAt = nowStr

	// Recalculate cost if overtime
	endTime, _ := time.Parse(time.RFC3339, booking.EndTime)
	if now.After(endTime) {
		extraHours := int(now.Sub(endTime).Hours()) + 1
		booking.TotalCost += float64(extraHours) * booking.PricePerHour
	}

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return nil, err
	}

	// Update spot status to available
	err = c.UpdateSpotStatus(ctx, booking.SpotID, "available")
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(bookingId, bookingJSON)
	if err != nil {
		return nil, err
	}

	return booking, nil
}

// ExtendBooking extends a booking
func (c *ParkingContract) ExtendBooking(ctx contractapi.TransactionContextInterface, bookingId, newEndTimeStr string, additionalCost float64) error {
	booking, err := c.GetBooking(ctx, bookingId)
	if err != nil {
		return err
	}

	newEndTime, err := time.Parse(time.RFC3339, newEndTimeStr)
	if err != nil {
		return fmt.Errorf("invalid end time format: %v", err)
	}

	startTime, _ := time.Parse(time.RFC3339, booking.StartTime)
	booking.EndTime = newEndTimeStr
	booking.TotalCost += additionalCost
	booking.Duration = int(newEndTime.Sub(startTime).Hours())
	booking.UpdatedAt = time.Now().Format(time.RFC3339)

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(bookingId, bookingJSON)
}

// CancelBooking cancels a booking
func (c *ParkingContract) CancelBooking(ctx contractapi.TransactionContextInterface, bookingId string) error {
	booking, err := c.GetBooking(ctx, bookingId)
	if err != nil {
		return err
	}

	if booking.Status == "completed" || booking.Status == "cancelled" {
		return fmt.Errorf("booking %s cannot be cancelled", bookingId)
	}

	booking.Status = "cancelled"
	booking.UpdatedAt = time.Now().Format(time.RFC3339)

	bookingJSON, err := json.Marshal(booking)
	if err != nil {
		return err
	}

	// Update spot status to available
	err = c.UpdateSpotStatus(ctx, booking.SpotID, "available")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(bookingId, bookingJSON)
}

// GetUserBookings returns all bookings for a user
func (c *ParkingContract) GetUserBookings(ctx contractapi.TransactionContextInterface, userId string) ([]*Booking, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("booking_", "booking_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var bookings []*Booking
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var booking Booking
		err = json.Unmarshal(queryResponse.Value, &booking)
		if err != nil {
			continue
		}
		
		if booking.DocType == "booking" && booking.UserID == userId {
			bookings = append(bookings, &booking)
		}
	}

	return bookings, nil
}

// GetSpotBookings returns all bookings for a parking spot
func (c *ParkingContract) GetSpotBookings(ctx contractapi.TransactionContextInterface, spotId string) ([]*Booking, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("booking_", "booking_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var bookings []*Booking
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var booking Booking
		err = json.Unmarshal(queryResponse.Value, &booking)
		if err != nil {
			continue
		}
		
		if booking.DocType == "booking" && booking.SpotID == spotId {
			bookings = append(bookings, &booking)
		}
	}

	return bookings, nil
}

// GetActiveBookings returns active bookings for a user
func (c *ParkingContract) GetActiveBookings(ctx contractapi.TransactionContextInterface, userId string) ([]*Booking, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("booking_", "booking_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var bookings []*Booking
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var booking Booking
		err = json.Unmarshal(queryResponse.Value, &booking)
		if err != nil {
			continue
		}
		
		if booking.DocType == "booking" && booking.UserID == userId && (booking.Status == "confirmed" || booking.Status == "active") {
			bookings = append(bookings, &booking)
		}
	}

	return bookings, nil
}

// GetBookingHistory returns completed/cancelled bookings for a user
func (c *ParkingContract) GetBookingHistory(ctx contractapi.TransactionContextInterface, userId string) ([]*Booking, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("booking_", "booking_~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var bookings []*Booking
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var booking Booking
		err = json.Unmarshal(queryResponse.Value, &booking)
		if err != nil {
			continue
		}
		
		if booking.DocType == "booking" && booking.UserID == userId && (booking.Status == "completed" || booking.Status == "cancelled") {
			bookings = append(bookings, &booking)
		}
	}

	return bookings, nil
}
