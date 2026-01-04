#!/bin/bash
# CityFlow Parking - Start Script
# This script starts the entire Hyperledger Fabric network and backend API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo "=========================================="
echo "CityFlow Parking - Starting System"
echo "=========================================="

# Set environment variables
export PATH=$PWD/bin:$PATH
export FABRIC_CFG_PATH=$PWD/network

# ========================================
# Step 1: Check Prerequisites
# ========================================
echo ""
echo "Step 1: Checking prerequisites..."

# Check if crypto materials exist
if [ ! -d "network/crypto-config" ]; then
    print_error "Crypto materials not found. Please run ./install.sh first"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first"
    exit 1
fi

print_status "Prerequisites check passed"

# ========================================
# Step 2: Clean Previous Network
# ========================================
echo ""
echo "Step 2: Cleaning previous network (if any)..."

cd network

# Stop any running containers
docker compose down --volumes --remove-orphans 2>/dev/null || true

# Remove chaincode containers and images
docker rm -f $(docker ps -aq --filter "name=dev-peer") 2>/dev/null || true
docker rmi -f $(docker images -q "dev-peer*") 2>/dev/null || true

# Clean channel artifacts (keep crypto-config)
rm -f channel-artifacts/*.block
rm -f channel-artifacts/*.tx
rm -f *.pb *.json

print_status "Previous network cleaned"

cd ..

# ========================================
# Step 3: Start Fabric Network
# ========================================
echo ""
echo "Step 3: Starting Hyperledger Fabric network..."

cd network
docker compose up -d

# Wait for containers to start
echo "Waiting for containers to initialize..."
sleep 10

# Check if all containers are running
RUNNING_CONTAINERS=$(docker ps --filter "name=peer*" --filter "name=orderer*" --format "{{.Names}}" | wc -l)
EXPECTED_CONTAINERS=5  # 1 orderer + 4 peer0 containers
if [ $RUNNING_CONTAINERS -lt $EXPECTED_CONTAINERS ]; then
    print_error "Not all containers started successfully (Expected: $EXPECTED_CONTAINERS, Running: $RUNNING_CONTAINERS)"
    docker ps -a
    exit 1
fi

print_status "Fabric network started successfully"
docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=peer*" --filter "name=orderer*"

cd ..

# ========================================
# Step 4: Create Channels
# ========================================
echo ""
echo "Step 4: Creating and joining channels..."

docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer
    ./scripts/createChannels.sh
"

if [ $? -eq 0 ]; then
    print_status "Channels created and joined successfully"
else
    print_error "Failed to create channels"
    exit 1
fi

# ========================================
# Step 5: Deploy Chaincode
# ========================================
echo ""
echo "Step 5: Deploying chaincode..."

docker exec cli bash -c "
    export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer
    ./scripts/deployChaincode.sh
"

if [ $? -eq 0 ]; then
    print_status "Chaincode deployed successfully"
else
    print_error "Failed to deploy chaincode"
    exit 1
fi

# ========================================
# Step 6: Start Backend API
# ========================================
echo ""
echo "Step 6: Starting Backend API..."

# Build the API if it doesn't exist or is outdated
if [ ! -f "build/cityflow-api" ] || [ "cmd/api/main.go" -nt "build/cityflow-api" ]; then
    print_info "Building API..."
    make build
fi

# Kill any existing API process
pkill -f "cityflow-api" 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Start the API in the background
nohup ./build/cityflow-api > logs/api.log 2>&1 &
API_PID=$!

# Wait a moment and check if it's still running
sleep 3

if ps -p $API_PID > /dev/null; then
    print_status "Backend API started successfully (PID: $API_PID)"
    echo $API_PID > logs/api.pid
else
    print_error "Backend API failed to start"
    cat logs/api.log
    exit 1
fi

# ========================================
# System Started Successfully
# ========================================
echo ""
echo "=========================================="
print_status "CityFlow Parking System Started!"
echo "=========================================="
echo ""
print_info "Network Status:"
echo "  Orderer:              http://localhost:7050"
echo "  ParkingOperator:      http://localhost:7051"
echo "  ChargingStation:      http://localhost:8051"
echo "  UserService:          http://localhost:9051"
echo "  CityManagement:       http://localhost:10051"
echo ""
print_info "Backend API:"
echo "  URL:                  http://localhost:8080"
echo "  Health Check:         http://localhost:8080/health"
echo "  Logs:                 tail -f logs/api.log"
echo ""
print_info "Useful Commands:"
echo "  View logs:            tail -f logs/api.log"
echo "  Check containers:     docker ps"
echo "  Check channels:       docker exec cli peer channel list"
echo "  Stop system:          ./stop.sh"
echo ""
print_info "Channels Created:"
echo "  - user-channel"
echo "  - parking-channel"
echo "  - charging-channel"
echo "  - wallet-channel"
echo ""
print_warning "Note: Frontend needs to be started separately from the frontend directory"
echo ""
