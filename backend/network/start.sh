#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Start the CityFlow Parking Hyperledger Fabric Network

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CityFlow Parking - Network Startup   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed!${NC}"

# Create directories if they don't exist
echo -e "\n${YELLOW}Creating required directories...${NC}"
mkdir -p channel-artifacts
mkdir -p crypto-config

# Stop any existing containers
echo -e "\n${YELLOW}Stopping any existing containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Check if crypto materials exist
if [ ! -d "crypto-config/peerOrganizations" ] || [ ! -d "crypto-config/ordererOrganizations" ]; then
    echo -e "\n${YELLOW}Generating crypto materials...${NC}"
    ../bin/cryptogen generate --config=./crypto-config.yaml
    
    # Create symlinks for configtxgen to find the certificates
    echo -e "\n${YELLOW}Setting up crypto material symlinks...${NC}"
    mkdir -p /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto
    ln -sf $(pwd)/crypto-config/peerOrganizations /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations 2>/dev/null || true
    ln -sf $(pwd)/crypto-config/ordererOrganizations /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations 2>/dev/null || true
fi

# Generate channel artifacts if they don't exist
if [ ! -f "channel-artifacts/user-channel.block" ]; then
    echo -e "\n${YELLOW}Generating channel artifacts...${NC}"
    
    # Set environment variables for configtxgen
    export FABRIC_CFG_PATH=${PWD}
    
    # Generate channel creation transactions
    ../bin/configtxgen -profile UserChannel -outputCreateChannelTx ./channel-artifacts/user-channel.tx -channelID user-channel
    ../bin/configtxgen -profile ParkingChannel -outputCreateChannelTx ./channel-artifacts/parking-channel.tx -channelID parking-channel
    ../bin/configtxgen -profile ChargingChannel -outputCreateChannelTx ./channel-artifacts/charging-channel.tx -channelID charging-channel
    ../bin/configtxgen -profile WalletChannel -outputCreateChannelTx ./channel-artifacts/wallet-channel.tx -channelID wallet-channel
fi

# Start all containers
echo -e "\n${YELLOW}Starting all network containers...${NC}"
docker-compose up -d

# Wait for network to stabilize
echo -e "\n${YELLOW}Waiting for network to stabilize...${NC}"
sleep 15

# Create channels
echo -e "\n${YELLOW}Creating channels...${NC}"
./scripts/createChannels.sh

# Deploy chaincodes
echo -e "\n${YELLOW}Deploying chaincodes...${NC}"
./scripts/deployChaincode.sh user user-channel
./scripts/deployChaincode.sh parking parking-channel
./scripts/deployChaincode.sh charging charging-channel
./scripts/deployChaincode.sh wallet wallet-channel

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Network started successfully!         ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Network components:${NC}"
echo -e "  - 1 Orderer"
echo -e "  - 4 Organizations with 4 Peers"
echo -e "  - 4 Channels (user, parking, charging, wallet)"
echo -e "  - 4 Chaincodes deployed"
echo -e "\n${YELLOW}Access points:${NC}"
echo -e "  - Peer0 ParkingOperator: localhost:7051"
echo -e "  - Peer0 ChargingStation: localhost:9051"
echo -e "  - Peer0 UserService: localhost:11051"
echo -e "  - Peer0 CityManagement: localhost:13051"
echo -e "  - Orderer: localhost:7050"
