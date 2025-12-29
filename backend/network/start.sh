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
mkdir -p organizations/fabric-ca/org1
mkdir -p organizations/fabric-ca/org2
mkdir -p organizations/fabric-ca/org3
mkdir -p organizations/fabric-ca/ordererOrg
mkdir -p channel-artifacts
mkdir -p peercfg

# Stop any existing containers
echo -e "\n${YELLOW}Stopping any existing containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Remove old artifacts
echo -e "\n${YELLOW}Cleaning up old artifacts...${NC}"
rm -rf organizations/peerOrganizations
rm -rf organizations/ordererOrganizations
rm -rf channel-artifacts/*
rm -rf system-genesis-block

# Start CA containers first
echo -e "\n${YELLOW}Starting Certificate Authorities...${NC}"
docker-compose up -d ca_org1 ca_org2 ca_org3 ca_orderer

# Wait for CAs to start properly
echo -e "\n${YELLOW}Waiting for CAs to start...${NC}"
sleep 10

# Check if CAs are ready
echo -e "\n${YELLOW}Checking CA health...${NC}"
for i in {1..30}; do
    if docker logs ca_org1 2>&1 | grep -q "Listening on"; then
        echo -e "${GREEN}CA Org1 is ready${NC}"
        break
    fi
    echo "Waiting for CA Org1... ($i/30)"
    sleep 2
done

# Generate crypto materials using the CA
echo -e "\n${YELLOW}Generating crypto materials...${NC}"
./scripts/registerEnroll.sh

# Generate genesis block and channel configuration
echo -e "\n${YELLOW}Generating channel artifacts...${NC}"
./scripts/createChannelTx.sh

# Start all containers
echo -e "\n${YELLOW}Starting all network containers...${NC}"
docker-compose up -d

# Wait for network to stabilize
echo -e "\n${YELLOW}Waiting for network to stabilize...${NC}"
sleep 10

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
echo -e "  - 3 Orderers (Raft consensus)"
echo -e "  - 3 Organizations with 5 Peers total"
echo -e "  - 5 CouchDB instances"
echo -e "  - 4 Channels (user, parking, charging, wallet)"
echo -e "  - 4 Chaincodes deployed"
echo -e "\n${YELLOW}Access points:${NC}"
echo -e "  - CouchDB Fauxton: http://localhost:5984/_utils (admin/adminpw)"
echo -e "  - Peer0 Org1: localhost:7051"
echo -e "  - Peer0 Org2: localhost:9051"
echo -e "  - Peer0 Org3: localhost:11051"
echo -e "  - Orderer: localhost:7050"
