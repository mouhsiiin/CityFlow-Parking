#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Cleanup the CityFlow Parking Hyperledger Fabric Network

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning up CityFlow Parking Network...${NC}"

# Stop and remove all containers
docker-compose down -v --remove-orphans

# Remove generated crypto materials
echo -e "${YELLOW}Removing crypto materials...${NC}"
rm -rf organizations/peerOrganizations
rm -rf organizations/ordererOrganizations
rm -rf organizations/fabric-ca/org1/msp
rm -rf organizations/fabric-ca/org1/tls-cert.pem
rm -rf organizations/fabric-ca/org1/ca-cert.pem
rm -rf organizations/fabric-ca/org1/IssuerPublicKey
rm -rf organizations/fabric-ca/org1/IssuerRevocationPublicKey
rm -rf organizations/fabric-ca/org1/fabric-ca-server.db
rm -rf organizations/fabric-ca/org2/msp
rm -rf organizations/fabric-ca/org2/tls-cert.pem
rm -rf organizations/fabric-ca/org2/ca-cert.pem
rm -rf organizations/fabric-ca/org2/IssuerPublicKey
rm -rf organizations/fabric-ca/org2/IssuerRevocationPublicKey
rm -rf organizations/fabric-ca/org2/fabric-ca-server.db
rm -rf organizations/fabric-ca/org3/msp
rm -rf organizations/fabric-ca/org3/tls-cert.pem
rm -rf organizations/fabric-ca/org3/ca-cert.pem
rm -rf organizations/fabric-ca/org3/IssuerPublicKey
rm -rf organizations/fabric-ca/org3/IssuerRevocationPublicKey
rm -rf organizations/fabric-ca/org3/fabric-ca-server.db
rm -rf organizations/fabric-ca/ordererOrg/msp
rm -rf organizations/fabric-ca/ordererOrg/tls-cert.pem
rm -rf organizations/fabric-ca/ordererOrg/ca-cert.pem
rm -rf organizations/fabric-ca/ordererOrg/IssuerPublicKey
rm -rf organizations/fabric-ca/ordererOrg/IssuerRevocationPublicKey
rm -rf organizations/fabric-ca/ordererOrg/fabric-ca-server.db

# Remove channel artifacts
echo -e "${YELLOW}Removing channel artifacts...${NC}"
rm -rf channel-artifacts/*
rm -rf system-genesis-block

# Remove chaincode packages
echo -e "${YELLOW}Removing chaincode packages...${NC}"
rm -rf ../chaincode/*/vendor
rm -f *.tar.gz

# Remove Docker volumes
echo -e "${YELLOW}Removing Docker volumes...${NC}"
docker volume prune -f

# Remove any leftover containers
echo -e "${YELLOW}Removing leftover containers...${NC}"
docker rm -f $(docker ps -aq --filter "label=service=hyperledger-fabric") 2>/dev/null || true

echo -e "${GREEN}Cleanup completed successfully!${NC}"
