# CityFlow Parking - Development Guide

## Quick Start

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Configure Backend Connection
Edit `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080/api
# VITE_BLOCKCHAIN_EXPLORER_URL=https://etherscan.io/tx  # Removed - not compatible with Hyperledger Fabric
```

### 3. Run Development Server
```bash
npm run dev
```
Access at: http://localhost:5173

## Project Architecture

### Directory Structure
```
src/
├── components/       # Reusable UI components
├── context/         # React Context (Auth)
├── pages/           # Main pages (Login, Dashboard, Map, Wallet)
├── services/        # API service layer
├── types/           # TypeScript definitions
├── config/          # Configuration
└── App.tsx          # Main app with routing
```

### Key Features

#### 1. Authentication Flow
- JWT token-based authentication
- Automatic token refresh
- Protected routes
- Persistent sessions

#### 2. Blockchain Integration
- Every transaction has a blockchain hash
- Direct links to blockchain explorer
- Real-time transaction status
- Transparent history

#### 3. Real-time Data
- Live spot availability
- Reservation status updates
- Wallet balance synchronization
- Transaction confirmations

## API Integration Points

### Authentication
```typescript
POST /api/auth/login
GET /api/users/profile
```

### Spots Management
```typescript
GET /api/spots                    // All spots
GET /api/spots/available          // Available only
GET /api/spots/:id                // Single spot
```

### Reservations
```typescript
GET /api/reservations/user        // User's reservations
POST /api/reservations            // Create reservation
POST /api/reservations/:id/cancel // Cancel reservation
```

### Wallet Operations
```typescript
GET /api/wallet                   // Wallet info
GET /api/wallet/transactions      // Transaction history
POST /api/wallet/deposit          // Deposit funds
POST /api/wallet/withdraw         // Withdraw funds
```

## Expected API Response Format

### Reservation Response
```json
{
  "id": "res-123",
  "spotId": "spot-456",
  "userId": "user-789",
  "startTime": "2025-12-04T10:00:00Z",
  "endTime": "2025-12-04T12:00:00Z",
  "totalCost": 20.00,
  "status": "active",
  "blockchainTxHash": "0x1234567890abcdef..."
}
```

### Transaction Response
```json
{
  "id": "tx-123",
  "userId": "user-789",
  "type": "payment",
  "amount": 20.00,
  "timestamp": "2025-12-04T10:00:00Z",
  "blockchainTxHash": "0x1234567890abcdef...",
  "status": "confirmed",
  "description": "Payment for parking reservation"
}
```

## Key Components

### BlockchainLink Component
Displays transaction hash with link to explorer:
```tsx
<BlockchainLink txHash={transaction.blockchainTxHash} />
```

### Protected Routes
Wraps authenticated pages:
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Service Layer
All API calls go through services:
```typescript
import { reservationService } from '../services';
const reservations = await reservationService.getUserReservations();
```

## Development Tips

### Adding New Features
1. Define types in `src/types/index.ts`
2. Add API endpoint in `src/config/api.ts`
3. Create service method in `src/services/index.ts`
4. Build UI component/page
5. Update routes in `App.tsx` if needed

### Styling
Uses Tailwind CSS - common patterns:
- Cards: `bg-white rounded-lg shadow-md p-6`
- Buttons: Use `<Button>` component with variants
- Forms: Use `<Input>` component with labels

### State Management
- Auth state: `useAuth()` hook
- Local state: `useState()` for component state
- API data: Fetch on mount, store in state

## Testing

### Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Navigate between pages
- [ ] View available spots on map
- [ ] Create reservation
- [ ] View reservation on dashboard
- [ ] Check blockchain transaction link
- [ ] Deposit funds to wallet
- [ ] View transaction history
- [ ] Logout and verify redirect

### Test User Flow
1. Login → Dashboard
2. Click "Find Parking Spot" → Map
3. Filter by EV Charging
4. Select a spot
5. Create reservation
6. Verify blockchain TX hash shown
7. Go to Wallet
8. Verify transaction appears
9. Click "View on Blockchain"

## Common Issues

### CORS Errors
Backend must allow frontend origin:
```go
// Go backend CORS config
AllowOrigins: []string{"http://localhost:5173"}
```

### 401 Unauthorized
- Check token in localStorage
- Verify backend token validation
- Check token expiration

### Missing Blockchain Hash
- Verify backend returns `blockchainTxHash`
- Check API response structure
- Confirm blockchain integration in backend

## Build & Deploy

### Production Build
```bash
npm run build
```
Output in `dist/` directory

### Environment Variables
Set these in production:
- `VITE_API_BASE_URL`: Production API URL
- `VITE_BLOCKCHAIN_EXPLORER_URL`: Appropriate blockchain explorer

### Deployment Options
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Docker container

## Performance Tips

1. **Lazy Loading**: Code-split routes if needed
2. **Caching**: Use React Query for API caching
3. **Memoization**: Use `useMemo` for expensive calculations
4. **Debouncing**: Debounce search inputs

## Security Considerations

- ✅ JWT tokens stored in localStorage
- ✅ Auto-logout on token expiration
- ✅ Protected routes require auth
- ✅ HTTPS in production
- ✅ No sensitive data in frontend code
- ⚠️ Don't commit `.env` files

## Support & Resources

- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org
- Tailwind CSS: https://tailwindcss.com
- Vite: https://vite.dev
