package contract

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Wallet represents a user's wallet
type Wallet struct {
	DocType     string    `json:"docType"`
	WalletID    string    `json:"walletId"`
	UserID      string    `json:"userId"`
	Balance     float64   `json:"balance"`
	Currency    string    `json:"currency"`
	CreatedAt   time.Time `json:"createdAt"`
	LastUpdated time.Time `json:"lastUpdated"`
}

// Payment represents a payment transaction
type Payment struct {
	DocType     string     `json:"docType"`
	PaymentID   string     `json:"paymentId"`
	WalletID    string     `json:"walletId"`
	UserID      string     `json:"userId"`
	Amount      float64    `json:"amount"`
	Type        string     `json:"type"` // parking, charging, refund, topup
	ReferenceID string     `json:"referenceId"` // bookingId or sessionId
	Status      string     `json:"status"` // pending, completed, failed, refunded
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"createdAt"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
}

// Transaction represents a wallet transaction record
type Transaction struct {
	DocType       string    `json:"docType"`
	TransactionID string    `json:"transactionId"`
	WalletID      string    `json:"walletId"`
	UserID        string    `json:"userId"`
	Type          string    `json:"type"` // debit, credit
	Amount        float64   `json:"amount"`
	BalanceBefore float64   `json:"balanceBefore"`
	BalanceAfter  float64   `json:"balanceAfter"`
	Description   string    `json:"description"`
	PaymentID     string    `json:"paymentId"`
	Timestamp     time.Time `json:"timestamp"`
}

// WalletContract provides functions for managing wallets and payments
type WalletContract struct {
	contractapi.Contract
}

// ==================== Wallet Management ====================

// CreateWallet creates a new wallet for a user
func (c *WalletContract) CreateWallet(ctx contractapi.TransactionContextInterface, walletId, userId string, initialBalance float64) error {
	// Check if user already has a wallet
	exists, err := c.UserHasWallet(ctx, userId)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user %s already has a wallet", userId)
	}

	now := time.Now()
	wallet := Wallet{
		DocType:     "wallet",
		WalletID:    walletId,
		UserID:      userId,
		Balance:     initialBalance,
		Currency:    "USD",
		CreatedAt:   now,
		LastUpdated: now,
	}

	walletJSON, err := json.Marshal(wallet)
	if err != nil {
		return err
	}

	// Create user-wallet index
	userIndexKey, err := ctx.GetStub().CreateCompositeKey("userId~walletId", []string{userId, walletId})
	if err != nil {
		return err
	}
	ctx.GetStub().PutState(userIndexKey, []byte{0x00})

	return ctx.GetStub().PutState(walletId, walletJSON)
}

// GetWallet retrieves a wallet by ID
func (c *WalletContract) GetWallet(ctx contractapi.TransactionContextInterface, walletId string) (*Wallet, error) {
	walletJSON, err := ctx.GetStub().GetState(walletId)
	if err != nil {
		return nil, fmt.Errorf("failed to read wallet: %v", err)
	}
	if walletJSON == nil {
		return nil, fmt.Errorf("wallet %s does not exist", walletId)
	}

	var wallet Wallet
	err = json.Unmarshal(walletJSON, &wallet)
	if err != nil {
		return nil, err
	}

	return &wallet, nil
}

// GetWalletByUserId retrieves a wallet by user ID
func (c *WalletContract) GetWalletByUserId(ctx contractapi.TransactionContextInterface, userId string) (*Wallet, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"wallet","userId":"%s"}}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	if resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var wallet Wallet
		err = json.Unmarshal(queryResponse.Value, &wallet)
		if err != nil {
			return nil, err
		}
		return &wallet, nil
	}

	return nil, fmt.Errorf("wallet for user %s not found", userId)
}

// AddFunds adds funds to a wallet
func (c *WalletContract) AddFunds(ctx contractapi.TransactionContextInterface, walletId string, amount float64, transactionId string) error {
	if amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}

	wallet, err := c.GetWallet(ctx, walletId)
	if err != nil {
		return err
	}

	balanceBefore := wallet.Balance
	wallet.Balance += amount
	wallet.LastUpdated = time.Now()

	walletJSON, err := json.Marshal(wallet)
	if err != nil {
		return err
	}

	// Record transaction
	err = c.recordTransaction(ctx, transactionId, walletId, wallet.UserID, "credit", amount, balanceBefore, wallet.Balance, "Funds added to wallet", "")
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(walletId, walletJSON)
}

// GetBalance returns the balance of a wallet
func (c *WalletContract) GetBalance(ctx contractapi.TransactionContextInterface, walletId string) (float64, error) {
	wallet, err := c.GetWallet(ctx, walletId)
	if err != nil {
		return 0, err
	}
	return wallet.Balance, nil
}

// ValidateBalance checks if wallet has sufficient funds
func (c *WalletContract) ValidateBalance(ctx contractapi.TransactionContextInterface, walletId string, amount float64) (bool, error) {
	wallet, err := c.GetWallet(ctx, walletId)
	if err != nil {
		return false, err
	}
	return wallet.Balance >= amount, nil
}

// UserHasWallet checks if a user already has a wallet
func (c *WalletContract) UserHasWallet(ctx contractapi.TransactionContextInterface, userId string) (bool, error) {
	_, err := c.GetWalletByUserId(ctx, userId)
	if err != nil {
		return false, nil
	}
	return true, nil
}

// ==================== Payment Processing ====================

// ProcessPayment processes a payment
func (c *WalletContract) ProcessPayment(ctx contractapi.TransactionContextInterface, paymentId, walletId string, amount float64, paymentType, referenceId, description string) (*Payment, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("amount must be positive")
	}

	wallet, err := c.GetWallet(ctx, walletId)
	if err != nil {
		return nil, err
	}

	if wallet.Balance < amount {
		return nil, fmt.Errorf("insufficient balance: have %.2f, need %.2f", wallet.Balance, amount)
	}

	now := time.Now()

	// Create payment record
	payment := Payment{
		DocType:     "payment",
		PaymentID:   paymentId,
		WalletID:    walletId,
		UserID:      wallet.UserID,
		Amount:      amount,
		Type:        paymentType,
		ReferenceID: referenceId,
		Status:      "completed",
		Description: description,
		CreatedAt:   now,
		CompletedAt: &now,
	}

	paymentJSON, err := json.Marshal(payment)
	if err != nil {
		return nil, err
	}

	// Deduct from wallet
	balanceBefore := wallet.Balance
	wallet.Balance -= amount
	wallet.LastUpdated = now

	walletJSON, err := json.Marshal(wallet)
	if err != nil {
		return nil, err
	}

	// Record transaction
	transactionId := fmt.Sprintf("tx_%s", paymentId)
	err = c.recordTransaction(ctx, transactionId, walletId, wallet.UserID, "debit", amount, balanceBefore, wallet.Balance, description, paymentId)
	if err != nil {
		return nil, err
	}

	// Save payment
	err = ctx.GetStub().PutState(paymentId, paymentJSON)
	if err != nil {
		return nil, err
	}

	// Save updated wallet
	err = ctx.GetStub().PutState(walletId, walletJSON)
	if err != nil {
		return nil, err
	}

	return &payment, nil
}

// RefundPayment refunds a payment
func (c *WalletContract) RefundPayment(ctx contractapi.TransactionContextInterface, paymentId string, refundAmount float64, refundPaymentId string) (*Payment, error) {
	// Get original payment
	paymentJSON, err := ctx.GetStub().GetState(paymentId)
	if err != nil {
		return nil, err
	}
	if paymentJSON == nil {
		return nil, fmt.Errorf("payment %s not found", paymentId)
	}

	var originalPayment Payment
	err = json.Unmarshal(paymentJSON, &originalPayment)
	if err != nil {
		return nil, err
	}

	if originalPayment.Status == "refunded" {
		return nil, fmt.Errorf("payment %s has already been refunded", paymentId)
	}

	if refundAmount > originalPayment.Amount {
		return nil, fmt.Errorf("refund amount cannot exceed original payment amount")
	}

	// Get wallet
	wallet, err := c.GetWallet(ctx, originalPayment.WalletID)
	if err != nil {
		return nil, err
	}

	now := time.Now()

	// Create refund payment
	refundPayment := Payment{
		DocType:     "payment",
		PaymentID:   refundPaymentId,
		WalletID:    originalPayment.WalletID,
		UserID:      originalPayment.UserID,
		Amount:      refundAmount,
		Type:        "refund",
		ReferenceID: paymentId,
		Status:      "completed",
		Description: fmt.Sprintf("Refund for payment %s", paymentId),
		CreatedAt:   now,
		CompletedAt: &now,
	}

	refundJSON, err := json.Marshal(refundPayment)
	if err != nil {
		return nil, err
	}

	// Add funds back to wallet
	balanceBefore := wallet.Balance
	wallet.Balance += refundAmount
	wallet.LastUpdated = now

	walletJSON, err := json.Marshal(wallet)
	if err != nil {
		return nil, err
	}

	// Update original payment status
	originalPayment.Status = "refunded"
	originalPaymentJSON, err := json.Marshal(originalPayment)
	if err != nil {
		return nil, err
	}

	// Record transaction
	transactionId := fmt.Sprintf("tx_%s", refundPaymentId)
	err = c.recordTransaction(ctx, transactionId, wallet.WalletID, wallet.UserID, "credit", refundAmount, balanceBefore, wallet.Balance, refundPayment.Description, refundPaymentId)
	if err != nil {
		return nil, err
	}

	// Save all updates
	err = ctx.GetStub().PutState(refundPaymentId, refundJSON)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(paymentId, originalPaymentJSON)
	if err != nil {
		return nil, err
	}
	err = ctx.GetStub().PutState(wallet.WalletID, walletJSON)
	if err != nil {
		return nil, err
	}

	return &refundPayment, nil
}

// GetPayment retrieves a payment by ID
func (c *WalletContract) GetPayment(ctx contractapi.TransactionContextInterface, paymentId string) (*Payment, error) {
	paymentJSON, err := ctx.GetStub().GetState(paymentId)
	if err != nil {
		return nil, fmt.Errorf("failed to read payment: %v", err)
	}
	if paymentJSON == nil {
		return nil, fmt.Errorf("payment %s does not exist", paymentId)
	}

	var payment Payment
	err = json.Unmarshal(paymentJSON, &payment)
	if err != nil {
		return nil, err
	}

	return &payment, nil
}

// GetPaymentReceipt returns payment details for a receipt
func (c *WalletContract) GetPaymentReceipt(ctx contractapi.TransactionContextInterface, paymentId string) (*Payment, error) {
	return c.GetPayment(ctx, paymentId)
}

// ==================== Transaction Management ====================

// recordTransaction is a helper function to record transactions
func (c *WalletContract) recordTransaction(ctx contractapi.TransactionContextInterface, transactionId, walletId, userId, txType string, amount, balanceBefore, balanceAfter float64, description, paymentId string) error {
	transaction := Transaction{
		DocType:       "transaction",
		TransactionID: transactionId,
		WalletID:      walletId,
		UserID:        userId,
		Type:          txType,
		Amount:        amount,
		BalanceBefore: balanceBefore,
		BalanceAfter:  balanceAfter,
		Description:   description,
		PaymentID:     paymentId,
		Timestamp:     time.Now(),
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(transactionId, transactionJSON)
}

// GetTransaction retrieves a transaction by ID
func (c *WalletContract) GetTransaction(ctx contractapi.TransactionContextInterface, transactionId string) (*Transaction, error) {
	transactionJSON, err := ctx.GetStub().GetState(transactionId)
	if err != nil {
		return nil, fmt.Errorf("failed to read transaction: %v", err)
	}
	if transactionJSON == nil {
		return nil, fmt.Errorf("transaction %s does not exist", transactionId)
	}

	var transaction Transaction
	err = json.Unmarshal(transactionJSON, &transaction)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// GetWalletTransactions returns all transactions for a wallet
func (c *WalletContract) GetWalletTransactions(ctx contractapi.TransactionContextInterface, walletId string) ([]*Transaction, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"transaction","walletId":"%s"},"sort":[{"timestamp":"desc"}]}`, walletId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var transaction Transaction
		err = json.Unmarshal(queryResponse.Value, &transaction)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

// GetUserTransactions returns all transactions for a user
func (c *WalletContract) GetUserTransactions(ctx contractapi.TransactionContextInterface, userId string) ([]*Transaction, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"transaction","userId":"%s"},"sort":[{"timestamp":"desc"}]}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var transaction Transaction
		err = json.Unmarshal(queryResponse.Value, &transaction)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

// QueryTransactionsByType returns transactions by type
func (c *WalletContract) QueryTransactionsByType(ctx contractapi.TransactionContextInterface, userId, txType string) ([]*Transaction, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"transaction","userId":"%s","type":"%s"},"sort":[{"timestamp":"desc"}]}`, userId, txType)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var transaction Transaction
		err = json.Unmarshal(queryResponse.Value, &transaction)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

// GetTotalSpent returns total amount spent by a user
func (c *WalletContract) GetTotalSpent(ctx contractapi.TransactionContextInterface, userId string) (float64, error) {
	transactions, err := c.QueryTransactionsByType(ctx, userId, "debit")
	if err != nil {
		return 0, err
	}

	var totalSpent float64
	for _, tx := range transactions {
		totalSpent += tx.Amount
	}

	return totalSpent, nil
}

// GetUserPayments returns all payments for a user
func (c *WalletContract) GetUserPayments(ctx contractapi.TransactionContextInterface, userId string) ([]*Payment, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":"payment","userId":"%s"},"sort":[{"createdAt":"desc"}]}`, userId)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var payments []*Payment
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var payment Payment
		err = json.Unmarshal(queryResponse.Value, &payment)
		if err != nil {
			return nil, err
		}
		payments = append(payments, &payment)
	}

	return payments, nil
}
