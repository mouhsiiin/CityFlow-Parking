package config

import (
	"os"
)

// Config holds application configuration
type Config struct {
	// Fabric connection settings
	FabricMSPID           string
	FabricCryptoPath      string
	FabricCertPath        string
	FabricKeyPath         string
	FabricTLSCertPath     string
	FabricPeerEndpoint    string
	FabricGatewayPeer     string

	// Channel names
	UserChannel     string
	ParkingChannel  string
	ChargingChannel string
	WalletChannel   string

	// Chaincode names
	UserChaincode     string
	ParkingChaincode  string
	ChargingChaincode string
	WalletChaincode   string

	// Server settings
	ServerPort string
	JWTSecret  string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	cfg := &Config{
		// Fabric settings
		FabricMSPID:        getEnv("FABRIC_MSP_ID", "Org1MSP"),
		FabricCryptoPath:   getEnv("FABRIC_CRYPTO_PATH", "/home/mot/blockchain/CityFlow-Parking-Backend/network/organizations"),
		FabricPeerEndpoint: getEnv("FABRIC_PEER_ENDPOINT", "localhost:7051"),
		FabricGatewayPeer:  getEnv("FABRIC_GATEWAY_PEER", "peer0.org1.example.com"),

		// Channel names
		UserChannel:     getEnv("USER_CHANNEL", "user-channel"),
		ParkingChannel:  getEnv("PARKING_CHANNEL", "parking-channel"),
		ChargingChannel: getEnv("CHARGING_CHANNEL", "charging-channel"),
		WalletChannel:   getEnv("WALLET_CHANNEL", "wallet-channel"),

		// Chaincode names
		UserChaincode:     getEnv("USER_CHAINCODE", "user"),
		ParkingChaincode:  getEnv("PARKING_CHAINCODE", "parking"),
		ChargingChaincode: getEnv("CHARGING_CHAINCODE", "charging"),
		WalletChaincode:   getEnv("WALLET_CHAINCODE", "wallet"),

		// Server settings
		ServerPort: getEnv("PORT", "8080"),
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key"),
	}

	// Set derived paths
	cfg.FabricCertPath = cfg.FabricCryptoPath + "/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/cert.pem"
	cfg.FabricKeyPath = cfg.FabricCryptoPath + "/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/"
	cfg.FabricTLSCertPath = cfg.FabricCryptoPath + "/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
