#!/bin/bash
# Copyright SecurDrgorP. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# Stop the CityFlow Parking Hyperledger Fabric Network

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping CityFlow Parking Network...${NC}"

# Stop all containers
docker-compose down

echo -e "${GREEN}Network stopped successfully!${NC}"
