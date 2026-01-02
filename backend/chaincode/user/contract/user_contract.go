package contract

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// User represents a user in the system
type User struct {
	DocType     string    `json:"docType"`
	UserID      string    `json:"userId"`
	Email       string    `json:"email"`
	PasswordHash string   `json:"passwordHash"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Phone       string    `json:"phone"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	IsActive    bool      `json:"isActive"`
}

// Session represents a user session stored on blockchain
type Session struct {
	DocType   string    `json:"docType"`
	SessionID string    `json:"sessionId"`
	UserID    string    `json:"userId"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"createdAt"`
	ExpiresAt time.Time `json:"expiresAt"`
	IsActive  bool      `json:"isActive"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
}

// UserContract provides functions for managing users and sessions
type UserContract struct {
	contractapi.Contract
}

// InitLedger initializes the chaincode
func (c *UserContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Initialize ledger - no sample data needed for production
	return nil
}

// CreateUser creates a new user on the blockchain
func (c *UserContract) CreateUser(ctx contractapi.TransactionContextInterface, userId, email, passwordHash, firstName, lastName, phone, role string) error {
	// Check if user already exists
	exists, err := c.UserExists(ctx, userId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user %s already exists", userId)
	}

	// Check if email is already registered
	emailExists, err := c.EmailExists(ctx, email)
	if err != nil {
		return err
	}
	if emailExists {
		return fmt.Errorf("email %s is already registered", email)
	}

	now := time.Now()
	user := User{
		DocType:      "user",
		UserID:       userId,
		Email:        email,
		PasswordHash: passwordHash,
		FirstName:    firstName,
		LastName:     lastName,
		Phone:        phone,
		Role:         role,
		CreatedAt:    now,
		UpdatedAt:    now,
		IsActive:     true,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	// Store user by ID
	err = ctx.GetStub().PutState(userId, userJSON)
	if err != nil {
		return err
	}

	// Create email index for lookup
	emailIndexKey, err := ctx.GetStub().CreateCompositeKey("email~userId", []string{email, userId})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(emailIndexKey, []byte{0x00})
}

// GetUser retrieves a user by ID
func (c *UserContract) GetUser(ctx contractapi.TransactionContextInterface, userId string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState(userId)
	if err != nil {
		return nil, fmt.Errorf("failed to read user: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("user %s does not exist", userId)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by email using composite key
func (c *UserContract) GetUserByEmail(ctx contractapi.TransactionContextInterface, email string) (*User, error) {
	// Get results iterator for email composite keys
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("email~userId", []string{email})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	if !resultsIterator.HasNext() {
		return nil, fmt.Errorf("user with email %s not found", email)
	}

	// Get the composite key
	queryResponse, err := resultsIterator.Next()
	if err != nil {
		return nil, err
	}

	// Split the composite key to get userId
	_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
	if err != nil {
		return nil, err
	}

	if len(compositeKeyParts) < 2 {
		return nil, fmt.Errorf("invalid composite key format")
	}

	userId := compositeKeyParts[1]

	// Now get the user by userId
	return c.GetUser(ctx, userId)
}

// UpdateUser updates user information
func (c *UserContract) UpdateUser(ctx contractapi.TransactionContextInterface, userId, firstName, lastName, phone string) error {
	user, err := c.GetUser(ctx, userId)
	if err != nil {
		return err
	}

	user.FirstName = firstName
	user.LastName = lastName
	user.Phone = phone
	user.UpdatedAt = time.Now()

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userId, userJSON)
}

// AuthenticateUser verifies user credentials and returns user if valid
func (c *UserContract) AuthenticateUser(ctx contractapi.TransactionContextInterface, email, passwordHash string) (*User, error) {
	user, err := c.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("authentication failed: invalid credentials")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("authentication failed: user is inactive")
	}

	// In production, use proper password verification (bcrypt)
	if user.PasswordHash != passwordHash {
		return nil, fmt.Errorf("authentication failed: invalid credentials")
	}

	return user, nil
}

// CreateSession creates a new session on the blockchain
func (c *UserContract) CreateSession(ctx contractapi.TransactionContextInterface, sessionId, userId, token, ipAddress, userAgent string, expiresInHours int) error {
	now := time.Now()
	session := Session{
		DocType:   "session",
		SessionID: sessionId,
		UserID:    userId,
		Token:     token,
		CreatedAt: now,
		ExpiresAt: now.Add(time.Duration(expiresInHours) * time.Hour),
		IsActive:  true,
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}

	// Store session by ID
	err = ctx.GetStub().PutState(sessionId, sessionJSON)
	if err != nil {
		return err
	}

	// Create token index for lookup
	tokenIndexKey, err := ctx.GetStub().CreateCompositeKey("token~sessionId", []string{token, sessionId})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(tokenIndexKey, []byte{0x00})
}

// GetSession retrieves a session by token using composite key index
func (c *UserContract) GetSession(ctx contractapi.TransactionContextInterface, token string) (*Session, error) {
	// Use composite key index to find session by token
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("token~sessionId", []string{token})
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	if !resultsIterator.HasNext() {
		return nil, fmt.Errorf("session not found")
	}

	// Get the composite key
	queryResponse, err := resultsIterator.Next()
	if err != nil {
		return nil, err
	}

	// Split the composite key to get sessionId
	_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
	if err != nil {
		return nil, err
	}

	if len(compositeKeyParts) < 2 {
		return nil, fmt.Errorf("invalid composite key format")
	}

	sessionId := compositeKeyParts[1]

	// Get the session by sessionId
	sessionJSON, err := ctx.GetStub().GetState(sessionId)
	if err != nil {
		return nil, fmt.Errorf("failed to read session: %v", err)
	}
	if sessionJSON == nil {
		return nil, fmt.Errorf("session %s does not exist", sessionId)
	}

	var session Session
	err = json.Unmarshal(sessionJSON, &session)
	if err != nil {
		return nil, err
	}

	// Check if session is active
	if !session.IsActive {
		return nil, fmt.Errorf("session is inactive")
	}

	// Check if session is expired
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session has expired")
	}

	return &session, nil
}

// ValidateSession validates a session token and returns the associated user
func (c *UserContract) ValidateSession(ctx contractapi.TransactionContextInterface, token string) (*User, error) {
	session, err := c.GetSession(ctx, token)
	if err != nil {
		return nil, err
	}

	return c.GetUser(ctx, session.UserID)
}

// DeleteSession invalidates a session (logout)
func (c *UserContract) DeleteSession(ctx contractapi.TransactionContextInterface, token string) error {
	session, err := c.GetSession(ctx, token)
	if err != nil {
		return err
	}

	session.IsActive = false

	sessionJSON, err := json.Marshal(session)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(session.SessionID, sessionJSON)
}

// GetActiveSessions returns all active sessions for a user
func (c *UserContract) GetActiveSessions(ctx contractapi.TransactionContextInterface, userId string) ([]*Session, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"session","userId":"%s","isActive":true}}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var sessions []*Session
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var session Session
		err = json.Unmarshal(queryResponse.Value, &session)
		if err != nil {
			return nil, err
		}

		// Only include non-expired sessions
		if time.Now().Before(session.ExpiresAt) {
			sessions = append(sessions, &session)
		}
	}

	return sessions, nil
}

// ListAllUsers returns all users (admin function)
func (c *UserContract) ListAllUsers(ctx contractapi.TransactionContextInterface) ([]*User, error) {
	queryString := `{"selector":{"docType":"user"}}`
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, nil
}

// DeleteUser deactivates a user
func (c *UserContract) DeleteUser(ctx contractapi.TransactionContextInterface, userId string) error {
	user, err := c.GetUser(ctx, userId)
	if err != nil {
		return err
	}

	user.IsActive = false
	user.UpdatedAt = time.Now()

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userId, userJSON)
}

// QueryUsersByRole returns users with a specific role
func (c *UserContract) QueryUsersByRole(ctx contractapi.TransactionContextInterface, role string) ([]*User, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"user","role":"%s","isActive":true}}`, role)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, nil
}

// UserExists checks if a user exists
func (c *UserContract) UserExists(ctx contractapi.TransactionContextInterface, userId string) (bool, error) {
	userJSON, err := ctx.GetStub().GetState(userId)
	if err != nil {
		return false, err
	}
	return userJSON != nil, nil
}

// EmailExists checks if an email is already registered
func (c *UserContract) EmailExists(ctx contractapi.TransactionContextInterface, email string) (bool, error) {
	// Get results iterator for email composite keys
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("email~userId", []string{email})
	if err != nil {
		return false, err
	}
	defer resultsIterator.Close()

	return resultsIterator.HasNext(), nil
}

// GetUserHistory returns the history of changes for a user
func (c *UserContract) GetUserHistory(ctx contractapi.TransactionContextInterface, userId string) ([]map[string]interface{}, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey(userId)
	if err != nil {
		return nil, err
	}
	defer historyIterator.Close()

	var history []map[string]interface{}
	for historyIterator.HasNext() {
		historyRecord, err := historyIterator.Next()
		if err != nil {
			return nil, err
		}

		record := map[string]interface{}{
			"txId":      historyRecord.TxId,
			"timestamp": time.Unix(historyRecord.Timestamp.Seconds, int64(historyRecord.Timestamp.Nanos)),
			"isDelete":  historyRecord.IsDelete,
		}

		if !historyRecord.IsDelete {
			var user User
			json.Unmarshal(historyRecord.Value, &user)
			record["value"] = user
		}

		history = append(history, record)
	}

	return history, nil
}
