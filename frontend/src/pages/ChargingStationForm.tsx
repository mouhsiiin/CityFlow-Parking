import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, type CreateChargingStationRequest } from '../services';
import { Card, Button, Input, Loading } from '../components';

const ChargingStationForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateChargingStationRequest>({
    stationNumber: '',
    location: '',
    latitude: 0,
    longitude: 0,
    powerOutput: 0,
    pricePerKwh: 0,
    connectorType: 'Type2',
    operatorId: user?.id || '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (isEditMode && id) {
      loadStation(id);
    }
  }, [user, navigate, isEditMode, id]);

  const loadStation = async (stationId: string) => {
    try {
      setLoading(true);
      const data = await adminService.getChargingStation(stationId);
      const station = data.station;
      setFormData({
        stationNumber: station.stationNumber || '',
        location: station.location?.address || '',
        latitude: station.location?.latitude || 0,
        longitude: station.location?.longitude || 0,
        powerOutput: station.powerOutput || 0,
        pricePerKwh: station.pricePerKwh || 0,
        connectorType: station.connectorType || 'Type2',
        operatorId: station.operatorId || user?.id || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load charging station');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.stationNumber || !formData.location || formData.powerOutput <= 0 || formData.pricePerKwh <= 0) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    try {
      setSubmitLoading(true);
      if (isEditMode && id) {
        await adminService.updateChargingStation(id, formData);
      } else {
        await adminService.createChargingStation(formData);
      }
      navigate('/admin/charging');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} charging station`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Edit Charging Station' : 'Create New Charging Station'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Update the charging station details' : 'Add a new charging station to the system'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="stationNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Station Number *
            </label>
            <Input
              id="stationNumber"
              name="stationNumber"
              type="text"
              value={formData.stationNumber}
              onChange={handleChange}
              placeholder="e.g., CS-001"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location Address *
            </label>
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., City Center Charging Hub"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="0.0"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="0.0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="powerOutput" className="block text-sm font-medium text-gray-700 mb-2">
              Power Output (kW) *
            </label>
            <Input
              id="powerOutput"
              name="powerOutput"
              type="number"
              min="0"
              value={formData.powerOutput}
              onChange={handleChange}
              placeholder="50"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Typical values: 7kW (slow), 22kW (fast), 50-150kW (rapid)</p>
          </div>

          <div>
            <label htmlFor="pricePerKwh" className="block text-sm font-medium text-gray-700 mb-2">
              Price per kWh ($) *
            </label>
            <Input
              id="pricePerKwh"
              name="pricePerKwh"
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerKwh}
              onChange={handleChange}
              placeholder="0.30"
              required
            />
          </div>

          <div>
            <label htmlFor="connectorType" className="block text-sm font-medium text-gray-700 mb-2">
              Connector Type *
            </label>
            <select
              id="connectorType"
              name="connectorType"
              value={formData.connectorType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="Type2">Type 2 (Mennekes)</option>
              <option value="CCS">CCS (Combined Charging System)</option>
              <option value="CHAdeMO">CHAdeMO</option>
              <option value="Tesla">Tesla Supercharger</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitLoading ? 'Saving...' : isEditMode ? 'Update Station' : 'Create Station'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/charging')}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ChargingStationForm;
