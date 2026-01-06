# CityFlow Smart Parking & EV Charging System

A blockchain-powered smart parking and EV charging management system built with Hyperledger Fabric 2.5, Go, and React.

---

## 📑 Report
The complete report detailing the project architecture :  
👉 **[Download the Report (PDF)](docs/report/MST-Report-CityFlow.pdf)**

---

## 🌟 Overview

CityFlow is a complete decentralized application (dApp) that leverages blockchain technology to provide transparent, secure, and efficient management of parking spots and EV charging stations. All transactions are recorded on a private Hyperledger Fabric blockchain network with no traditional database dependencies.

## ✨ Key Features

### 🚗 Smart Parking Management
- Real-time parking spot discovery and availability
- QR code-based check-in/check-out
- Reservation management (create, extend, cancel)
- Location-based search with interactive map
- Automatic payment processing

### ⚡ EV Charging Management
- Charging station availability tracking
- Session management (start, stop, monitor)
- Energy consumption tracking
- Dynamic pricing based on power output
- Real-time session updates

### 💳 Digital Wallet System
- Blockchain-based digital wallet
- Add funds, view balance
- Complete transaction history
- Automatic payment processing
- Refund management

### 🔗 Blockchain Integration
- 100% on-chain data storage (Hyperledger Fabric)
- Transaction hash and block number for every operation
- Endorsing organization visibility
- Complete audit trail
- Immutable transaction records

### 🔐 Security Monitoring (Mini SOC)
- Real-time security event logging
- Automated alert generation
- Security health scoring
- Admin dashboard for monitoring
- Brute force attack detection

## 🏗️ Architecture

### Technology Stack

**Backend**:
- **Hyperledger Fabric 2.5**: Private blockchain network
- **Go 1.21+**: Backend API and smart contracts
- **Gin Framework**: RESTful API
- **JWT**: Authentication

**Frontend**:
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool

**Blockchain Network**:
- 4 Organizations (8 Peers)
- 1 Orderer (Raft consensus)
- 4 Channels (user, parking, charging, wallet)
- 4 Smart Contracts (Chaincode)

### Network Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    CityFlow Blockchain Network               │
│                                                              │
│  Organizations:                                              │
│  ├─ ParkingOperator  (ports 7051, 7151)                     │
│  ├─ ChargingStation  (ports 8051, 8151)                     │
│  ├─ UserService      (ports 9051, 9151)                     │
│  └─ CityManagement   (ports 10051, 10151)                   │
│                                                              │
│  Channels:                                                   │
│  ├─ user-channel     (User management & auth)               │
│  ├─ parking-channel  (Parking spots & bookings)             │
│  ├─ charging-channel (Charging stations & sessions)         │
│  └─ wallet-channel   (Payments & transactions)              │
│                                                              │
│  Orderer: orderer.cityflow.com (port 7050)                 │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend API (Go)                          │
│                  localhost:8080                              │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                 Frontend (React + TypeScript)                │
│                  localhost:5173                              │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- Linux/macOS (Ubuntu 20.04+ recommended)
- 8GB RAM minimum, 16GB recommended

### Installation

```bash
# Clone repository
git clone https://github.com/mouhsiiin/CityFlow-Parking.git
cd CityFlow-Parking

# Backend Setup
cd backend
chmod +x install.sh start.sh stop.sh

# Install everything (Docker, Go, Fabric, dependencies)
./install.sh

# Start the entire blockchain network and API
./start.sh

# Generate test data (in another terminal)
cd backend
./generate_test_data.sh

# Frontend Setup
cd ../frontend
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **Security Dashboard**: http://localhost:5173/admin/security

### Test Credentials

**Admin User:**
```
Email: admin@cityflow.com
Password: admin123
```

**Regular User:**
```
Email: john.doe@example.com
Password: password123
```

For detailed setup instructions, see [QUICK_START.md](docs/setup/QUICK_START.md).

## 🎥 Video Demo

Watch a complete system walkthrough and security monitoring (SOC) in action:

- **System Walkthrough**: Shows the full user journey from registration to parking reservation and EV charging
- **Security Operations Center (SOC)**: Real-time security event monitoring, alerts, and dashboard analytics
- **Blockchain Integration**: Live transaction verification and audit trail demonstration

- **Full Demo Video (Google Drive)**: [Watch/Download Demo](https://drive.google.com/file/d/1avT4HCUJItWNpKQdhbTU7OzsStDJ4dg2/view?usp=sharing)


## 📚 Documentation

Comprehensive documentation is available:

- **[API_DOCUMENTATION.md](docs/setup/API_DOCUMENTATION.md)**: Complete API reference with all endpoints
- **[HYPERLEDGER_BLOCKCHAIN.md](docs/setup/HYPERLEDGER_BLOCKCHAIN.md)**: Blockchain network setup and management
- **[SECURITY_MONITORING.md](docs/setup/SECURITY_MONITORING.md)**: Security monitoring system guide
- **[FRONTEND.md](docs/setup/FRONTEND.md)**: Frontend development and integration guide

## 🎯 Use Cases

### For Users
1. **Find Parking**: Search for available parking spots near your location
2. **Reserve Spot**: Book a parking spot in advance
3. **Charge EV**: Find and use EV charging stations
4. **Manage Wallet**: Add funds and track spending
5. **View History**: Complete transaction history with blockchain verification

### For Administrators
1. **Manage Infrastructure**: Add/update parking spots and charging stations
2. **Monitor Security**: View security events and alerts
3. **View Analytics**: Track usage statistics and revenue
4. **Manage Users**: User administration and support

### For Developers
1. **Blockchain Learning**: Understand Hyperledger Fabric implementation
2. **API Integration**: RESTful API with comprehensive documentation
3. **Security Monitoring**: Learn security monitoring concepts
4. **Full-Stack Development**: React + Go + Blockchain

## 🔧 Development

### Project Structure

```
CityFlow-Parking/
├── backend/
│   ├── chaincode/          # Smart contracts (User, Parking, Charging, Wallet)
│   ├── cmd/api/            # API server entry point
│   ├── internal/           # Internal packages (handlers, fabric client)
│   ├── network/            # Blockchain network configuration
│   │   ├── crypto-config.yaml
│   │   ├── configtx.yaml
│   │   └── docker-compose.yaml
│   ├── install.sh          # Installation script
│   ├── start.sh            # Start system
│   └── stop.sh             # Stop system
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
└── Documentation files (this README, API docs, etc.)
```

### Backend Development

```bash
cd backend

# Build API
go build -o bin/api ./cmd/api

# Run tests
go test ./...

# Hot reload chaincode (development)
cd network
./hot-reload-charging.sh  # Example for charging chaincode
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Test blockchain network
docker ps  # Verify all containers running

# Test API endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/auth/login -X POST ...

# Run security monitoring tests
./test-security-monitoring.sh
```

### Frontend Testing

```bash
cd frontend

# Start frontend (backend must be running)
npm run dev

# Manual testing checklist
# - Login/Register
# - Dashboard view
# - Map and spot search
# - Create booking
# - Wallet operations
# - Transaction history
```

## 🛠️ Troubleshooting

### Common Issues

**Docker permission denied**:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**Port already in use**:
```bash
sudo lsof -i :7051  # Find process
kill -9 <PID>       # Kill process
```

**Containers won't start**:
```bash
cd backend/network
docker compose down --volumes
docker system prune -f
cd ..
./start.sh
```

See detailed troubleshooting in [HYPERLEDGER_BLOCKCHAIN.md](docs/setup/HYPERLEDGER_BLOCKCHAIN.md).

## 📊 API Endpoints

### Quick Reference

| Category | Endpoints |
|----------|-----------|
| **Authentication** | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me` |
| **Users** | `/users/:id`, `/users` (admin) |
| **Parking Spots** | `/parking/spots`, `/parking/spots/search`, `/parking/spots/available` |
| **Parking Bookings** | `/parking/reserve`, `/parking/checkin`, `/parking/checkout`, `/parking/cancel/:id` |
| **Charging Stations** | `/charging/stations`, `/charging/stations/search`, `/charging/stations/available` |
| **Charging Sessions** | `/charging/start`, `/charging/stop`, `/charging/sessions` |
| **Wallet** | `/wallet`, `/wallet/balance`, `/wallet/add-funds`, `/wallet/transactions` |
| **Security (Admin)** | `/security/dashboard`, `/security/events`, `/security/alerts` |

See complete API documentation in [API_DOCUMENTATION.md](docs/setup/API_DOCUMENTATION.md).

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Admin Role**: Role-based access control
- **Security Monitoring**: Real-time event logging and alerting
- **Brute Force Protection**: Automated detection and alerts
- **Blockchain Audit Trail**: Immutable transaction records
- **TLS/SSL**: Encrypted communication in production

## 🎓 Educational Value

This project demonstrates:
- **Blockchain Development**: Hyperledger Fabric implementation
- **Smart Contracts**: Chaincode development in Go
- **Full-Stack Development**: React + Go integration
- **Microservices Architecture**: Multi-organization blockchain network
- **Security Operations**: Mini SOC implementation
- **RESTful API Design**: Comprehensive API with best practices
- **DevOps**: Docker containerization and orchestration

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- **Mouhsiin** - [GitHub](https://github.com/mouhsiiin)

## 🙏 Acknowledgments

- Hyperledger Fabric Community
- Go Community
- React Community
- All contributors and testers

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [Create an issue](https://github.com/mouhsiiin/CityFlow-Parking/issues)
- **Email**: mouhsiin@example.com
- **Documentation**: See docs folder and markdown files

## 🗺️ Roadmap

Future enhancements:
- [ ] Mobile application (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] IoT device integration
- [ ] Machine learning for demand prediction
- [ ] Public blockchain explorer

## 📈 Project Status

**Current Version**: 1.0.0  
**Status**: Active Development  
**Last Updated**: January 2026

---

**Happy Coding! 🚀**
