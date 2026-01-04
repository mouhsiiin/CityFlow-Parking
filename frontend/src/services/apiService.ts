import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';
import type {
  User,
  ParkingSpot,
  Reservation,
  ChargingStation,
  ChargingSession,
  WalletInfo,
  Transaction,
  Payment,
  LoginRequest,
  LoginResponse,
} from '../types';

const AUTH_TOKEN_KEY = 'authToken';

// ==================== AUTH SERVICES ====================
export const authService = {
  register: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(API_ENDPOINTS.REGISTER, data);
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, credentials);
    // Persist token immediately so subsequent requests send Authorization header
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post<void>(API_ENDPOINTS.LOGOUT);
    } finally {
      // Always clear client token to avoid sending stale/invalid sessions
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINTS.CURRENT_USER);
  },

  // Alias used elsewhere in the app (AuthContext)
  getProfile: async (): Promise<User> => {
    return authService.getCurrentUser();
  },
};

// ==================== USER SERVICES ====================
export const userService = {
  getUser: async (userId: string): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINTS.USER_BY_ID(userId));
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(API_ENDPOINTS.UPDATE_USER(userId), data);
  },

  deleteUser: async (userId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.DELETE_USER(userId));
  },

  listAllUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>(API_ENDPOINTS.LIST_ALL_USERS);
  },

  getUserHistory: async (userId: string): Promise<any> => {
    return apiClient.get<any>(API_ENDPOINTS.USER_HISTORY(userId));
  },
};

// ==================== PARKING SPOT SERVICES ====================
export const parkingSpotService = {
  getAllSpots: async (): Promise<ParkingSpot[]> => {
    return apiClient.get<ParkingSpot[]>(API_ENDPOINTS.SPOTS);
  },

  getSpot: async (spotId: string): Promise<ParkingSpot> => {
    return apiClient.get<ParkingSpot>(API_ENDPOINTS.SPOT_BY_ID(spotId));
  },

  searchSpots: async (params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    type?: string;
  }): Promise<ParkingSpot[]> => {
    return apiClient.get<ParkingSpot[]>(API_ENDPOINTS.SEARCH_SPOTS, params);
  },

  getAvailableSpots: async (): Promise<ParkingSpot[]> => {
    return apiClient.get<ParkingSpot[]>(API_ENDPOINTS.AVAILABLE_SPOTS);
  },

  createSpot: async (data: Partial<ParkingSpot>): Promise<ParkingSpot> => {
    return apiClient.post<ParkingSpot>(API_ENDPOINTS.CREATE_SPOT, data);
  },

  updateSpot: async (spotId: string, data: Partial<ParkingSpot>): Promise<ParkingSpot> => {
    return apiClient.put<ParkingSpot>(API_ENDPOINTS.UPDATE_SPOT(spotId), data);
  },

  deleteSpot: async (spotId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.DELETE_SPOT(spotId));
  },
};

// ==================== PARKING BOOKING SERVICES ====================
export const parkingBookingService = {
  createBooking: async (data: {
    spotId: string;
    startTime: string;
    endTime: string;
  }): Promise<Reservation> => {
    return apiClient.post<Reservation>(API_ENDPOINTS.CREATE_RESERVATION, data);
  },

  checkIn: async (data: { bookingId: string }): Promise<Reservation> => {
    return apiClient.post<Reservation>(API_ENDPOINTS.CHECKIN, data);
  },

  checkOut: async (data: { bookingId: string }): Promise<Reservation> => {
    return apiClient.post<Reservation>(API_ENDPOINTS.CHECKOUT, data);
  },

  extendBooking: async (data: {
    bookingId: string;
    newEndTime: string;
  }): Promise<Reservation> => {
    return apiClient.post<Reservation>(API_ENDPOINTS.EXTEND_BOOKING, data);
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.CANCEL_BOOKING(bookingId));
  },

  getUserBookings: async (): Promise<Reservation[]> => {
    return apiClient.get<Reservation[]>(API_ENDPOINTS.USER_BOOKINGS);
  },

  getBooking: async (bookingId: string): Promise<Reservation> => {
    return apiClient.get<Reservation>(API_ENDPOINTS.BOOKING_BY_ID(bookingId));
  },

  getActiveBookings: async (): Promise<Reservation[]> => {
    return apiClient.get<Reservation[]>(API_ENDPOINTS.ACTIVE_BOOKINGS);
  },

  getBookingHistory: async (): Promise<Reservation[]> => {
    return apiClient.get<Reservation[]>(API_ENDPOINTS.BOOKING_HISTORY);
  },
};

// ==================== CHARGING STATION SERVICES ====================
export const chargingStationService = {
  getAllStations: async (): Promise<ChargingStation[]> => {
    return apiClient.get<ChargingStation[]>(API_ENDPOINTS.CHARGING_STATIONS);
  },

  getStation: async (stationId: string): Promise<ChargingStation> => {
    return apiClient.get<ChargingStation>(API_ENDPOINTS.CHARGING_STATION_BY_ID(stationId));
  },

  searchStations: async (params: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    connectorType?: string;
  }): Promise<ChargingStation[]> => {
    return apiClient.get<ChargingStation[]>(API_ENDPOINTS.SEARCH_STATIONS, params);
  },

  getAvailableStations: async (): Promise<ChargingStation[]> => {
    return apiClient.get<ChargingStation[]>(API_ENDPOINTS.AVAILABLE_STATIONS);
  },

  createStation: async (data: Partial<ChargingStation>): Promise<ChargingStation> => {
    return apiClient.post<ChargingStation>(API_ENDPOINTS.CREATE_STATION, data);
  },

  updateStation: async (stationId: string, data: Partial<ChargingStation>): Promise<ChargingStation> => {
    return apiClient.put<ChargingStation>(API_ENDPOINTS.UPDATE_STATION(stationId), data);
  },

  deleteStation: async (stationId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.DELETE_STATION(stationId));
  },
};

// ==================== CHARGING SESSION SERVICES ====================
export const chargingSessionService = {
  startSession: async (data: {
    stationId: string;
    vehicleId?: string;
  }): Promise<ChargingSession> => {
    return apiClient.post<ChargingSession>(API_ENDPOINTS.START_CHARGING, data);
  },

  updateSession: async (sessionId: string, data: {
    energyConsumed?: number;
    currentCost?: number;
  }): Promise<ChargingSession> => {
    return apiClient.put<ChargingSession>(API_ENDPOINTS.UPDATE_CHARGING(sessionId), data);
  },

  stopSession: async (data: { sessionId: string }): Promise<ChargingSession> => {
    return apiClient.post<ChargingSession>(API_ENDPOINTS.STOP_CHARGING, data);
  },

  cancelSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.CANCEL_CHARGING(sessionId));
  },

  getUserSessions: async (): Promise<ChargingSession[]> => {
    return apiClient.get<ChargingSession[]>(API_ENDPOINTS.USER_SESSIONS);
  },

  getSession: async (sessionId: string): Promise<ChargingSession> => {
    return apiClient.get<ChargingSession>(API_ENDPOINTS.CHARGING_SESSION_BY_ID(sessionId));
  },

  getActiveSessions: async (): Promise<ChargingSession[]> => {
    return apiClient.get<ChargingSession[]>(API_ENDPOINTS.ACTIVE_CHARGING_SESSIONS);
  },

  getSessionHistory: async (): Promise<ChargingSession[]> => {
    return apiClient.get<ChargingSession[]>(API_ENDPOINTS.CHARGING_HISTORY);
  },

  getEnergyStats: async (): Promise<any> => {
    return apiClient.get<any>(API_ENDPOINTS.ENERGY_STATS);
  },
};

// ==================== WALLET SERVICES ====================
export const walletService = {
  createWallet: async (): Promise<WalletInfo> => {
    const response = await apiClient.post<{ walletId: string; message: string }>(API_ENDPOINTS.CREATE_WALLET);
    // After creating, fetch the wallet details
    return walletService.getWallet();
  },

  getWallet: async (): Promise<WalletInfo> => {
    const response = await apiClient.get<{ wallet: any }>(API_ENDPOINTS.WALLET);
    const wallet = response.wallet;
    
    // Map blockchain wallet structure to frontend WalletInfo
    return {
      id: wallet.walletId,
      userId: wallet.userId,
      address: wallet.walletId, // Use walletId as address
      balance: wallet.balance || 0,
      currency: wallet.currency || 'USD',
      createdAt: wallet.createdAt,
      lastUpdated: wallet.lastUpdated,
    };
  },

  getBalance: async (): Promise<{ balance: number }> => {
    return apiClient.get<{ balance: number }>(API_ENDPOINTS.WALLET_BALANCE);
  },

  addFunds: async (data: { amount: number }): Promise<Transaction> => {
    return apiClient.post<Transaction>(API_ENDPOINTS.ADD_FUNDS, data);
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiClient.get<{ transactions: any[] }>(API_ENDPOINTS.WALLET_TRANSACTIONS);
    const transactions = response.transactions || [];
    
    // Map blockchain transaction structure to frontend Transaction type
    return transactions.map((tx: any) => ({
      id: tx.transactionId || tx.id,
      userId: tx.userId,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      timestamp: tx.timestamp,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      status: 'completed',
    }));
  },

  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.get<{ transaction: any }>(API_ENDPOINTS.WALLET_TRANSACTION_BY_ID(transactionId));
    const tx = response.transaction;
    
    return {
      id: tx.transactionId || tx.id,
      userId: tx.userId,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      timestamp: tx.timestamp,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      status: 'completed',
    };
  },

  getTotalSpending: async (): Promise<{ totalSpent: number }> => {
    const response = await apiClient.get<{ totalSpent: string | number }>(API_ENDPOINTS.TOTAL_SPENDING);
    const totalSpent = typeof response.totalSpent === 'string' 
      ? parseFloat(response.totalSpent) 
      : response.totalSpent;
    
    return { totalSpent: totalSpent || 0 };
  },
};

// ==================== PAYMENT SERVICES ====================
export const paymentService = {
  processPayment: async (data: {
    amount: number;
    type: string;
    referenceId: string;
    description: string;
  }): Promise<Payment> => {
    return apiClient.post<Payment>(API_ENDPOINTS.PROCESS_PAYMENT, data);
  },

  refundPayment: async (paymentId: string, data?: { reason?: string }): Promise<Payment> => {
    return apiClient.post<Payment>(API_ENDPOINTS.REFUND_PAYMENT(paymentId), data);
  },

  getPaymentReceipt: async (paymentId: string): Promise<any> => {
    return apiClient.get<any>(API_ENDPOINTS.PAYMENT_RECEIPT(paymentId));
  },
};

// ==================== EXPORT ALL ====================
export default {
  auth: authService,
  user: userService,
  parkingSpot: parkingSpotService,
  parkingBooking: parkingBookingService,
  chargingStation: chargingStationService,
  chargingSession: chargingSessionService,
  wallet: walletService,
  payment: paymentService,
};
