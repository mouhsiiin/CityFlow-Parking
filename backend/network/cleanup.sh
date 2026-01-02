#!/bin/bash
# CityFlow Parking - Cleanup Script
# This script performs a complete cleanup of the Fabric network

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "=========================================="
echo "CityFlow Parking - Complete Cleanup"
echo "=========================================="
echo ""
print_warning "This will remove:"
echo "  - All Docker containers and volumes"
echo "  - Chaincode containers and images"
echo "  - Channel artifacts"
echo "  - Crypto materials"
echo "  - API logs and PID files"
echo ""
read -p "Are you sure you want to continue? (yes/NO): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "Starting cleanup..."

# Stop backend API
if [ -f "logs/api.pid" ]; then
    API_PID=$(cat logs/api.pid)
    kill $API_PID 2>/dev/null || true
    rm -f logs/api.pid
fi
pkill -f "bin/api" 2>/dev/null || true
print_status "Backend API stopped"

# Stop Docker containers
cd network
docker compose down --volumes --remove-orphans 2>/dev/null || true
print_status "Docker containers stopped"

# Remove chaincode containers
CHAINCODE_CONTAINERS=$(docker ps -aq --filter "name=dev-peer")
if [ ! -z "$CHAINCODE_CONTAINERS" ]; then
    docker rm -f $CHAINCODE_CONTAINERS 2>/dev/null || true
    print_status "Chaincode containers removed"
fi

# Remove chaincode images
CHAINCODE_IMAGES=$(docker images -q "dev-peer*")
if [ ! -z "$CHAINCODE_IMAGES" ]; then
    docker rmi -f $CHAINCODE_IMAGES 2>/dev/null || true
    print_status "Chaincode images removed"
fi

cd ..

# Remove crypto materials
rm -rf network/crypto-config
print_status "Crypto materials removed"

# Remove channel artifacts
rm -rf network/channel-artifacts
mkdir -p network/channel-artifacts
print_status "Channel artifacts removed"

# Remove build artifacts
rm -f network/*.pb network/*.json
print_status "Build artifacts removed"

# Remove logs
rm -rf logs
mkdir -p logs
print_status "Logs removed"

# Optional: Remove Fabric binaries
read -p "Do you also want to remove Fabric binaries? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf bin config
    print_status "Fabric binaries removed"
    print_warning "You'll need to run ./install.sh to reinstall"
fi

echo ""
echo "=========================================="
print_status "Cleanup completed!"
echo "=========================================="
echo ""
echo "To set up the system again:"
echo "  1. Run: ./install.sh"
echo "  2. Run: ./start.sh"
echo ""
