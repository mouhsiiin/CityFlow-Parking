# Admin Panel Documentation

## Overview

The CityFlow Parking Admin Panel provides comprehensive management capabilities for parking spots and charging stations. It's built on top of the Hyperledger Fabric blockchain infrastructure.

## Features

### Admin Dashboard (`/admin`)
- Overview statistics for parking spots and charging stations
- Quick access to management pages
- Real-time occupancy metrics

### Parking Spot Management (`/admin/parking`)
- View all parking spots in the system
- Create new parking spots
- Edit existing parking spots
- Delete/deactivate parking spots
- Filter by status (available, occupied, reserved, maintenance)
- View spot details including:
  - Spot number
  - Location and coordinates
  - Pricing
  - Type (standard, premium, disabled, compact)
  - EV charging availability

### Charging Station Management (`/admin/charging`)
- View all charging stations
- Create new charging stations
- Edit existing stations
- Delete/deactivate stations
- Filter by status (available, in-use, maintenance, out-of-service)
- View station details including:
  - Station number
  - Location and coordinates
  - Power output (kW)
  - Pricing per kWh
  - Connector type (Type2, CCS, CHAdeMO, Tesla)

## Access Control

### Role-Based Access
- Only users with `role: "admin"` can access admin pages
- Admin routes are protected by the `AdminRoute` component
- Non-admin users are automatically redirected to the dashboard
- Admin navigation link appears in navbar only for admin users

### Authentication Flow
1. User logs in with credentials
2. Backend validates and returns user data with role
3. Frontend AuthContext stores user information
4. AdminRoute checks user role before rendering admin pages

## API Endpoints

### Parking Spots
- `POST /api/v1/parking/spots` - Create parking spot (Admin only)
- `GET /api/v1/parking/spots` - Get all parking spots
- `GET /api/v1/parking/spots/:id` - Get specific parking spot
- `PUT /api/v1/parking/spots/:id` - Update parking spot (Admin only)
- `DELETE /api/v1/parking/spots/:id` - Delete parking spot (Admin only)

### Charging Stations
- `POST /api/v1/charging/stations` - Create charging station (Admin only)
- `GET /api/v1/charging/stations` - Get all charging stations
- `GET /api/v1/charging/stations/:id` - Get specific station
- `PUT /api/v1/charging/stations/:id` - Update station (Admin only)
- `DELETE /api/v1/charging/stations/:id` - Delete station (Admin only)

## Blockchain Integration

### Chaincode Functions

#### Parking Chaincode (`parking`)
- `CreateParkingSpot` - Creates a new parking spot on the blockchain
- `UpdateParkingSpot` - Updates parking spot details
- `GetParkingSpot` - Retrieves a parking spot
- `GetAllParkingSpots` - Lists all parking spots
- `UpdateSpotStatus` - Changes spot status
- `DeleteParkingSpot` - Soft deletes (sets to maintenance)

#### Charging Chaincode (`charging`)
- `CreateChargingStation` - Creates a new charging station
- `UpdateChargingStation` - Updates station details
- `GetChargingStation` - Retrieves a charging station
- `GetAllChargingStations` - Lists all stations
- `UpdateStationStatus` - Changes station status
- `DeleteChargingStation` - Soft deletes (sets to out-of-service)

## Frontend Structure

### Services
- `adminService.ts` - Admin-specific API calls
- Methods for CRUD operations on parking spots and stations
- Statistics aggregation

### Pages
- `AdminDashboard.tsx` - Main admin overview
- `ParkingManagement.tsx` - Parking spot list and management
- `ChargingManagement.tsx` - Charging station list and management
- `ParkingSpotForm.tsx` - Create/edit parking spot form
- `ChargingStationForm.tsx` - Create/edit charging station form

### Components
- `AdminRoute.tsx` - Protected route wrapper for admin pages
- Reuses existing components: `Card`, `Button`, `Input`, `Loading`

### Routes
```
/admin                          -> Admin Dashboard
/admin/parking                  -> Parking Management List
/admin/parking/create           -> Create Parking Spot Form
/admin/parking/edit/:id         -> Edit Parking Spot Form
/admin/charging                 -> Charging Station List
/admin/charging/create          -> Create Charging Station Form
/admin/charging/edit/:id        -> Edit Charging Station Form
```

## Usage Guide

### Creating a Parking Spot
1. Navigate to `/admin` or click "Admin" in navbar (if admin)
2. Click "Create New Parking Spot" or navigate to `/admin/parking/create`
3. Fill in the form:
   - Spot Number (required) - e.g., "A-101"
   - Location Address (required) - e.g., "Downtown Parking Garage"
   - Latitude/Longitude (optional)
   - Spot Type (required) - standard, premium, disabled, compact
   - Price per Hour (required)
   - EV Charging checkbox
4. Click "Create Spot"
5. Spot is created on the blockchain and appears in the list

### Creating a Charging Station
1. Navigate to `/admin` or click "Admin" in navbar
2. Click "Create New Charging Station" or navigate to `/admin/charging/create`
3. Fill in the form:
   - Station Number (required) - e.g., "CS-001"
   - Location Address (required)
   - Latitude/Longitude (optional)
   - Power Output in kW (required) - e.g., 50 for rapid charging
   - Price per kWh (required)
   - Connector Type (required) - Type2, CCS, CHAdeMO, Tesla
4. Click "Create Station"
5. Station is created on the blockchain and appears in the list

### Editing
1. Navigate to management page (`/admin/parking` or `/admin/charging`)
2. Click "Edit" button on the item you want to modify
3. Update the fields in the form
4. Click "Update Spot" or "Update Station"
5. Changes are committed to the blockchain

### Deleting
1. Navigate to management page
2. Click "Delete" button on the item
3. Confirm the deletion
4. Item is soft-deleted (status changed to maintenance/out-of-service)

## Development Notes

### Backend Requirements
- Go backend with Gin framework
- Hyperledger Fabric network running
- User chaincode with admin role support
- Parking and charging chaincodes deployed

### Middleware
- `AuthMiddleware` - Validates JWT token and session
- `AdminMiddleware` - Checks user role is "admin"

### Testing Admin Features
To test admin features, you need a user account with `role: "admin"` in the blockchain:

```go
// When creating a test admin user via chaincode
CreateUser(ctx, userId, email, passwordHash, firstName, lastName, phone, "admin")
```

## Security Considerations

1. **Role-Based Access Control**: Only users with admin role can access admin endpoints
2. **JWT Authentication**: All admin endpoints require valid JWT token
3. **Blockchain Validation**: All changes are validated and recorded on blockchain
4. **Frontend Protection**: AdminRoute component prevents unauthorized access
5. **Backend Validation**: AdminMiddleware validates role on every request

## Future Enhancements

Potential additions to the admin panel:
- Bulk operations (create/update multiple spots/stations)
- Advanced filtering and search
- Usage analytics and reporting
- User management (view/edit users, assign roles)
- Booking and session monitoring
- Real-time status updates via WebSockets
- Export data to CSV/Excel
- Audit logs and history tracking
- Map view for managing locations
- Pricing strategy management
