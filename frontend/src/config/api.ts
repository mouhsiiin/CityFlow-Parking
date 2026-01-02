export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
// Removed Etherscan - not compatible with Hyperledger Fabric
// Use Fabric Explorer or build custom blockchain viewer when available
export const BLOCKCHAIN_EXPLORER_URL = import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || null;

export const API_ENDPOINTS = {
  // Health Check
  HEALTH: '/health',
  
  // Auth (User Chaincode)
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  LOGOUT: '/api/v1/auth/logout',
  CURRENT_USER: '/api/v1/auth/me',
  
  // Users (User Chaincode)
  USER_BY_ID: (id: string) => `/api/v1/users/${id}`,
  UPDATE_USER: (id: string) => `/api/v1/users/${id}`,
  DELETE_USER: (id: string) => `/api/v1/users/${id}`,
  LIST_ALL_USERS: '/api/v1/users',
  USER_HISTORY: (id: string) => `/api/v1/users/${id}/history`,
  
  // Parking Spots (Parking Chaincode)
  SPOTS: '/api/v1/parking/spots',
  SPOT_BY_ID: (id: string) => `/api/v1/parking/spots/${id}`,
  AVAILABLE_SPOTS: '/api/v1/parking/spots/available',
  CREATE_SPOT: '/api/v1/parking/spots',
  UPDATE_SPOT: (id: string) => `/api/v1/parking/spots/${id}`,
  DELETE_SPOT: (id: string) => `/api/v1/parking/spots/${id}`,
  SEARCH_SPOTS: '/api/v1/parking/spots/search',
  
  // Parking Reservations (Parking Chaincode)
  CREATE_RESERVATION: '/api/v1/parking/reserve',
  CHECKIN: '/api/v1/parking/checkin',
  CHECKOUT: '/api/v1/parking/checkout',
  EXTEND_BOOKING: '/api/v1/parking/extend',
  CANCEL_BOOKING: (id: string) => `/api/v1/parking/cancel/${id}`,
  USER_BOOKINGS: '/api/v1/parking/bookings',
  BOOKING_BY_ID: (id: string) => `/api/v1/parking/bookings/${id}`,
  ACTIVE_BOOKINGS: '/api/v1/parking/bookings/active',
  BOOKING_HISTORY: '/api/v1/parking/bookings/history',
  
  // Charging Stations (Charging Chaincode)
  CHARGING_STATIONS: '/api/v1/charging/stations',
  CHARGING_STATION_BY_ID: (id: string) => `/api/v1/charging/stations/${id}`,
  AVAILABLE_STATIONS: '/api/v1/charging/stations/available',
  SEARCH_STATIONS: '/api/v1/charging/stations/search',
  CREATE_STATION: '/api/v1/charging/stations',
  UPDATE_STATION: (id: string) => `/api/v1/charging/stations/${id}`,
  DELETE_STATION: (id: string) => `/api/v1/charging/stations/${id}`,
  
  // Charging Sessions (Charging Chaincode)
  START_CHARGING: '/api/v1/charging/start',
  UPDATE_CHARGING: (id: string) => `/api/v1/charging/update/${id}`,
  STOP_CHARGING: '/api/v1/charging/stop',
  CANCEL_CHARGING: (id: string) => `/api/v1/charging/cancel/${id}`,
  USER_SESSIONS: '/api/v1/charging/sessions',
  CHARGING_SESSION_BY_ID: (id: string) => `/api/v1/charging/sessions/${id}`,
  ACTIVE_CHARGING_SESSIONS: '/api/v1/charging/sessions/active',
  CHARGING_HISTORY: '/api/v1/charging/sessions/history',
  ENERGY_STATS: '/api/v1/charging/stats/energy',
  
  // Wallet (Wallet Chaincode)
  CREATE_WALLET: '/api/v1/wallet/create',
  WALLET: '/api/v1/wallet',
  WALLET_BALANCE: '/api/v1/wallet/balance',
  WALLET_TRANSACTIONS: '/api/v1/wallet/transactions',
  WALLET_TRANSACTION_BY_ID: (id: string) => `/api/v1/wallet/transactions/${id}`,
  ADD_FUNDS: '/api/v1/wallet/add-funds',
  TOTAL_SPENDING: '/api/v1/wallet/spending',
  
  // Payments (Wallet Chaincode)
  PROCESS_PAYMENT: '/api/v1/payment/process',
  REFUND_PAYMENT: (id: string) => `/api/v1/payment/refund/${id}`,
  PAYMENT_RECEIPT: (id: string) => `/api/v1/payment/receipt/${id}`,
};
