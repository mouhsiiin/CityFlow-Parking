# Hyperledger Fabric Blockchain Documentation

Complete guide for the Hyperledger Fabric blockchain network powering CityFlow Smart Parking & EV Charging System.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Network Components](#network-components)
- [Chaincode (Smart Contracts)](#chaincode-smart-contracts)
- [Channel Configuration](#channel-configuration)
- [Installation & Setup](#installation--setup)
- [Network Management](#network-management)
- [Chaincode Operations](#chaincode-operations)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

This project uses a **pure blockchain architecture** with **4 organizations** in a Hyperledger Fabric 2.5 network. All data is stored on-chain with no traditional databases.

### Organizations

1. **ParkingOperator**: Manages parking spots and bookings
   - Peer0: port 7051
   - Peer1: port 7151

2. **ChargingStation**: Manages EV charging stations and sessions
   - Peer0: port 8051
   - Peer1: port 8151

3. **UserService**: Manages users, authentication, and sessions
   - Peer0: port 9051
   - Peer1: port 9151

4. **CityManagement**: Municipal oversight and analytics
   - Peer0: port 10051
   - Peer1: port 10151

### Orderer
- **orderer.cityflow.com**: port 7050 (Raft consensus)

### Backend API
- **localhost**: port 8080

## Quick Start

### One-Command Setup

```bash
# Navigate to backend directory
cd backend

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

### Quick Health Check

```bash
# Check if all containers are running
docker ps

# Check API health
curl http://localhost:8080/health

# View backend logs
tail -f backend/logs/api.log
```

## Network Components

### Complete Network Topology

```
┌─────────────────────┬──────────────────────────────────┬──────┐
│ Component           │ Domain                           │ Port │
├─────────────────────┼──────────────────────────────────┼──────┤
│ Orderer             │ orderer.cityflow.com             │ 7050 │
│ ParkingOperator P0  │ peer0.parkingoperator.cityflow   │ 7051 │
│ ParkingOperator P1  │ peer1.parkingoperator.cityflow   │ 7151 │
│ ChargingStation P0  │ peer0.chargingstation.cityflow   │ 8051 │
│ ChargingStation P1  │ peer1.chargingstation.cityflow   │ 8151 │
│ UserService P0      │ peer0.userservice.cityflow       │ 9051 │
│ UserService P1      │ peer1.userservice.cityflow       │ 9151 │
│ CityManagement P0   │ peer0.citymanagement.cityflow    │10051 │
│ CityManagement P1   │ peer1.citymanagement.cityflow    │10151 │
│ Backend API         │ localhost                        │ 8080 │
└─────────────────────┴──────────────────────────────────┴──────┘
```

### Docker Containers

Expected running containers:
- `orderer.cityflow.com`
- `peer0.parkingoperator.cityflow.com`
- `peer1.parkingoperator.cityflow.com`
- `peer0.chargingstation.cityflow.com`
- `peer1.chargingstation.cityflow.com`
- `peer0.userservice.cityflow.com`
- `peer1.userservice.cityflow.com`
- `peer0.citymanagement.cityflow.com`
- `peer1.citymanagement.cityflow.com`
- `cli` (Command Line Interface container)

## Chaincode (Smart Contracts)

### 1. User Chaincode
**Channel**: `user-channel`  
**Path**: `backend/chaincode/user/`  
**Functions**:
- User registration and authentication
- Session management
- User profile management

### 2. Parking Chaincode
**Channel**: `parking-channel`  
**Path**: `backend/chaincode/parking/`  
**Functions**:
- Parking spot CRUD operations
- Booking lifecycle management (reserve, checkin, checkout, extend, cancel)
- Availability tracking

### 3. Charging Chaincode
**Channel**: `charging-channel`  
**Path**: `backend/chaincode/charging/`  
**Functions**:
- Charging station management
- Charging session lifecycle (start, update, stop, cancel)
- Energy consumption tracking

### 4. Wallet Chaincode
**Channel**: `wallet-channel`  
**Path**: `backend/chaincode/wallet/`  
**Functions**:
- Digital wallet creation and management
- Payment processing
- Transaction history
- Refund operations

## Channel Configuration

### Channels and Participants

| Channel | Participating Organizations |
|---------|----------------------------|
| `user-channel` | UserService, ParkingOperator, ChargingStation |
| `parking-channel` | ParkingOperator, UserService, CityManagement |
| `charging-channel` | ChargingStation, UserService, CityManagement |
| `wallet-channel` | All 4 Organizations |

### Channel Artifacts Location
```
backend/network/channel-artifacts/
├── user-channel.tx
├── parking-channel.tx
├── charging-channel.tx
└── wallet-channel.tx
```

## Installation & Setup

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- 8GB RAM minimum, 16GB recommended
- 50GB free disk space

### Step-by-Step Installation

#### 1. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### 2. Install Go 1.21+
```bash
# Download and install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version
```

#### 3. Install Hyperledger Fabric Binaries
```bash
cd backend

# Download Fabric binaries and Docker images (version 2.5.4)
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary docker

# Add binaries to PATH
export PATH=$PATH:$(pwd)/bin

# Verify installation
peer version
orderer version
```

#### 4. Generate Crypto Materials
```bash
cd network

# Generate certificates for all organizations
../bin/cryptogen generate --config=crypto-config.yaml --output=crypto-config

# Verify crypto materials were generated
ls -la crypto-config/
```

#### 5. Build Backend
```bash
cd ..

# Install Go dependencies
go mod download

# Build backend API
go build -o bin/api ./cmd/api
```

#### 6. Start Fabric Network
```bash
cd network

# Start all Docker containers
docker compose up -d

# Wait for containers to start
sleep 5

# Verify all containers are running
docker ps
```

#### 7. Create Channels
```bash
# Execute channel creation script from CLI container
docker exec cli bash -c "./scripts/createChannels.sh"

# Verify channels were created
docker exec cli peer channel list
```

#### 8. Deploy Chaincode
```bash
# Execute chaincode deployment script
docker exec cli bash -c "./scripts/deployChaincode.sh"

# Verify chaincode installation
docker exec cli peer lifecycle chaincode queryinstalled
```

#### 9. Start Backend API
```bash
cd ..

# Create logs directory
mkdir -p logs

# Start the API
./bin/api

# Or run in background:
nohup ./bin/api > logs/api.log 2>&1 &

# Check API health
curl http://localhost:8080/health
```

## Network Management

### Essential Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs peer0.userservice.cityflow.com
docker logs -f orderer.cityflow.com  # Follow logs

# Restart container
docker restart peer0.parkingoperator.cityflow.com

# Enter CLI container
docker exec -it cli bash

# Stop all containers
cd network && docker compose down

# Stop and remove volumes
docker compose down --volumes

# Remove chaincode containers
docker rm -f $(docker ps -aq --filter "name=dev-peer")

# Remove chaincode images
docker rmi -f $(docker images -q --filter "reference=dev-peer*")
```

### Network Lifecycle

#### Start Network
```bash
cd backend
./start.sh
```

#### Stop Network
```bash
cd backend
./stop.sh
```

#### Complete Cleanup
```bash
cd backend/network
./cleanup.sh
```

## Chaincode Operations

### Via CLI Container

#### List Channels
```bash
docker exec cli peer channel list
```

#### Query Installed Chaincode
```bash
docker exec cli peer lifecycle chaincode queryinstalled
```

#### Query Committed Chaincode
```bash
docker exec cli peer lifecycle chaincode querycommitted -C user-channel
```

#### Query Chaincode
```bash
docker exec cli peer chaincode query \
  -C user-channel \
  -n user \
  -c '{"function":"GetAllUsers","Args":[]}'
```

#### Invoke Chaincode
```bash
docker exec cli peer chaincode invoke \
  -o orderer.cityflow.com:7050 \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \
  -C user-channel \
  -n user \
  -c '{"function":"CreateUser","Args":["user123","John Doe","john@example.com"]}'
```

### Hot Reload Chaincode (Development)

#### For Charging Chaincode
```bash
cd backend/network
./hot-reload-charging.sh
```

This script:
1. Stops the existing chaincode container
2. Rebuilds the chaincode
3. Redeploys it without restarting the network

## Troubleshooting

### Common Issues

#### 1. Docker Permission Denied
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or log out and log back in
```

#### 2. Port Already in Use
```bash
# Find process using port
sudo lsof -i :7051

# Kill process
kill -9 <PID>
```

#### 3. Containers Won't Start
```bash
# Check Docker logs
docker logs peer0.userservice.cityflow.com

# Clean up and restart
cd network
docker compose down --volumes
docker system prune -f
cd ..
./start.sh
```

#### 4. Chaincode Errors
```bash
# Check CLI container logs
docker logs cli

# Manual deployment
docker exec -it cli bash
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
./scripts/deployChaincode.sh
```

#### 5. Crypto Materials Issues
```bash
# Regenerate crypto materials
cd backend/network
rm -rf crypto-config
../bin/cryptogen generate --config=crypto-config.yaml --output=crypto-config
cd ..
./start.sh
```

### Debug Mode

Enable detailed logging:
```bash
# Set environment variable
export FABRIC_LOGGING_SPEC=DEBUG

# View detailed logs
docker logs -f peer0.userservice.cityflow.com
```

### Network Health Check

```bash
# View all running containers
docker ps

# Check resource usage
docker stats

# View network
docker network ls
docker network inspect network_cityflow
```

### View Logs

```bash
# Backend API logs
tail -f backend/logs/api.log

# Orderer logs
docker logs -f orderer.cityflow.com

# Peer logs
docker logs -f peer0.parkingoperator.cityflow.com
```

## Configuration Files

### Key Configuration Files

1. **crypto-config.yaml**: Defines organization structure and generates crypto materials
   - Location: `backend/network/crypto-config.yaml`

2. **configtx.yaml**: Defines channel configuration and policies
   - Location: `backend/network/configtx.yaml`

3. **docker-compose.yaml**: Defines all Docker containers and network
   - Location: `backend/network/docker-compose.yaml`

4. **Environment Variables**: Backend configuration
   ```bash
   # Fabric Configuration
   FABRIC_MSP_ID=UserServiceMSP
   FABRIC_CERT_PATH=network/crypto-config/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp/signcerts/cert.pem
   FABRIC_KEY_PATH=network/crypto-config/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp/keystore/
   FABRIC_TLS_CERT_PATH=network/crypto-config/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt
   FABRIC_PEER_ENDPOINT=localhost:9051
   
   # Channel Names
   USER_CHANNEL=user-channel
   PARKING_CHANNEL=parking-channel
   CHARGING_CHANNEL=charging-channel
   WALLET_CHANNEL=wallet-channel
   
   # Chaincode Names
   USER_CHAINCODE=user
   PARKING_CHAINCODE=parking
   CHARGING_CHAINCODE=charging
   WALLET_CHAINCODE=wallet
   ```

## Project Structure

```
backend/
├── bin/                         # Fabric binaries
│   ├── cryptogen
│   ├── configtxgen
│   ├── peer
│   └── orderer
├── chaincode/                   # Smart contracts
│   ├── user/
│   ├── parking/
│   ├── charging/
│   └── wallet/
├── network/
│   ├── crypto-config.yaml      # Organization structure
│   ├── configtx.yaml           # Channel configuration
│   ├── docker-compose.yaml     # Network deployment
│   ├── crypto-config/          # Generated certificates
│   ├── channel-artifacts/      # Channel transaction files
│   └── scripts/
│       ├── createChannels.sh
│       └── deployChaincode.sh
├── cmd/api/                    # Backend API entry point
├── internal/
│   ├── api/handlers/          # REST API handlers
│   ├── fabric/                # Fabric Gateway client
│   └── config/                # Configuration management
├── install.sh                 # Installation script
├── start.sh                   # Start system
└── stop.sh                    # Stop system
```

## Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Samples](https://github.com/hyperledger/fabric-samples)
- [Fabric Gateway](https://hyperledger.github.io/fabric-gateway/)

## Version Information

- **Hyperledger Fabric**: 2.5.4
- **Go**: 1.21+
- **Docker**: Latest
- **Docker Compose**: Latest
