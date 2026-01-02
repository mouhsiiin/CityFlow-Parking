#!/bin/bash
# CityFlow Parking - Complete Installation Script
# This script installs all prerequisites and sets up the Hyperledger Fabric network

set -e

FABRIC_VERSION="2.5.4"
CA_VERSION="1.5.7"
FABRIC_SAMPLES_VERSION="2.5.4"

echo "=========================================="
echo "CityFlow Parking - Installation Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# ========================================
# Step 1: Update System
# ========================================
echo ""
echo "Step 1: Updating system packages..."
sudo apt-get update -y
print_status "System updated"

# ========================================
# Step 2: Install Docker
# ========================================
echo ""
echo "Step 2: Installing Docker..."

if ! command -v docker &> /dev/null; then
    print_warning "Docker not found, installing..."
    
    # Install prerequisites
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
else
    print_status "Docker already installed"
fi

# Verify Docker installation
docker --version
docker compose version

# ========================================
# Step 3: Install Node.js
# ========================================
echo ""
echo "Step 3: Installing Node.js 18 LTS..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found, installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed successfully"
else
    print_status "Node.js already installed"
fi

node --version
npm --version

# ========================================
# Step 4: Install Go
# ========================================
echo ""
echo "Step 4: Installing Go..."

if ! command -v go &> /dev/null; then
    print_warning "Go not found, installing..."
    GO_VERSION="1.21.5"
    wget -q https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    rm go${GO_VERSION}.linux-amd64.tar.gz
    
    # Add Go to PATH if not already added
    if ! grep -q "/usr/local/go/bin" ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
        echo 'export GOPATH=$HOME/go' >> ~/.bashrc
        echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
    fi
    
    export PATH=$PATH:/usr/local/go/bin
    export GOPATH=$HOME/go
    export PATH=$PATH:$GOPATH/bin
    
    print_status "Go installed successfully"
else
    print_status "Go already installed"
fi

go version

# ========================================
# Step 5: Install Hyperledger Fabric Binaries
# ========================================
echo ""
echo "Step 5: Installing Hyperledger Fabric binaries..."

if [ ! -d "bin" ] || [ ! -f "bin/cryptogen" ]; then
    print_warning "Fabric binaries not found, downloading..."
    
    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary docker
    
    print_status "Fabric binaries downloaded successfully"
else
    print_status "Fabric binaries already installed"
fi

# Add Fabric binaries to PATH
export PATH=$PWD/bin:$PATH
export FABRIC_CFG_PATH=$PWD/network

# Verify Fabric tools
./bin/cryptogen version
./bin/configtxgen -version

# ========================================
# Step 6: Generate Crypto Materials
# ========================================
echo ""
echo "Step 6: Generating crypto materials..."

cd network

# Clean previous artifacts
rm -rf crypto-config channel-artifacts
mkdir -p channel-artifacts

# Generate crypto materials
../bin/cryptogen generate --config=./crypto-config.yaml --output=crypto-config

if [ $? -eq 0 ]; then
    print_status "Crypto materials generated successfully"
else
    print_error "Failed to generate crypto materials"
    exit 1
fi

cd ..

# ========================================
# Step 7: Install Chaincode Dependencies
# ========================================
echo ""
echo "Step 7: Installing chaincode dependencies (parallel)..."

# Function to install chaincode dependencies
install_cc_deps() {
    local CC_NAME=$1
    local CC_PATH=$2
    if [ -f "$CC_PATH/go.mod" ]; then
        (
            cd "$CC_PATH"
            echo "[$CC_NAME] Downloading dependencies..."
            go mod download
            go mod vendor 2>/dev/null || true
            echo "[$CC_NAME] Dependencies installed"
        ) &
    fi
}

# Install all chaincode dependencies in parallel
install_cc_deps "User" "chaincode/user"
install_cc_deps "Parking" "chaincode/parking"
install_cc_deps "Charging" "chaincode/charging"
install_cc_deps "Wallet" "chaincode/wallet"

# Wait for all installations to complete
wait
print_status "All chaincode dependencies installed"

# ========================================
# Step 8: Install Backend Dependencies
# ========================================
echo ""
echo "Step 8: Installing backend dependencies..."

if [ -f "go.mod" ]; then
    go mod download
    go mod tidy
    print_status "Backend dependencies installed"
fi

# ========================================
# Step 9: Build Backend API
# ========================================
echo ""
echo "Step 9: Building backend API..."

make build 2>/dev/null || go build -o bin/api ./cmd/api

if [ -f "bin/api" ]; then
    print_status "Backend API built successfully"
else
    print_error "Failed to build backend API"
    exit 1
fi

# ========================================
# Step 10: Make Scripts Executable
# ========================================
echo ""
echo "Step 10: Making scripts executable..."

chmod +x network/scripts/*.sh
chmod +x start.sh stop.sh

print_status "Scripts made executable"

echo ""
echo "=========================================="
print_status "Installation completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Log out and log back in (or run: newgrp docker)"
echo "  2. Run: ./start.sh"
echo ""
echo "Fabric binaries location: $PWD/bin"
echo "Network configuration: $PWD/network"
echo ""
