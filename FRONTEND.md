# Frontend Documentation

Complete guide for the CityFlow Smart Parking & EV Charging frontend application.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [Pages](#pages)
- [Components](#components)
- [Services](#services)
- [Blockchain Integration](#blockchain-integration)
- [Development](#development)
- [Building for Production](#building-for-production)

## Overview

A modern React-based frontend application for smart parking and EV charging management with complete blockchain integration powered by Hyperledger Fabric.

### Key Highlights
- ⚛️ React 19 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔗 Full blockchain transaction tracking
- 🚀 Vite for fast development
- 📱 Responsive design
- 🔐 JWT authentication
- 💳 Digital wallet integration

## Features

### 🎯 Core Functionality

#### Smart Parking & EV Charging
- Browse and filter available parking and charging spots in real-time
- Interactive map visualization with location-based search
- Real-time availability status updates
- Detailed spot information and pricing

#### Reservation System
- Create, view, and manage reservations
- Check-in and check-out functionality
- Extend reservations
- Cancel bookings with automatic refunds
- QR code generation for easy access

#### Blockchain Integration
- All transactions recorded on Hyperledger Fabric blockchain
- Transaction hash and block number display
- Endorsing organization visibility
- Transaction verification
- Complete audit trail

#### Wallet Management
- Digital wallet creation and management
- Add funds functionality
- View balance and transaction history
- Transaction categorization (deposits, payments, refunds)
- Blockchain transaction links

#### Security & Monitoring
- Admin security dashboard
- Real-time event monitoring
- Security alerts and notifications
- System health tracking

## Technology Stack

### Core Technologies
- **React 19**: Latest React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Custom Components**: Reusable UI components

### State Management & Data
- **React Context**: Global state management
- **Axios**: HTTP client with interceptors
- **Local Storage**: Token and session persistence

### Development Tools
- **ESLint**: Code linting
- **TypeScript ESLint**: TypeScript-specific linting
- **Vite Plugin React**: React fast refresh

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running backend API (see [HYPERLEDGER_BLOCKCHAIN.md](HYPERLEDGER_BLOCKCHAIN.md))

### Steps

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configure Environment Variables
```bash
# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8080/api/v1
EOF
```

#### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### 4. Verify Backend Connection
Ensure the backend API is running:
```bash
curl http://localhost:8080/health
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styles
│   ├── components/     # Reusable UI components
│   │   ├── BlockchainTransactionCard.tsx
│   │   ├── BlockchainBookingCard.tsx
│   │   ├── BlockchainChargingCard.tsx
│   │   ├── BlockchainStats.tsx
│   │   ├── TransactionDetailsModal.tsx
│   │   └── ...
│   ├── pages/          # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Map.tsx
│   │   ├── Wallet.tsx
│   │   ├── SecurityDashboard.tsx
│   │   └── ...
│   ├── services/       # API services
│   │   ├── apiService.ts
│   │   └── index.ts
│   ├── context/        # React context providers
│   │   ├── AuthContext.tsx
│   │   └── SecurityContext.tsx
│   ├── config/         # Configuration files
│   │   └── api.ts
│   └── types/          # TypeScript type definitions
│       └── index.ts
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Pages

### 1. Login Page
**Route**: `/login`  
**Features**:
- Email/password authentication
- JWT token management
- Session persistence
- Clean, modern UI with gradient background

**Usage**:
```typescript
import Login from './pages/Login';
```

### 2. Dashboard
**Route**: `/dashboard`  
**Features**:
- Overview of active and past reservations
- Quick statistics (active reservations, wallet balance, total bookings)
- Quick action buttons
- Blockchain transaction display
- Recent activity feed

**Components Used**:
- `BlockchainBookingCard`
- `BlockchainChargingCard`
- `BlockchainStats`

### 3. Map Page
**Route**: `/map`  
**Features**:
- Interactive map visualization
- Real-time spot availability
- Filter by type (Parking vs EV Charging)
- Toggle available-only spots
- Location-based search
- Quick reservation creation
- Cost calculation

**State Management**:
```typescript
const [spots, setSpots] = useState([]);
const [selectedSpot, setSelectedSpot] = useState(null);
const [filter, setFilter] = useState({ type: 'all', availableOnly: false });
```

### 4. Wallet Page
**Route**: `/wallet`  
**Features**:
- Current balance display
- Wallet address
- Add funds functionality
- Complete transaction history
- Transaction statistics
- Blockchain transaction links
- Transaction status tracking

**Components Used**:
- `BlockchainTransactionCard`
- `TransactionDetailsModal`

### 5. Security Dashboard (Admin)
**Route**: `/admin/security`  
**Features**:
- Security event monitoring
- Active alerts display
- System health score
- Event statistics
- Top IP addresses
- Recent events log

**Access**: Admin users only

## Components

### Blockchain Components

#### BlockchainTransactionCard
Display wallet transactions with blockchain metadata.

```typescript
<BlockchainTransactionCard 
  transaction={transaction}
  onClick={() => handleClick(transaction)}
/>
```

**Props**:
- `transaction`: Transaction object with blockchain metadata
- `onClick`: Optional click handler

**Displays**:
- Amount and type
- Transaction status
- Blockchain hash
- Block number
- Endorsing organizations

#### BlockchainBookingCard
Display parking bookings with blockchain verification.

```typescript
<BlockchainBookingCard 
  booking={reservation}
  onClick={() => handleClick(reservation)}
/>
```

**Props**:
- `booking`: Booking/reservation object
- `onClick`: Optional click handler

**Displays**:
- Booking details (spot, time, vehicle)
- QR code for access
- Blockchain hash and block number
- Endorsing organizations
- Status and actions

#### BlockchainChargingCard
Display charging sessions with blockchain verification.

```typescript
<BlockchainChargingCard 
  session={chargingSession}
  onClick={() => handleClick(session)}
/>
```

**Props**:
- `session`: Charging session object
- `onClick`: Optional click handler

**Displays**:
- Energy usage and cost
- Session duration
- Station information
- Blockchain hash and block number
- Endorsing organizations

#### BlockchainStats
Display blockchain statistics dashboard.

```typescript
<BlockchainStats transactions={transactionArray} />
```

**Props**:
- `transactions`: Array of blockchain transactions

**Displays**:
- Total transactions
- Unique blocks used
- Endorsing organizations count
- Success rate percentage

#### TransactionDetailsModal
Show detailed transaction information in a modal.

```typescript
<TransactionDetailsModal 
  transaction={transaction}
  onClose={() => setSelectedTransaction(null)}
/>
```

**Props**:
- `transaction`: Full transaction object
- `onClose`: Close handler

## Services

### API Service Architecture

All API calls are centralized in the service layer with automatic:
- Token injection
- Error handling
- Response transformation
- Request/response logging

### Import Services

```typescript
import {
  authService,
  userService,
  parkingSpotService,
  parkingBookingService,
  chargingStationService,
  chargingSessionService,
  walletService,
  paymentService,
} from '@/services';
```

### Service Usage Examples

#### Authentication
```typescript
// Login
const { token, user } = await authService.login({ 
  email, 
  password 
});
localStorage.setItem('authToken', token);

// Get current user
const user = await authService.getCurrentUser();

// Logout
await authService.logout();
localStorage.removeItem('authToken');
```

#### Parking Operations
```typescript
// Get available spots
const spots = await parkingSpotService.getAvailableSpots();

// Create booking
const booking = await parkingBookingService.createBooking({
  spotId: 'spot123',
  startTime: '2026-01-05T10:00:00Z',
  endTime: '2026-01-05T12:00:00Z',
  vehicleNumber: 'ABC-123',
});

// Get user bookings
const bookings = await parkingBookingService.getUserBookings();
```

#### Wallet Operations
```typescript
// Get wallet
const wallet = await walletService.getWallet();

// Add funds
const transaction = await walletService.addFunds({ 
  amount: 50.00 
});

// Get transactions
const transactions = await walletService.getTransactions();
```

### Error Handling Pattern

```typescript
try {
  const data = await someService.someMethod();
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Blockchain Integration

### Transaction Tracking

Every transaction includes blockchain metadata:

```typescript
interface BlockchainTransaction {
  id: string;
  amount: number;
  type: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  
  // Blockchain metadata
  blockchainTxHash: string;      // Transaction hash
  blockNumber: number;            // Block number
  endorsingOrgs: string[];        // Endorsing organizations
  channelName: string;            // Hyperledger Fabric channel
  chaincodeName: string;          // Smart contract name
}
```

### Displaying Blockchain Data

```typescript
// Show transaction hash
<div>
  <label>Transaction Hash:</label>
  <code>{transaction.blockchainTxHash}</code>
</div>

// Show block number
<div>
  <label>Block Number:</label>
  <span>{transaction.blockNumber}</span>
</div>

// Show endorsing organizations
<div>
  <label>Endorsed By:</label>
  <ul>
    {transaction.endorsingOrgs.map(org => (
      <li key={org}>{org}</li>
    ))}
  </ul>
</div>
```

### Blockchain Verification

All blockchain-recorded transactions display:
- ✅ Blockchain Transaction Hash
- ✅ Block Number
- ✅ Endorsing Organizations
- ✅ Transaction Status
- ✅ Timestamp

This provides complete transparency and allows users to verify transactions independently.

## Development

### Development Server
```bash
npm run dev
```

Starts development server at `http://localhost:5173` with:
- Hot module replacement (HMR)
- Fast refresh
- Error overlay
- Source maps

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Code Formatting
```bash
npm run format
```

### Development Best Practices

1. **Use TypeScript**: Define types for all data structures
2. **Component Organization**: Keep components small and focused
3. **Service Layer**: All API calls through service layer
4. **Error Handling**: Always handle errors gracefully
5. **Loading States**: Show loading indicators for async operations
6. **Responsive Design**: Test on multiple screen sizes

## Building for Production

### Build Application
```bash
npm run build
```

Creates optimized production build in `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting
- Asset optimization
- Source maps (optional)

### Preview Production Build
```bash
npm run preview
```

Serves production build locally for testing.

### Deployment

#### Option 1: Static Hosting (Netlify, Vercel, etc.)
```bash
npm run build
# Upload dist/ directory
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t cityflow-frontend .
docker run -p 80:80 cityflow-frontend
```

#### Option 3: Serve with Backend
Copy `dist/` contents to backend's `static/` directory.

### Environment Variables for Production

```env
# Production API endpoint
VITE_API_BASE_URL=https://api.cityflow.example.com/api/v1

# Optional: Enable/disable features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Dashboard loads with correct data
- [ ] Map displays parking and charging spots
- [ ] Spot filtering works correctly
- [ ] Create parking booking
- [ ] Create charging session
- [ ] Wallet shows correct balance
- [ ] Add funds to wallet
- [ ] Transaction history displays correctly
- [ ] Blockchain metadata visible on all transactions
- [ ] Admin security dashboard (admin users only)
- [ ] Logout functionality

### Test User Credentials

```bash
# Create test user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

## API Integration

The frontend integrates with the Go backend API. See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

### Base URL Configuration
```typescript
// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'http://localhost:8080/api/v1';
```

### Request Interceptor
Automatically adds authentication token to all requests:

```typescript
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptor
Handles common errors and token refresh:

```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Troubleshooting

### Common Issues

#### 1. API Connection Error
**Problem**: Cannot connect to backend API  
**Solution**: 
- Ensure backend is running: `curl http://localhost:8080/health`
- Check VITE_API_BASE_URL in `.env`
- Verify CORS settings in backend

#### 2. Authentication Token Issues
**Problem**: Token expired or invalid  
**Solution**:
- Clear localStorage: `localStorage.clear()`
- Login again to get new token
- Check token expiration time

#### 3. Build Errors
**Problem**: TypeScript or build errors  
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run build
```

#### 4. Hot Reload Not Working
**Problem**: Changes not reflecting in browser  
**Solution**:
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Restart dev server
- Check console for errors

### Debug Mode

Enable debug mode to see detailed logs:
```typescript
// src/config/api.ts
export const DEBUG = import.meta.env.DEV;

// Log all requests and responses in development
if (DEBUG) {
  axios.interceptors.request.use(req => {
    console.log('Request:', req);
    return req;
  });
  
  axios.interceptors.response.use(res => {
    console.log('Response:', res);
    return res;
  });
}
```

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [API Documentation](API_DOCUMENTATION.md)
- [Blockchain Integration](HYPERLEDGER_BLOCKCHAIN.md)
