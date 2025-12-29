#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Create and join channels

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Set environment variables
export FABRIC_CFG_PATH=${PWD}/peercfg
export CORE_PEER_TLS_ENABLED=true

# Organization 1 environment
setOrg1Env() {
    export CORE_PEER_LOCALMSPID="ParkingOperatorMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

# Organization 2 environment
setOrg2Env() {
    export CORE_PEER_LOCALMSPID="ChargingStationMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
}

# Organization 3 environment
setOrg3Env() {
    export CORE_PEER_LOCALMSPID="UserServiceMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
}

ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

createChannel() {
    CHANNEL_NAME=$1
    echo -e "${YELLOW}Creating channel: ${CHANNEL_NAME}${NC}"
    
    setOrg1Env
    
    peer channel create -o localhost:7050 -c $CHANNEL_NAME \
        --ordererTLSHostnameOverride orderer.example.com \
        -f ./channel-artifacts/${CHANNEL_NAME}.tx \
        --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
        --tls --cafile $ORDERER_CA
    
    echo -e "${GREEN}Channel ${CHANNEL_NAME} created!${NC}"
}

joinChannel() {
    CHANNEL_NAME=$1
    echo -e "${YELLOW}Joining peers to channel: ${CHANNEL_NAME}${NC}"
    
    # Org1 peers
    setOrg1Env
    export CORE_PEER_ADDRESS=localhost:7051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    echo -e "${GREEN}peer0.org1 joined ${CHANNEL_NAME}${NC}"
    
    export CORE_PEER_ADDRESS=localhost:8051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    echo -e "${GREEN}peer1.org1 joined ${CHANNEL_NAME}${NC}"
    
    # Org2 peers
    setOrg2Env
    export CORE_PEER_ADDRESS=localhost:9051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    echo -e "${GREEN}peer0.org2 joined ${CHANNEL_NAME}${NC}"
    
    export CORE_PEER_ADDRESS=localhost:10051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    echo -e "${GREEN}peer1.org2 joined ${CHANNEL_NAME}${NC}"
    
    # Org3 peer
    setOrg3Env
    export CORE_PEER_ADDRESS=localhost:11051
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    echo -e "${GREEN}peer0.org3 joined ${CHANNEL_NAME}${NC}"
}

updateAnchorPeers() {
    CHANNEL_NAME=$1
    echo -e "${YELLOW}Updating anchor peers for channel: ${CHANNEL_NAME}${NC}"
    
    # Org1
    setOrg1Env
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        -c $CHANNEL_NAME -f ./channel-artifacts/ParkingOperatorMSPanchors-${CHANNEL_NAME}.tx \
        --tls --cafile $ORDERER_CA
    
    # Org2
    setOrg2Env
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        -c $CHANNEL_NAME -f ./channel-artifacts/ChargingStationMSPanchors-${CHANNEL_NAME}.tx \
        --tls --cafile $ORDERER_CA
    
    # Org3
    setOrg3Env
    peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        -c $CHANNEL_NAME -f ./channel-artifacts/UserServiceMSPanchors-${CHANNEL_NAME}.tx \
        --tls --cafile $ORDERER_CA
    
    echo -e "${GREEN}Anchor peers updated for ${CHANNEL_NAME}!${NC}"
}

# Create all channels
CHANNELS=("user-channel" "parking-channel" "charging-channel" "wallet-channel")

for channel in "${CHANNELS[@]}"; do
    createChannel $channel
    sleep 2
    joinChannel $channel
    sleep 2
    updateAnchorPeers $channel
    sleep 2
done

echo -e "${GREEN}All channels created and joined successfully!${NC}"
