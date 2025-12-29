# CityFlow Parking Frontend

A modern React-based frontend for smart parking and EV charging management with blockchain integration.

## Features

### 🎯 Core Functionality
- **Smart Parking & EV Charging Spot Discovery**: Browse and filter available parking and charging spots in real-time
- **Reservation System**: Create, view, and manage reservations for parking and charging spots
- **Blockchain Integration**: All transactions recorded on blockchain with transaction ID tracking
- **Real-time Updates**: Live status updates for spots and reservations
- **Wallet Management**: Deposit, withdraw, and track all financial transactions

### 📱 Pages

#### 1. Login Page
- Secure authentication with email/password
- Session management with JWT tokens
- Clean, modern UI with gradient background

#### 2. Dashboard
- Overview of active and past reservations
- Quick statistics (active reservations, wallet balance, total reservations)
- Quick actions for common tasks
- Blockchain transaction ID display for each reservation
- "View on Blockchain" links for transparency

#### 3. Map Page
- Interactive map visualization of parking spots
- Real-time availability status
- Filter by type (Parking vs EV Charging)
- Toggle available-only spots
- Detailed spot information
- Quick reservation creation
- Cost calculation based on duration

#### 4. Wallet Page
- Current balance display
- Wallet address visibility
- Deposit and withdrawal functionality
- Complete transaction history
- Transaction statistics (deposits, spent, total)
- Blockchain transaction links for every transaction
- Transaction status tracking (pending, confirmed, failed)

### 🔗 Blockchain Integration

Every transaction displays:
- **Blockchain Transaction Hash**: Unique identifier for each transaction
- **"View on Blockchain" Button**: Direct link to blockchain explorer
- **Transaction Status**: Real-time status (pending, confirmed, failed)
- **Transparency**: Full visibility into on-chain transactions

### 🛠️ Technology Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running Go backend API

### Steps

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8080/api
# VITE_BLOCKCHAIN_EXPLORER_URL=https://etherscan.io/tx  # Removed - not compatible with Hyperledger Fabric
```

3. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Integration

The frontend integrates with Go Backend APIs for all operations:

### Required Endpoints
- Authentication: `/api/auth/login`, `/api/auth/register`
- Spots: `/api/spots`, `/api/spots/available`
- Reservations: `/api/reservations`, `/api/reservations/user`
- Wallet: `/api/wallet`, `/api/wallet/transactions`
- Blockchain: `/api/blockchain/verify/:hash`

All responses should include `blockchainTxHash` for transaction tracking.

## Building for Production

```bash
npm run build
npm run preview  # Preview production build
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
