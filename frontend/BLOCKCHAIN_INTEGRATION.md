# 🔗 Blockchain Integration Guide

## Overview

This frontend is designed to work with a **100% blockchain-based backend** using **Hyperledger Fabric**. All data is stored on the blockchain in CouchDB (Fabric's world state), with no traditional PostgreSQL database.

## Architecture

### Blockchain Backend Structure

```
Hyperledger Fabric Network
├── 3 Organizations
│   ├── Org1: ParkingOperator (2 peers)
│   ├── Org2: ChargingStation (2 peers)
│   └── Org3: UserService (1 peer)
├── 4 Smart Contracts (Chaincode)
│   ├── User Contract (user-channel)
│   ├── Parking Contract (parking-channel)
│   ├── Charging Contract (charging-channel)
│   └── Wallet Contract (wallet-channel)
└── CouchDB (World State Database)
    ├── User data
    ├── Parking spots & bookings
    ├── Charging stations & sessions
    └── Wallets & transactions
```

### Key Differences from Traditional Backend

| Feature | Traditional | Blockchain (This Project) |
|---------|-------------|---------------------------|
| Data Storage | PostgreSQL | CouchDB (Fabric World State) |
| Queries | SQL | CouchDB Rich Queries |
| Transactions | Database TX | Blockchain Transactions |
| History | Database logs | Immutable Blockchain |
| Validation | Backend logic | Chaincode + Endorsement |
| Audit Trail | Optional logs | Built-in (blockchain) |

## Data Flow

### Example: User Login

```
1. User enters credentials in React frontend
   ↓
2. POST /api/auth/login → Go REST API
   ↓
3. Go API invokes User Chaincode
   ↓
4. Chaincode queries CouchDB world state
   ↓
5. Password verified in chaincode
   ↓
6. Transaction recorded on blockchain
   ↓
7. JWT token returned (stored in Redis)
   ↓
8. User data returned to frontend
```

### Example: Create Parking Reservation

```
1. User selects spot and time
   ↓
2. POST /api/parking/reserve → Go REST API
   ↓
3. Go API invokes Parking Chaincode
   ↓
4. Chaincode validates spot availability
   ↓
5. Chaincode invokes Wallet Chaincode (payment)
   ↓
6. Multi-org endorsement required
   ↓
7. Transaction committed to blockchain
   ↓
8. Booking data written to CouchDB
   ↓
9. Transaction ID returned to frontend
   ↓
10. Frontend displays blockchain TX info
```

## Blockchain Metadata in Frontend

Every entity includes blockchain metadata:

### User Object
```typescript
{
  id: "user001",
  email: "john@example.com",
  walletAddress: "0x742d35...",
  balance: 100.00,
  // Blockchain metadata
  txId: "abc123...",        // Fabric transaction ID
  blockNumber: 1234,        // Block number
  createdAt: "2024-01-15T10:00:00Z"
}
```

### Reservation Object
```typescript
{
  id: "booking001",
  spotId: "spot001",
  userId: "user001",
  totalCost: 20.00,
  status: "active",
  // Blockchain metadata
  blockchainTxHash: "def456...",  // Transaction hash
  blockNumber: 1235,
  endorsingOrgs: ["Org1MSP", "Org3MSP"],  // Which orgs endorsed
  qrCode: "QR_CODE_STRING"
}
```

### Transaction Object
```typescript
{
  id: "tx001",
  userId: "user001",
  type: "payment",
  amount: 20.00,
  balanceBefore: 100.00,
  balanceAfter: 80.00,
  // Blockchain metadata
  blockchainTxHash: "ghi789...",
  blockNumber: 1235,
  endorsingOrgs: ["Org2MSP", "Org3MSP"],
  timestamp: "2024-01-20T14:00:00Z"
}
```

## Frontend Components for Blockchain

### 1. BlockchainLink Component

Displays clickable links to blockchain explorer:

```tsx
<BlockchainLink 
  txHash={reservation.blockchainTxHash} 
  label="View on Blockchain"
/>
```

### 2. BlockchainMetadata Component

Shows detailed blockchain information:

```tsx
<BlockchainMetadata
  txId={transaction.blockchainTxHash}
  blockNumber={transaction.blockNumber}
  endorsingOrgs={transaction.endorsingOrgs}
  timestamp={transaction.timestamp}
/>
```

**Compact mode:**
```tsx
<BlockchainMetadata
  txId={reservation.blockchainTxHash}
  blockNumber={reservation.blockNumber}
  compact={true}
/>
```

## API Integration

### Expected Backend Endpoints

All endpoints interact with blockchain:

#### User Service (User Chaincode)
```
POST   /api/auth/register     → CreateUser on blockchain
POST   /api/auth/login        → AuthenticateUser (queries blockchain)
GET    /api/auth/me           → GetUser from blockchain
PUT    /api/users/:id         → UpdateUser on blockchain
```

#### Parking Service (Parking Chaincode)
```
GET    /api/parking/spots                → GetAllParkingSpots
GET    /api/parking/spots/:id            → GetParkingSpot
POST   /api/parking/reserve              → CreateBooking
POST   /api/parking/checkin              → CheckInBooking
POST   /api/parking/checkout             → CheckOutBooking
GET    /api/parking/bookings             → GetUserBookings
DELETE /api/parking/cancel/:id           → CancelBooking
```

#### Charging Service (Charging Chaincode)
```
GET    /api/charging/stations            → GetAllChargingStations
POST   /api/charging/start               → CreateChargingSession
PUT    /api/charging/update/:id          → UpdateSessionProgress
POST   /api/charging/stop                → StopChargingSession
GET    /api/charging/sessions            → GetUserSessions
```

#### Wallet Service (Wallet Chaincode)
```
GET    /api/wallet                       → GetWalletByUserId
POST   /api/wallet/add-funds             → AddFunds
POST   /api/payment/process              → ProcessPayment
GET    /api/wallet/transactions          → GetUserTransactions
```

### Response Format

All responses include blockchain metadata:

```json
{
  "success": true,
  "data": {
    "id": "booking001",
    "userId": "user001",
    "spotId": "spot001",
    "status": "active",
    "totalCost": 20.00,
    // Blockchain metadata
    "blockchainTxHash": "abc123def456...",
    "blockNumber": 1235,
    "endorsingOrgs": ["Org1MSP", "Org3MSP"],
    "timestamp": "2024-01-20T14:00:00Z"
  }
}
```

## Development Mode

The frontend includes a development bypass for testing without the blockchain backend:

**Location:** `src/context/AuthContext.tsx`

```typescript
const login = async (email: string, password: string) => {
  // Development bypass (comment out when backend ready)
  const response = {
    token: 'dummy-token',
    user: {
      id: 'user001',
      email,
      balance: 100.00,
      walletAddress: '0x742d35...',
      // Mock blockchain metadata
      txId: 'demo-tx-' + Date.now(),
      blockNumber: 1234,
    },
  };
  
  // Production (uncomment when blockchain backend is ready):
  // const response = await authService.login({ email, password });
  
  localStorage.setItem('authToken', response.token);
  setUser(response.user);
};
```

### Switching to Production

1. **Ensure blockchain network is running**
2. **Update `.env` with backend URL:**
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

3. **Enable real API calls in AuthContext:**
   ```typescript
   // Comment out the mock response
   // Uncomment the real API call
   const response = await authService.login({ email, password });
   ```

4. **Configure blockchain explorer URL:**
   ```env
   VITE_BLOCKCHAIN_EXPLORER_URL=http://localhost:5984/_utils
   ```
   (Or use your Fabric blockchain explorer)

## Displaying Blockchain Data

### In Dashboard

```tsx
// Show blockchain info for each reservation
{reservations.map(reservation => (
  <Card key={reservation.id}>
    <h3>{reservation.spotId}</h3>
    <p>Cost: ${reservation.totalCost}</p>
    
    {/* Blockchain metadata */}
    <BlockchainMetadata
      txId={reservation.blockchainTxHash}
      blockNumber={reservation.blockNumber}
      endorsingOrgs={reservation.endorsingOrgs}
      compact={true}
    />
    
    {/* Link to explorer */}
    <BlockchainLink txHash={reservation.blockchainTxHash} />
  </Card>
))}
```

### In Wallet

```tsx
// Show blockchain info for transactions
{transactions.map(tx => (
  <div key={tx.id}>
    <h4>{tx.type}</h4>
    <p>${tx.amount}</p>
    
    {/* Full blockchain metadata */}
    <BlockchainMetadata
      txId={tx.blockchainTxHash}
      blockNumber={tx.blockNumber}
      endorsingOrgs={tx.endorsingOrgs}
      timestamp={tx.timestamp}
    />
  </div>
))}
```

## CouchDB Rich Queries

The backend can use CouchDB's rich query capabilities:

### Example: Find available parking spots near location

**Backend Chaincode:**
```go
queryString := `{
  "selector": {
    "docType": "parkingSpot",
    "status": "available",
    "location": {
      "$regex": "Downtown"
    },
    "pricePerHour": {
      "$lte": 10
    }
  },
  "sort": [{"pricePerHour": "asc"}]
}`
```

**Frontend API Call:**
```typescript
const spots = await spotService.getAvailableSpots({
  location: 'Downtown',
  maxPrice: 10
});
```

## Benefits of Blockchain Approach

### For Users
✅ **Complete transparency** - All transactions visible
✅ **Immutable history** - Records can't be altered
✅ **Trust** - Multi-org endorsement required
✅ **Audit trail** - Every action recorded

### For Development
✅ **Simpler architecture** - No database to manage
✅ **Built-in consistency** - Blockchain ensures data integrity
✅ **Distributed** - No single point of failure
✅ **Automatic history** - Blockchain keeps all versions

### For Demo/Presentation
✅ **Show CouchDB Fauxton** - Visualize world state
✅ **Display transaction IDs** - Prove blockchain usage
✅ **Show block numbers** - Demonstrate immutability
✅ **Multi-org endorsement** - Show distributed validation

## Testing Blockchain Integration

### 1. Verify Network
```bash
docker ps
# Should show: peers, orderers, CouchDB containers
```

### 2. Check CouchDB
Open: `http://localhost:5984/_utils`
- Verify databases exist
- View documents in world state
- Check indexes

### 3. Query Chaincode Directly
```bash
peer chaincode query \
  -C user-channel \
  -n user-contract \
  -c '{"Args":["GetUser","user001"]}'
```

### 4. Test API → Blockchain Flow
```bash
# Create user via API
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Check CouchDB
# Open http://localhost:5984/_utils
# Verify user document exists
```

### 5. Verify Frontend Integration
1. Start frontend: `npm run dev`
2. Login with test user
3. Open DevTools → Network tab
4. Observe API calls
5. Check response includes blockchain metadata

## Troubleshooting

### Issue: No blockchain metadata in responses

**Solution:** Ensure backend returns these fields:
```go
type Response struct {
    Data interface{} `json:"data"`
    // Add blockchain metadata
    TxID         string   `json:"blockchainTxHash"`
    BlockNumber  uint64   `json:"blockNumber"`
    EndorsingOrgs []string `json:"endorsingOrgs"`
}
```

### Issue: CouchDB queries slow

**Solution:** Add indexes to chaincode:
```go
{
  "index": {
    "fields": ["docType", "status", "location"]
  },
  "name": "spotStatusLocationIndex",
  "type": "json"
}
```

### Issue: Transaction endorsement fails

**Check:**
- All required peers are running
- Endorsement policy is satisfied
- Chaincode is installed on all peers

## Next Steps

1. ✅ **Frontend ready** - All components built
2. ⏳ **Setup Fabric network** - Follow project plan
3. ⏳ **Deploy chaincodes** - User, Parking, Charging, Wallet
4. ⏳ **Build Go REST API** - Connect to Fabric SDK
5. ⏳ **Connect frontend** - Update API URLs
6. ⏳ **Test integration** - End-to-end testing
7. ✅ **Demo** - Show blockchain in action!

## Resources

- **Hyperledger Fabric Docs:** https://hyperledger-fabric.readthedocs.io
- **CouchDB Docs:** https://docs.couchdb.org
- **Fabric SDK Go:** https://github.com/hyperledger/fabric-sdk-go
- **Your Project Plan:** See main project overview document

---

**Ready for 100% blockchain integration! 🚀🔗**
