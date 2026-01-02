# 🚗 CityFlow Parking - Hyperledger Fabric Network Setup

Complete setup guide for the CityFlow Parking Hyperledger Fabric blockchain network with 4 organizations.

## 📋 Network Architecture

### Organizations
| Organization | Domain | MSP ID | Purpose | Peers |
|--------------|--------|--------|---------|-------|
| **ParkingOperator** | parkingoperator.cityflow.com | ParkingOperatorMSP | Manages parking spots & bookings | peer0:7051, peer1:7151 |
| **ChargingStation** | chargingstation.cityflow.com | ChargingStationMSP | Manages EV charging stations | peer0:8051, peer1:8151 |
| **UserService** | userservice.cityflow.com | UserServiceMSP | Manages users & authentication | peer0:9051, peer1:9151 |
| **CityManagement** | citymanagement.cityflow.com | CityManagementMSP | Municipal oversight & analytics | peer0:10051, peer1:10151 |

### Channels
- **user-channel**: UserService, ParkingOperator, ChargingStation
- **parking-channel**: ParkingOperator, UserService, CityManagement
- **charging-channel**: ChargingStation, UserService, CityManagement
- **wallet-channel**: All 4 organizations

### Chaincodes
- **user**: User management and authentication
- **parking**: Parking spots and booking management
- **charging**: EV charging station and session management
- **wallet**: Payment and wallet management

## 🚀 Quick Start

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- 8GB RAM minimum, 16GB recommended
- 50GB free disk space
- Internet connection for downloading dependencies

### One-Command Installation

```bash
# Make scripts executable
chmod +x install.sh start.sh stop.sh

# Install everything (Docker, Node.js, Go, Fabric binaries)
./install.sh

# Start the entire system
./start.sh

# Stop the system
./stop.sh
```

## 📖 Detailed Setup Instructions

### Step 1: System Preparation

```bash
# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install prerequisites
sudo apt-get install -y curl wget git build-essential jq
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker compose version

# IMPORTANT: Log out and log back in, or run:
newgrp docker
```

### Step 3: Install Node.js 18 LTS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

### Step 4: Install Go 1.21+

```bash
# Download and install Go
GO_VERSION="1.21.5"
wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
rm go${GO_VERSION}.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
go version  # Should show go1.21.5
```

### Step 5: Install Hyperledger Fabric Binaries

```bash
cd backend

# Download Fabric binaries and Docker images (version 2.5.4)
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary docker

# Add binaries to PATH
export PATH=$PWD/bin:$PATH
export FABRIC_CFG_PATH=$PWD/network

# Verify installation
./bin/cryptogen version
./bin/configtxgen -version
./bin/peer version
```

### Step 6: Generate Crypto Materials

```bash
cd network

# Generate certificates for all organizations
../bin/cryptogen generate --config=./crypto-config.yaml --output=crypto-config

# Verify crypto materials were generated
ls -la crypto-config/peerOrganizations/
ls -la crypto-config/ordererOrganizations/

cd ..
```

### Step 7: Install Dependencies

```bash
# Install chaincode dependencies
cd chaincode/user && go mod download && cd ../..
cd chaincode/parking && go mod download && cd ../..
cd chaincode/charging && go mod download && cd ../..
cd chaincode/wallet && go mod download && cd ../..

# Install backend dependencies
go mod download
go mod tidy

# Build backend API
go build -o bin/api ./cmd/api
```

### Step 8: Start the Network

```bash
# Start Fabric network
cd network
docker compose up -d

# Wait for containers to start
sleep 10

# Verify all containers are running
docker ps

# Expected containers:
# - orderer.cityflow.com
# - peer0.parkingoperator.cityflow.com
# - peer1.parkingoperator.cityflow.com
# - peer0.chargingstation.cityflow.com
# - peer1.chargingstation.cityflow.com
# - peer0.userservice.cityflow.com
# - peer1.userservice.cityflow.com
# - peer0.citymanagement.cityflow.com
# - peer1.citymanagement.cityflow.com
# - cli

cd ..
```

### Step 9: Create Channels

```bash
# Execute channel creation script
docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer
    ./scripts/createChannels.sh
"

# Verify channels were created
docker exec cli peer channel list
```

### Step 10: Deploy Chaincode

```bash
# Execute chaincode deployment script
docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer
    ./scripts/deployChaincode.sh
"

# Verify chaincode installation
docker exec cli peer lifecycle chaincode queryinstalled
docker exec cli peer lifecycle chaincode querycommitted -C user-channel
docker exec cli peer lifecycle chaincode querycommitted -C parking-channel
docker exec cli peer lifecycle chaincode querycommitted -C charging-channel
docker exec cli peer lifecycle chaincode querycommitted -C wallet-channel
```

### Step 11: Start Backend API

```bash
# Create logs directory
mkdir -p logs

# Start the API
./bin/api

# Or run in background:
nohup ./bin/api > logs/api.log 2>&1 &

# Check API health
curl http://localhost:8080/health
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Fabric Configuration
FABRIC_ORG=userservice
FABRIC_MSP_ID=UserServiceMSP
FABRIC_PEER_ENDPOINT=localhost:9051
FABRIC_GATEWAY_PEER=peer0.userservice.cityflow.com

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

# Server Configuration
PORT=8080
JWT_SECRET=your-secure-secret-key-change-in-production

# Log Level
LOG_LEVEL=info
```

### Using Different Organizations

To connect to a different organization, update the environment variables:

**For ParkingOperator:**
```bash
export FABRIC_ORG=parkingoperator
export FABRIC_MSP_ID=ParkingOperatorMSP
export FABRIC_PEER_ENDPOINT=localhost:7051
export FABRIC_GATEWAY_PEER=peer0.parkingoperator.cityflow.com
```

**For ChargingStation:**
```bash
export FABRIC_ORG=chargingstation
export FABRIC_MSP_ID=ChargingStationMSP
export FABRIC_PEER_ENDPOINT=localhost:8051
export FABRIC_GATEWAY_PEER=peer0.chargingstation.cityflow.com
```

## 🛠️ Useful Commands

### Docker Management

```bash
# View all containers
docker ps -a

# View container logs
docker logs peer0.userservice.cityflow.com
docker logs orderer.cityflow.com

# Follow logs in real-time
docker logs -f peer0.parkingoperator.cityflow.com

# Restart a specific container
docker restart peer0.userservice.cityflow.com

# Enter CLI container
docker exec -it cli bash
```

### Channel Operations

```bash
# List joined channels
docker exec cli peer channel list

# Get channel info
docker exec cli peer channel getinfo -c user-channel

# Fetch channel config
docker exec cli peer channel fetch config -c user-channel
```

### Chaincode Operations

```bash
# Query installed chaincode
docker exec cli peer lifecycle chaincode queryinstalled

# Query committed chaincode
docker exec cli peer lifecycle chaincode querycommitted -C user-channel

# Query chaincode (example)
docker exec cli peer chaincode query -C user-channel -n user -c '{"function":"GetAllUsers","Args":[]}'

# Invoke chaincode (example)
docker exec cli peer chaincode invoke -o orderer.cityflow.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \
    -C user-channel -n user \
    -c '{"function":"CreateUser","Args":["user123","John Doe","john@example.com"]}'
```

### Network Management

```bash
# Stop network
cd network
docker compose down

# Stop network and remove volumes
docker compose down --volumes

# Remove chaincode containers
docker rm -f $(docker ps -aq --filter "name=dev-peer")

# Remove chaincode images
docker rmi -f $(docker images -q "dev-peer*")

# Clean everything (use with caution!)
docker compose down --volumes --remove-orphans
docker system prune -a --volumes
```

## 🧪 Testing the Network

### Test User Chaincode

```bash
# Create a user
docker exec cli peer chaincode invoke -o orderer.cityflow.com:7050 \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \
    -C user-channel -n user \
    -c '{"function":"CreateUser","Args":["USR001","Alice Johnson","alice@example.com","password123"]}'

# Query all users
docker exec cli peer chaincode query -C user-channel -n user \
    -c '{"function":"GetAllUsers","Args":[]}'
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# API endpoints (once implemented)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

## 🔍 Troubleshooting

### Common Issues

**1. Docker permission denied**
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or log out and log back in
```

**2. Containers won't start**
```bash
# Check Docker logs
docker logs <container-name>

# Clean up and restart
docker compose down --volumes
docker system prune -f
./start.sh
```

**3. Port already in use**
```bash
# Find process using port
sudo lsof -i :7051
sudo lsof -i :8080

# Kill process
kill -9 <PID>
```

**4. Chaincode deployment fails**
```bash
# Check CLI container logs
docker logs cli

# Manual deployment
docker exec -it cli bash
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
./scripts/deployChaincode.sh
```

**5. Crypto materials not found**
```bash
# Regenerate crypto materials
cd network
rm -rf crypto-config
../bin/cryptogen generate --config=./crypto-config.yaml --output=crypto-config
```

### Debug Mode

Enable verbose logging:

```bash
# Set environment variable
export FABRIC_LOGGING_SPEC=DEBUG

# View detailed logs
docker logs -f peer0.userservice.cityflow.com
```

## 📊 Monitoring

### Check Network Health

```bash
# View all running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check resource usage
docker stats

# View network
docker network inspect cityflow_network
```

### View Logs

```bash
# Backend API logs
tail -f logs/api.log

# Orderer logs
docker logs -f orderer.cityflow.com

# Peer logs
docker logs -f peer0.userservice.cityflow.com
```

## 🔒 Security Notes

- **Change JWT Secret**: Update `JWT_SECRET` in production
- **TLS Enabled**: All peer-to-peer communication uses TLS
- **Private Keys**: Never commit crypto materials to version control
- **Admin Access**: Use separate admin identities for production
- **Firewall**: Configure firewall rules for production deployment

## 📚 Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Gateway SDK](https://hyperledger.github.io/fabric-gateway/)
- [Docker Documentation](https://docs.docker.com/)
- [Go Documentation](https://go.dev/doc/)

## 🤝 Support

For issues and questions:
- Check logs: `docker logs <container-name>`
- Review configuration files
- Verify crypto materials exist
- Ensure all ports are available

## 📝 Version Information

- Hyperledger Fabric: 2.5.4
- Fabric CA: 1.5.7
- Go: 1.21+
- Node.js: 18 LTS
- Docker: 20.10+
- Docker Compose: v2.23.0+
