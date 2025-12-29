#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Register and enroll identities using Fabric CA

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Registering and enrolling identities...${NC}"

# Set fabric-ca-client home
export FABRIC_CA_CLIENT_HOME=${PWD}/organizations

# ==================== Org1 (ParkingOperator) ====================
echo -e "${GREEN}Creating Org1 identities...${NC}"

mkdir -p organizations/peerOrganizations/org1.example.com

export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org1.example.com

# Enroll CA admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-org1 --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Register peer0
fabric-ca-client register --caname ca-org1 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Register peer1
fabric-ca-client register --caname ca-org1 --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Register user
fabric-ca-client register --caname ca-org1 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Register admin
fabric-ca-client register --caname ca-org1 --id.name org1admin --id.secret org1adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Generate peer0 MSP
fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-org1 -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp" --csr.hosts peer0.org1.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Generate peer1 MSP
fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-org1 -M "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp" --csr.hosts peer1.org1.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Generate user MSP
fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-org1 -M "${PWD}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# Generate admin MSP
fabric-ca-client enroll -u https://org1admin:org1adminpw@localhost:7054 --caname ca-org1 -M "${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org1/ca-cert.pem"

# ==================== Org2 (ChargingStation) ====================
echo -e "${GREEN}Creating Org2 identities...${NC}"

mkdir -p organizations/peerOrganizations/org2.example.com

export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org2.example.com

# Enroll CA admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-org2 --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Register peer0
fabric-ca-client register --caname ca-org2 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Register peer1
fabric-ca-client register --caname ca-org2 --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Register user
fabric-ca-client register --caname ca-org2 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Register admin
fabric-ca-client register --caname ca-org2 --id.name org2admin --id.secret org2adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Generate peer0 MSP
fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-org2 -M "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp" --csr.hosts peer0.org2.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Generate peer1 MSP
fabric-ca-client enroll -u https://peer1:peer1pw@localhost:8054 --caname ca-org2 -M "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/msp" --csr.hosts peer1.org2.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Generate user MSP
fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-org2 -M "${PWD}/organizations/peerOrganizations/org2.example.com/users/User1@org2.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# Generate admin MSP
fabric-ca-client enroll -u https://org2admin:org2adminpw@localhost:8054 --caname ca-org2 -M "${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org2/ca-cert.pem"

# ==================== Org3 (UserService) ====================
echo -e "${GREEN}Creating Org3 identities...${NC}"

mkdir -p organizations/peerOrganizations/org3.example.com

export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/org3.example.com

# Enroll CA admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-org3 --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Register peer0
fabric-ca-client register --caname ca-org3 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Register user
fabric-ca-client register --caname ca-org3 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Register admin
fabric-ca-client register --caname ca-org3 --id.name org3admin --id.secret org3adminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Generate peer0 MSP
fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-org3 -M "${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/msp" --csr.hosts peer0.org3.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Generate user MSP
fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-org3 -M "${PWD}/organizations/peerOrganizations/org3.example.com/users/User1@org3.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# Generate admin MSP
fabric-ca-client enroll -u https://org3admin:org3adminpw@localhost:11054 --caname ca-org3 -M "${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/org3/ca-cert.pem"

# ==================== Orderer Org ====================
echo -e "${GREEN}Creating Orderer identities...${NC}"

mkdir -p organizations/ordererOrganizations/example.com

export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

# Enroll CA admin
fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

# Register orderers
fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
fabric-ca-client register --caname ca-orderer --id.name orderer2 --id.secret orderer2pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
fabric-ca-client register --caname ca-orderer --id.name orderer3 --id.secret orderer3pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

# Register admin
fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

# Generate orderer MSPs
fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp" --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

fabric-ca-client enroll -u https://orderer2:orderer2pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer2.example.com/msp" --csr.hosts orderer2.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

fabric-ca-client enroll -u https://orderer3:orderer3pw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer3.example.com/msp" --csr.hosts orderer3.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

# Generate admin MSP
fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

echo -e "${GREEN}Identity registration and enrollment completed!${NC}"
