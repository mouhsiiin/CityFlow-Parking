package api

import (
	"github.com/gin-gonic/gin"

	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/config"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/fabric"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/api/handlers"
	"github.com/mouhsiiin/CityFlow-Parking/backend/internal/api/middleware"
)

// Server represents the API server
type Server struct {
	router       *gin.Engine
	config       *config.Config
	fabricClient *fabric.Client
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, fabricClient *fabric.Client) *Server {
	router := gin.Default()

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())

	server := &Server{
		router:       router,
		config:       cfg,
		fabricClient: fabricClient,
	}

	server.setupRoutes()

	return server
}

// setupRoutes sets up all API routes
func (s *Server) setupRoutes() {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(s.fabricClient)
	userHandler := handlers.NewUserHandler(s.fabricClient)
	parkingHandler := handlers.NewParkingHandler(s.fabricClient)
	chargingHandler := handlers.NewChargingHandler(s.fabricClient)
	walletHandler := handlers.NewWalletHandler(s.fabricClient)

	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "cityflow-parking-api"})
	})

	// API v1 routes
	v1 := s.router.Group("/api/v1")
	{
		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(s.fabricClient), authHandler.Logout)
			auth.GET("/me", middleware.AuthMiddleware(s.fabricClient), authHandler.GetCurrentUser)
		}

		// User routes (protected)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(s.fabricClient))
		{
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.GET("", middleware.AdminMiddleware(), userHandler.ListAllUsers)
			users.GET("/:id/history", userHandler.GetUserHistory)
		}

		// Parking spot routes
		parking := v1.Group("/parking")
		{
			// Public routes - specific routes BEFORE parameterized routes
			parking.GET("/spots/search", parkingHandler.SearchSpots)
			parking.GET("/spots/available", parkingHandler.GetAvailableSpots)
			parking.GET("/spots", parkingHandler.GetAllSpots)
			parking.GET("/spots/:id", parkingHandler.GetSpot)

			// Protected routes
			protected := parking.Group("")
			protected.Use(middleware.AuthMiddleware(s.fabricClient))
			{
				// Admin only
				protected.POST("/spots", middleware.AdminMiddleware(), parkingHandler.CreateSpot)
				protected.PUT("/spots/:id", middleware.AdminMiddleware(), parkingHandler.UpdateSpot)
				protected.DELETE("/spots/:id", middleware.AdminMiddleware(), parkingHandler.DeleteSpot)

				// Booking routes
				protected.POST("/reserve", parkingHandler.CreateBooking)
				protected.POST("/checkin", parkingHandler.CheckIn)
				protected.POST("/checkout", parkingHandler.CheckOut)
				protected.POST("/extend", parkingHandler.ExtendBooking)
				protected.DELETE("/cancel/:id", parkingHandler.CancelBooking)

				// Booking queries
				protected.GET("/bookings", parkingHandler.GetUserBookings)
				protected.GET("/bookings/:id", parkingHandler.GetBooking)
				protected.GET("/bookings/active", parkingHandler.GetActiveBookings)
				protected.GET("/bookings/history", parkingHandler.GetBookingHistory)
			}
		}

		// Charging station routes
		charging := v1.Group("/charging")
		{
			// Public routes - specific routes BEFORE parameterized routes
			charging.GET("/stations/search", chargingHandler.SearchStations)
			charging.GET("/stations/available", chargingHandler.GetAvailableStations)
			charging.GET("/stations", chargingHandler.GetAllStations)
			charging.GET("/stations/:id", chargingHandler.GetStation)

			// Protected routes
			protected := charging.Group("")
			protected.Use(middleware.AuthMiddleware(s.fabricClient))
			{
				// Admin only
				protected.POST("/stations", middleware.AdminMiddleware(), chargingHandler.CreateStation)
				protected.PUT("/stations/:id", middleware.AdminMiddleware(), chargingHandler.UpdateStation)
				protected.DELETE("/stations/:id", middleware.AdminMiddleware(), chargingHandler.DeleteStation)

				// Session routes
				protected.POST("/start", chargingHandler.StartSession)
				protected.PUT("/update/:id", chargingHandler.UpdateSession)
				protected.POST("/stop", chargingHandler.StopSession)
				protected.DELETE("/cancel/:id", chargingHandler.CancelSession)

				// Session queries
				protected.GET("/sessions", chargingHandler.GetUserSessions)
				protected.GET("/sessions/:id", chargingHandler.GetSession)
				protected.GET("/sessions/active", chargingHandler.GetActiveSessions)
				protected.GET("/sessions/history", chargingHandler.GetSessionHistory)
				protected.GET("/stats/energy", chargingHandler.GetEnergyStats)
			}
		}

		// Wallet routes (all protected)
		wallet := v1.Group("/wallet")
		wallet.Use(middleware.AuthMiddleware(s.fabricClient))
		{
			wallet.POST("/create", walletHandler.CreateWallet)
			wallet.GET("", walletHandler.GetWallet)
			wallet.GET("/balance", walletHandler.GetBalance)
			wallet.POST("/add-funds", walletHandler.AddFunds)
			wallet.GET("/transactions", walletHandler.GetTransactions)
			wallet.GET("/transactions/:id", walletHandler.GetTransaction)
			wallet.GET("/spending", walletHandler.GetTotalSpent)
		}

		// Payment routes (protected)
		payment := v1.Group("/payment")
		payment.Use(middleware.AuthMiddleware(s.fabricClient))
		{
			payment.POST("/process", walletHandler.ProcessPayment)
			payment.POST("/refund/:id", walletHandler.RefundPayment)
			payment.GET("/receipt/:id", walletHandler.GetPaymentReceipt)
		}
	}
}

// Run starts the server
func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}
