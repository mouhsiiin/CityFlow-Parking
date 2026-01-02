# API Usage Guide

This guide demonstrates how to use the integrated API services in the CityFlow Parking frontend application.

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

// Or import the default export
import apiService from '@/services/apiService';
```

## Authentication

### Register a New User
```typescript
const handleRegister = async () => {
  try {
    const response = await authService.register({
      email: 'user@example.com',
      password: 'securePassword123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
    });
    
    // Store token
    localStorage.setItem('authToken', response.token);
    console.log('User registered:', response.user);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};
```

### Login
```typescript
const handleLogin = async () => {
  try {
    const response = await authService.login({
      email: 'user@example.com',
      password: 'securePassword123',
    });
    
    localStorage.setItem('authToken', response.token);
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Get Current User
```typescript
const fetchCurrentUser = async () => {
  try {
    const user = await authService.getCurrentUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
};
```

### Logout
```typescript
const handleLogout = async () => {
  try {
    await authService.logout();
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## User Management

### Get User Details
```typescript
const getUserDetails = async (userId: string) => {
  try {
    const user = await userService.getUser(userId);
    console.log('User details:', user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
};
```

### Update User Profile
```typescript
const updateProfile = async (userId: string) => {
  try {
    const updatedUser = await userService.updateUser(userId, {
      firstName: 'Jane',
      phone: '+9876543210',
    });
    console.log('Updated user:', updatedUser);
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### List All Users (Admin)
```typescript
const listUsers = async () => {
  try {
    const users = await userService.listAllUsers();
    console.log('All users:', users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};
```

## Parking Spots

### Get All Parking Spots
```typescript
const fetchParkingSpots = async () => {
  try {
    const spots = await parkingSpotService.getAllSpots();
    console.log('Parking spots:', spots);
  } catch (error) {
    console.error('Failed to fetch spots:', error);
  }
};
```

### Search for Parking Spots
```typescript
const searchSpots = async () => {
  try {
    const spots = await parkingSpotService.searchSpots({
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 5000, // meters
      type: 'parking',
    });
    console.log('Found spots:', spots);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Get Available Parking Spots
```typescript
const getAvailableSpots = async () => {
  try {
    const spots = await parkingSpotService.getAvailableSpots();
    console.log('Available spots:', spots);
  } catch (error) {
    console.error('Failed to fetch available spots:', error);
  }
};
```

### Create Parking Spot (Admin)
```typescript
const createSpot = async () => {
  try {
    const newSpot = await parkingSpotService.createSpot({
      spotNumber: 'A-123',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY',
      },
      type: 'parking',
      status: 'available',
      pricePerHour: 5.00,
      features: ['covered', 'security-camera'],
    });
    console.log('Created spot:', newSpot);
  } catch (error) {
    console.error('Failed to create spot:', error);
  }
};
```

## Parking Bookings

### Create a Booking
```typescript
const createBooking = async () => {
  try {
    const booking = await parkingBookingService.createBooking({
      spotId: 'spot-123',
      startTime: '2024-01-15T10:00:00Z',
      endTime: '2024-01-15T14:00:00Z',
    });
    console.log('Booking created:', booking);
  } catch (error) {
    console.error('Booking failed:', error);
  }
};
```

### Check In
```typescript
const checkIn = async (bookingId: string) => {
  try {
    const booking = await parkingBookingService.checkIn({ bookingId });
    console.log('Checked in:', booking);
  } catch (error) {
    console.error('Check-in failed:', error);
  }
};
```

### Check Out
```typescript
const checkOut = async (bookingId: string) => {
  try {
    const booking = await parkingBookingService.checkOut({ bookingId });
    console.log('Checked out:', booking);
  } catch (error) {
    console.error('Check-out failed:', error);
  }
};
```

### Extend Booking
```typescript
const extendBooking = async (bookingId: string) => {
  try {
    const booking = await parkingBookingService.extendBooking({
      bookingId,
      newEndTime: '2024-01-15T16:00:00Z',
    });
    console.log('Booking extended:', booking);
  } catch (error) {
    console.error('Extension failed:', error);
  }
};
```

### Get Active Bookings
```typescript
const getActiveBookings = async () => {
  try {
    const bookings = await parkingBookingService.getActiveBookings();
    console.log('Active bookings:', bookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};
```

### Get Booking History
```typescript
const getBookingHistory = async () => {
  try {
    const history = await parkingBookingService.getBookingHistory();
    console.log('Booking history:', history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
  }
};
```

## Charging Stations

### Get All Charging Stations
```typescript
const fetchStations = async () => {
  try {
    const stations = await chargingStationService.getAllStations();
    console.log('Charging stations:', stations);
  } catch (error) {
    console.error('Failed to fetch stations:', error);
  }
};
```

### Search Charging Stations
```typescript
const searchStations = async () => {
  try {
    const stations = await chargingStationService.searchStations({
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 5000,
      connectorType: 'Type2',
    });
    console.log('Found stations:', stations);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

### Get Available Charging Stations
```typescript
const getAvailableStations = async () => {
  try {
    const stations = await chargingStationService.getAvailableStations();
    console.log('Available stations:', stations);
  } catch (error) {
    console.error('Failed to fetch available stations:', error);
  }
};
```

## Charging Sessions

### Start Charging Session
```typescript
const startCharging = async (stationId: string) => {
  try {
    const session = await chargingSessionService.startSession({
      stationId,
      vehicleId: 'vehicle-123',
    });
    console.log('Charging started:', session);
  } catch (error) {
    console.error('Failed to start charging:', error);
  }
};
```

### Stop Charging Session
```typescript
const stopCharging = async (sessionId: string) => {
  try {
    const session = await chargingSessionService.stopSession({ sessionId });
    console.log('Charging stopped:', session);
  } catch (error) {
    console.error('Failed to stop charging:', error);
  }
};
```

### Get Active Sessions
```typescript
const getActiveSessions = async () => {
  try {
    const sessions = await chargingSessionService.getActiveSessions();
    console.log('Active charging sessions:', sessions);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
};
```

### Get Energy Stats
```typescript
const getEnergyStats = async () => {
  try {
    const stats = await chargingSessionService.getEnergyStats();
    console.log('Energy statistics:', stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};
```

## Wallet Management

### Create Wallet
```typescript
const createWallet = async () => {
  try {
    const wallet = await walletService.createWallet();
    console.log('Wallet created:', wallet);
  } catch (error) {
    console.error('Failed to create wallet:', error);
  }
};
```

### Get Wallet Balance
```typescript
const getBalance = async () => {
  try {
    const { balance } = await walletService.getBalance();
    console.log('Current balance:', balance);
  } catch (error) {
    console.error('Failed to fetch balance:', error);
  }
};
```

### Add Funds
```typescript
const addFunds = async (amount: number) => {
  try {
    const transaction = await walletService.addFunds({ amount });
    console.log('Funds added:', transaction);
  } catch (error) {
    console.error('Failed to add funds:', error);
  }
};
```

### Get Transactions
```typescript
const getTransactions = async () => {
  try {
    const transactions = await walletService.getTransactions();
    console.log('Transaction history:', transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  }
};
```

### Get Total Spending
```typescript
const getTotalSpending = async () => {
  try {
    const { totalSpent } = await walletService.getTotalSpending();
    console.log('Total spending:', totalSpent);
  } catch (error) {
    console.error('Failed to fetch spending:', error);
  }
};
```

## Payment Processing

### Process Payment
```typescript
const processPayment = async () => {
  try {
    const payment = await paymentService.processPayment({
      amount: 25.50,
      type: 'parking',
      referenceId: 'booking-123',
      description: 'Parking fee for 5 hours',
    });
    console.log('Payment processed:', payment);
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### Refund Payment
```typescript
const refundPayment = async (paymentId: string) => {
  try {
    const refund = await paymentService.refundPayment(paymentId, {
      reason: 'Booking cancelled by user',
    });
    console.log('Refund processed:', refund);
  } catch (error) {
    console.error('Refund failed:', error);
  }
};
```

### Get Payment Receipt
```typescript
const getReceipt = async (paymentId: string) => {
  try {
    const receipt = await paymentService.getPaymentReceipt(paymentId);
    console.log('Payment receipt:', receipt);
  } catch (error) {
    console.error('Failed to fetch receipt:', error);
  }
};
```

## Using in React Components

### Example: Login Component
```typescript
import React, { useState } from 'react';
import { authService } from '@/services';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('authToken', response.token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Example: Parking Spots List Component
```typescript
import React, { useEffect, useState } from 'react';
import { parkingSpotService } from '@/services';
import { ParkingSpot } from '@/types';

const ParkingSpotsList = () => {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const data = await parkingSpotService.getAvailableSpots();
        setSpots(data);
      } catch (error) {
        console.error('Failed to fetch spots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Available Parking Spots</h2>
      <div className="spots-grid">
        {spots.map((spot) => (
          <div key={spot.id} className="spot-card">
            <h3>{spot.spotNumber}</h3>
            <p>{spot.location.address}</p>
            <p>${spot.pricePerHour}/hour</p>
            <button>Reserve</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Error Handling

The API client automatically handles:
- Adding authentication tokens to requests
- Redirecting to login on 401 Unauthorized responses
- Token management in localStorage

Always wrap API calls in try-catch blocks to handle errors gracefully:

```typescript
try {
  const data = await someService.someMethod();
  // Handle success
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Resource not found');
  } else if (error.response?.status === 403) {
    console.error('Access forbidden');
  } else {
    console.error('An error occurred:', error);
  }
}
```

## Environment Configuration

Make sure to set the API base URL in your `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For production:
```env
VITE_API_BASE_URL=https://api.cityflow.com
```
