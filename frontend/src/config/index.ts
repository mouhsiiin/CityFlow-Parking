// Environment variables configuration
// Create a .env file in the root directory with these variables:

// VITE_API_BASE_URL=http://localhost:8080/api
// VITE_BLOCKCHAIN_EXPLORER_URL=https://etherscan.io/tx  # Removed - not compatible with Hyperledger Fabric

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  blockchainExplorerUrl: import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL || null,
  enableBlockchainTracking: true,
  refreshInterval: 30000, // 30 seconds
};
