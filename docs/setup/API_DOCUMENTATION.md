# API Documentation

Complete API reference for CityFlow Smart Parking & EV Charging System.

## Table of Contents
- [Quick Start](#quick-start)
- [Import Services](#import-services)
- [Authentication](#authentication)
- [User Management](#user-management)
- [Parking Spots](#parking-spots)
- [Parking Bookings](#parking-bookings)
- [Charging Stations](#charging-stations)
- [Charging Sessions](#charging-sessions)
- [Wallet Management](#wallet-management)
- [Payment Processing](#payment-processing)
- [API Endpoints Reference](#api-endpoints-reference)
- [Error Handling](#error-handling)

## Quick Start

### Environment Configuration
```env
# .env file
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Import Services in Frontend
```typescript
import {
  authService,
  userService,
  parkingSpotService,
  parkingBookingService,
  chargingStationService,
  chargingSessionService,
  walletService,
  paymentService,
} from '@/services';
```

## Authentication

### Register New User
```typescript
const response = await authService.register({
  email: 'user@example.com',
  password: 'securePassword123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
});
localStorage.setItem('authToken', response.token);
```

**Endpoint**: `POST /api/v1/auth/register`

### Login
```typescript
const response = await authService.login({
  email: 'user@example.com',
  password: 'securePassword123',
});
localStorage.setItem('authToken', response.token);
```

**Endpoint**: `POST /api/v1/auth/login`

### Get Current User
```typescript
const user = await authService.getCurrentUser();
```

**Endpoint**: `GET /api/v1/auth/me`

### Logout
```typescript
await authService.logout();
localStorage.removeItem('authToken');
```

**Endpoint**: `POST /api/v1/auth/logout`

## User Management

### Get User Details
```typescript
const user = await userService.getUser(userId);
```

**Endpoint**: `GET /api/v1/users/:id`

### Update User Profile
```typescript
const updatedUser = await userService.updateUser(userId, {
  firstName: 'Jane',
  phone: '+9876543210',
});
```

**Endpoint**: `PUT /api/v1/users/:id`

### List All Users (Admin)
```typescript
const users = await userService.listAllUsers();
```

**Endpoint**: `GET /api/v1/users`

### Get User History
```typescript
const history = await userService.getUserHistory(userId);
```

**Endpoint**: `GET /api/v1/users/:id/history`

### Delete User (Admin)
```typescript
await userService.deleteUser(userId);
```

**Endpoint**: `DELETE /api/v1/users/:id`

## Parking Spots

### Get All Parking Spots
```typescript
const spots = await parkingSpotService.getAllSpots();
```

**Endpoint**: `GET /api/v1/parking/spots`

### Get Available Spots
```typescript
const availableSpots = await parkingSpotService.getAvailableSpots();
```

**Endpoint**: `GET /api/v1/parking/spots/available`

### Search Parking Spots
```typescript
const spots = await parkingSpotService.searchSpots({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 5000, // meters
  type: 'parking',
});
```

**Endpoint**: `GET /api/v1/parking/spots/search`

### Get Spot Details
```typescript
const spot = await parkingSpotService.getSpot(spotId);
```

**Endpoint**: `GET /api/v1/parking/spots/:id`

### Create Spot (Admin)
```typescript
const newSpot = await parkingSpotService.createSpot({
  name: 'Parking Spot A1',
  location: 'Downtown Area',
  latitude: 40.7128,
  longitude: -74.0060,
  type: 'parking',
  pricePerHour: 5.00,
  status: 'available',
});
```

**Endpoint**: `POST /api/v1/parking/spots`

### Update Spot (Admin)
```typescript
const updatedSpot = await parkingSpotService.updateSpot(spotId, {
  status: 'maintenance',
  pricePerHour: 6.00,
});
```

**Endpoint**: `PUT /api/v1/parking/spots/:id`

### Delete Spot (Admin)
```typescript
await parkingSpotService.deleteSpot(spotId);
```

**Endpoint**: `DELETE /api/v1/parking/spots/:id`

## Parking Bookings

### Create Booking
```typescript
const booking = await parkingBookingService.createBooking({
  spotId: 'spot123',
  startTime: '2026-01-05T10:00:00Z',
  endTime: '2026-01-05T12:00:00Z',
  vehicleNumber: 'ABC-123',
});
```

**Endpoint**: `POST /api/v1/parking/reserve`

### Get User Bookings
```typescript
const bookings = await parkingBookingService.getUserBookings();
```

**Endpoint**: `GET /api/v1/parking/bookings`

### Get Active Bookings
```typescript
const activeBookings = await parkingBookingService.getActiveBookings();
```

**Endpoint**: `GET /api/v1/parking/bookings/active`

### Get Booking History
```typescript
const history = await parkingBookingService.getBookingHistory();
```

**Endpoint**: `GET /api/v1/parking/bookings/history`

### Check In
```typescript
const booking = await parkingBookingService.checkIn({
  bookingId: 'booking123',
});
```

**Endpoint**: `POST /api/v1/parking/checkin`

### Check Out
```typescript
const booking = await parkingBookingService.checkOut({
  bookingId: 'booking123',
});
```

**Endpoint**: `POST /api/v1/parking/checkout`

### Extend Booking
```typescript
const extendedBooking = await parkingBookingService.extendBooking({
  bookingId: 'booking123',
  newEndTime: '2026-01-05T14:00:00Z',
});
```

**Endpoint**: `POST /api/v1/parking/extend`

### Cancel Booking
```typescript
await parkingBookingService.cancelBooking(bookingId);
```

**Endpoint**: `DELETE /api/v1/parking/cancel/:id`

## Charging Stations

### Get All Charging Stations
```typescript
const stations = await chargingStationService.getAllStations();
```

**Endpoint**: `GET /api/v1/charging/stations`

### Get Available Stations
```typescript
const availableStations = await chargingStationService.getAvailableStations();
```

**Endpoint**: `GET /api/v1/charging/stations/available`

### Search Stations
```typescript
const stations = await chargingStationService.searchStations({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 5000,
  powerOutput: 'fast',
});
```

**Endpoint**: `GET /api/v1/charging/stations/search`

### Get Station Details
```typescript
const station = await chargingStationService.getStation(stationId);
```

**Endpoint**: `GET /api/v1/charging/stations/:id`

### Create Station (Admin)
```typescript
const newStation = await chargingStationService.createStation({
  name: 'Fast Charger A1',
  location: 'Downtown Charging Hub',
  latitude: 40.7128,
  longitude: -74.0060,
  powerOutput: 50, // kW
  pricePerKwh: 0.30,
  status: 'available',
});
```

**Endpoint**: `POST /api/v1/charging/stations`

### Update Station (Admin)
```typescript
const updatedStation = await chargingStationService.updateStation(stationId, {
  status: 'maintenance',
  pricePerKwh: 0.35,
});
```

**Endpoint**: `PUT /api/v1/charging/stations/:id`

### Delete Station (Admin)
```typescript
await chargingStationService.deleteStation(stationId);
```

**Endpoint**: `DELETE /api/v1/charging/stations/:id`

## Charging Sessions

### Start Charging Session
```typescript
const session = await chargingSessionService.startSession({
  stationId: 'station123',
  vehicleNumber: 'ABC-123',
});
```

**Endpoint**: `POST /api/v1/charging/start`

### Get User Sessions
```typescript
const sessions = await chargingSessionService.getUserSessions();
```

**Endpoint**: `GET /api/v1/charging/sessions`

### Get Active Sessions
```typescript
const activeSessions = await chargingSessionService.getActiveSessions();
```

**Endpoint**: `GET /api/v1/charging/sessions/active`

### Get Session History
```typescript
const history = await chargingSessionService.getSessionHistory();
```

**Endpoint**: `GET /api/v1/charging/sessions/history`

### Update Session
```typescript
const updatedSession = await chargingSessionService.updateSession(sessionId, {
  energyConsumed: 25.5,
});
```

**Endpoint**: `PUT /api/v1/charging/update/:id`

### Stop Charging Session
```typescript
const session = await chargingSessionService.stopSession({
  sessionId: 'session123',
});
```

**Endpoint**: `POST /api/v1/charging/stop`

### Cancel Session
```typescript
await chargingSessionService.cancelSession(sessionId);
```

**Endpoint**: `DELETE /api/v1/charging/cancel/:id`

### Get Energy Statistics
```typescript
const stats = await chargingSessionService.getEnergyStats();
```

**Endpoint**: `GET /api/v1/charging/stats/energy`

## Wallet Management

### Create Wallet
```typescript
const wallet = await walletService.createWallet();
```

**Endpoint**: `POST /api/v1/wallet/create`

### Get Wallet Information
```typescript
const wallet = await walletService.getWallet();
```

**Endpoint**: `GET /api/v1/wallet`

### Get Balance
```typescript
const { balance } = await walletService.getBalance();
```

**Endpoint**: `GET /api/v1/wallet/balance`

### Add Funds
```typescript
const transaction = await walletService.addFunds({
  amount: 50.00,
});
```

**Endpoint**: `POST /api/v1/wallet/add-funds`

### Get Transactions
```typescript
const transactions = await walletService.getTransactions();
```

**Endpoint**: `GET /api/v1/wallet/transactions`

### Get Transaction Details
```typescript
const transaction = await walletService.getTransaction(transactionId);
```

**Endpoint**: `GET /api/v1/wallet/transactions/:id`

### Get Total Spending
```typescript
const { totalSpent } = await walletService.getTotalSpending();
```

**Endpoint**: `GET /api/v1/wallet/spending`

## Payment Processing

### Process Payment
```typescript
const payment = await paymentService.processPayment({
  amount: 25.00,
  type: 'parking',
  referenceId: 'booking123',
});
```

**Endpoint**: `POST /api/v1/payment/process`

### Refund Payment
```typescript
const refund = await paymentService.refundPayment(paymentId, {
  reason: 'Cancellation',
});
```

**Endpoint**: `POST /api/v1/payment/refund/:id`

### Get Payment Receipt
```typescript
const receipt = await paymentService.getPaymentReceipt(paymentId);
```

**Endpoint**: `GET /api/v1/payment/receipt/:id`

## API Endpoints Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Auth** | POST | `/api/v1/auth/register` | Register new user |
| | POST | `/api/v1/auth/login` | User login |
| | POST | `/api/v1/auth/logout` | User logout |
| | GET | `/api/v1/auth/me` | Get current user |
| **User** | GET | `/api/v1/users/:id` | Get user details |
| | PUT | `/api/v1/users/:id` | Update user |
| | DELETE | `/api/v1/users/:id` | Delete user |
| | GET | `/api/v1/users` | List all users (admin) |
| | GET | `/api/v1/users/:id/history` | Get user history |
| **Parking Spot** | GET | `/api/v1/parking/spots` | Get all spots |
| | GET | `/api/v1/parking/spots/:id` | Get spot details |
| | GET | `/api/v1/parking/spots/search` | Search spots |
| | GET | `/api/v1/parking/spots/available` | Get available spots |
| | POST | `/api/v1/parking/spots` | Create spot (admin) |
| | PUT | `/api/v1/parking/spots/:id` | Update spot (admin) |
| | DELETE | `/api/v1/parking/spots/:id` | Delete spot (admin) |
| **Parking Booking** | POST | `/api/v1/parking/reserve` | Create booking |
| | POST | `/api/v1/parking/checkin` | Check in |
| | POST | `/api/v1/parking/checkout` | Check out |
| | POST | `/api/v1/parking/extend` | Extend booking |
| | DELETE | `/api/v1/parking/cancel/:id` | Cancel booking |
| | GET | `/api/v1/parking/bookings` | Get user bookings |
| | GET | `/api/v1/parking/bookings/:id` | Get booking details |
| | GET | `/api/v1/parking/bookings/active` | Get active bookings |
| | GET | `/api/v1/parking/bookings/history` | Get booking history |
| **Charging Station** | GET | `/api/v1/charging/stations` | Get all stations |
| | GET | `/api/v1/charging/stations/:id` | Get station details |
| | GET | `/api/v1/charging/stations/search` | Search stations |
| | GET | `/api/v1/charging/stations/available` | Get available stations |
| | POST | `/api/v1/charging/stations` | Create station (admin) |
| | PUT | `/api/v1/charging/stations/:id` | Update station (admin) |
| | DELETE | `/api/v1/charging/stations/:id` | Delete station (admin) |
| **Charging Session** | POST | `/api/v1/charging/start` | Start session |
| | PUT | `/api/v1/charging/update/:id` | Update session |
| | POST | `/api/v1/charging/stop` | Stop session |
| | DELETE | `/api/v1/charging/cancel/:id` | Cancel session |
| | GET | `/api/v1/charging/sessions` | Get user sessions |
| | GET | `/api/v1/charging/sessions/:id` | Get session details |
| | GET | `/api/v1/charging/sessions/active` | Get active sessions |
| | GET | `/api/v1/charging/sessions/history` | Get session history |
| | GET | `/api/v1/charging/stats/energy` | Get energy statistics |
| **Wallet** | POST | `/api/v1/wallet/create` | Create wallet |
| | GET | `/api/v1/wallet` | Get wallet info |
| | GET | `/api/v1/wallet/balance` | Get balance |
| | POST | `/api/v1/wallet/add-funds` | Add funds |
| | GET | `/api/v1/wallet/transactions` | Get transactions |
| | GET | `/api/v1/wallet/transactions/:id` | Get transaction details |
| | GET | `/api/v1/wallet/spending` | Get total spending |
| **Payment** | POST | `/api/v1/payment/process` | Process payment |
| | POST | `/api/v1/payment/refund/:id` | Refund payment |
| | GET | `/api/v1/payment/receipt/:id` | Get receipt |

## Error Handling

### Standard Error Handling Pattern
```typescript
try {
  const data = await someService.someMethod();
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    console.error('Error:', error.response.data.message);
    // Show user-friendly error message
  } else if (error.request) {
    // Request made but no response
    console.error('Network error');
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

### Automatic Features
- **Authentication**: Token automatically included in all requests via interceptor
- **Token Refresh**: Automatic token refresh on 401 responses
- **Error Handling**: Centralized error handling with meaningful messages
- **Request/Response Logging**: Automatic logging in development mode

## Testing

### Start Backend
```bash
cd backend
./start.sh
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### API Health Check
```bash
curl http://localhost:8080/health
```