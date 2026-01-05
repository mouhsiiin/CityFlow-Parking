import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { Navbar } from './components';
import { 
  Login, 
  Dashboard, 
  Map, 
  Wallet, 
  TransactionHistory,
  AdminDashboard,
  ParkingManagement,
  ChargingManagement,
  ParkingSpotForm,
  ChargingStationForm,
  SecurityDashboard
} from './pages';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <AuthProvider>
          <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <Navbar />
                <Map />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Navbar />
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Navbar />
                <TransactionHistory />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navbar />
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/parking"
            element={
              <AdminRoute>
                <Navbar />
                <ParkingManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/parking/create"
            element={
              <AdminRoute>
                <Navbar />
                <ParkingSpotForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/parking/edit/:id"
            element={
              <AdminRoute>
                <Navbar />
                <ParkingSpotForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charging"
            element={
              <AdminRoute>
                <Navbar />
                <ChargingManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charging/create"
            element={
              <AdminRoute>
                <Navbar />
                <ChargingStationForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charging/edit/:id"
            element={
              <AdminRoute>
                <Navbar />
                <ChargingStationForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/security"
            element={
              <AdminRoute>
                <Navbar />
                <SecurityDashboard />
              </AdminRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </AuthProvider>
      </Router>
    </NotificationProvider>
  );
}

export default App;
