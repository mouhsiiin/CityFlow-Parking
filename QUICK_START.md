# CityFlow Quick Start Guide

## 🚀 One-Command Setup

```bash
# Start everything
cd backend && ./start.sh && cd .. && cd backend && ./generate_test_data.sh && cd ../frontend && npm run dev
```

## 📋 Test Credentials

### Admin User (Full Access)
```
Email:    admin@cityflow.com
Password: admin123
Wallet:   $500.00
```

**Admin Access:**
- Security Dashboard: `/admin/security`
- Parking Management: `/admin/parking`
- Charging Management: `/admin/charging`
- All security monitoring features

### Regular Test Users
```
Email:    john.doe@example.com
Password: password123
Wallet:   $100.00

Email:    jane.smith@example.com
Password: password123

Email:    bob.wilson@example.com
Password: password123
```

## 🌐 Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| API Health | http://localhost:8080/health |
| Security Dashboard | http://localhost:5173/admin/security |
| Admin Dashboard | http://localhost:5173/admin |

## 🔧 Quick Commands

```bash
# Start Backend
cd backend
./start.sh

# Generate Test Data
cd backend
./generate_test_data.sh

# Start Frontend
cd frontend
npm run dev

# Stop Backend
cd backend
./stop.sh

# Generate Security Events
cd backend
./test-security-monitoring.sh

# View API Logs
cd backend
tail -f logs/api.log

# Check Running Containers
docker ps
```

## 📊 Test Data Summary

- **Users**: 1 admin + 3 regular users
- **Parking Spots**: 10 spots (P-001 to P-010)
- **Charging Stations**: 6 stations (CS-001 to CS-006)
- **Wallets**: Funded with initial balances
- **Locations**: Downtown, Airport, Mall, Hospital

## 🎯 Testing Workflow

### As Admin User
1. Login: `admin@cityflow.com` / `admin123`
2. Navigate to Security Dashboard (Shield icon in navbar)
3. View security events and health metrics
4. Manage parking spots: `/admin/parking`
5. Manage charging stations: `/admin/charging`
6. Create/edit infrastructure

### As Regular User
1. Login: `john.doe@example.com` / `password123`
2. Browse available spots on Map
3. Create a parking booking
4. Start a charging session
5. View wallet and transactions
6. Check booking history

## 🔐 Security Features

Admin users can access:
- Real-time security monitoring
- Event logging and filtering
- Security alerts
- System health scores
- IP tracking
- Brute force detection

## 📚 Documentation

- Main README: `/README.md`
- API Docs: `/API_DOCUMENTATION.md`
- Blockchain: `/HYPERLEDGER_BLOCKCHAIN.md`
- Security: `/SECURITY_MONITORING.md`
- Frontend: `/FRONTEND.md`
- Test Data: `/backend/TEST_DATA_README.md`

## 🐛 Troubleshooting

**Backend not starting?**
```bash
cd backend
docker ps -a  # Check containers
./stop.sh     # Stop everything
./start.sh    # Restart
```

**Frontend build errors?**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Can't create parking spots?**
```bash
# Make sure you're logged in as admin
# Check API logs for errors
cd backend
tail -f logs/api.log
```

## 💡 Quick Tips

- 🔒 Security Dashboard requires admin role
- 💳 Use "Add Funds" to increase wallet balance
- 🅿️ Parking spots show real-time availability
- ⚡ Charging sessions track energy consumption
- 🔍 All transactions are blockchain-verified
- 📱 UI is responsive for mobile devices

## 🎓 Learning Path

1. **Start Simple**: Login, explore dashboard
2. **Try Features**: Create booking, start session
3. **Admin Mode**: Login as admin, manage resources
4. **Security**: View security dashboard, events
5. **Blockchain**: Check transaction hashes, block numbers
6. **Advanced**: Generate security events, test alerts

---

**Need Help?** Check the documentation or logs!
