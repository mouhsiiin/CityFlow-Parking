# CityFlow Smart Parking & EV Charging Backend

A 100% blockchain-based smart parking and EV charging management system built with Hyperledger Fabric and Go.

## 🏗️ Architecture

This project uses a **pure blockchain architecture** - no traditional databases (Redis, PostgreSQL, MongoDB). All data, including user sessions, is stored on Hyperledger Fabric.

### Organizations
- **ParkingOperator (Org1)**: Manages parking spots and bookings
- **ChargingStation (Org2)**: Manages EV charging stations and sessions
- **UserService (Org3)**: Manages users, authentication, and wallets

### Channels
- `user-channel`: User management and authentication
- `parking-channel`: Parking spot and booking management
- `charging-channel`: EV charging station and session management
- `wallet-channel`: Digital wallet and payment transactions

### Smart Contracts (Chaincode)
1. **User Chaincode**: User registration, authentication, session management
2. **Parking Chaincode**: Parking spot CRUD, booking lifecycle
3. **Charging Chaincode**: Charging station management, charging sessions
4. **Wallet Chaincode**: Digital wallet, payments, refunds, transaction history

## 📁 Project Structure

```
├── chaincode/                    # Smart contracts
│   ├── user/contract/           # User & session management
│   ├── parking/contract/        # Parking spots & bookings
│   ├── charging/contract/       # Charging stations & sessions
│   └── wallet/contract/         # Wallets & payments
├── cmd/api/                     # API entry point
├── internal/
│   ├── api/
│   │   ├── handlers/           # REST API handlers
│   │   ├── middleware/         # Auth middleware
│   │   └── server.go           # Gin router setup
│   ├── config/                 # Configuration management
│   └── fabric/                 # Fabric Gateway client
├── network/
│   ├── configtx.yaml           # Channel configuration
│   ├── docker-compose.yaml     # Network deployment
│   └── scripts/                # Deployment scripts
└── Makefile                    # Build & deployment commands
```

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Docker & Docker Compose
- Hyperledger Fabric 2.5+
- Fabric binaries in PATH

### 1. Start the Fabric Network

```bash
# Clean any previous network
make network-clean

# Start the network (CAs, peers, orderers)
make network-up

# Create channels
cd network/scripts && ./createChannels.sh

# Deploy chaincode
./deployChaincode.sh
```

### 2. Run the REST API

```bash
# Build the API
make build

# Run the API
make run
```

The API will be available at `http://localhost:8080`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get session |
| POST | `/api/auth/logout` | Logout and invalidate session |

### Users (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user profile |

### Parking (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking/spots` | List available parking spots |
| GET | `/api/parking/spots/:id` | Get parking spot details |
| POST | `/api/parking/spots` | Create parking spot (admin) |
| PUT | `/api/parking/spots/:id` | Update parking spot (admin) |
| POST | `/api/parking/bookings` | Create booking |
| GET | `/api/parking/bookings/:id` | Get booking details |
| POST | `/api/parking/bookings/:id/checkin` | Check in to parking |
| POST | `/api/parking/bookings/:id/checkout` | Check out from parking |
| POST | `/api/parking/bookings/:id/cancel` | Cancel booking |

### Charging (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charging/stations` | List charging stations |
| GET | `/api/charging/stations/:id` | Get station details |
| POST | `/api/charging/stations` | Create station (admin) |
| PUT | `/api/charging/stations/:id` | Update station (admin) |
| POST | `/api/charging/sessions` | Start charging session |
| GET | `/api/charging/sessions/:id` | Get session details |
| POST | `/api/charging/sessions/:id/stop` | Stop charging session |

### Wallet (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/topup` | Add funds to wallet |
| GET | `/api/wallet/transactions` | Get transaction history |

## 🔧 Configuration

Environment variables:
```bash
# Server
SERVER_PORT=8080

# Fabric
FABRIC_MSP_ID=Org1MSP
FABRIC_CRYPTO_PATH=/path/to/crypto-config
FABRIC_CERT_PATH=/path/to/cert.pem
FABRIC_KEY_PATH=/path/to/key.pem
FABRIC_TLS_CERT_PATH=/path/to/tls-cert.pem
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_GATEWAY_PEER=peer0.org1.example.com
```

## 🧪 Development

```bash
# Run tests
make test

# Run linter
make lint

# Build chaincode packages
make chaincode-build

# Format code
go fmt ./...
```

## 🐳 Docker Network Components

| Component | Port | Description |
|-----------|------|-------------|
| peer0.parkingoperator | 7051 | Parking Operator peer |
| peer1.parkingoperator | 8051 | Parking Operator peer 2 |
| peer0.chargingstation | 9051 | Charging Station peer |
| peer1.chargingstation | 10051 | Charging Station peer 2 |
| peer0.userservice | 11051 | User Service peer |
| peer1.userservice | 12051 | User Service peer 2 |
| orderer.example.com | 7050 | Raft orderer |
| orderer2.example.com | 8050 | Raft orderer 2 |
| orderer3.example.com | 9050 | Raft orderer 3 |
| ca-parkingoperator | 7054 | Parking Operator CA |
| ca-chargingstation | 8054 | Charging Station CA |
| ca-userservice | 9054 | User Service CA |

## 📜 License

MIT License