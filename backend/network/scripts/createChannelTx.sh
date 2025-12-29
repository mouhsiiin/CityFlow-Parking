#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Create channel transaction files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating channel transaction files...${NC}"

# Set configtxgen path
export FABRIC_CFG_PATH=${PWD}

# Create channel artifacts directory
mkdir -p channel-artifacts

# Generate genesis block for orderer
echo -e "${GREEN}Generating genesis block...${NC}"
configtxgen -profile ThreeOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generate channel configuration transactions
echo -e "${GREEN}Generating user-channel configuration...${NC}"
configtxgen -profile UserChannel -outputCreateChannelTx ./channel-artifacts/user-channel.tx -channelID user-channel

echo -e "${GREEN}Generating parking-channel configuration...${NC}"
configtxgen -profile ParkingChannel -outputCreateChannelTx ./channel-artifacts/parking-channel.tx -channelID parking-channel

echo -e "${GREEN}Generating charging-channel configuration...${NC}"
configtxgen -profile ChargingChannel -outputCreateChannelTx ./channel-artifacts/charging-channel.tx -channelID charging-channel

echo -e "${GREEN}Generating wallet-channel configuration...${NC}"
configtxgen -profile WalletChannel -outputCreateChannelTx ./channel-artifacts/wallet-channel.tx -channelID wallet-channel

# Generate anchor peer updates
echo -e "${GREEN}Generating anchor peer updates...${NC}"

# User channel
configtxgen -profile UserChannel -outputAnchorPeersUpdate ./channel-artifacts/ParkingOperatorMSPanchors-user.tx -channelID user-channel -asOrg ParkingOperatorMSP
configtxgen -profile UserChannel -outputAnchorPeersUpdate ./channel-artifacts/ChargingStationMSPanchors-user.tx -channelID user-channel -asOrg ChargingStationMSP
configtxgen -profile UserChannel -outputAnchorPeersUpdate ./channel-artifacts/UserServiceMSPanchors-user.tx -channelID user-channel -asOrg UserServiceMSP

# Parking channel
configtxgen -profile ParkingChannel -outputAnchorPeersUpdate ./channel-artifacts/ParkingOperatorMSPanchors-parking.tx -channelID parking-channel -asOrg ParkingOperatorMSP
configtxgen -profile ParkingChannel -outputAnchorPeersUpdate ./channel-artifacts/ChargingStationMSPanchors-parking.tx -channelID parking-channel -asOrg ChargingStationMSP
configtxgen -profile ParkingChannel -outputAnchorPeersUpdate ./channel-artifacts/UserServiceMSPanchors-parking.tx -channelID parking-channel -asOrg UserServiceMSP

# Charging channel
configtxgen -profile ChargingChannel -outputAnchorPeersUpdate ./channel-artifacts/ParkingOperatorMSPanchors-charging.tx -channelID charging-channel -asOrg ParkingOperatorMSP
configtxgen -profile ChargingChannel -outputAnchorPeersUpdate ./channel-artifacts/ChargingStationMSPanchors-charging.tx -channelID charging-channel -asOrg ChargingStationMSP
configtxgen -profile ChargingChannel -outputAnchorPeersUpdate ./channel-artifacts/UserServiceMSPanchors-charging.tx -channelID charging-channel -asOrg UserServiceMSP

# Wallet channel
configtxgen -profile WalletChannel -outputAnchorPeersUpdate ./channel-artifacts/ParkingOperatorMSPanchors-wallet.tx -channelID wallet-channel -asOrg ParkingOperatorMSP
configtxgen -profile WalletChannel -outputAnchorPeersUpdate ./channel-artifacts/ChargingStationMSPanchors-wallet.tx -channelID wallet-channel -asOrg ChargingStationMSP
configtxgen -profile WalletChannel -outputAnchorPeersUpdate ./channel-artifacts/UserServiceMSPanchors-wallet.tx -channelID wallet-channel -asOrg UserServiceMSP

echo -e "${GREEN}Channel transaction files created successfully!${NC}"
