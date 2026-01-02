export interface User {
  id: string; // userId from blockchain
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  walletAddress: string;
  balance: number;
  role?: 'user' | 'admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Blockchain metadata
  txId?: string; // Transaction ID from Fabric
  blockNumber?: number;
}

export interface ParkingSpot {
  id: string; // spotId from blockchain
  spotNumber?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type: 'parking' | 'ev_charging'; // spotType in chaincode
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  pricePerHour: number;
  features?: string[];
  chargingPower?: number; // kW for EV charging
  hasEVCharging?: boolean;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Blockchain metadata
  txId?: string;
  blockNumber?: number;
}

export interface Reservation {
  id: string; // bookingId from blockchain
  spotId: string;
  userId: string;
  startTime: string;
  endTime: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  duration?: number; // hours
  pricePerHour: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalCost: number;
  qrCode?: string;
  paymentId?: string;
  transactionId?: string;
  blockchainTxHash?: string; // Fabric transaction ID
  createdAt?: string;
  updatedAt?: string;
  // Blockchain metadata
  blockNumber?: number;
  endorsingOrgs?: string[]; // Which orgs endorsed this transaction
}

export interface Transaction {
  id: string; // transactionId from blockchain
  walletId?: string;
  userId: string;
  type: 'debit' | 'credit' | 'payment' | 'refund' | 'deposit' | 'withdrawal';
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  timestamp: string;
  blockchainTxHash: string; // Fabric transaction ID
  status: 'pending' | 'confirmed' | 'completed' | 'failed';
  description: string;
  paymentId?: string;
  reservationId?: string;
  sessionId?: string; // For charging sessions
  // Blockchain metadata
  blockNumber?: number;
  endorsingOrgs?: string[];
}

export interface ChargingStation {
  id: string; // stationId from blockchain
  stationNumber?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  powerOutput: number; // kW
  pricePerKwh: number;
  connectorType: 'CCS' | 'CHAdeMO' | 'Type2' | 'Tesla';
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service';
  features?: string[];
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Blockchain metadata
  txId?: string;
  blockNumber?: number;
}

export interface ChargingSession {
  id: string; // sessionId from blockchain
  userId: string;
  stationId: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  energyConsumed: number; // kWh
  pricePerKwh: number;
  currentCost: number;
  totalCost: number;
  status: 'starting' | 'active' | 'completed' | 'cancelled';
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Blockchain metadata
  blockchainTxHash?: string;
  blockNumber?: number;
  endorsingOrgs?: string[];
}

export interface WalletInfo {
  id: string; // walletId from blockchain
  userId: string;
  address: string;
  balance: number;
  currency?: string;
  createdAt?: string;
  lastUpdated?: string;
  transactions?: Transaction[];
  // Blockchain metadata
  txId?: string;
  blockNumber?: number;
}

export interface Payment {
  id: string; // paymentId from blockchain
  walletId: string;
  userId: string;
  amount: number;
  type: 'parking' | 'charging' | 'refund';
  referenceId: string; // bookingId or sessionId
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  createdAt: string;
  completedAt?: string;
  // Blockchain metadata
  blockchainTxHash?: string;
  blockNumber?: number;
  endorsingOrgs?: string[];
}

export interface CreateReservationRequest {
  spotId: string;
  startTime: string;
  endTime: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchSpotsParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: 'parking' | 'ev_charging';
}

export interface SearchStationsParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  connectorType?: 'CCS' | 'CHAdeMO' | 'Type2' | 'Tesla';
}

export interface CreateBookingRequest {
  spotId: string;
  startTime: string;
  endTime: string;
}

export interface CheckInRequest {
  bookingId: string;
}

export interface CheckOutRequest {
  bookingId: string;
}

export interface ExtendBookingRequest {
  bookingId: string;
  newEndTime: string;
}

export interface StartChargingRequest {
  stationId: string;
  vehicleId?: string;
}

export interface StopChargingRequest {
  sessionId: string;
}

export interface UpdateChargingRequest {
  energyConsumed?: number;
  currentCost?: number;
}

export interface AddFundsRequest {
  amount: number;
}

export interface ProcessPaymentRequest {
  amount: number;
  type: 'parking' | 'charging' | 'refund';
  referenceId: string;
  description: string;
}

export interface RefundPaymentRequest {
  reason?: string;
}
