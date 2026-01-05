# Blockchain Features Quick Reference

## Component Quick Reference

### 1. BlockchainTransactionCard
**Purpose**: Display wallet transactions with blockchain metadata  
**Location**: `src/components/BlockchainTransactionCard.tsx`

```tsx
<BlockchainTransactionCard 
  transaction={transaction}
  onClick={() => handleClick(transaction)}
/>
```

**Shows**: Amount, type, status, blockchain hash, block number, endorsing orgs

---

### 2. BlockchainBookingCard
**Purpose**: Display parking bookings with blockchain verification  
**Location**: `src/components/BlockchainBookingCard.tsx`

```tsx
<BlockchainBookingCard 
  booking={reservation}
  onClick={() => handleClick(reservation)}
/>
```

**Shows**: Booking details, QR code, blockchain hash, block number, endorsing orgs

---

### 3. BlockchainChargingCard
**Purpose**: Display charging sessions with blockchain verification  
**Location**: `src/components/BlockchainChargingCard.tsx`

```tsx
<BlockchainChargingCard 
  session={chargingSession}
  onClick={() => handleClick(session)}
/>
```

**Shows**: Energy usage, cost, blockchain hash, block number, endorsing orgs

---

### 4. BlockchainStats
**Purpose**: Display blockchain statistics dashboard  
**Location**: `src/components/BlockchainStats.tsx`

```tsx
<BlockchainStats transactions={transactionArray} />
```

**Shows**: Total transactions, blocks used, endorsing orgs, success rate

---

### 5. TransactionDetailsModal
**Purpose**: Show detailed transaction information in modal  
**Location**: `src/components/TransactionDetailsModal.tsx`

```tsx
<TransactionDetailsModal 
  transaction={transaction}
  onClose={() => setSelectedTransaction(null)}
/>
```

---

## Service Functions Quick Reference

### Wallet Service

```typescript
import { walletService } from '../services/apiService';

// Get wallet info
const wallet = await walletService.getWallet();

// Get all transactions (with blockchain metadata)
const transactions = await walletService.getTransactions();

// Get specific transaction
const transaction = await walletService.getTransaction(transactionId);

// Add funds (creates blockchain transaction)
const newTransaction = await walletService.addFunds({ amount: 50.00 });

// Get total spending
const { totalSpent } = await walletService.getTotalSpending();
```

### Parking Booking Service

```typescript
import { parkingBookingService } from '../services/apiService';

// Create booking (blockchain-verified)
const booking = await parkingBookingService.createBooking({
  spotId: 'spot_123',
  startTime: '2026-01-05T10:00:00Z',
  endTime: '2026-01-05T12:00:00Z'
});

// Get user bookings (with blockchain metadata)
const bookings = await parkingBookingService.getUserBookings();

// Check in (updates blockchain)
const updatedBooking = await parkingBookingService.checkIn({ 
  bookingId: 'booking_123' 
});

// Check out (updates blockchain)
const completedBooking = await parkingBookingService.checkOut({ 
  bookingId: 'booking_123' 
});
```

### Charging Session Service

```typescript
import { chargingSessionService } from '../services/apiService';

// Start session (blockchain-verified)
const session = await chargingSessionService.startSession({
  stationId: 'station_123',
  vehicleId: 'vehicle_123' // optional
});

// Get user sessions (with blockchain metadata)
const sessions = await chargingSessionService.getUserSessions();

// Update session (updates blockchain)
const updated = await chargingSessionService.updateSession(sessionId, {
  energyConsumed: 25.5,
  currentCost: 15.30
});

// Stop session (updates blockchain)
const stopped = await chargingSessionService.stopSession({ 
  sessionId: 'session_123' 
});
```

### Payment Service

```typescript
import { paymentService } from '../services/apiService';

// Process payment (blockchain-verified)
const payment = await paymentService.processPayment({
  amount: 25.00,
  type: 'parking',
  referenceId: 'booking_123',
  description: 'Parking payment'
});

// Refund payment (creates blockchain transaction)
const refund = await paymentService.refundPayment('payment_123', {
  reason: 'Booking cancelled'
});

// Get payment receipt
const receipt = await paymentService.getPaymentReceipt('payment_123');
```

---

## TypeScript Types

### Transaction
```typescript
interface Transaction {
  id: string;
  userId: string;
  walletId?: string;
  type: 'debit' | 'credit' | 'payment' | 'refund' | 'deposit' | 'withdrawal';
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  timestamp: string;
  blockchainTxHash: string;           // Fabric transaction ID
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  description: string;
  paymentId?: string;
  reservationId?: string;
  sessionId?: string;
  blockNumber?: number;                // Block number
  endorsingOrgs?: string[];            // Endorsing organizations
}
```

### Reservation (Booking)
```typescript
interface Reservation {
  id: string;
  spotId: string;
  userId: string;
  startTime: string;
  endTime: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  duration?: number;
  pricePerHour: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalCost: number;
  qrCode?: string;
  paymentId?: string;
  transactionId?: string;
  blockchainTxHash?: string;           // Fabric transaction ID
  createdAt?: string;
  updatedAt?: string;
  blockNumber?: number;                // Block number
  endorsingOrgs?: string[];            // Endorsing organizations
}
```

### ChargingSession
```typescript
interface ChargingSession {
  id: string;
  userId: string;
  stationId: string;
  startTime: string;
  endTime?: string;
  duration: number;                    // minutes
  energyConsumed: number;              // kWh
  pricePerKwh: number;
  currentCost: number;
  totalCost: number;
  status: 'starting' | 'active' | 'completed' | 'cancelled';
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
  blockchainTxHash?: string;           // Fabric transaction ID
  blockNumber?: number;                // Block number
  endorsingOrgs?: string[];            // Endorsing organizations
}
```

---

## Common Patterns

### Loading Transactions with Error Handling

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [isLoading, setIsLoading] = useState(true);
const notification = useNotification();

useEffect(() => {
  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const txns = await walletService.getTransactions();
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      notification.error('Failed to load transactions', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };
  
  loadTransactions();
}, []);
```

### Filtering Transactions

```typescript
const [filterType, setFilterType] = useState<string>('all');
const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);

useEffect(() => {
  if (filterType === 'all') {
    setFilteredTransactions(transactions);
  } else {
    setFilteredTransactions(
      transactions.filter((t) => t.type === filterType)
    );
  }
}, [filterType, transactions]);
```

### Displaying Blockchain Info

```typescript
// Show transaction hash
{transaction.blockchainTxHash && (
  <p className="font-mono text-xs">
    TX: {transaction.blockchainTxHash}
  </p>
)}

// Show block number
{transaction.blockNumber !== undefined && (
  <span className="font-mono">
    Block #{transaction.blockNumber}
  </span>
)}

// Show endorsing orgs
{transaction.endorsingOrgs && transaction.endorsingOrgs.length > 0 && (
  <div>
    {transaction.endorsingOrgs.map((org, index) => (
      <span key={index} className="badge">{org}</span>
    ))}
  </div>
)}
```

---

## Pages Using Blockchain Features

### Wallet.tsx
- Displays wallet balance (blockchain-verified)
- Shows transaction history with blockchain metadata
- Supports adding funds (creates blockchain transaction)

### TransactionHistory.tsx
- Complete transaction history with blockchain stats
- Advanced filtering and search
- CSV export with blockchain hashes

### Dashboard.tsx (Admin)
- Overview of blockchain transactions
- Statistics and analytics

---

## Styling Classes

### Status Colors
```tsx
// Confirmed/Completed
'bg-green-100 text-green-800 border-green-200'

// Pending
'bg-yellow-100 text-yellow-800 border-yellow-200'

// Active
'bg-blue-100 text-blue-800 border-blue-200'

// Failed/Cancelled
'bg-red-100 text-red-800 border-red-200'
```

### Blockchain Info Section
```tsx
className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200"
```

---

## Icons (lucide-react)

```typescript
// Transaction types
import {
  ArrowDownCircle,    // Deposits/Credits
  ArrowUpCircle,      // Withdrawals/Debits
  TrendingDown,       // Payments
  TrendingUp,         // Refunds
  Wallet,             // Generic wallet/transaction
} from 'lucide-react';

// Blockchain
import {
  Shield,             // Blockchain security
  Hash,               // Transaction hash
  Layers,             // Blocks
  Users,              // Endorsing organizations
  CheckCircle,        // Verified/Confirmed
} from 'lucide-react';

// Status
import {
  Clock,              // Pending
  AlertCircle,        // Warning/Active
  XCircle,            // Failed/Cancelled
} from 'lucide-react';
```

---

## Testing Checklist

- [ ] Load wallet and see blockchain balance
- [ ] Add funds and verify blockchain transaction appears
- [ ] Create parking booking and see blockchain metadata
- [ ] Start charging session and see blockchain verification
- [ ] View transaction history with blockchain stats
- [ ] Filter transactions by type/status
- [ ] Export transactions to CSV
- [ ] Click on transaction to see details modal
- [ ] Verify all blockchain hashes are displayed correctly
- [ ] Check that block numbers appear
- [ ] Verify endorsing organizations are shown

---

## Environment Variables

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8080

# Blockchain Explorer URL (optional)
VITE_BLOCKCHAIN_EXPLORER_URL=http://localhost:7050
```

---

## Troubleshooting

### Transactions not showing blockchain metadata
- Check that backend is returning `transactionId`, `blockNumber`, `endorsingOrgs`
- Verify mapping functions in `apiService.ts` are working
- Check browser console for errors

### Components not rendering
- Verify imports are correct
- Check that components are exported from `index.ts`
- Ensure TypeScript types match API responses

### API errors
- Check network tab in browser DevTools
- Verify backend API is running
- Check authentication token is valid

---

## Performance Tips

- Use React.memo() for blockchain cards if rendering many items
- Implement virtual scrolling for large transaction lists
- Cache blockchain metadata where appropriate
- Use pagination for transaction history

---

## Security Considerations

- Never expose private keys in frontend code
- Validate all blockchain data received from API
- Use HTTPS in production
- Implement rate limiting for API calls
- Sanitize user inputs before displaying
