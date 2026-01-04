import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService, type CreateParkingSpotRequest } from '../services';
import { Card, Button, Input, Loading } from '../components';

const ParkingSpotForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateParkingSpotRequest>({
    spotNumber: '',
    location: '',
    latitude: 0,
    longitude: 0,
    spotType: 'standard',
    pricePerHour: 0,
    hasEVCharging: false,
    operatorId: user?.id || '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (isEditMode && id) {
      loadSpot(id);
    }
  }, [user, navigate, isEditMode, id]);

  const loadSpot = async (spotId: string) => {
    try {
      setLoading(true);
      const data = await adminService.getParkingSpot(spotId);
      const spot = data.spot;
      setFormData({
        spotNumber: spot.spotNumber || '',
        location: spot.location?.address || '',
        latitude: spot.location?.latitude || 0,
        longitude: spot.location?.longitude || 0,
        spotType: spot.type || 'standard',
        pricePerHour: spot.pricePerHour || 0,
        hasEVCharging: spot.hasEVCharging || false,
        operatorId: spot.operatorId || user?.id || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load parking spot');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.spotNumber || !formData.location || formData.pricePerHour <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitLoading(true);
      if (isEditMode && id) {
        await adminService.updateParkingSpot(id, formData);
      } else {
        await adminService.createParkingSpot(formData);
      }
      navigate('/admin/parking');
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} parking spot`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
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
          {isEditMode ? 'Edit Parking Spot' : 'Create New Parking Spot'}
        </h1>
        <p className="text-gray-600">
          {isEditMode ? 'Update the parking spot details' : 'Add a new parking spot to the system'}
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
            <label htmlFor="spotNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Spot Number *
            </label>
            <Input
              id="spotNumber"
              name="spotNumber"
              type="text"
              value={formData.spotNumber}
              onChange={handleChange}
              placeholder="e.g., A-101"
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
              placeholder="e.g., Downtown Parking Garage"
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
            <label htmlFor="spotType" className="block text-sm font-medium text-gray-700 mb-2">
              Spot Type *
            </label>
            <select
              id="spotType"
              name="spotType"
              value={formData.spotType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="disabled">Disabled</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div>
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-2">
              Price per Hour ($) *
            </label>
            <Input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerHour}
              onChange={handleChange}
              placeholder="5.00"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="hasEVCharging"
              name="hasEVCharging"
              type="checkbox"
              checked={formData.hasEVCharging}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasEVCharging" className="ml-2 block text-sm text-gray-700">
              Has EV Charging Available
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={submitLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {submitLoading ? 'Saving...' : isEditMode ? 'Update Spot' : 'Create Spot'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/parking')}
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

export default ParkingSpotForm;
