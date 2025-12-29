# API Documentation for Frontend Integration

This document describes the expected API contract between the React frontend and Go backend.

## Base Configuration

```
Base URL: http://localhost:8080/api
Authentication: Bearer JWT Token (in Authorization header)
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/login
Login user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "walletAddress": "0x1234567890abcdef...",
    "balance": 100.50
  }
}
```

### POST /auth/register
Register new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "walletAddress": "0x1234567890abcdef..." // optional
}
```

**Response:** Same as login

### POST /auth/logout
Logout user (invalidate token).

**Request:** Empty body
**Response:** 
```json
{
  "success": true
}
```

### GET /users/profile
Get current user profile.

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "walletAddress": "0x1234567890abcdef...",
  "balance": 100.50
}
```

## Parking Spots Endpoints

### GET /spots
Get all parking spots.

**Response:**
```json
[
  {
    "id": "spot-123",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, New York, NY"
    },
    "type": "parking", // or "ev_charging"
    "status": "available", // or "occupied" or "reserved"
    "pricePerHour": 5.00,
    "features": ["covered", "security"],
    "chargingPower": 50 // only for ev_charging type (kW)
  }
]
```

### GET /spots/available
Get only available spots.

**Query Parameters:**
- `type` (optional): "parking" or "ev_charging"

**Response:** Same as GET /spots

### GET /spots/:id
Get single spot by ID.

**Response:** Single spot object (same structure as above)

## Reservations Endpoints

### GET /reservations/user
Get all reservations for current user.

**Headers:** Authorization: Bearer {token}

**Response:**
```json
[
  {
    "id": "res-123",
    "spotId": "spot-456",
    "userId": "user-789",
    "startTime": "2025-12-04T10:00:00Z",
    "endTime": "2025-12-04T12:00:00Z",
    "status": "active", // or "pending", "completed", "cancelled"
    "totalCost": 10.00,
    "transactionId": "tx-123",
    "blockchainTxHash": "0xabcdef1234567890..." // REQUIRED
  }
]
```

### POST /reservations
Create new reservation.

**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "spotId": "spot-123",
  "startTime": "2025-12-04T10:00:00Z",
  "endTime": "2025-12-04T12:00:00Z"
}
```

**Response:**
```json
{
  "id": "res-123",
  "spotId": "spot-456",
  "userId": "user-789",
  "startTime": "2025-12-04T10:00:00Z",
  "endTime": "2025-12-04T12:00:00Z",
  "status": "pending",
  "totalCost": 10.00,
  "transactionId": "tx-123",
  "blockchainTxHash": "0xabcdef1234567890..." // REQUIRED
}
```

### GET /reservations/:id
Get single reservation by ID.

**Headers:** Authorization: Bearer {token}

**Response:** Single reservation object

### POST /reservations/:id/cancel
Cancel reservation.

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "message": "Reservation cancelled successfully",
  "refundTxHash": "0x9876543210fedcba..." // blockchain refund transaction
}
```

## Wallet Endpoints

### GET /wallet
Get wallet information.

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "address": "0x1234567890abcdef...",
  "balance": 100.50,
  "transactions": [] // can be empty, use /wallet/transactions for full list
}
```

### GET /wallet/transactions
Get all wallet transactions.

**Headers:** Authorization: Bearer {token}

**Response:**
```json
[
  {
    "id": "tx-123",
    "userId": "user-789",
    "type": "payment", // or "deposit", "withdrawal", "refund"
    "amount": 10.00,
    "timestamp": "2025-12-04T10:00:00Z",
    "blockchainTxHash": "0xabcdef1234567890...", // REQUIRED
    "status": "confirmed", // or "pending", "failed"
    "description": "Payment for parking reservation",
    "reservationId": "res-123" // optional, if related to reservation
  }
]
```

### POST /wallet/deposit
Deposit funds to wallet.

**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "amount": 50.00
}
```

**Response:**
```json
{
  "id": "tx-456",
  "userId": "user-789",
  "type": "deposit",
  "amount": 50.00,
  "timestamp": "2025-12-04T10:30:00Z",
  "blockchainTxHash": "0x1111222233334444...", // REQUIRED
  "status": "pending",
  "description": "Wallet deposit"
}
```

### POST /wallet/withdraw
Withdraw funds from wallet.

**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "amount": 25.00
}
```

**Response:**
```json
{
  "id": "tx-789",
  "userId": "user-789",
  "type": "withdrawal",
  "amount": 25.00,
  "timestamp": "2025-12-04T11:00:00Z",
  "blockchainTxHash": "0x5555666677778888...", // REQUIRED
  "status": "pending",
  "description": "Wallet withdrawal"
}
```

## Blockchain Endpoints

### GET /blockchain/verify/:hash
Verify blockchain transaction.

**Parameters:**
- `hash`: Blockchain transaction hash

**Response:**
```json
{
  "success": true,
  "data": {
    "hash": "0xabcdef1234567890...",
    "blockNumber": 12345678,
    "confirmations": 15,
    "status": "confirmed",
    "timestamp": "2025-12-04T10:00:00Z"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., spot already reserved)
- **500 Internal Server Error**: Server error

### Example Error Response

```json
{
  "success": false,
  "error": "Insufficient balance for this transaction"
}
```

## Important Notes

### Blockchain Transaction Hashes

**CRITICAL**: Every financial transaction MUST include a `blockchainTxHash` field:

- Reservations: Include `blockchainTxHash` in response
- Deposits: Include `blockchainTxHash` in response
- Withdrawals: Include `blockchainTxHash` in response
- Payments: Include `blockchainTxHash` in transaction records
- Refunds: Include `refundTxHash` or `blockchainTxHash`

The frontend will display "View on Blockchain" buttons for all transactions with hashes.

### Date/Time Format

All timestamps should be in ISO 8601 format:
```
2025-12-04T10:00:00Z
```

### Currency

All monetary amounts are in USD with 2 decimal places:
```json
{
  "amount": 10.50,
  "pricePerHour": 5.00,
  "balance": 100.00
}
```

### Authentication

Frontend sends JWT token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Backend should:
1. Validate token
2. Extract user ID from token
3. Return 401 if token is invalid/expired

### CORS Configuration

Backend must allow requests from frontend origin:

```go
// Example Go CORS config
cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
})
```

## Testing Endpoints

Use these tools to test API endpoints:

1. **Postman**: Import as OpenAPI/Swagger
2. **curl**: Command line testing
3. **Thunder Client**: VS Code extension

### Example curl Request

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get spots (with token)
curl -X GET http://localhost:8080/api/spots \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Implementation Checklist

### Backend Must Implement:

- [ ] All authentication endpoints
- [ ] All parking spots endpoints
- [ ] All reservations endpoints
- [ ] All wallet endpoints
- [ ] Blockchain verification endpoint
- [ ] CORS configuration
- [ ] JWT token generation/validation
- [ ] Error handling with proper status codes
- [ ] Blockchain transaction hash generation
- [ ] Real-time spot status updates

### Frontend Integration Verified:

- [x] API client with interceptors
- [x] Token storage and refresh
- [x] All service methods implemented
- [x] Error handling
- [x] Type definitions
- [x] Blockchain transaction display
- [x] "View on Blockchain" buttons
