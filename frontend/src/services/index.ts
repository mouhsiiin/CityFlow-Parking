// Export the new comprehensive API service
export { default as apiService } from './apiService';
export * from './apiService';

// Export admin service
export { adminService } from './adminService';
export * from './adminService';

// Keep existing exports for backwards compatibility
import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';
import type {
  LoginRequest,
  LoginResponse,
  User,
  ParkingSpot,
  Reservation,
  CreateReservationRequest,
  ChargingStation,
  ChargingSession,
  WalletInfo,
  Transaction,
  ApiResponse,
} from '../types';
import {
  mockUsers,
  mockParkingSpots,
  mockReservations,
  mockChargingStations,
  mockChargingSessions,
  mockTransactions,
  mockWalletInfo,
  mockLoginResponse,
  simulateDelay,
} from './mockData';

// Set to true to use mock data (for testing without backend)
const USE_MOCK_DATA = false;
const AUTH_TOKEN_KEY = 'authToken';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const user = mockUsers.find(u => u.email === credentials.email);
      if (user) {
        return { ...mockLoginResponse, user };
      }
      throw new Error('Invalid credentials');
    }
    const response = await apiClient.post<{ token: string; user: any; message?: string }>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    
    // Transform backend response to match frontend User type
    const user: User = {
      id: response.user.userId || response.user.id,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      phone: response.user.phone,
      walletAddress: response.user.walletAddress || '0x0000000000000000000000000000000000000000',
      balance: response.user.balance || 0,
      role: response.user.role as 'user' | 'admin',
      isActive: response.user.isActive,
      createdAt: response.user.createdAt,
      updatedAt: response.user.updatedAt,
    };
    
    // Persist token immediately so subsequent requests include Authorization header
    if (response.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    }

    return { token: response.token, user };
  },

  async register(data: { 
    email: string; 
    password: string; 
    firstName: string;
    lastName: string;
    phone?: string;
    walletAddress?: string;
  }): Promise<LoginResponse> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const newUser: User = {
        id: 'user' + (mockUsers.length + 1).toString().padStart(3, '0'),
        email: data.email,
        firstName: 'New',
        lastName: 'User',
        walletAddress: data.walletAddress || '0x' + Math.random().toString(16).substr(2, 40),
        balance: 0,
        role: 'user',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        txId: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 10000) + 5000,
      };
      mockUsers.push(newUser);
      return { token: 'mock-jwt-token-' + Date.now(), user: newUser };
    }
    const response = await apiClient.post<{ message: string; userId: string }>(
      API_ENDPOINTS.REGISTER,
      data
    );
    // After registration, log the user in
    return this.login({ email: data.email, password: data.password });
  },

  async logout(): Promise<void> {
    if (USE_MOCK_DATA) {
      await simulateDelay(300);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    try {
      await apiClient.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  async getProfile(): Promise<User> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      return mockUsers[0];
    }
    const response = await apiClient.get<{ user: any }>(API_ENDPOINTS.CURRENT_USER);
    const userData = response.user;
    
    // Transform backend response to match frontend User type
    return {
      id: userData.userId || userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      walletAddress: userData.walletAddress || '0x0000000000000000000000000000000000000000',
      balance: userData.balance || 0,
      role: userData.role as 'user' | 'admin',
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  },
};

export const spotService = {
  async getAllSpots(): Promise<ParkingSpot[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      return mockParkingSpots;
    }
    return apiClient.get<ParkingSpot[]>(API_ENDPOINTS.SPOTS);
  },

  async getAvailableSpots(params?: { type?: 'parking' | 'ev_charging' }): Promise<ParkingSpot[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      let spots = mockParkingSpots.filter(s => s.status === 'available');
      if (params?.type) {
        spots = spots.filter(s => s.type === params.type);
      }
      return spots;
    }
    return apiClient.get<ParkingSpot[]>(API_ENDPOINTS.AVAILABLE_SPOTS, params);
  },

  async getSpotById(id: string): Promise<ParkingSpot> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      const spot = mockParkingSpots.find(s => s.id === id);
      if (!spot) throw new Error('Spot not found');
      return spot;
    }
    return apiClient.get<ParkingSpot>(API_ENDPOINTS.SPOT_BY_ID(id));
  },
};

export const reservationService = {
  async getUserReservations(): Promise<Reservation[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return mockReservations;
    }
    return apiClient.get<Reservation[]>(API_ENDPOINTS.USER_BOOKINGS);
  },

  async createReservation(data: CreateReservationRequest): Promise<Reservation> {
    if (USE_MOCK_DATA) {
      await simulateDelay(1000);
      const spot = mockParkingSpots.find(s => s.id === data.spotId);
      if (!spot) throw new Error('Spot not found');
      if (spot.status !== 'available') throw new Error('Spot not available');
      
      const duration = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60);
      const newReservation: Reservation = {
        id: 'booking' + (mockReservations.length + 1).toString().padStart(3, '0'),
        spotId: data.spotId,
        userId: 'user001',
        startTime: data.startTime,
        endTime: data.endTime,
        duration,
        pricePerHour: spot.pricePerHour,
        status: 'pending',
        totalCost: duration * spot.pricePerHour,
        qrCode: 'QR-BOOKING' + (mockReservations.length + 1) + '-2024',
        paymentId: 'payment' + (mockTransactions.length + 1).toString().padStart(3, '0'),
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blockNumber: Math.floor(Math.random() * 100) + 5200,
        endorsingOrgs: ['Org1MSP', 'Org3MSP'],
      };
      mockReservations.push(newReservation);
      spot.status = 'reserved';
      return newReservation;
    }
    return apiClient.post<Reservation>(API_ENDPOINTS.CREATE_RESERVATION, data);
  },

  async getReservationById(id: string): Promise<Reservation> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      const reservation = mockReservations.find(r => r.id === id);
      if (!reservation) throw new Error('Reservation not found');
      return reservation;
    }
    return apiClient.get<Reservation>(API_ENDPOINTS.BOOKING_BY_ID(id));
  },

  async cancelReservation(id: string): Promise<ApiResponse<void>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const reservation = mockReservations.find(r => r.id === id);
      if (reservation) {
        reservation.status = 'cancelled';
        const spot = mockParkingSpots.find(s => s.id === reservation.spotId);
        if (spot) spot.status = 'available';
      }
      return { success: true };
    }
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.CANCEL_BOOKING(id));
  },
};

export const walletService = {
  async getWalletInfo(): Promise<WalletInfo> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return mockWalletInfo;
    }
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

  async getTransactions(): Promise<Transaction[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      return mockTransactions;
    }
    return apiClient.get<Transaction[]>(API_ENDPOINTS.WALLET_TRANSACTIONS);
  },

  async deposit(amount: number): Promise<Transaction> {
    if (USE_MOCK_DATA) {
      await simulateDelay(1200);
      const newTransaction: Transaction = {
        id: 'tx' + (mockTransactions.length + 1).toString().padStart(3, '0'),
        walletId: 'wallet001',
        userId: 'user001',
        type: 'deposit',
        amount,
        balanceBefore: mockWalletInfo.balance,
        balanceAfter: mockWalletInfo.balance + amount,
        timestamp: new Date().toISOString(),
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'confirmed',
        description: 'Wallet deposit',
        blockNumber: Math.floor(Math.random() * 100) + 5200,
        endorsingOrgs: ['Org3MSP'],
      };
      mockTransactions.push(newTransaction);
      mockWalletInfo.balance += amount;
      mockUsers[0].balance = mockWalletInfo.balance;
      return newTransaction;
    }
    return apiClient.post<Transaction>(API_ENDPOINTS.ADD_FUNDS, { amount });
  },

  async withdraw(amount: number): Promise<Transaction> {
    if (USE_MOCK_DATA) {
      await simulateDelay(1200);
      if (amount > mockWalletInfo.balance) {
        throw new Error('Insufficient balance');
      }
      const newTransaction: Transaction = {
        id: 'tx' + (mockTransactions.length + 1).toString().padStart(3, '0'),
        walletId: 'wallet001',
        userId: 'user001',
        type: 'withdrawal',
        amount,
        balanceBefore: mockWalletInfo.balance,
        balanceAfter: mockWalletInfo.balance - amount,
        timestamp: new Date().toISOString(),
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
        status: 'confirmed',
        description: 'Wallet withdrawal',
        blockNumber: Math.floor(Math.random() * 100) + 5200,
        endorsingOrgs: ['Org3MSP'],
      };
      mockTransactions.push(newTransaction);
      mockWalletInfo.balance -= amount;
      mockUsers[0].balance = mockWalletInfo.balance;
      return newTransaction;
    }
    // Withdraw is not supported in the new API - use processPayment instead
    throw new Error('Withdraw endpoint not available');
  },
};

export const chargingService = {
  async getAllStations(): Promise<ChargingStation[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      return mockChargingStations;
    }
    return apiClient.get<ChargingStation[]>(API_ENDPOINTS.CHARGING_STATIONS);
  },

  async getAvailableStations(params?: { location?: string }): Promise<ChargingStation[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      let stations = mockChargingStations.filter(s => s.status === 'available');
      if (params?.location) {
        stations = stations.filter(s => s.location.address.includes(params.location!));
      }
      return stations;
    }
    return apiClient.get<ChargingStation[]>(API_ENDPOINTS.AVAILABLE_STATIONS, params);
  },

  async getStationById(id: string): Promise<ChargingStation> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      const station = mockChargingStations.find(s => s.id === id);
      if (!station) throw new Error('Station not found');
      return station;
    }
    return apiClient.get<ChargingStation>(API_ENDPOINTS.CHARGING_STATION_BY_ID(id));
  },

  async getUserSessions(): Promise<ChargingSession[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return mockChargingSessions;
    }
    return apiClient.get<ChargingSession[]>(API_ENDPOINTS.USER_SESSIONS);
  },

  async startSession(stationId: string): Promise<ChargingSession> {
    if (USE_MOCK_DATA) {
      await simulateDelay(1000);
      const station = mockChargingStations.find(s => s.id === stationId);
      if (!station) throw new Error('Station not found');
      if (station.status !== 'available') throw new Error('Station not available');
      
      const newSession: ChargingSession = {
        id: 'session' + (mockChargingSessions.length + 1).toString().padStart(3, '0'),
        userId: 'user001',
        stationId,
        startTime: new Date().toISOString(),
        duration: 0,
        energyConsumed: 0,
        pricePerKwh: station.pricePerKwh,
        currentCost: 0,
        totalCost: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blockchainTxHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 100) + 5200,
        endorsingOrgs: ['Org2MSP', 'Org3MSP'],
      };
      mockChargingSessions.push(newSession);
      station.status = 'in-use';
      return newSession;
    }
    return apiClient.post<ChargingSession>(API_ENDPOINTS.START_CHARGING, { stationId });
  },

  async stopSession(sessionId: string): Promise<ChargingSession> {
    if (USE_MOCK_DATA) {
      await simulateDelay(1000);
      const session = mockChargingSessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session not found');
      
      session.endTime = new Date().toISOString();
      session.status = 'completed';
      session.totalCost = session.currentCost;
      
      const station = mockChargingStations.find(s => s.id === session.stationId);
      if (station) station.status = 'available';
      
      return session;
    }
    return apiClient.post<ChargingSession>(API_ENDPOINTS.STOP_CHARGING, { sessionId });
  },

  async getSessionById(id: string): Promise<ChargingSession> {
    if (USE_MOCK_DATA) {
      await simulateDelay(400);
      const session = mockChargingSessions.find(s => s.id === id);
      if (!session) throw new Error('Session not found');
      return session;
    }
    return apiClient.get<ChargingSession>(API_ENDPOINTS.CHARGING_SESSION_BY_ID(id));
  },

  async getActiveSessions(): Promise<ChargingSession[]> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      return mockChargingSessions.filter(s => s.status === 'active');
    }
    return apiClient.get<ChargingSession[]>(API_ENDPOINTS.ACTIVE_CHARGING_SESSIONS);
  },

  async getEnergyStats(): Promise<{ totalEnergy: number; totalCost: number }> {
    if (USE_MOCK_DATA) {
      await simulateDelay(500);
      const completed = mockChargingSessions.filter(s => s.status === 'completed');
      const totalEnergy = completed.reduce((sum, s) => sum + s.energyConsumed, 0);
      const totalCost = completed.reduce((sum, s) => sum + s.totalCost, 0);
      return { totalEnergy, totalCost };
    }
    return apiClient.get(API_ENDPOINTS.ENERGY_STATS);
  },
};

export const blockchainService = {
  async verifyTransaction(hash: string): Promise<ApiResponse<any>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(800);
      const transaction = mockTransactions.find(t => t.blockchainTxHash === hash);
      const reservation = mockReservations.find(r => r.blockchainTxHash === hash);
      const session = mockChargingSessions.find(s => s.blockchainTxHash === hash);
      
      const item = transaction || reservation || session;
      
      return {
        success: !!item,
        data: item ? {
          txId: item.blockchainTxHash,
          blockNumber: item.blockNumber,
          timestamp: transaction ? transaction.timestamp : (reservation?.createdAt || session?.startTime || new Date().toISOString()),
          endorsingOrgs: item.endorsingOrgs,
          type: 'type' in item ? item.type : ('spotId' in item ? 'reservation' : 'charging-session'),
          valid: true,
        } : null,
        message: item ? 'Transaction verified' : 'Transaction not found',
      };
    }
    // Blockchain verification endpoints not available in current API
    throw new Error('Blockchain verification endpoint not available');
  },

  async getBlockInfo(blockNumber: number): Promise<ApiResponse<any>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(700);
      const transactions = mockTransactions.filter(t => t.blockNumber === blockNumber);
      const reservations = mockReservations.filter(r => r.blockNumber === blockNumber);
      const sessions = mockChargingSessions.filter(s => s.blockNumber === blockNumber);
      
      const items = [
        ...transactions,
        ...reservations,
        ...sessions,
      ];
      
      // Get the first available timestamp
      const timestamp = transactions[0]?.timestamp || reservations[0]?.createdAt || sessions[0]?.startTime || new Date().toISOString();
      
      return {
        success: true,
        data: {
          blockNumber,
          transactions: items.map(item => item.blockchainTxHash),
          timestamp,
          previousBlockHash: '0x' + Math.random().toString(16).substr(2, 64),
          dataHash: '0x' + Math.random().toString(16).substr(2, 64),
        },
        message: 'Block info retrieved',
      };
    }
    // Blockchain verification endpoints not available in current API
    throw new Error('Block info endpoint not available');
  },

  async getTransactionHistory(txId: string): Promise<ApiResponse<any>> {
    if (USE_MOCK_DATA) {
      await simulateDelay(600);
      return {
        success: true,
        data: mockTransactions.filter(t => t.userId === txId),
        message: 'Transaction history retrieved',
      };
    }
    // Use wallet transactions endpoint instead
    throw new Error('Transaction history endpoint not available - use walletService.getTransactions()');
  },
};
