package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/SecurDrgorP/cityflow-parking-backend/internal/fabric"
)

// UserHandler handles user management endpoints
type UserHandler struct {
	fabricClient *fabric.Client
}

// NewUserHandler creates a new user handler
func NewUserHandler(fabricClient *fabric.Client) *UserHandler {
	return &UserHandler{
		fabricClient: fabricClient,
	}
}

// UpdateUserRequest represents update user request
type UpdateUserRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Phone     string `json:"phone"`
}

// GetUser returns a user by ID
func (h *UserHandler) GetUser(c *gin.Context) {
	userId := c.Param("id")

	contract := h.fabricClient.GetUserContract()
	result, err := contract.EvaluateTransaction("GetUser", userId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": json.RawMessage(result)})
}

// UpdateUser updates a user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userId := c.Param("id")

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contract := h.fabricClient.GetUserContract()
	_, err := contract.SubmitTransaction("UpdateUser", userId, req.FirstName, req.LastName, req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
}

// DeleteUser deactivates a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userId := c.Param("id")

	contract := h.fabricClient.GetUserContract()
	_, err := contract.SubmitTransaction("DeleteUser", userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// ListAllUsers returns all users (admin only)
func (h *UserHandler) ListAllUsers(c *gin.Context) {
	contract := h.fabricClient.GetUserContract()
	result, err := contract.EvaluateTransaction("ListAllUsers")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": json.RawMessage(result)})
}

// GetUserHistory returns the history of a user
func (h *UserHandler) GetUserHistory(c *gin.Context) {
	userId := c.Param("id")

	contract := h.fabricClient.GetUserContract()
	result, err := contract.EvaluateTransaction("GetUserHistory", userId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"history": json.RawMessage(result)})
}
