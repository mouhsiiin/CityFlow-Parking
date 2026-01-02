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
	// Determine organization to use (default to UserService for backend API)
	orgName := getEnv("FABRIC_ORG", "userservice")
	
	// Get the working directory for crypto path
	workDir, _ := os.Getwd()
	defaultCryptoPath := workDir + "/network/crypto-config"
	
	cfg := &Config{
		// Fabric settings - Using UserService organization as default
		FabricMSPID:        getEnv("FABRIC_MSP_ID", "UserServiceMSP"),
		FabricCryptoPath:   getEnv("FABRIC_CRYPTO_PATH", defaultCryptoPath),
		FabricPeerEndpoint: getEnv("FABRIC_PEER_ENDPOINT", "localhost:9051"),
		FabricGatewayPeer:  getEnv("FABRIC_GATEWAY_PEER", "peer0.userservice.cityflow.com"),

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
		JWTSecret:  getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
	}

	// Set derived paths based on organization
	// Using Admin user for backend API operations
	orgDomain := orgName + ".cityflow.com"
	certDir := cfg.FabricCryptoPath + "/peerOrganizations/" + orgDomain + "/users/Admin@" + orgDomain + "/msp/signcerts/"
	cfg.FabricCertPath = certDir + "Admin@" + orgDomain + "-cert.pem"
	cfg.FabricKeyPath = cfg.FabricCryptoPath + "/peerOrganizations/" + orgDomain + "/users/Admin@" + orgDomain + "/msp/keystore/"
	cfg.FabricTLSCertPath = cfg.FabricCryptoPath + "/peerOrganizations/" + orgDomain + "/peers/peer0." + orgDomain + "/tls/ca.crt"

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
