# Test Data Generation

This directory contains a script to generate comprehensive test data for the CityFlow system.

## Quick Start

```bash
# Make sure backend is running
cd backend
./start.sh

# In another terminal, generate test data
cd backend
./generate_test_data.sh
```

## What Gets Created

### Users
- **Admin User**
  - Email: `admin@cityflow.com`
  - Password: `admin123`
  - Role: Admin
  - Wallet Balance: $500

- **Regular Test Users**
  - `john.doe@example.com` / `password123`
  - `jane.smith@example.com` / `password123`
  - `bob.wilson@example.com` / `password123`
  - Wallet Balance: $100 (first user only)

### Parking Spots (10 locations)
- Downtown Plaza (2 spots)
- City Center Mall (2 spots)
- Airport Parking (2 spots)
- Shopping Mall (2 spots)
- Hospital Zone (2 spots)

### Charging Stations (6 stations)
- Fast Charger Downtown (50 kW)
- Supercharger City Center (150 kW)
- Airport Fast Charger (75 kW)
- Mall Rapid Chargers (100 kW each)
- Hospital Charger (60 kW)

### Sample Transactions
- Sample parking booking (for first parking spot)
- Sample charging session (for first charging station)
- Wallet funding transactions

## Access Information

After running the script:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Security Dashboard**: http://localhost:5173/admin/security (admin only)

## Login Credentials

### Admin Access
```
Email: admin@cityflow.com
Password: admin123
```

Use admin credentials to:
- Access the Security Dashboard
- Manage parking spots and charging stations
- View all users and transactions
- Monitor security events

### Regular User Access
```
Email: john.doe@example.com
Password: password123
```

Use regular user credentials to:
- Browse parking spots and charging stations
- Create bookings and charging sessions
- Manage wallet and view transactions

## Script Features

- ✅ Automatic API health check
- ✅ Color-coded output for easy reading
- ✅ Handles existing users gracefully
- ✅ Creates realistic test data with proper locations
- ✅ Sets up wallets with initial balances
- ✅ Creates sample bookings and sessions
- ✅ Comprehensive summary at the end

## Troubleshooting

**API Not Running**
```bash
cd backend
./start.sh
# Wait for all services to start, then run the script again
```

**Users Already Exist**
The script handles this gracefully and will login with existing credentials.

**No Data Created**
Check the backend logs:
```bash
cd backend
tail -f logs/api.log
```

**Reset Everything**
To start fresh:
```bash
cd backend
./stop.sh
./start.sh
# Wait for services to start
./generate_test_data.sh
```

## Manual Testing

After generating test data, you can:

1. **Login as Admin** and explore:
   - Admin Dashboard (`/admin`)
   - Security Dashboard (`/admin/security`)
   - Parking Management (`/admin/parking`)
   - Charging Management (`/admin/charging`)

2. **Login as Regular User** and explore:
   - Dashboard with bookings
   - Map with available spots
   - Wallet with transactions
   - Create new bookings

3. **Test Security Monitoring**:
   ```bash
   # Generate security events
   ./test-security-monitoring.sh
   
   # View in Security Dashboard as admin
   ```

## Customization

Edit `generate_test_data.sh` to:
- Add more users
- Change parking spot locations
- Modify charging station specifications
- Adjust initial wallet balances
- Create additional test bookings

## Integration with CI/CD

This script can be used in CI/CD pipelines:

```bash
# In your CI pipeline
./backend/start.sh
sleep 30  # Wait for services
./backend/generate_test_data.sh
# Run your tests here
```
