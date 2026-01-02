#!/bin/bash
# CityFlow Parking - Stop Script
# This script stops the entire Hyperledger Fabric network and backend API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo "=========================================="
echo "CityFlow Parking - Stopping System"
echo "=========================================="

# ========================================
# Step 1: Stop Backend API
# ========================================
echo ""
echo "Step 1: Stopping Backend API..."

if [ -f "logs/api.pid" ]; then
    API_PID=$(cat logs/api.pid)
    if ps -p $API_PID > /dev/null 2>&1; then
        kill $API_PID
        print_status "Backend API stopped (PID: $API_PID)"
    else
        print_warning "Backend API process not found"
    fi
    rm -f logs/api.pid
else
    # Try to kill by process name
    pkill -f "bin/api" 2>/dev/null && print_status "Backend API stopped" || print_warning "No Backend API process found"
fi

# ========================================
# Step 2: Stop Docker Containers
# ========================================
echo ""
echo "Step 2: Stopping Hyperledger Fabric network..."

cd network

# Stop all containers
docker compose down --volumes --remove-orphans

# Remove chaincode containers
CHAINCODE_CONTAINERS=$(docker ps -aq --filter "name=dev-peer")
if [ ! -z "$CHAINCODE_CONTAINERS" ]; then
    docker rm -f $CHAINCODE_CONTAINERS
    print_status "Chaincode containers removed"
fi

# Remove chaincode images
CHAINCODE_IMAGES=$(docker images -q "dev-peer*")
if [ ! -z "$CHAINCODE_IMAGES" ]; then
    docker rmi -f $CHAINCODE_IMAGES
    print_status "Chaincode images removed"
fi

cd ..

print_status "Fabric network stopped"

# ========================================
# Step 3: Clean Up (Optional)
# ========================================
echo ""
read -p "Do you want to clean up generated artifacts? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up artifacts..."
    
    # Remove channel artifacts
    rm -f network/channel-artifacts/*.block
    rm -f network/channel-artifacts/*.tx
    rm -f network/*.pb network/*.json
    
    print_status "Channel artifacts cleaned"
    
    read -p "Do you also want to remove crypto materials? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf network/crypto-config
        print_warning "Crypto materials removed (you'll need to run ./install.sh again)"
    fi
fi

# ========================================
# System Stopped Successfully
# ========================================
echo ""
echo "=========================================="
print_status "CityFlow Parking System Stopped!"
echo "=========================================="
echo ""
echo "To start the system again, run: ./start.sh"
echo ""
