#!/bin/bash

# Hot reload the charging chaincode

set -e

CHAINCODE_NAME="charging"
CHANNEL_NAME="charging-channel"
VERSION="1.1"
SEQUENCE="2"
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem

echo "=========================================="
echo "Hot Reloading Charging Chaincode"
echo "=========================================="

# Start a CLI container
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && rm -f ${CHAINCODE_NAME}.tar.gz"

echo "Step 1: Packaging chaincode..."
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} --lang golang --label ${CHAINCODE_NAME}_${VERSION}"

echo "Step 2: Installing on ChargingStationMSP peer..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=ChargingStationMSP \
  -e CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp \
  cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz"

echo "Step 2b: Installing on UserServiceMSP peer..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=UserServiceMSP \
  -e CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp \
  cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz"

echo "Step 2c: Installing on CityManagementMSP peer..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=CityManagementMSP \
  -e CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/users/Admin@citymanagement.cityflow.com/msp \
  cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz"

echo "Step 3: Getting package ID..."
PACKAGE_ID=$(docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=ChargingStationMSP \
  -e CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp \
  cli bash -c "peer lifecycle chaincode queryinstalled" | grep ${CHAINCODE_NAME}_${VERSION} | awk '{print $3}' | sed 's/,$//')

echo "Package ID: $PACKAGE_ID"

if [ -z "$PACKAGE_ID" ]; then
  echo "Error: Could not get package ID"
  exit 1
fi

echo "Step 4: Approving for ChargingStationMSP..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=ChargingStationMSP \
  -e CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp \
  cli bash -c "peer lifecycle chaincode approveformyorg -o orderer.cityflow.com:7050 --ordererTLSHostnameOverride orderer.cityflow.com --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${VERSION} --package-id $PACKAGE_ID --sequence ${SEQUENCE} --signature-policy \"OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')\""

echo "Step 4b: Approving for UserServiceMSP..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=UserServiceMSP \
  -e CORE_PEER_ADDRESS=peer0.userservice.cityflow.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/users/Admin@userservice.cityflow.com/msp \
  cli bash -c "peer lifecycle chaincode approveformyorg -o orderer.cityflow.com:7050 --ordererTLSHostnameOverride orderer.cityflow.com --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${VERSION} --package-id $PACKAGE_ID --sequence ${SEQUENCE} --signature-policy \"OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')\""

echo "Step 4c: Approving for CityManagementMSP..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=CityManagementMSP \
  -e CORE_PEER_ADDRESS=peer0.citymanagement.cityflow.com:10051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/users/Admin@citymanagement.cityflow.com/msp \
  cli bash -c "peer lifecycle chaincode approveformyorg -o orderer.cityflow.com:7050 --ordererTLSHostnameOverride orderer.cityflow.com --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${VERSION} --package-id $PACKAGE_ID --sequence ${SEQUENCE} --signature-policy \"OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')\""

echo "Step 5: Committing chaincode..."
docker exec -e FABRIC_CFG_PATH=/etc/hyperledger/fabric \
  -e CORE_PEER_LOCALMSPID=ChargingStationMSP \
  -e CORE_PEER_ADDRESS=peer0.chargingstation.cityflow.com:8051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/users/Admin@chargingstation.cityflow.com/msp \
  cli bash -c "peer lifecycle chaincode commit -o orderer.cityflow.com:7050 --ordererTLSHostnameOverride orderer.cityflow.com --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${VERSION} --sequence ${SEQUENCE} --signature-policy \"OR('ChargingStationMSP.member','UserServiceMSP.member','CityManagementMSP.member')\" --peerAddresses peer0.chargingstation.cityflow.com:8051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/chargingstation.cityflow.com/peers/peer0.chargingstation.cityflow.com/tls/ca.crt --peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt --peerAddresses peer0.citymanagement.cityflow.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/citymanagement.cityflow.com/peers/peer0.citymanagement.cityflow.com/tls/ca.crt"

echo "=========================================="
echo "Charging chaincode hot reload complete!"
echo "=========================================="
