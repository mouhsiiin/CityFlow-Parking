# 🚀 CityFlow Parking - Quick Reference

## Quick Start Commands

```bash
# Installation
chmod +x install.sh start.sh stop.sh
./install.sh         # Install everything
./start.sh          # Start the system
./stop.sh           # Stop the system
```

## Network Architecture

### Organizations & Ports
```
┌─────────────────────┬──────────────────────────────────┬──────┐
│ Organization        │ Domain                           │ Port │
├─────────────────────┼──────────────────────────────────┼──────┤
│ Orderer             │ orderer.cityflow.com             │ 7050 │
│ ParkingOperator P0  │ peer0.parkingoperator.cityflow   │ 7051 │
│ ParkingOperator P1  │ peer1.parkingoperator.cityflow   │ 7151 │
│ ChargingStation P0  │ peer0.chargingstation.cityflow   │ 8051 │
│ ChargingStation P1  │ peer1.chargingstation.cityflow   │ 8151 │
│ UserService P0      │ peer0.userservice.cityflow       │ 9051 │
│ UserService P1      │ peer1.userservice.cityflow       │ 9151 │
│ CityManagement P0   │ peer0.citymanagement.cityflow    │10051 │
│ CityManagement P1   │ peer1.citymanagement.cityflow    │10151 │
│ Backend API         │ localhost                        │ 8080 │
└─────────────────────┴──────────────────────────────────┴──────┘
```

### Channels & Participants
```
user-channel:      UserService, ParkingOperator, ChargingStation
parking-channel:   ParkingOperator, UserService, CityManagement
charging-channel:  ChargingStation, UserService, CityManagement
wallet-channel:    All 4 Organizations
```

## Essential Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs peer0.userservice.cityflow.com
docker logs -f orderer.cityflow.com  # Follow logs

# Restart container
docker restart peer0.parkingoperator.cityflow.com

# Enter CLI container
docker exec -it cli bash

# Stop all containers
cd network && docker compose down
```

## Fabric Commands (via CLI)

```bash
# List channels
docker exec cli peer channel list

# Query installed chaincode
docker exec cli peer lifecycle chaincode queryinstalled

# Query committed chaincode
docker exec cli peer lifecycle chaincode querycommitted -C user-channel

# Query chaincode
docker exec cli peer chaincode query \
  -C user-channel -n user \
  -c '{"function":"GetAllUsers","Args":[]}'

# Invoke chaincode
docker exec cli peer chaincode invoke \
  -o orderer.cityflow.com:7050 --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/cityflow.com/orderers/orderer.cityflow.com/msp/tlscacerts/tlsca.cityflow.com-cert.pem \
  -C user-channel -n user \
  -c '{"function":"CreateUser","Args":["user123","John Doe","john@example.com"]}'
```

## API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# View API logs
tail -f logs/api.log

# Stop API
kill $(cat logs/api.pid)

# Start API
nohup ./bin/api > logs/api.log 2>&1 &
```

## Troubleshooting

### Common Issues

**Docker permission denied:**
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port already in use:**
```bash
sudo lsof -i :7051  # Find process
kill -9 <PID>       # Kill process
```

**Containers won't start:**
```bash
docker compose down --volumes
docker system prune -f
./start.sh
```

**Chaincode errors:**
```bash
docker logs cli
docker exec -it cli bash
cd /opt/gopath/src/github.com/hyperledger/fabric/peer
./scripts/deployChaincode.sh
```

## File Structure

```
backend/
├── install.sh              # Installation script
├── start.sh                # Start system
├── stop.sh                 # Stop system
├── SETUP_GUIDE.md          # Detailed setup guide
├── bin/
│   ├── api                 # Backend API binary
│   ├── cryptogen           # Fabric cryptogen tool
│   ├── configtxgen         # Fabric configtxgen tool
│   └── peer                # Fabric peer tool
├── network/
│   ├── crypto-config.yaml  # Org & crypto definition
│   ├── configtx.yaml       # Channel configuration
│   ├── docker-compose.yaml # Network containers
│   ├── cleanup.sh          # Complete cleanup
│   ├── crypto-config/      # Generated certificates
│   ├── channel-artifacts/  # Generated channel files
│   └── scripts/
│       ├── createChannels.sh
│       └── deployChaincode.sh
├── chaincode/
│   ├── user/               # User chaincode
│   ├── parking/            # Parking chaincode
│   ├── charging/           # Charging chaincode
│   └── wallet/             # Wallet chaincode
├── cmd/api/                # API entry point
├── internal/
│   ├── api/                # API handlers
│   ├── config/             # Configuration
│   └── fabric/             # Fabric client
└── logs/                   # Application logs
```

## Environment Variables

```bash
# Fabric Configuration
export FABRIC_ORG=userservice
export FABRIC_MSP_ID=UserServiceMSP
export FABRIC_PEER_ENDPOINT=localhost:9051
export FABRIC_GATEWAY_PEER=peer0.userservice.cityflow.com

# Server Configuration
export PORT=8080
export JWT_SECRET=your-secret-key
```

## Maintenance Commands

```bash
# Rebuild backend
cd backend
go build -o bin/api ./cmd/api

# Update chaincode dependencies
cd chaincode/user && go mod tidy && cd ../..

# View chaincode containers
docker ps --filter "name=dev-peer"

# Remove old chaincode
docker rm -f $(docker ps -aq --filter "name=dev-peer")
docker rmi -f $(docker images -q "dev-peer*")

# Complete cleanup
./network/cleanup.sh
```

## Monitoring

```bash
# Container stats
docker stats

# Network inspection
docker network inspect cityflow_network

# View all logs
docker compose -f network/docker-compose.yaml logs -f

# Disk usage
docker system df
```

## Useful Paths

```
Crypto materials: backend/network/crypto-config/
Channel artifacts: backend/network/channel-artifacts/
API logs: backend/logs/api.log
Fabric binaries: backend/bin/
Chaincode: backend/chaincode/
```

## Version Information

- Hyperledger Fabric: 2.5.4
- Fabric CA: 1.5.7
- Go: 1.21+
- Node.js: 18 LTS
- Docker: 20.10+
- Docker Compose: v2.23.0+

## Support

Check logs first:
```bash
# Backend logs
tail -f logs/api.log

# Container logs
docker logs <container-name>

# All logs
docker compose -f network/docker-compose.yaml logs
```

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
