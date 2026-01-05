# Admin Panel Quick Start Guide

## Prerequisites

Before testing the admin panel, ensure:

1. ✅ Backend is running (`make dev` or `./start.sh` in backend/)
2. ✅ Hyperledger Fabric network is up
3. ✅ All chaincodes are deployed (user, parking, charging, wallet)
4. ✅ Frontend is running (`npm start` in frontend/)

## Creating an Admin User

You need a user with `role: "admin"` to access the admin panel. Here are a few options:

### Option 1: Create via API (Recommended)

```bash
# Register an admin user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "+1234567890",
    "role": "admin"
  }'
```

### Option 2: Modify Existing User in Chaincode

If you have access to the Fabric CLI:

```bash
# Invoke user chaincode to create admin
peer chaincode invoke \
  -C user-channel \
  -n user \
  -c '{"function":"CreateUser","Args":["user_admin_001","admin@admin.com","hashedpassword","Admin","User","+1234567890","admin"]}'
```

### Option 3: Register via Frontend and Manually Update

1. Register a normal user via `/login` page
2. Access the blockchain and update the user's role to "admin"

## Accessing the Admin Panel

### 1. Login
1. Navigate to http://localhost:5173 (or your frontend URL)
2. Login with admin credentials:
   - Email: `admin@admin.com`
   - Password: `admin123` (or your password)

### 2. Navigate to Admin
- After login, you should see an "Admin" link in the navigation bar
- Click "Admin" or navigate to http://localhost:5173/admin

### 3. Verify Access
You should see the Admin Dashboard with:
- Statistics cards (Parking Spots, Charging Stations, Occupancy Rate)
- Management action buttons

## Testing Parking Spot Management

### Create a Parking Spot

1. From Admin Dashboard, click "Create New Parking Spot"
   - OR navigate to: http://localhost:5173/admin/parking/create

2. Fill in the form:
   ```
   Spot Number: A-101
   Location Address: Downtown Parking Garage - Level 1
   Latitude: 40.7128
   Longitude: -74.0060
   Spot Type: standard
   Price per Hour: 5.00
   EV Charging: ✓ (checked)
   ```

3. Click "Create Spot"

4. You should be redirected to `/admin/parking` with the new spot visible

### View All Parking Spots

1. Navigate to `/admin/parking`
2. You should see all parking spots in a grid layout
3. Each card shows:
   - Spot number
   - Location
   - Status badge
   - Type and pricing
   - EV charging indicator
   - Edit and Delete buttons

### Edit a Parking Spot

1. On any spot card, click "Edit"
2. Modify any field (e.g., change price from 5.00 to 6.00)
3. Click "Update Spot"
4. Verify the change is reflected in the list

### Delete a Parking Spot

1. On any spot card, click "Delete"
2. Confirm the deletion dialog
3. The spot status should change to "maintenance"

## Testing Charging Station Management

### Create a Charging Station

1. From Admin Dashboard, click "Create New Charging Station"
   - OR navigate to: http://localhost:5173/admin/charging/create

2. Fill in the form:
   ```
   Station Number: CS-001
   Location Address: City Center Charging Hub
   Latitude: 40.7580
   Longitude: -73.9855
   Power Output: 50 (kW)
   Price per kWh: 0.30
   Connector Type: Type2
   ```

3. Click "Create Station"

4. You should be redirected to `/admin/charging` with the new station visible

### View All Charging Stations

1. Navigate to `/admin/charging`
2. You should see all charging stations in a grid layout
3. Each card shows:
   - Station number
   - Location
   - Status badge
   - Power output and pricing
   - Connector type
   - Edit and Delete buttons

### Edit a Charging Station

1. On any station card, click "Edit"
2. Modify any field (e.g., change power output from 50 to 150)
3. Click "Update Station"
4. Verify the change is reflected in the list

### Delete a Charging Station

1. On any station card, click "Delete"
2. Confirm the deletion dialog
3. The station status should change to "out-of-service"

## Testing Access Control

### Test Admin Access
1. Verify the "Admin" link appears in navbar when logged in as admin
2. Navigate to all admin routes - all should load successfully:
   - `/admin`
   - `/admin/parking`
   - `/admin/charging`

### Test Non-Admin Access
1. Logout from admin account
2. Register/login with a regular user account (without admin role)
3. Verify:
   - ✅ No "Admin" link in navbar
   - ✅ Attempting to access `/admin` redirects to `/dashboard`
   - ✅ Attempting to access `/admin/parking` redirects to `/dashboard`

## Troubleshooting

### Admin link not showing
- **Issue**: Logged in but don't see Admin link
- **Solution**: Check user role in localStorage or AuthContext
  ```javascript
  // In browser console
  console.log(JSON.parse(localStorage.getItem('user')).role);
  // Should output: "admin"
  ```

### Can't create spots/stations
- **Issue**: Form submission fails
- **Check**:
  1. Backend is running and accessible
  2. Chaincode is deployed properly
  3. Check browser console for errors
  4. Check backend logs for errors

### 401 Unauthorized errors
- **Issue**: Getting unauthorized errors
- **Solution**: 
  1. Ensure you're logged in
  2. Check if token is valid in localStorage
  3. Try logging out and logging back in

### 403 Forbidden errors
- **Issue**: Getting forbidden errors on admin endpoints
- **Solution**: 
  1. Verify user has admin role
  2. Check backend AdminMiddleware is working
  3. Verify token contains correct user info

### Data not showing
- **Issue**: Empty lists on management pages
- **Check**:
  1. Create some test data first
  2. Check browser console for API errors
  3. Verify chaincode queries are working
  4. Check backend API responses

## API Testing (Alternative)

You can also test admin endpoints directly with curl:

### Create Parking Spot
```bash
curl -X POST http://localhost:8080/api/v1/parking/spots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "spotNumber": "B-202",
    "location": "West Wing Parking",
    "latitude": 40.7500,
    "longitude": -74.0100,
    "spotType": "premium",
    "pricePerHour": 8.50,
    "hasEVCharging": true,
    "operatorId": "operator_001"
  }'
```

### Get All Parking Spots
```bash
curl http://localhost:8080/api/v1/parking/spots
```

### Create Charging Station
```bash
curl -X POST http://localhost:8080/api/v1/charging/stations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stationNumber": "CS-002",
    "location": "North Charging Hub",
    "latitude": 40.7600,
    "longitude": -74.0200,
    "powerOutput": 150,
    "pricePerKwh": 0.35,
    "connectorType": "CCS",
    "operatorId": "operator_001"
  }'
```

### Get JWT Token
```bash
# Login first to get token
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@admin.com",
    "password": "admin123"
  }'

# Extract token from response and use in subsequent requests
```

## Expected Behavior

### Successful Operations
- ✅ Create: Success message, redirect to list page, item appears in list
- ✅ Read: Items load quickly, displayed in grid layout
- ✅ Update: Changes reflected immediately, success feedback
- ✅ Delete: Confirmation dialog, status changes, removed from active list

### Error Handling
- ❌ Network errors: User-friendly error message displayed
- ❌ Validation errors: Form highlights invalid fields
- ❌ Permission errors: Redirect to appropriate page
- ❌ Duplicate entries: Backend returns error, user notified

## Next Steps

After verifying the admin panel works:

1. **Create Test Data**: Add multiple parking spots and charging stations
2. **Test User Flow**: Make bookings/sessions as regular user
3. **Monitor Changes**: Watch how admin panel reflects real-time data
4. **Test Edge Cases**: 
   - Very long location names
   - Extreme coordinates
   - Zero pricing
   - Maximum values

## Support

If you encounter issues:

1. Check browser console for frontend errors
2. Check backend logs for API errors
3. Verify Fabric network status
4. Review chaincode logs
5. Ensure all services are running

## Summary

The admin panel is now ready for use! You can:
- ✅ Manage parking spots (CRUD)
- ✅ Manage charging stations (CRUD)
- ✅ View statistics and metrics
- ✅ All changes are recorded on blockchain
- ✅ Access control ensures only admins can modify data
