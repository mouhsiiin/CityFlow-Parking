# Chaincode Hot Reload Guide

## Overview

This guide covers how to quickly update chaincode without restarting the entire network.

## 🚀 Quick Reload Process

When you make changes to chaincode, follow these steps:

### 1. **Make Your Chaincode Changes**
Edit your chaincode files in `backend/chaincode/[chaincode-name]/`

### 2. **Rebuild the Chaincode Package**
```bash
cd backend/network
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode package [chaincode-name].tar.gz --path /opt/gopath/src/github.com/chaincode/[chaincode-name] --lang golang --label [chaincode-name]_1.1"
```

### 3. **Install on All Peers**
```bash
# For each organization (peer0 only)
docker exec cli bash -c "
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export CORE_PEER_LOCALMSPID=ParkingOperatorMSP
export CORE_PEER_ADDRESS=peer0.parkingoperator.cityflow.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/users/Admin@parkingoperator.cityflow.com/msp
peer lifecycle chaincode install [chaincode-name].tar.gz
"
```

### 4. **Get Package ID**
```bash
docker exec cli bash -c "peer lifecycle chaincode queryinstalled"
```
Copy the package ID for your new version.

### 5. **Approve for Organizations**
```bash
docker exec cli bash -c "
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export CORE_PEER_LOCALMSPID=ParkingOperatorMSP
export CORE_PEER_ADDRESS=peer0.parkingoperator.cityflow.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/users/Admin@parkingoperator.cityflow.com/msp

peer lifecycle chaincode approveformyorg \\
  -o orderer.cityflow.com:7050 \\
  --ordererTLSHostnameOverride orderer.cityflow.com \\
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \\
  --channelID [channel-name] \\
  --name [chaincode-name] \\
  --version 1.1 \\
  --package-id [PACKAGE_ID] \\
  --sequence 2 \\
  --signature-policy \"OR('UserServiceMSP.member','ParkingOperatorMSP.member','ChargingStationMSP.member','CityManagementMSP.member')\"
"
```

Repeat for each organization on the channel.

### 6. **Commit the New Version**
```bash
docker exec cli bash -c "
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
export CORE_PEER_LOCALMSPID=ParkingOperatorMSP
export CORE_PEER_ADDRESS=peer0.parkingoperator.cityflow.com:7051
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/users/Admin@parkingoperator.cityflow.com/msp

peer lifecycle chaincode commit \\
  -o orderer.cityflow.com:7050 \\
  --ordererTLSHostnameOverride orderer.cityflow.com \\
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \\
  --channelID [channel-name] \\
  --name [chaincode-name] \\
  --version 1.1 \\
  --sequence 2 \\
  --signature-policy \"OR('UserServiceMSP.member','ParkingOperatorMSP.member','ChargingStationMSP.member','CityManagementMSP.member')\" \\
  --peerAddresses peer0.parkingoperator.cityflow.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/parkingoperator.cityflow.com/peers/peer0.parkingoperator.cityflow.com/tls/ca.crt \\
  --peerAddresses peer0.userservice.cityflow.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/userservice.cityflow.com/peers/peer0.userservice.cityflow.com/tls/ca.crt
"
```

## ⚡ Automated Hot Reload Script

Create this script for faster updates:

```bash
#!/bin/bash
# hot-reload-chaincode.sh

CHAINCODE_NAME=$1
CHANNEL_NAME=$2
NEW_VERSION=$3
NEW_SEQUENCE=$4

if [ -z "$CHAINCODE_NAME" ] || [ -z "$CHANNEL_NAME" ] || [ -z "$NEW_VERSION" ] || [ -z "$NEW_SEQUENCE" ]; then
    echo "Usage: ./hot-reload-chaincode.sh <chaincode-name> <channel-name> <version> <sequence>"
    echo "Example: ./hot-reload-chaincode.sh parking parking-channel 1.1 2"
    exit 1
fi

echo "Hot reloading $CHAINCODE_NAME on $CHANNEL_NAME..."

# Package
docker exec cli bash -c "cd /opt/gopath/src/github.com/hyperledger/fabric/peer && peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode/${CHAINCODE_NAME} --lang golang --label ${CHAINCODE_NAME}_${NEW_VERSION}"

# Install on all peers
for ORG in "parkingoperator:7051:ParkingOperatorMSP" "chargingstation:8051:ChargingStationMSP" "userservice:9051:UserServiceMSP" "citymanagement:10051:CityManagementMSP"; do
    IFS=':' read -r org port mspid <<< "$ORG"
    docker exec cli bash -c "
        export FABRIC_CFG_PATH=/etc/hyperledger/fabric
        export CORE_PEER_LOCALMSPID=$mspid
        export CORE_PEER_ADDRESS=peer0.$org.cityflow.com:$port
        export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$org.cityflow.com/peers/peer0.$org.cityflow.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/$org.cityflow.com/users/Admin@$org.cityflow.com/msp
        peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
    "
done

# Get package ID
PACKAGE_ID=$(docker exec cli bash -c "peer lifecycle chaincode queryinstalled" | grep "${CHAINCODE_NAME}_${NEW_VERSION}" | awk -F',' '{print $1}' | awk '{print $3}')
echo "Package ID: $PACKAGE_ID"

echo "Chaincode updated! You can now test it."
echo "Note: Full approval/commit process needed for production."
```

## 🔧 Development Tips

### 1. **External Chaincode (Best for Development)**

For true hot reload, use Chaincode as External Service:

1. Build your chaincode as a standalone service
2. Run it outside Docker
3. Update `connection.json` to point to your local service
4. Changes are immediate - just restart your chaincode process

**Setup:**
```bash
cd backend/chaincode/parking
go build -o parking-chaincode

# Run it
./parking-chaincode -peer.address=localhost:9999
```

Update connection.json:
```json
{
  "address": "host.docker.internal:9999",
  "dial_timeout": "10s",
  "tls_required": false
}
```

### 2. **Use Chaincode Development Mode**

Start peers in dev mode:
```yaml
environment:
  - CORE_CHAINCODE_MODE=dev
```

Then manually start chaincode:
```bash
CORE_PEER_ADDRESS=peer0.parkingoperator.cityflow.com:7052 \
CORE_CHAINCODE_ID_NAME=parking:1.0 \
./parking-chaincode
```

Changes take effect immediately on restart.

### 3. **Quick Test Without Full Redeploy**

For testing logic changes only:
```bash
# Build locally
cd backend/chaincode/parking
go test -v ./...

# If tests pass, then deploy
```

## 📊 Version Management

Keep track of versions:
- v1.0 - Initial deployment
- v1.1 - Bug fix (sequence 2)
- v1.2 - New feature (sequence 3)
- v2.0 - Breaking changes (sequence 4)

## ⚠️ Important Notes

1. **Sequence Number**: Always increment when updating chaincode
2. **Endorsement Policy**: Must be same or compatible with previous version
3. **State Compatibility**: New version must handle existing state format
4. **Testing**: Always test in dev environment first
5. **Backup**: The persistent volumes preserve your data

## 🎯 Best Practice Workflow

```bash
# 1. Stop network (data persists)
cd backend/network
./stop.sh

# 2. Make chaincode changes
vim ../chaincode/parking/contract/parking.go

# 3. Restart network (uses existing data)
./start.sh

# 4. Deploy updated chaincode
docker exec cli bash -c "cd scripts && ./deployChaincode.sh"
```

This preserves all data while testing new chaincode!
