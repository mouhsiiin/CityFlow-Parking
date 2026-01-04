import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services';
import type { ChargingStation } from '../types';
import { Card, Button, Loading } from '../components';

const ChargingManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadStations();
  }, [user, navigate]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllChargingStations();
      setStations(data.stations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load charging stations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stationId: string) => {
    if (!confirm('Are you sure you want to delete this charging station?')) {
      return;
    }

    try {
      setDeleteLoading(stationId);
      await adminService.deleteChargingStation(stationId);
      await loadStations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete charging station');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-service':
        return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Charging Station Management</h1>
          <p className="text-gray-600">Manage all charging stations in the system</p>
        </div>
        <Button onClick={() => navigate('/admin/charging/create')} className="bg-green-600 hover:bg-green-700">
          Create New Station
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No charging stations found</p>
            <Button onClick={() => navigate('/admin/charging/create')} className="mt-4">
              Create First Charging Station
            </Button>
          </div>
        ) : (
          stations.map((station) => (
            <Card key={station.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {station.stationNumber || station.id}
                  </h3>
                  <p className="text-sm text-gray-600">{station.location?.address || 'No location'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.status)}`}>
                  {station.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Power Output:</span>
                  <span className="font-medium text-gray-900">{station.powerOutput} kW</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price/kWh:</span>
                  <span className="font-medium text-gray-900">${station.pricePerKwh.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Connector:</span>
                  <span className="font-medium text-gray-900">{station.connectorType}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/admin/charging/edit/${station.id}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(station.id)}
                  disabled={deleteLoading === station.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
                >
                  {deleteLoading === station.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ChargingManagement;
