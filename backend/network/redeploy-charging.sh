#!/bin/bash

# Complete Charging Chaincode Redeploy Script
# This script upgrades the charging chaincode from 1.0 to 1.2 with bug fixes

set -e

CHAINCODE_NAME="charging"
CHANNEL_NAME="charging-channel"
OLD_VERSION="1.0"
NEW_VERSION="1.2"
NEW_SEQUENCE="3"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem

echo "=========================================="
echo "Charging Chaincode Redeploy Script"
echo "=========================================="
echo "OLD Version: $OLD_VERSION"
echo "NEW Version: $NEW_VERSION"
echo "Channel: $CHANNEL_NAME"
echo "=========================================="

# Run all operations inside the CLI container
docker exec cli bash << 'SCRIPT'
set -e

CHAINCODE_NAME="charging"
CHANNEL_NAME="charging-channel"
NEW_VERSION="1.2"
NEW_SEQUENCE="3"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem

cd /opt/gopath/src/github.com/hyperledger/fabric/peer

# Step 1: Package chaincode
echo "Step 1: Packaging chaincode..."
rm -f ${CHAINCODE_NAME}.tar.gz
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
  --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} \
  --lang golang \
  --label ${CHAINCODE_NAME}_${NEW_VERSION}

# Step 2: Install on ChargingStationMSP
echo "Step 2: Installing on ChargingStationMSP peer..."
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz || echo "Already installed on ChargingStationMSP"

# Step 3: Install on UserServiceMSP
echo "Step 3: Installing on UserServiceMSP peer..."
export CORE_PEER_LOCALMSPID=UserServiceMSP
export CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz || echo "Already installed on UserServiceMSP"

# Step 4: Install on CityManagementMSP
echo "Step 4: Installing on CityManagementMSP peer..."
export CORE_PEER_LOCALMSPID=CityManagementMSP
export CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/users/Admin@citymanagement.cityflow.com/msp
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz || echo "Already installed on CityManagementMSP"

# Step 5: Get Package ID
echo "Step 5: Getting package ID..."
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${NEW_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ]; then
  echo "ERROR: Could not get package ID"
  exit 1
fi

# Step 6: Approve for all organizations
echo "Step 6: Approving for all organizations..."

export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${NEW_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${NEW_SEQUENCE} \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

export CORE_PEER_LOCALMSPID=UserServiceMSP
export CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${NEW_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${NEW_SEQUENCE} \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

export CORE_PEER_LOCALMSPID=CityManagementMSP
export CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/users/Admin@citymanagement.cityflow.com/msp
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${NEW_VERSION} \
  --package-id $PACKAGE_ID \
  --sequence ${NEW_SEQUENCE} \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

# Step 7: Commit chaincode
echo "Step 7: Committing chaincode..."
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
peer lifecycle chaincode commit \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID ${CHANNEL_NAME} \
  --name ${CHAINCODE_NAME} \
  --version ${NEW_VERSION} \
  --sequence ${NEW_SEQUENCE} \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')" \
  --peerAddresses peer0.chargingstation.cityflow.com:8051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  --peerAddresses peer0.userservice.cityflow.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt \
  --peerAddresses peer0.citymanagement.cityflow.com:10051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt

echo "=========================================="
echo "Chaincode commit completed!"
echo "=========================================="
SCRIPT

echo "=========================================="
echo "Redeploy complete!"
echo "=========================================="
