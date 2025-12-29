package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/SecurDrgorP/cityflow-parking-backend/internal/fabric"
)

// WalletHandler handles wallet and payment endpoints
type WalletHandler struct {
	fabricClient *fabric.Client
}

// NewWalletHandler creates a new wallet handler
func NewWalletHandler(fabricClient *fabric.Client) *WalletHandler {
	return &WalletHandler{
		fabricClient: fabricClient,
	}
}

// CreateWalletRequest represents create wallet request
type CreateWalletRequest struct {
	InitialBalance float64 `json:"initialBalance"`
}

// AddFundsRequest represents add funds request
type AddFundsRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// ProcessPaymentRequest represents process payment request
type ProcessPaymentRequest struct {
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Type        string  `json:"type" binding:"required"`
	ReferenceID string  `json:"referenceId" binding:"required"`
	Description string  `json:"description"`
}

// RefundRequest represents refund request
type RefundRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// ==================== Wallet Endpoints ====================

// CreateWallet creates a new wallet for the current user
func (h *WalletHandler) CreateWallet(c *gin.Context) {
	var req CreateWalletRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.InitialBalance = 0
	}

	// Get user ID from context
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	walletId := "wallet_" + uuid.New().String()

	contract := h.fabricClient.GetWalletContract()
	_, err := contract.SubmitTransaction(
		"CreateWallet",
		walletId,
		user.UserID,
		fmt.Sprintf("%f", req.InitialBalance),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Wallet created successfully",
		"walletId": walletId,
	})
}

// GetWallet returns the current user's wallet
func (h *WalletHandler) GetWallet(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"wallet": json.RawMessage(result)})
}

// GetBalance returns the current user's wallet balance
func (h *WalletHandler) GetBalance(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	walletResult, err := contract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	var wallet struct {
		WalletID string  `json:"walletId"`
		Balance  float64 `json:"balance"`
		Currency string  `json:"currency"`
	}
	json.Unmarshal(walletResult, &wallet)

	c.JSON(http.StatusOK, gin.H{
		"balance":  wallet.Balance,
		"currency": wallet.Currency,
	})
}

// AddFunds adds funds to the current user's wallet
func (h *WalletHandler) AddFunds(c *gin.Context) {
	var req AddFundsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	walletResult, err := contract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	var wallet struct {
		WalletID string `json:"walletId"`
	}
	json.Unmarshal(walletResult, &wallet)

	transactionId := "topup_" + uuid.New().String()
	_, err = contract.SubmitTransaction(
		"AddFunds",
		wallet.WalletID,
		fmt.Sprintf("%f", req.Amount),
		transactionId,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Funds added successfully",
		"transactionId": transactionId,
	})
}

// GetTransactions returns all transactions for the current user
func (h *WalletHandler) GetTransactions(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.EvaluateTransaction("GetUserTransactions", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transactions": json.RawMessage(result)})
}

// GetTransaction returns a transaction by ID
func (h *WalletHandler) GetTransaction(c *gin.Context) {
	transactionId := c.Param("id")

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.EvaluateTransaction("GetTransaction", transactionId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"transaction": json.RawMessage(result)})
}

// GetTotalSpent returns total amount spent by the current user
func (h *WalletHandler) GetTotalSpent(c *gin.Context) {
	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.EvaluateTransaction("GetTotalSpent", user.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"totalSpent": string(result)})
}

// ==================== Payment Endpoints ====================

// ProcessPayment processes a payment
func (h *WalletHandler) ProcessPayment(c *gin.Context) {
	var req ProcessPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userData, _ := c.Get("user")
	var user struct {
		UserID string `json:"userId"`
	}
	json.Unmarshal([]byte(userData.(string)), &user)

	contract := h.fabricClient.GetWalletContract()
	walletResult, err := contract.EvaluateTransaction("GetWalletByUserId", user.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}

	var wallet struct {
		WalletID string `json:"walletId"`
	}
	json.Unmarshal(walletResult, &wallet)

	paymentId := "payment_" + uuid.New().String()
	result, err := contract.SubmitTransaction(
		"ProcessPayment",
		paymentId,
		wallet.WalletID,
		fmt.Sprintf("%f", req.Amount),
		req.Type,
		req.ReferenceID,
		req.Description,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Payment processed successfully",
		"payment":   json.RawMessage(result),
		"paymentId": paymentId,
	})
}

// RefundPayment refunds a payment
func (h *WalletHandler) RefundPayment(c *gin.Context) {
	paymentId := c.Param("id")

	var req RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	refundPaymentId := "refund_" + uuid.New().String()

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.SubmitTransaction(
		"RefundPayment",
		paymentId,
		fmt.Sprintf("%f", req.Amount),
		refundPaymentId,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Payment refunded successfully",
		"refund":          json.RawMessage(result),
		"refundPaymentId": refundPaymentId,
	})
}

// GetPaymentReceipt returns a payment receipt
func (h *WalletHandler) GetPaymentReceipt(c *gin.Context) {
	paymentId := c.Param("id")

	contract := h.fabricClient.GetWalletContract()
	result, err := contract.EvaluateTransaction("GetPaymentReceipt", paymentId)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"receipt": json.RawMessage(result)})
}
