# CityFlow Smart Parking & EV Charging Backend

A 100% blockchain-based smart parking and EV charging management system built with Hyperledger Fabric 2.5 and Go.

## 🏗️ Network Architecture

This project uses a **pure blockchain architecture** with **4 organizations** in a Hyperledger Fabric network. All data is stored on-chain with no traditional databases.

### Organizations
- **ParkingOperator**: Manages parking spots and bookings (peers: 7051, 7151)
- **ChargingStation**: Manages EV charging stations and sessions (peers: 8051, 8151)
- **UserService**: Manages users, authentication, and sessions (peers: 9051, 9151)
- **CityManagement**: Municipal oversight and analytics (peers: 10051, 10151)

### Channels
- `user-channel`: User management and authentication (UserService, ParkingOperator, ChargingStation)
- `parking-channel`: Parking spot and booking management (ParkingOperator, UserService, CityManagement)
- `charging-channel`: EV charging station and session management (ChargingStation, UserService, CityManagement)
- `wallet-channel`: Digital wallet and payment transactions (All 4 Organizations)

### Smart Contracts (Chaincode)
1. **User Chaincode**: User registration, authentication, session management
2. **Parking Chaincode**: Parking spot CRUD, booking lifecycle
3. **Charging Chaincode**: Charging station management, charging sessions
4. **Wallet Chaincode**: Digital wallet, payments, refunds, transaction history

## 📁 Project Structure

```
backend/
├── chaincode/                    # Smart contracts (Go)
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
│   ├── crypto-config.yaml      # Organization structure
│   ├── configtx.yaml           # Channel configuration
│   ├── docker-compose.yaml     # Network deployment
│   ├── scripts/                # Deployment scripts
│   │   ├── createChannels.sh
│   │   └── deployChaincode.sh
│   └── cleanup.sh              # Complete cleanup
├── install.sh                  # One-click installation
├── start.sh                    # Start entire system
├── stop.sh                     # Stop system
├── SETUP_GUIDE.md              # Detailed setup guide
├── QUICK_REFERENCE.md          # Quick command reference
└── Makefile                    # Build & deployment commands
```

## 🚀 Quick Start

### One-Command Setup

```bash
# Make scripts executable
chmod +x install.sh start.sh stop.sh

# Install everything (Docker, Go, Fabric, dependencies)
./install.sh

# Start the entire system (network + channels + chaincode + API)
./start.sh

# Access the system
# Backend API: http://localhost:8080
# View logs: tail -f logs/api.log

# Stop the system
./stop.sh
```

### Manual Setup (Step by Step)

#### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- 8GB RAM minimum, 16GB recommended
- 50GB free disk space

#### Installation Steps

```bash
# 1. Install prerequisites
sudo apt-get update -y
sudo apt-get install -y curl wget git build-essential jq

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Install Go 1.21+
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# 4. Install Fabric binaries
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary docker

# 5. Generate crypto materials
cd network
../bin/cryptogen generate --config=crypto-config.yaml --output=crypto-config
cd ..

# 6. Build backend
go build -o bin/api ./cmd/api

# 7. Start network
cd network
docker compose up -d
cd ..

# 8. Create channels and deploy chaincode
docker exec cli bash -c "./scripts/createChannels.sh"
docker exec cli bash -c "./scripts/deployChaincode.sh"

# 9. Start API
./bin/api
```

For detailed instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: Comprehensive setup and configuration guide
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**: Quick command reference
- **[API_CONTRACT.md](../frontend/API_CONTRACT.md)**: API endpoint documentation

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