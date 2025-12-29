package fabric

import (
	"crypto/x509"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/identity"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"github.com/SecurDrgorP/cityflow-parking-backend/internal/config"
)

// Client wraps the Fabric Gateway client
type Client struct {
	gateway        *client.Gateway
	grpcConnection *grpc.ClientConn
	config         *config.Config
}

// NewClient creates a new Fabric client
func NewClient(cfg *config.Config) (*Client, error) {
	// Create gRPC connection to the peer
	grpcConn, err := newGrpcConnection(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection: %w", err)
	}

	// Create identity
	id, err := newIdentity(cfg)
	if err != nil {
		grpcConn.Close()
		return nil, fmt.Errorf("failed to create identity: %w", err)
	}

	// Create signer
	sign, err := newSign(cfg)
	if err != nil {
		grpcConn.Close()
		return nil, fmt.Errorf("failed to create signer: %w", err)
	}

	// Create gateway connection
	gw, err := client.Connect(
		id,
		client.WithSign(sign),
		client.WithClientConnection(grpcConn),
		client.WithEvaluateTimeout(5*time.Second),
		client.WithEndorseTimeout(15*time.Second),
		client.WithSubmitTimeout(5*time.Second),
		client.WithCommitStatusTimeout(1*time.Minute),
	)
	if err != nil {
		grpcConn.Close()
		return nil, fmt.Errorf("failed to connect to gateway: %w", err)
	}

	return &Client{
		gateway:        gw,
		grpcConnection: grpcConn,
		config:         cfg,
	}, nil
}

// Close closes the Fabric client connections
func (c *Client) Close() {
	c.gateway.Close()
	c.grpcConnection.Close()
}

// GetUserContract returns the user chaincode contract
func (c *Client) GetUserContract() *client.Contract {
	network := c.gateway.GetNetwork(c.config.UserChannel)
	return network.GetContract(c.config.UserChaincode)
}

// GetParkingContract returns the parking chaincode contract
func (c *Client) GetParkingContract() *client.Contract {
	network := c.gateway.GetNetwork(c.config.ParkingChannel)
	return network.GetContract(c.config.ParkingChaincode)
}

// GetChargingContract returns the charging chaincode contract
func (c *Client) GetChargingContract() *client.Contract {
	network := c.gateway.GetNetwork(c.config.ChargingChannel)
	return network.GetContract(c.config.ChargingChaincode)
}

// GetWalletContract returns the wallet chaincode contract
func (c *Client) GetWalletContract() *client.Contract {
	network := c.gateway.GetNetwork(c.config.WalletChannel)
	return network.GetContract(c.config.WalletChaincode)
}

// newGrpcConnection creates a new gRPC connection to the peer
func newGrpcConnection(cfg *config.Config) (*grpc.ClientConn, error) {
	certificate, err := loadCertificate(cfg.FabricTLSCertPath)
	if err != nil {
		return nil, err
	}

	certPool := x509.NewCertPool()
	certPool.AddCert(certificate)
	transportCredentials := credentials.NewClientTLSFromCert(certPool, cfg.FabricGatewayPeer)

	connection, err := grpc.Dial(cfg.FabricPeerEndpoint, grpc.WithTransportCredentials(transportCredentials))
	if err != nil {
		return nil, fmt.Errorf("failed to create gRPC connection: %w", err)
	}

	return connection, nil
}

// newIdentity creates a new X509 identity
func newIdentity(cfg *config.Config) (*identity.X509Identity, error) {
	certificate, err := loadCertificate(cfg.FabricCertPath)
	if err != nil {
		return nil, err
	}

	id, err := identity.NewX509Identity(cfg.FabricMSPID, certificate)
	if err != nil {
		return nil, err
	}

	return id, nil
}

// newSign creates a new signer function
func newSign(cfg *config.Config) (identity.Sign, error) {
	// Find the private key file
	files, err := os.ReadDir(cfg.FabricKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read keystore directory: %w", err)
	}

	var keyPath string
	for _, file := range files {
		if !file.IsDir() {
			keyPath = filepath.Join(cfg.FabricKeyPath, file.Name())
			break
		}
	}

	if keyPath == "" {
		return nil, fmt.Errorf("no private key found in %s", cfg.FabricKeyPath)
	}

	privateKeyPEM, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read private key: %w", err)
	}

	privateKey, err := identity.PrivateKeyFromPEM(privateKeyPEM)
	if err != nil {
		return nil, err
	}

	sign, err := identity.NewPrivateKeySign(privateKey)
	if err != nil {
		return nil, err
	}

	return sign, nil
}

// loadCertificate loads an X509 certificate from file
func loadCertificate(filename string) (*x509.Certificate, error) {
	certificatePEM, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read certificate file: %w", err)
	}
	return identity.CertificateFromPEM(certificatePEM)
}
