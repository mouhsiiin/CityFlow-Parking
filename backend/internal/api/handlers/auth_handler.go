package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/fabric"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	fabricClient *fabric.Client
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(fabricClient *fabric.Client) *AuthHandler {
	return &AuthHandler{
		fabricClient: fabricClient,
	}
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Phone     string `json:"phone"`
	Role      string `json:"role"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// User represents the user structure from chaincode
type User struct {
	UserID       string `json:"userId"`
	Email        string `json:"email"`
	PasswordHash string `json:"passwordHash"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
	Phone        string `json:"phone"`
	Role         string `json:"role"`
	IsActive     bool   `json:"isActive"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	Token   string          `json:"token"`
	User    json.RawMessage `json:"user"`
	Message string          `json:"message,omitempty"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate user ID
	userId := "user_" + uuid.New().String()

	// Set default role if not provided
	userRole := req.Role
	if userRole == "" {
		userRole = "user"
	}

	// Validate role - only allow user or admin
	if userRole != "user" && userRole != "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'user' or 'admin'"})
		return
	}

	// Create user on blockchain
	contract := h.fabricClient.GetUserContract()
	_, err = contract.SubmitTransaction(
		"CreateUser",
		userId,
		req.Email,
		string(hashedPassword),
		req.FirstName,
		req.LastName,
		req.Phone,
		userRole,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create wallet for user
	walletContract := h.fabricClient.GetWalletContract()
	walletId := "wallet_" + uuid.New().String()
	_, err = walletContract.SubmitTransaction("CreateWallet", walletId, userId, "0")
	if err != nil {
		// Log error but don't fail registration
		// Wallet can be created later
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"role":    userRole,
		"userId":  userId,
	})
}




// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user by email from blockchain
	contract := h.fabricClient.GetUserContract()
	userResult, err := contract.EvaluateTransaction("GetUserByEmail", req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Parse user data
	var user struct {
		UserID       string `json:"userId"`
		Email        string `json:"email"`
		PasswordHash string `json:"passwordHash"`
		FirstName    string `json:"firstName"`
		LastName     string `json:"lastName"`
		Phone        string `json:"phone"`
		Role         string `json:"role"`
		IsActive     bool   `json:"isActive"`
	}
	if err := json.Unmarshal(userResult, &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is inactive"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Create session on blockchain
	sessionId := "session_" + uuid.New().String()
	token := uuid.New().String() + uuid.New().String() // Generate secure token

	_, err = contract.SubmitTransaction(
		"CreateSession",
		sessionId,
		user.UserID,
		token,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
		"12", // 12 hours expiry
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	// Remove password hash from response
	user.PasswordHash = ""
	
	// Create response with properly formatted user
	userResponse := map[string]interface{}{
		"userId":    user.UserID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
		"phone":     user.Phone,
		"role":      user.Role,
		"isActive":  user.IsActive,
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   token,
		"user":    userResponse,
		"message": "Login successful",
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	token, exists := c.Get("token")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No token found"})
		return
	}

	// Delete session from blockchain
	contract := h.fabricClient.GetUserContract()
	_, err := contract.SubmitTransaction("DeleteSession", token.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	// Parse the user JSON string
	var user User
	if err := json.Unmarshal([]byte(userData.(string)), &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	// Return formatted user (without password hash)
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"userId":    user.UserID,
			"email":     user.Email,
			"firstName": user.FirstName,
			"lastName":  user.LastName,
			"phone":     user.Phone,
			"role":      user.Role,
			"isActive":  user.IsActive,
		},
	})
}
