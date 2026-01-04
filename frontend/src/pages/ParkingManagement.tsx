import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import type { ParkingSpot } from '../types';
import { Card, Button, Loading } from '../components';

const ParkingManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadSpots();
  }, [user, navigate]);

  const loadSpots = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllParkingSpots();
      setSpots(data.spots || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load parking spots');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (spotId: string) => {
    if (!confirm('Are you sure you want to delete this parking spot?')) {
      return;
    }

    try {
      setDeleteLoading(spotId);
      await adminService.deleteParkingSpot(spotId);
      await loadSpots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete parking spot');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parking Spot Management</h1>
          <p className="text-gray-600">Manage all parking spots in the system</p>
        </div>
        <Button onClick={() => navigate('/admin/parking/create')} className="bg-blue-600 hover:bg-blue-700">
          Create New Spot
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No parking spots found</p>
            <Button onClick={() => navigate('/admin/parking/create')} className="mt-4">
              Create First Parking Spot
            </Button>
          </div>
        ) : (
          spots.map((spot) => (
            <Card key={spot.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{spot.spotNumber || spot.id}</h3>
                  <p className="text-sm text-gray-600">{spot.location?.address || 'No location'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(spot.status)}`}>
                  {spot.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{spot.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price/Hour:</span>
                  <span className="font-medium text-gray-900">${spot.pricePerHour.toFixed(2)}</span>
                </div>
                {spot.hasEVCharging && (
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    EV Charging
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/admin/parking/edit/${spot.id}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(spot.id)}
                  disabled={deleteLoading === spot.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
                >
                  {deleteLoading === spot.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ParkingManagement;
