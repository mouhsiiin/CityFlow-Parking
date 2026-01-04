#!/bin/bash
# Deploy chaincode to CityFlow Parking network

set -e

CHANNEL_NAME_USER="user-channel"
CHANNEL_NAME_PARKING="parking-channel"
CHANNEL_NAME_CHARGING="charging-channel"
CHANNEL_NAME_WALLET="wallet-channel"
VERSION="1.0"
SEQUENCE=1
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem

echo "=========================================="
echo "Deploying Chaincode"
echo "=========================================="

# Function to set peer environment
set_peer_env() {
    local PEER=$1
    local ORG_DOMAIN=$2
    local MSP_ID=$3
    local PORT=$4
    
    export FABRIC_CFG_PATH=/etc/hyperledger/fabric
    export CORE_PEER_LOCALMSPID=$MSP_ID
    export CORE_PEER_ADDRESS=$PEER.$ORG_DOMAIN:$PORT
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/peers/$PEER.$ORG_DOMAIN/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/users/Admin@$ORG_DOMAIN/msp
}

# Function to package chaincode
package_chaincode() {
    local CC_NAME=$1
    local CC_PATH=$2
    
    echo "Packaging chaincode: $CC_NAME"
    
    export FABRIC_CFG_PATH=/etc/hyperledger/fabric
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path /opt/gopath/src/github.com/chaincode/${CC_PATH} \
        --lang golang \
        --label ${CC_NAME}_${VERSION}
    
    echo "Chaincode $CC_NAME packaged successfully"
}

# Function to install chaincode on peer
install_chaincode() {
    local CC_NAME=$1
    local PEER=$2
    local ORG_DOMAIN=$3
    local MSP_ID=$4
    local PORT=$5
    
    echo "Installing $CC_NAME on $PEER.$ORG_DOMAIN"
    
    set_peer_env $PEER $ORG_DOMAIN $MSP_ID $PORT
    
    peer lifecycle chaincode install ${CC_NAME}.tar.gz
}

# Function to install chaincode on peer in background
install_chaincode_async() {
    local CC_NAME=$1
    local PEER=$2
    local ORG_DOMAIN=$3
    local MSP_ID=$4
    local PORT=$5
    
    (
        export FABRIC_CFG_PATH=/etc/hyperledger/fabric
        export CORE_PEER_LOCALMSPID=$MSP_ID
        export CORE_PEER_ADDRESS=$PEER.$ORG_DOMAIN:$PORT
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/peers/$PEER.$ORG_DOMAIN/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/users/Admin@$ORG_DOMAIN/msp
        
        echo "Installing $CC_NAME on $PEER.$ORG_DOMAIN"
        peer lifecycle chaincode install ${CC_NAME}.tar.gz
    ) &
    
    # Small stagger to avoid overwhelming peers
    sleep 0.5
}

# Function to query installed chaincode and get package ID
query_installed() {
    local CC_NAME=$1
    local PEER=$2
    local ORG_DOMAIN=$3
    local MSP_ID=$4
    local PORT=$5
    
    set_peer_env $PEER $ORG_DOMAIN $MSP_ID $PORT
    
    peer lifecycle chaincode queryinstalled >&log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo $PACKAGE_ID
}

# Function to approve chaincode for organization
approve_chaincode() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    local PACKAGE_ID=$3
    local PEER=$4
    local ORG_DOMAIN=$5
    local MSP_ID=$6
    local PORT=$7
    
    echo "Approving $CC_NAME for $MSP_ID on $CHANNEL_NAME"
    
    set_peer_env $PEER $ORG_DOMAIN $MSP_ID $PORT
    
    peer lifecycle chaincode approveformyorg \
        -o orderer.cityflow.com:7050 \
        --ordererTLSHostnameOverride orderer.cityflow.com \
        --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME \
        --name $CC_NAME \
        --version $VERSION \
        --package-id $PACKAGE_ID \
        --sequence $SEQUENCE \
        --signature-policy "OR('UserServiceMSP.member','ParkingOperatorMSP.member','ChargingStationMSP.member','CityManagementMSP.member')"
}

# Function to approve chaincode for organization in background
approve_chaincode_async() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    local PACKAGE_ID=$3
    local PEER=$4
    local ORG_DOMAIN=$5
    local MSP_ID=$6
    local PORT=$7
    
    (
        export FABRIC_CFG_PATH=/etc/hyperledger/fabric
        export CORE_PEER_LOCALMSPID=$MSP_ID
        export CORE_PEER_ADDRESS=$PEER.$ORG_DOMAIN:$PORT
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/peers/$PEER.$ORG_DOMAIN/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$ORG_DOMAIN/users/Admin@$ORG_DOMAIN/msp
        
        echo "Approving $CC_NAME for $MSP_ID on $CHANNEL_NAME"
        peer lifecycle chaincode approveformyorg \
            -o orderer.cityflow.com:7050 \
            --ordererTLSHostnameOverride orderer.cityflow.com \
            --tls --cafile $ORDERER_CA \
            --channelID $CHANNEL_NAME \
            --name $CC_NAME \
            --version $VERSION \
            --package-id $PACKAGE_ID \
            --sequence $SEQUENCE \
            --signature-policy "OR('UserServiceMSP.member','ParkingOperatorMSP.member','ChargingStationMSP.member','CityManagementMSP.member')"
    ) &
    
    # Small stagger to avoid overwhelming orderer
    sleep 0.3
}

# Function to commit chaincode
commit_chaincode() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    local PEER=$3
    local ORG_DOMAIN=$4
    local MSP_ID=$5
    local PORT=$6
    shift 6
    local PEER_ARGS=("$@")
    
    echo "Committing $CC_NAME on $CHANNEL_NAME"
    
    # Set peer environment for the commit operation
    set_peer_env $PEER $ORG_DOMAIN $MSP_ID $PORT
    
    local PEER_CONN_PARAMS=""
    for arg in "${PEER_ARGS[@]}"; do
        PEER_CONN_PARAMS+="$arg "
    done
    
    peer lifecycle chaincode commit \
        -o orderer.cityflow.com:7050 \
        --ordererTLSHostnameOverride orderer.cityflow.com \
        --tls --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME \
        --name $CC_NAME \
        --version $VERSION \
        --sequence $SEQUENCE \
        --signature-policy "OR('UserServiceMSP.member','ParkingOperatorMSP.member','ChargingStationMSP.member','CityManagementMSP.member')" \
        $PEER_CONN_PARAMS
}

# Function to initialize chaincode
init_chaincode() {
    local CC_NAME=$1
    local CHANNEL_NAME=$2
    local PEER=$3
    local ORG_DOMAIN=$4
    local MSP_ID=$5
    local PORT=$6
    
    echo "Initializing $CC_NAME on $CHANNEL_NAME"
    
    set_peer_env $PEER $ORG_DOMAIN $MSP_ID $PORT
    
    peer chaincode invoke \
        -o orderer.cityflow.com:7050 \
        --ordererTLSHostnameOverride orderer.cityflow.com \
        --tls --cafile $ORDERER_CA \
        -C $CHANNEL_NAME \
        -n $CC_NAME \
        --isInit \
        -c '{"function":"InitLedger","Args":[]}'
}

# Function to wait for all background jobs
wait_for_jobs() {
    echo "Waiting for parallel operations to complete..."
    wait
    echo "All operations completed"
}

# ===========================
# Deploy User Chaincode
# ===========================
echo "Deploying User Chaincode..."
package_chaincode "user" "user"

# Install on all peers in user-channel
echo "Installing user chaincode on all organizations..."
install_chaincode_async "user" peer0 userservice.cityflow.com UserServiceMSP 9051
install_chaincode_async "user" peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
install_chaincode_async "user" peer0 chargingstation.cityflow.com ChargingStationMSP 8051
wait_for_jobs

# Get package ID and approve (parallel)
PACKAGE_ID=$(query_installed "user" peer0 userservice.cityflow.com UserServiceMSP 9051)
echo "Package ID: $PACKAGE_ID"
echo "Approving user chaincode for all organizations..."
approve_chaincode_async "user" $CHANNEL_NAME_USER $PACKAGE_ID peer0 userservice.cityflow.com UserServiceMSP 9051
approve_chaincode_async "user" $CHANNEL_NAME_USER $PACKAGE_ID peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
approve_chaincode_async "user" $CHANNEL_NAME_USER $PACKAGE_ID peer0 chargingstation.cityflow.com ChargingStationMSP 8051
wait_for_jobs

# Commit chaincode
commit_chaincode "user" $CHANNEL_NAME_USER peer0 userservice.cityflow.com UserServiceMSP 9051 \
    "--peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.parkingoperator.cityflow.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.chargingstation.cityflow.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt"

echo "User chaincode deployed successfully"

# ===========================
# Deploy Parking Chaincode
# ===========================
echo "Deploying Parking Chaincode..."
package_chaincode "parking" "parking"

# Install on all peers in parking-channel
echo "Installing parking chaincode on all organizations..."
install_chaincode_async "parking" peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
install_chaincode_async "parking" peer0 userservice.cityflow.com UserServiceMSP 9051
install_chaincode_async "parking" peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Get package ID and approve (parallel)
PACKAGE_ID=$(query_installed "parking" peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051)
echo "Package ID: $PACKAGE_ID"
echo "Approving parking chaincode for all organizations..."
approve_chaincode_async "parking" $CHANNEL_NAME_PARKING $PACKAGE_ID peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
approve_chaincode_async "parking" $CHANNEL_NAME_PARKING $PACKAGE_ID peer0 userservice.cityflow.com UserServiceMSP 9051
approve_chaincode_async "parking" $CHANNEL_NAME_PARKING $PACKAGE_ID peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Commit chaincode
commit_chaincode "parking" $CHANNEL_NAME_PARKING peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051 \
    "--peerAddresses peer0.parkingoperator.cityflow.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.citymanagement.cityflow.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt"

echo "Parking chaincode deployed successfully"

# ===========================
# Deploy Charging Chaincode
# ===========================
echo "Deploying Charging Chaincode..."
package_chaincode "charging" "charging"

# Install on all peers in charging-channel
echo "Installing charging chaincode on all organizations..."
install_chaincode_async "charging" peer0 chargingstation.cityflow.com ChargingStationMSP 8051
install_chaincode_async "charging" peer0 userservice.cityflow.com UserServiceMSP 9051
install_chaincode_async "charging" peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Get package ID and approve (parallel)
PACKAGE_ID=$(query_installed "charging" peer0 chargingstation.cityflow.com ChargingStationMSP 8051)
echo "Package ID: $PACKAGE_ID"
echo "Approving charging chaincode for all organizations..."
approve_chaincode_async "charging" $CHANNEL_NAME_CHARGING $PACKAGE_ID peer0 chargingstation.cityflow.com ChargingStationMSP 8051
approve_chaincode_async "charging" $CHANNEL_NAME_CHARGING $PACKAGE_ID peer0 userservice.cityflow.com UserServiceMSP 9051
approve_chaincode_async "charging" $CHANNEL_NAME_CHARGING $PACKAGE_ID peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Commit chaincode
commit_chaincode "charging" $CHANNEL_NAME_CHARGING peer0 chargingstation.cityflow.com ChargingStationMSP 8051 \
    "--peerAddresses peer0.chargingstation.cityflow.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.citymanagement.cityflow.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt"

echo "Charging chaincode deployed successfully"

# ===========================
# Deploy Wallet Chaincode
# ===========================
echo "Deploying Wallet Chaincode..."
package_chaincode "wallet" "wallet"

# Install on all peers in wallet-channel
echo "Installing wallet chaincode on all organizations..."
install_chaincode_async "wallet" peer0 userservice.cityflow.com UserServiceMSP 9051
install_chaincode_async "wallet" peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
install_chaincode_async "wallet" peer0 chargingstation.cityflow.com ChargingStationMSP 8051
install_chaincode_async "wallet" peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Get package ID and approve (parallel)
PACKAGE_ID=$(query_installed "wallet" peer0 userservice.cityflow.com UserServiceMSP 9051)
echo "Package ID: $PACKAGE_ID"
echo "Approving wallet chaincode for all organizations..."
approve_chaincode_async "wallet" $CHANNEL_NAME_WALLET $PACKAGE_ID peer0 userservice.cityflow.com UserServiceMSP 9051
approve_chaincode_async "wallet" $CHANNEL_NAME_WALLET $PACKAGE_ID peer0 parkingoperator.cityflow.com ParkingOperatorMSP 7051
approve_chaincode_async "wallet" $CHANNEL_NAME_WALLET $PACKAGE_ID peer0 chargingstation.cityflow.com ChargingStationMSP 8051
approve_chaincode_async "wallet" $CHANNEL_NAME_WALLET $PACKAGE_ID peer0 citymanagement.cityflow.com CityManagementMSP 10051
wait_for_jobs

# Commit chaincode
commit_chaincode "wallet" $CHANNEL_NAME_WALLET peer0 userservice.cityflow.com UserServiceMSP 9051 \
    "--peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.parkingoperator.cityflow.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.chargingstation.cityflow.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt" \
    "--peerAddresses peer0.citymanagement.cityflow.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt"

echo "Wallet chaincode deployed successfully"

echo "=========================================="
echo "All chaincode deployed successfully!"
echo "=========================================="
