#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Deploy chaincode to a channel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CHAINCODE_NAME=$1
CHANNEL_NAME=$2
CHAINCODE_VERSION=${3:-1.0}
SEQUENCE=${4:-1}

if [ -z "$CHAINCODE_NAME" ] || [ -z "$CHANNEL_NAME" ]; then
    echo -e "${RED}Usage: $0 <chaincode_name> <channel_name> [version] [sequence]${NC}"
    echo -e "Example: $0 user user-channel 1.0 1"
    exit 1
fi

CHAINCODE_PATH="../chaincode/${CHAINCODE_NAME}"
CC_LABEL="${CHAINCODE_NAME}_${CHAINCODE_VERSION}"

echo -e "${YELLOW}Deploying chaincode: ${CHAINCODE_NAME} to ${CHANNEL_NAME}${NC}"

# Set environment variables
export FABRIC_CFG_PATH=${PWD}/peercfg
export CORE_PEER_TLS_ENABLED=true

ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Organization environments
setOrg1Env() {
    export CORE_PEER_LOCALMSPID="ParkingOperatorMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

setOrg2Env() {
    export CORE_PEER_LOCALMSPID="ChargingStationMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
}

setOrg3Env() {
    export CORE_PEER_LOCALMSPID="UserServiceMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
}

# Package chaincode
echo -e "${GREEN}Packaging chaincode...${NC}"
cd ${CHAINCODE_PATH}
GO111MODULE=on go mod tidy
GO111MODULE=on go mod vendor
cd -

peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path ${CHAINCODE_PATH} \
    --lang golang \
    --label ${CC_LABEL}

# Install chaincode on all peers
echo -e "${GREEN}Installing chaincode on Org1 peers...${NC}"
setOrg1Env
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:8051
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

echo -e "${GREEN}Installing chaincode on Org2 peers...${NC}"
setOrg2Env
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

export CORE_PEER_ADDRESS=localhost:10051
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

echo -e "${GREEN}Installing chaincode on Org3 peer...${NC}"
setOrg3Env
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
echo -e "${GREEN}Getting package ID...${NC}"
setOrg1Env
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CC_LABEL}" | awk -F "[, ]+" '{print $3}')
echo "Package ID: ${PACKAGE_ID}"

# Approve chaincode for organizations
echo -e "${GREEN}Approving chaincode for Org1...${NC}"
setOrg1Env
peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${SEQUENCE} \
    --tls --cafile ${ORDERER_CA}

echo -e "${GREEN}Approving chaincode for Org2...${NC}"
setOrg2Env
peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${SEQUENCE} \
    --tls --cafile ${ORDERER_CA}

echo -e "${GREEN}Approving chaincode for Org3...${NC}"
setOrg3Env
peer lifecycle chaincode approveformyorg -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${SEQUENCE} \
    --tls --cafile ${ORDERER_CA}

# Check commit readiness
echo -e "${GREEN}Checking commit readiness...${NC}"
peer lifecycle chaincode checkcommitreadiness \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence ${SEQUENCE} \
    --tls --cafile ${ORDERER_CA} \
    --output json

# Commit chaincode
echo -e "${GREEN}Committing chaincode...${NC}"
setOrg1Env
peer lifecycle chaincode commit -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID ${CHANNEL_NAME} \
    --name ${CHAINCODE_NAME} \
    --version ${CHAINCODE_VERSION} \
    --sequence ${SEQUENCE} \
    --tls --cafile ${ORDERER_CA} \
    --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    --peerAddresses localhost:11051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

# Verify deployment
echo -e "${GREEN}Verifying chaincode deployment...${NC}"
peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --cafile ${ORDERER_CA}

# Cleanup
rm -f ${CHAINCODE_NAME}.tar.gz

echo -e "${GREEN}Chaincode ${CHAINCODE_NAME} deployed successfully to ${CHANNEL_NAME}!${NC}"
