# CityFlow API Quick Reference

## Import Services
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

## Quick Reference Table

| Service | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| **Auth** |
| | `register()` | `POST /api/v1/auth/register` | Register new user |
| | `login()` | `POST /api/v1/auth/login` | User login |
| | `logout()` | `POST /api/v1/auth/logout` | User logout |
| | `getCurrentUser()` | `GET /api/v1/auth/me` | Get current user |
| **User** |
| | `getUser(id)` | `GET /api/v1/users/:id` | Get user details |
| | `updateUser(id, data)` | `PUT /api/v1/users/:id` | Update user |
| | `deleteUser(id)` | `DELETE /api/v1/users/:id` | Delete user |
| | `listAllUsers()` | `GET /api/v1/users` | List all users |
| | `getUserHistory(id)` | `GET /api/v1/users/:id/history` | Get user history |
| **Parking Spot** |
| | `getAllSpots()` | `GET /api/v1/parking/spots` | Get all spots |
| | `getSpot(id)` | `GET /api/v1/parking/spots/:id` | Get spot details |
| | `searchSpots(params)` | `GET /api/v1/parking/spots/search` | Search spots |
| | `getAvailableSpots()` | `GET /api/v1/parking/spots/available` | Get available spots |
| | `createSpot(data)` | `POST /api/v1/parking/spots` | Create spot (admin) |
| | `updateSpot(id, data)` | `PUT /api/v1/parking/spots/:id` | Update spot (admin) |
| | `deleteSpot(id)` | `DELETE /api/v1/parking/spots/:id` | Delete spot (admin) |
| **Parking Booking** |
| | `createBooking(data)` | `POST /api/v1/parking/reserve` | Create booking |
| | `checkIn(data)` | `POST /api/v1/parking/checkin` | Check in |
| | `checkOut(data)` | `POST /api/v1/parking/checkout` | Check out |
| | `extendBooking(data)` | `POST /api/v1/parking/extend` | Extend booking |
| | `cancelBooking(id)` | `DELETE /api/v1/parking/cancel/:id` | Cancel booking |
| | `getUserBookings()` | `GET /api/v1/parking/bookings` | Get user bookings |
| | `getBooking(id)` | `GET /api/v1/parking/bookings/:id` | Get booking details |
| | `getActiveBookings()` | `GET /api/v1/parking/bookings/active` | Get active bookings |
| | `getBookingHistory()` | `GET /api/v1/parking/bookings/history` | Get booking history |
| **Charging Station** |
| | `getAllStations()` | `GET /api/v1/charging/stations` | Get all stations |
| | `getStation(id)` | `GET /api/v1/charging/stations/:id` | Get station details |
| | `searchStations(params)` | `GET /api/v1/charging/stations/search` | Search stations |
| | `getAvailableStations()` | `GET /api/v1/charging/stations/available` | Get available stations |
| | `createStation(data)` | `POST /api/v1/charging/stations` | Create station (admin) |
| | `updateStation(id, data)` | `PUT /api/v1/charging/stations/:id` | Update station (admin) |
| | `deleteStation(id)` | `DELETE /api/v1/charging/stations/:id` | Delete station (admin) |
| **Charging Session** |
| | `startSession(data)` | `POST /api/v1/charging/start` | Start session |
| | `updateSession(id, data)` | `PUT /api/v1/charging/update/:id` | Update session |
| | `stopSession(data)` | `POST /api/v1/charging/stop` | Stop session |
| | `cancelSession(id)` | `DELETE /api/v1/charging/cancel/:id` | Cancel session |
| | `getUserSessions()` | `GET /api/v1/charging/sessions` | Get user sessions |
| | `getSession(id)` | `GET /api/v1/charging/sessions/:id` | Get session details |
| | `getActiveSessions()` | `GET /api/v1/charging/sessions/active` | Get active sessions |
| | `getSessionHistory()` | `GET /api/v1/charging/sessions/history` | Get session history |
| | `getEnergyStats()` | `GET /api/v1/charging/stats/energy` | Get energy stats |
| **Wallet** |
| | `createWallet()` | `POST /api/v1/wallet/create` | Create wallet |
| | `getWallet()` | `GET /api/v1/wallet` | Get wallet info |
| | `getBalance()` | `GET /api/v1/wallet/balance` | Get balance |
| | `addFunds(data)` | `POST /api/v1/wallet/add-funds` | Add funds |
| | `getTransactions()` | `GET /api/v1/wallet/transactions` | Get transactions |
| | `getTransaction(id)` | `GET /api/v1/wallet/transactions/:id` | Get transaction details |
| | `getTotalSpending()` | `GET /api/v1/wallet/spending` | Get total spending |
| **Payment** |
| | `processPayment(data)` | `POST /api/v1/payment/process` | Process payment |
| | `refundPayment(id, data)` | `POST /api/v1/payment/refund/:id` | Refund payment |
| | `getPaymentReceipt(id)` | `GET /api/v1/payment/receipt/:id` | Get receipt |

## Common Patterns

### Authentication Flow
```typescript
// 1. Login
const { token, user } = await authService.login({ email, password });
localStorage.setItem('authToken', token);

// 2. Use authenticated endpoints
const bookings = await parkingBookingService.getUserBookings();

// 3. Logout
await authService.logout();
localStorage.removeItem('authToken');
```

### Create Booking Flow
```typescript
// 1. Find available spots
const spots = await parkingSpotService.getAvailableSpots();

// 2. Create booking
const booking = await parkingBookingService.createBooking({
  spotId: spots[0].id,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 3600000).toISOString(),
});

// 3. Check in
await parkingBookingService.checkIn({ bookingId: booking.id });

// 4. Check out
await parkingBookingService.checkOut({ bookingId: booking.id });
```

### Charging Session Flow
```typescript
// 1. Find available station
const stations = await chargingStationService.getAvailableStations();

// 2. Start session
const session = await chargingSessionService.startSession({
  stationId: stations[0].id,
});

// 3. Stop session
await chargingSessionService.stopSession({ sessionId: session.id });
```

### Wallet & Payment Flow
```typescript
// 1. Check balance
const { balance } = await walletService.getBalance();

// 2. Add funds if needed
if (balance < 50) {
  await walletService.addFunds({ amount: 100 });
}

// 3. Process payment
const payment = await paymentService.processPayment({
  amount: 25.50,
  type: 'parking',
  referenceId: bookingId,
  description: 'Parking fee',
});
```

## Error Handling Pattern

```typescript
try {
  const result = await someService.someMethod();
  // Handle success
} catch (error) {
  if (error.response?.status === 404) {
    // Handle not found
  } else if (error.response?.status === 403) {
    // Handle forbidden
  } else {
    // Handle other errors
    console.error(error);
  }
}
```

## React Hook Example

```typescript
function useParkingSpots() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    parkingSpotService.getAvailableSpots()
      .then(setSpots)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { spots, loading, error };
}
```

## Environment Setup

```env
# .env
VITE_API_BASE_URL=http://localhost:8080
```

## TypeScript Types Location

All types are exported from `@/types`:
- `User`
- `ParkingSpot`
- `Reservation`
- `ChargingStation`
- `ChargingSession`
- `WalletInfo`
- `Transaction`
- `Payment`
- And more...

## Automatic Features

✅ **Auth Token** - Automatically added to all requests  
✅ **Token Storage** - Managed in localStorage  
✅ **Auto Redirect** - 401 errors redirect to login  
✅ **Type Safety** - Full TypeScript support  
✅ **Error Handling** - Centralized via interceptors  

## Testing Commands

```bash
# Start backend
cd backend && ./start.sh

# Start frontend
cd frontend && npm run dev
```

---

**Base URL**: `http://localhost:8080`  
**Total Endpoints**: 56  
**Last Updated**: 2024-01-15
