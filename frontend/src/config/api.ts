export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
// Removed Etherscan - not compatible with Hyperledger Fabric
// Use Fabric Explorer or build custom blockchain viewer when available
export const BLOCKCHAIN_EXPLORER_URL = import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || null;

export const API_ENDPOINTS = {
  // Auth (User Chaincode)
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users (User Chaincode)
  USER_PROFILE: '/users/profile',
  USER_BY_ID: (id: string) => `/users/${id}`,
  UPDATE_USER: (id: string) => `/users/${id}`,
  
  // Parking Spots (Parking Chaincode)
  SPOTS: '/parking/spots',
  SPOT_BY_ID: (id: string) => `/parking/spots/${id}`,
  AVAILABLE_SPOTS: '/parking/spots/available',
  CREATE_SPOT: '/parking/spots',
  UPDATE_SPOT: (id: string) => `/parking/spots/${id}`,
  SEARCH_SPOTS: '/parking/spots/search',
  
  // Parking Reservations (Parking Chaincode)
  RESERVATIONS: '/parking/bookings',
  RESERVATION_BY_ID: (id: string) => `/parking/bookings/${id}`,
  USER_RESERVATIONS: '/parking/bookings',
  CREATE_RESERVATION: '/parking/reserve',
  CANCEL_RESERVATION: (id: string) => `/parking/cancel/${id}`,
  CHECKIN_RESERVATION: '/parking/checkin',
  CHECKOUT_RESERVATION: '/parking/checkout',
  EXTEND_RESERVATION: (id: string) => `/parking/extend/${id}`,
  ACTIVE_RESERVATIONS: '/parking/bookings/active',
  RESERVATION_HISTORY: '/parking/bookings/history',
  
  // Charging Stations (Charging Chaincode)
  CHARGING_STATIONS: '/charging/stations',
  CHARGING_STATION_BY_ID: (id: string) => `/charging/stations/${id}`,
  AVAILABLE_STATIONS: '/charging/stations/available',
  SEARCH_STATIONS: '/charging/stations/search',
  
  // Charging Sessions (Charging Chaincode)
  CHARGING_SESSIONS: '/charging/sessions',
  CHARGING_SESSION_BY_ID: (id: string) => `/charging/sessions/${id}`,
  START_CHARGING: '/charging/start',
  STOP_CHARGING: '/charging/stop',
  UPDATE_CHARGING: (id: string) => `/charging/update/${id}`,
  CANCEL_CHARGING: (id: string) => `/charging/cancel/${id}`,
  ACTIVE_CHARGING_SESSIONS: '/charging/sessions/active',
  CHARGING_HISTORY: '/charging/sessions/history',
  ENERGY_STATS: '/charging/stats/energy',
  
  // Wallet (Wallet Chaincode)
  WALLET: '/wallet',
  WALLET_BY_ID: (id: string) => `/wallet/${id}`,
  WALLET_BALANCE: '/wallet/balance',
  WALLET_TRANSACTIONS: '/wallet/transactions',
  ADD_FUNDS: '/wallet/add-funds',
  DEPOSIT: '/wallet/deposit',
  WITHDRAW: '/wallet/withdraw',
  
  // Payments (Wallet Chaincode)
  PROCESS_PAYMENT: '/payment/process',
  REFUND_PAYMENT: (id: string) => `/payment/refund/${id}`,
  PAYMENT_RECEIPT: (id: string) => `/payment/receipt/${id}`,
  PAYMENT_HISTORY: '/payment/history',
  
  // Blockchain Verification
  VERIFY_TRANSACTION: (hash: string) => `/blockchain/verify/${hash}`,
  BLOCK_INFO: (blockNumber: number) => `/blockchain/block/${blockNumber}`,
  TRANSACTION_HISTORY: (txId: string) => `/blockchain/transaction/${txId}`,
};
