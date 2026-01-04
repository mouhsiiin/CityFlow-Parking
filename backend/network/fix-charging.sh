#!/bin/bash

# Final Charging Chaincode Fix - Upgrade from 1.1 (buggy) to 1.1 (fixed)

set -e

echo "=========================================="
echo "Final Charging Chaincode Fix"
echo "=========================================="
echo "Upgrading from 1.1 (buggy) to 1.1.1 (fixed)"
echo "=========================================="

docker exec cli bash << 'DSCRIPT'
set -e
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem

echo "Step 1: Packaging fixed chaincode..."
rm -f charging_fixed.tar.gz
peer lifecycle chaincode package charging_fixed.tar.gz \
  --path /opt/gopath/src/github.com/chaincode/charging \
  --lang golang \
  --label charging_1.1.1

echo "Step 2: Installing on all peers..."

# ChargingStationMSP
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
peer lifecycle chaincode install charging_fixed.tar.gz || echo "Already installed"

# UserServiceMSP
export CORE_PEER_LOCALMSPID=UserServiceMSP
export CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp
peer lifecycle chaincode install charging_fixed.tar.gz || echo "Already installed"

# CityManagementMSP
export CORE_PEER_LOCALMSPID=CityManagementMSP
export CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/users/Admin@citymanagement.cityflow.com/msp
peer lifecycle chaincode install charging_fixed.tar.gz || echo "Already installed"

echo "Step 3: Getting package ID..."
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep charging_1.1.1 | awk '{print $3}' | sed 's/,$//')
echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ]; then
  echo "ERROR: Could not get package ID"
  exit 1
fi

echo "Step 4: Approving for all organizations..."

# Approve for ChargingStationMSP
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID charging-channel \
  --name charging \
  --version 1.1.1 \
  --package-id $PACKAGE_ID \
  --sequence 3 \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

# Approve for UserServiceMSP
export CORE_PEER_LOCALMSPID=UserServiceMSP
export CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID charging-channel \
  --name charging \
  --version 1.1.1 \
  --package-id $PACKAGE_ID \
  --sequence 3 \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

# Approve for CityManagementMSP
export CORE_PEER_LOCALMSPID=CityManagementMSP
export CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051
peer lifecycle chaincode approveformyorg \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID charging-channel \
  --name charging \
  --version 1.1.1 \
  --package-id $PACKAGE_ID \
  --sequence 3 \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')"

echo "Step 5: Committing chaincode..."
export CORE_PEER_LOCALMSPID=ChargingStationMSP
export CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051
peer lifecycle chaincode commit \
  -o orderer.cityflow.com:7050 \
  --ordererTLSHostnameOverride orderer.cityflow.com \
  --tls --cafile $ORDERER_CA \
  --channelID charging-channel \
  --name charging \
  --version 1.1.1 \
  --sequence 3 \
  --signature-policy "OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')" \
  --peerAddresses peer0.chargingstation.cityflow.com:8051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  --peerAddresses peer0.userservice.cityflow.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt \
  --peerAddresses peer0.citymanagement.cityflow.com:10051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt

echo "=========================================="
echo "Fix complete! New version (1.1.1) committed"
echo "=========================================="
DSCRIPT

echo "=========================================="
echo "All done! Testing endpoint in 10 seconds..."
echo "=========================================="
