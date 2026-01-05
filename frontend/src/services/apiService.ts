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
    const response = await apiClient.post<{ booking?: any }>(API_ENDPOINTS.CREATE_RESERVATION, data);
    return parkingBookingService.mapBooking(response.booking || response);
  },

  checkIn: async (data: { bookingId: string }): Promise<Reservation> => {
    const response = await apiClient.post<{ booking?: any }>(API_ENDPOINTS.CHECKIN, data);
    return parkingBookingService.mapBooking(response.booking || response);
  },

  checkOut: async (data: { bookingId: string }): Promise<Reservation> => {
    const response = await apiClient.post<{ booking?: any }>(API_ENDPOINTS.CHECKOUT, data);
    return parkingBookingService.mapBooking(response.booking || response);
  },

  extendBooking: async (data: {
    bookingId: string;
    newEndTime: string;
  }): Promise<Reservation> => {
    const response = await apiClient.post<{ booking?: any }>(API_ENDPOINTS.EXTEND_BOOKING, data);
    return parkingBookingService.mapBooking(response.booking || response);
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.CANCEL_BOOKING(bookingId));
  },

  getUserBookings: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<{ bookings: any[] }>(API_ENDPOINTS.USER_BOOKINGS);
    const bookings = response.bookings || [];
    return bookings.map(parkingBookingService.mapBooking);
  },

  getBooking: async (bookingId: string): Promise<Reservation> => {
    const response = await apiClient.get<{ booking?: any }>(API_ENDPOINTS.BOOKING_BY_ID(bookingId));
    return parkingBookingService.mapBooking(response.booking || response);
  },

  getActiveBookings: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<{ bookings: any[] }>(API_ENDPOINTS.ACTIVE_BOOKINGS);
    const bookings = response.bookings || [];
    return bookings.map(parkingBookingService.mapBooking);
  },

  getBookingHistory: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<{ bookings: any[] }>(API_ENDPOINTS.BOOKING_HISTORY);
    const bookings = response.bookings || [];
    return bookings.map(parkingBookingService.mapBooking);
  },

  // Helper to map blockchain booking data to frontend Reservation type
  mapBooking: (booking: any): Reservation => ({
    id: booking.bookingId || booking.id,
    spotId: booking.spotId,
    userId: booking.userId,
    startTime: booking.startTime,
    endTime: booking.endTime,
    actualCheckIn: booking.actualCheckIn,
    actualCheckOut: booking.actualCheckOut,
    duration: booking.duration,
    pricePerHour: booking.pricePerHour,
    totalCost: booking.totalCost,
    status: booking.status,
    qrCode: booking.qrCode,
    paymentId: booking.paymentId,
    transactionId: booking.transactionId,
    blockchainTxHash: booking.transactionId || booking.bookingId,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    blockNumber: booking.blockNumber,
    endorsingOrgs: booking.endorsingOrgs,
  }),
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
    const response = await apiClient.post<{ session?: any }>(API_ENDPOINTS.START_CHARGING, data);
    return chargingSessionService.mapSession(response.session || response);
  },

  updateSession: async (sessionId: string, data: {
    energyConsumed?: number;
    currentCost?: number;
  }): Promise<ChargingSession> => {
    const response = await apiClient.put<{ session?: any }>(API_ENDPOINTS.UPDATE_CHARGING(sessionId), data);
    return chargingSessionService.mapSession(response.session || response);
  },

  stopSession: async (data: { sessionId: string }): Promise<ChargingSession> => {
    const response = await apiClient.post<{ session?: any }>(API_ENDPOINTS.STOP_CHARGING, data);
    return chargingSessionService.mapSession(response.session || response);
  },

  cancelSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.CANCEL_CHARGING(sessionId));
  },

  getUserSessions: async (): Promise<ChargingSession[]> => {
    const response = await apiClient.get<{ sessions: any[] }>(API_ENDPOINTS.USER_SESSIONS);
    const sessions = response.sessions || [];
    return sessions.map(chargingSessionService.mapSession);
  },

  getSession: async (sessionId: string): Promise<ChargingSession> => {
    const response = await apiClient.get<{ session?: any }>(API_ENDPOINTS.CHARGING_SESSION_BY_ID(sessionId));
    return chargingSessionService.mapSession(response.session || response);
  },

  getActiveSessions: async (): Promise<ChargingSession[]> => {
    const response = await apiClient.get<{ sessions: any[] }>(API_ENDPOINTS.ACTIVE_CHARGING_SESSIONS);
    const sessions = response.sessions || [];
    return sessions.map(chargingSessionService.mapSession);
  },

  getSessionHistory: async (): Promise<ChargingSession[]> => {
    const response = await apiClient.get<{ sessions: any[] }>(API_ENDPOINTS.CHARGING_HISTORY);
    const sessions = response.sessions || [];
    return sessions.map(chargingSessionService.mapSession);
  },

  getEnergyStats: async (): Promise<any> => {
    return apiClient.get<any>(API_ENDPOINTS.ENERGY_STATS);
  },

  // Helper to map blockchain session data to frontend ChargingSession type
  mapSession: (session: any): ChargingSession => ({
    id: session.sessionId || session.id,
    userId: session.userId,
    stationId: session.stationId,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    energyConsumed: session.energyConsumed,
    pricePerKwh: session.pricePerKwh,
    currentCost: session.currentCost,
    totalCost: session.totalCost,
    status: session.status,
    paymentId: session.paymentId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    blockchainTxHash: session.transactionId || session.sessionId,
    blockNumber: session.blockNumber,
    endorsingOrgs: session.endorsingOrgs,
  }),
};

// ==================== WALLET SERVICES ====================
export const walletService = {
  createWallet: async (): Promise<WalletInfo> => {
    await apiClient.post<{ walletId: string; message: string }>(API_ENDPOINTS.CREATE_WALLET);
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
      blockchainTxHash: tx.transactionId || tx.id, // Use transactionId as blockchain hash
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      status: tx.status || 'confirmed',
      paymentId: tx.paymentId,
      reservationId: tx.reservationId || tx.bookingId,
      sessionId: tx.sessionId,
      blockNumber: tx.blockNumber,
      endorsingOrgs: tx.endorsingOrgs,
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
      blockchainTxHash: tx.transactionId || tx.id,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      status: tx.status || 'confirmed',
      paymentId: tx.paymentId,
      reservationId: tx.reservationId || tx.bookingId,
      sessionId: tx.sessionId,
      blockNumber: tx.blockNumber,
      endorsingOrgs: tx.endorsingOrgs,
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
    const response = await apiClient.post<{ payment?: any }>(API_ENDPOINTS.PROCESS_PAYMENT, data);
    return paymentService.mapPayment(response.payment || response);
  },

  refundPayment: async (paymentId: string, data?: { reason?: string }): Promise<Payment> => {
    const response = await apiClient.post<{ payment?: any }>(API_ENDPOINTS.REFUND_PAYMENT(paymentId), data);
    return paymentService.mapPayment(response.payment || response);
  },

  getPaymentReceipt: async (paymentId: string): Promise<any> => {
    const response = await apiClient.get<{ receipt?: any }>(API_ENDPOINTS.PAYMENT_RECEIPT(paymentId));
    return response.receipt || response;
  },

  // Helper to map blockchain payment data to frontend Payment type
  mapPayment: (payment: any): Payment => ({
    id: payment.paymentId || payment.id,
    walletId: payment.walletId,
    userId: payment.userId,
    amount: payment.amount,
    type: payment.type,
    referenceId: payment.referenceId,
    status: payment.status,
    description: payment.description || '',
    createdAt: payment.createdAt,
    completedAt: payment.completedAt,
    blockchainTxHash: payment.transactionId || payment.paymentId,
    blockNumber: payment.blockNumber,
    endorsingOrgs: payment.endorsingOrgs,
  }),
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
