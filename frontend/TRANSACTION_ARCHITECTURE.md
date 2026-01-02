# Transaction Display Architecture

## Component Hierarchy

```
App.tsx
├── /wallet (Wallet Page)
│   ├── Wallet Balance Card
│   ├── Transaction Statistics (3 cards)
│   ├── Transaction History List
│   │   ├── Transaction Card (clickable)
│   │   │   ├── Icon (type indicator)
│   │   │   ├── Type & Status Badges
│   │   │   ├── Description
│   │   │   ├── Timestamp
│   │   │   ├── Blockchain Link
│   │   │   └── Amount Display
│   │   └── TransactionDetailsModal (on click)
│   ├── Deposit Modal
│   └── Withdraw Modal
│
└── /transactions (Transaction History Page)
    ├── Summary Statistics (4 cards)
    ├── Filters & Search Bar
    │   ├── Search Input
    │   ├── Type Filter Dropdown
    │   ├── Status Filter Dropdown
    │   └── Date Range Dropdown
    ├── Export CSV Button
    ├── Transaction List (filtered)
    │   └── Transaction Card (clickable)
    │       └── TransactionDetailsModal (on click)
    └── TransactionDetailsModal
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Wallet Page / Transaction History Page                      │
│         │                                                     │
│         ├──> Load Data on Mount                             │
│         │                                                     │
│         └──> Call walletService API                         │
│                    │                                          │
│                    v                                          │
│         ┌──────────────────────────────┐                    │
│         │   API Service Layer          │                     │
│         │   (apiService.ts)            │                     │
│         │                              │                     │
│         │  • getWallet()               │                     │
│         │  • getTransactions()         │                     │
│         │  • getTotalSpending()        │                     │
│         │  • addFunds()                │                     │
│         └──────────────┬───────────────┘                    │
│                        │                                      │
│                        │ HTTP Request                         │
│                        │ with Bearer Token                    │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         v
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Go/Gin)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  API Endpoints:                                              │
│    GET  /api/v1/wallet                                       │
│    GET  /api/v1/wallet/balance                               │
│    GET  /api/v1/wallet/transactions                          │
│    GET  /api/v1/wallet/transactions/:id                      │
│    GET  /api/v1/wallet/spending                              │
│    POST /api/v1/wallet/add-funds                             │
│         │                                                     │
│         ├──> Validate Request                               │
│         ├──> Check Authentication                           │
│         └──> Call Fabric Client                             │
│                    │                                          │
└────────────────────┼──────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│              Hyperledger Fabric Network                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Wallet Chaincode (Go)                                       │
│                                                               │
│  Functions:                                                  │
│    • GetWallet()          - Retrieve wallet info             │
│    • GetTransactions()    - Query all transactions           │
│    • AddFunds()          - Create deposit transaction       │
│    • GetTotalSpending()  - Calculate total spent            │
│    • ProcessPayment()    - Process payment transaction      │
│                                                               │
│  ┌─────────────────────────────────────────┐               │
│  │          World State (CouchDB)          │               │
│  │                                          │               │
│  │  Wallet Records:                         │               │
│  │    • walletId                            │               │
│  │    • userId                              │               │
│  │    • balance                             │               │
│  │    • address                             │               │
│  │                                          │               │
│  │  Transaction Records:                    │               │
│  │    • transactionId                       │               │
│  │    • type (deposit/payment/refund)       │               │
│  │    • amount                              │               │
│  │    • balanceBefore/After                 │               │
│  │    • status                              │               │
│  │    • timestamp                           │               │
│  │    • description                         │               │
│  │    • references (payment/booking/session)│               │
│  └─────────────────────────────────────────┘               │
│                                                               │
│  ┌─────────────────────────────────────────┐               │
│  │          Blockchain Ledger              │               │
│  │                                          │               │
│  │  Immutable Transaction Log:              │               │
│  │    • Transaction Hash                    │               │
│  │    • Block Number                        │               │
│  │    • Endorsing Organizations             │               │
│  │    • Timestamp                           │               │
│  │    • Transaction Data                    │               │
│  └─────────────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Transaction Lifecycle

```
1. USER ACTION
   └─> Click "Deposit" button in Wallet page
       └─> Enter amount
           └─> Click "Confirm Deposit"

2. FRONTEND PROCESSING
   └─> Validate input
       └─> Call walletService.addFunds({ amount })
           └─> Axios POST to /api/v1/wallet/add-funds

3. BACKEND API
   └─> Receive POST request
       └─> Verify JWT token
           └─> Extract userId from token
               └─> Call Fabric SDK
                   └─> Invoke "AddFunds" chaincode function

4. HYPERLEDGER FABRIC
   └─> Wallet Chaincode receives transaction
       └─> Validate wallet exists
           └─> Calculate new balance
               └─> Create transaction record
                   └─> Update wallet balance
                       └─> Commit to world state
                           └─> Add to blockchain ledger
                               └─> Get endorsements from orgs
                                   └─> Return transaction hash

5. BACKEND RESPONSE
   └─> Receive transaction from Fabric
       └─> Format response with:
           • Transaction ID
           • Blockchain hash
           • Block number
           • New balance
       └─> Send JSON response to frontend

6. FRONTEND UPDATE
   └─> Receive success response
       └─> Show success notification
           └─> Refresh wallet data
               └─> Update transaction list
                   └─> Show new transaction
                       └─> Display blockchain link

7. USER VERIFICATION
   └─> Click "View on Blockchain"
       └─> See transaction details modal
           └─> Verify transaction hash
               └─> Check block number
                   └─> Confirm endorsing organizations
```

## Transaction Detail Modal Flow

```
User clicks transaction card
         │
         v
┌──────────────────────────────────────┐
│   TransactionDetailsModal opens      │
├──────────────────────────────────────┤
│                                       │
│  Header Section:                      │
│    • Status Icon                      │
│    • Transaction ID                   │
│    • Status Badge                     │
│    • Type Badge                       │
│                                       │
│  Amount Section:                      │
│    • Large Amount Display             │
│    • +/- Indicator                    │
│    • Balance Before                   │
│    • Balance After                    │
│                                       │
│  Information Section:                 │
│    • Description                      │
│    • Timestamp (full format)          │
│    • User ID                          │
│    • Wallet ID                        │
│                                       │
│  Related References:                  │
│    • Payment ID (if applicable)       │
│    • Reservation ID (if applicable)   │
│    • Session ID (if applicable)       │
│                                       │
│  Blockchain Section:                  │
│    • Transaction Hash (full)          │
│    • Block Number                     │
│    • Endorsing Organizations          │
│    • Blockchain Explorer Link         │
│                                       │
│  Actions:                             │
│    • Close Button                     │
│                                       │
└──────────────────────────────────────┘
```

## Filter Logic (Transaction History Page)

```
All Transactions (from API)
         │
         v
    ┌─────────┐
    │ Type    │ ─> Filter by transaction type
    │ Filter  │    (deposit, payment, refund, etc.)
    └────┬────┘
         │
         v
    ┌─────────┐
    │ Status  │ ─> Filter by status
    │ Filter  │    (confirmed, pending, failed)
    └────┬────┘
         │
         v
    ┌─────────┐
    │  Date   │ ─> Filter by date range
    │  Range  │    (7d, 30d, 90d, all)
    └────┬────┘
         │
         v
    ┌─────────┐
    │ Search  │ ─> Search in description,
    │  Term   │    ID, hash, type
    └────┬────┘
         │
         v
   Filtered Results
         │
         v
    Display in UI
```

## State Management

```
Wallet Page State:
├── walletInfo: WalletInfo | null
├── transactions: Transaction[]
├── filteredTransactions: Transaction[]  (not used in Wallet, only in History)
├── isLoading: boolean
├── showDepositModal: boolean
├── showWithdrawModal: boolean
├── selectedTransaction: Transaction | null
├── amount: string
├── isProcessing: boolean
└── totalSpent: number

Transaction History Page State:
├── transactions: Transaction[]
├── filteredTransactions: Transaction[]
├── isLoading: boolean
├── selectedTransaction: Transaction | null
├── filterType: string
├── filterStatus: string
├── searchTerm: string
└── dateRange: string

Effects:
├── useEffect(() => loadData(), [])           // Load on mount
└── useEffect(() => applyFilters(), [filters]) // Apply filters on change
```

## API Response Format

```json
{
  "id": "tx001",
  "walletId": "wallet123",
  "userId": "user001",
  "type": "deposit",
  "amount": 50.00,
  "balanceBefore": 100.00,
  "balanceAfter": 150.00,
  "timestamp": "2025-12-30T10:30:00Z",
  "blockchainTxHash": "0xabcdef123456...",
  "status": "confirmed",
  "description": "Wallet deposit via web app",
  "blockNumber": 5234,
  "endorsingOrgs": ["Org1MSP", "Org3MSP"]
}
```

---

**Diagram Version**: 1.0  
**Last Updated**: December 30, 2025
