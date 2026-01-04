import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import { Card, Button, Loading } from '../components';

interface DashboardStats {
  totalParkingSpots: number;
  availableParkingSpots: number;
  occupiedParkingSpots: number;
  totalChargingStations: number;
  availableChargingStations: number;
  inUseChargingStations: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage parking spots and charging stations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Parking Spots</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-blue-600">{stats?.totalParkingSpots || 0}</p>
            <p className="text-sm text-gray-600">
              {stats?.availableParkingSpots || 0} available, {stats?.occupiedParkingSpots || 0} occupied
            </p>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Charging Stations</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-green-600">{stats?.totalChargingStations || 0}</p>
            <p className="text-sm text-gray-600">
              {stats?.availableChargingStations || 0} available, {stats?.inUseChargingStations || 0} in use
            </p>
          </div>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Occupancy Rate</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-purple-600">
              {stats?.totalParkingSpots
                ? Math.round((stats.occupiedParkingSpots / stats.totalParkingSpots) * 100)
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600">Current parking occupancy</p>
          </div>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Parking Spot Management</h3>
              <p className="text-gray-600">Create, update, and manage parking spots</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/admin/parking')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Manage Parking Spots
            </Button>
            <Button
              onClick={() => navigate('/admin/parking/create')}
              variant="secondary"
              className="w-full"
            >
              Create New Parking Spot
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Charging Station Management</h3>
              <p className="text-gray-600">Create, update, and manage charging stations</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/admin/charging')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Manage Charging Stations
            </Button>
            <Button
              onClick={() => navigate('/admin/charging/create')}
              variant="secondary"
              className="w-full"
            >
              Create New Charging Station
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
