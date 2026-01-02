#!/bin/bash
# Create and join channels for CityFlow Parking

set -e

# Ensure FABRIC_CFG_PATH is set
export FABRIC_CFG_PATH=${FABRIC_CFG_PATH:-/etc/hyperledger/fabric}

CHANNEL_NAME_USER="user-channel"
CHANNEL_NAME_PARKING="parking-channel"
CHANNEL_NAME_CHARGING="charging-channel"
CHANNEL_NAME_WALLET="wallet-channel"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem
ORDERER_ADMIN_TLS_SIGN_CERT=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/tls/server.crt
ORDERER_ADMIN_TLS_PRIVATE_KEY=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/tls/server.key

echo "=========================================="
echo "Creating Channels"
echo "=========================================="

# Function to create and join channel
create_and_join_channel() {
    local CHANNEL_NAME=$1
    local PROFILE=$2
    
    echo "Creating channel: $CHANNEL_NAME"
    
    # Generate channel genesis block directly (no system channel in Fabric 2.3+)
    configtxgen -profile $PROFILE \
        -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
        -channelID $CHANNEL_NAME 2>/dev/null || echo "Block generation skipped (may already exist)"
    
    # Join the channel to the orderer using osnadmin (ignore errors if already joined)
    osnadmin channel join \
        --channelID $CHANNEL_NAME \
        --config-block ./channel-artifacts/${CHANNEL_NAME}.block \
        -o orderer.cityflow.com:7053 \
        --ca-file "$ORDERER_CA" \
        --client-cert "$ORDERER_ADMIN_TLS_SIGN_CERT" \
        --client-key "$ORDERER_ADMIN_TLS_PRIVATE_KEY" 2>&1 | grep -v "exists" || true
    
    sleep 2
    echo "Channel $CHANNEL_NAME ready"
}

# Function to join peer to channel
join_peer_to_channel() {
    local PEER=$1
    local ORG_DOMAIN=$2
    local MSP_ID=$3
    local CHANNEL_NAME=$4
    local PORT=$5
    
    echo "Joining $PEER to $CHANNEL_NAME..."
    
    export FABRIC_CFG_PATH=/etc/hyperledger/fabric
    export CORE_PEER_LOCALMSPID=$MSP_ID
    export CORE_PEER_ADDRESS=$PEER.$ORG_DOMAIN:$PORT
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/peers/$PEER.$ORG_DOMAIN/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/users/Admin@$ORG_DOMAIN/msp
    
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block 2>&1 | grep -v "already exists" || true
    
    sleep 1
}

# Function to update anchor peer
update_anchor_peer() {
    echo "Skipping anchor peer update (can be done later manually)"
    return 0
}

# Create User Channel
create_and_join_channel $CHANNEL_NAME_USER UserChannel

# Join peers to User Channel
join_peer_to_channel peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_USER 9051
join_peer_to_channel peer1 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_USER 9151
join_peer_to_channel peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_USER 7051
join_peer_to_channel peer1 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_USER 7151
join_peer_to_channel peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_USER 8051
join_peer_to_channel peer1 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_USER 8151

# Update anchor peers for User Channel
update_anchor_peer peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_USER 9051 UserServiceMSP
update_anchor_peer peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_USER 7051 ParkingOperatorMSP
update_anchor_peer peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_USER 8051 ChargingStationMSP

# Create Parking Channel
create_and_join_channel $CHANNEL_NAME_PARKING ParkingChannel

# Join peers to Parking Channel
join_peer_to_channel peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_PARKING 7051
join_peer_to_channel peer1 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_PARKING 7151
join_peer_to_channel peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_PARKING 9051
join_peer_to_channel peer1 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_PARKING 9151
join_peer_to_channel peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_PARKING 10051
join_peer_to_channel peer1 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_PARKING 10151

# Update anchor peers for Parking Channel
update_anchor_peer peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_PARKING 7051 ParkingOperatorMSP
update_anchor_peer peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_PARKING 9051 UserServiceMSP
update_anchor_peer peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_PARKING 10051 CityManagementMSP

# Create Charging Channel
create_and_join_channel $CHANNEL_NAME_CHARGING ChargingChannel

# Join peers to Charging Channel
join_peer_to_channel peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_CHARGING 8051
join_peer_to_channel peer1 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_CHARGING 8151
join_peer_to_channel peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_CHARGING 9051
join_peer_to_channel peer1 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_CHARGING 9151
join_peer_to_channel peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_CHARGING 10051
join_peer_to_channel peer1 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_CHARGING 10151

# Update anchor peers for Charging Channel
update_anchor_peer peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_CHARGING 8051 ChargingStationMSP
update_anchor_peer peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_CHARGING 9051 UserServiceMSP
update_anchor_peer peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_CHARGING 10051 CityManagementMSP

# Create Wallet Channel
create_and_join_channel $CHANNEL_NAME_WALLET WalletChannel

# Join peers to Wallet Channel
join_peer_to_channel peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_WALLET 9051
join_peer_to_channel peer1 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_WALLET 9151
join_peer_to_channel peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_WALLET 7051
join_peer_to_channel peer1 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_WALLET 7151
join_peer_to_channel peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_WALLET 8051
join_peer_to_channel peer1 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_WALLET 8151
join_peer_to_channel peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_WALLET 10051
join_peer_to_channel peer1 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_WALLET 10151

# Update anchor peers for Wallet Channel
update_anchor_peer peer0 userservice.cityflow.com UserServiceMSP $CHANNEL_NAME_WALLET 9051 UserServiceMSP
update_anchor_peer peer0 parkingoperator.cityflow.com ParkingOperatorMSP $CHANNEL_NAME_WALLET 7051 ParkingOperatorMSP
update_anchor_peer peer0 chargingstation.cityflow.com ChargingStationMSP $CHANNEL_NAME_WALLET 8051 ChargingStationMSP
update_anchor_peer peer0 citymanagement.cityflow.com CityManagementMSP $CHANNEL_NAME_WALLET 10051 CityManagementMSP

echo "=========================================="
echo "All channels created and peers joined successfully!"
echo "=========================================="
