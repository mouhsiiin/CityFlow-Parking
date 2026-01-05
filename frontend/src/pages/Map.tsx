import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { spotService, reservationService } from '../services';
import type { ParkingSpot } from '../types';
import { Card, Button, Input } from '../components';
import { MapPin, Zap } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

// Fix Leaflet default icon issue with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for different spot types
const createCustomIcon = (type: 'parking' | 'ev_charging', status: string) => {
  const color = status === 'available' ? (type === 'ev_charging' ? '#EAB308' : '#3B82F6') : '#9CA3AF';
  const symbol = type === 'ev_charging' ? '⚡' : '🅿️';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 16px;">${symbol}</div>`,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Component to update map view when selected spot changes
const MapUpdater: React.FC<{ spot: ParkingSpot | null }> = ({ spot }) => {
  const map = useMap();
  
  useEffect(() => {
    if (spot) {
      map.flyTo([spot.location.latitude, spot.location.longitude], 16, {
        duration: 1,
      });
    }
  }, [spot, map]);
  
  return null;
};

export const Map: React.FC = () => {
  const notification = useNotification();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'parking' | 'ev_charging'>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);

  // Reservation form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    loadSpots();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [spots, filterType, showAvailableOnly]);

  const loadSpots = async () => {
    try {
      setIsLoading(true);
      const data = await spotService.getAllSpots();
      
      // Handle both array and wrapped object responses
      let spotsArray: any[] = [];
      
      if (Array.isArray(data)) {
        spotsArray = data;
      } else if (data && typeof data === 'object') {
        if ('data' in data && Array.isArray((data as any).data)) {
          spotsArray = (data as any).data;
        } else if ('spots' in data && Array.isArray((data as any).spots)) {
          spotsArray = (data as any).spots;
        }
      }
      
      // Transform API response to match ParkingSpot interface
      const transformedSpots = spotsArray.map((spot: any) => ({
        id: spot.spotId || spot.id, // API returns spotId
        spotNumber: spot.spotNumber,
        location: {
          latitude: spot.latitude || spot.location?.latitude || 0,
          longitude: spot.longitude || spot.location?.longitude || 0,
          address: spot.location || spot.location?.address || 'Unknown Location',
        },
        // If hasEVCharging is true, type is 'ev_charging', otherwise 'parking'
        type: spot.hasEVCharging ? 'ev_charging' : 'parking',
        status: spot.status || 'available',
        pricePerHour: spot.pricePerHour || 0,
        features: spot.features || [],
        chargingPower: spot.hasEVCharging ? (spot.chargingPower || 7) : undefined,
        hasEVCharging: spot.hasEVCharging || false,
        operatorId: spot.operatorId || '',
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        txId: spot.txId,
        blockNumber: spot.blockNumber,
      }));
      
      setSpots(transformedSpots);
    } catch (error) {
      console.error('Error loading spots:', error);
      notification.error('Failed to load spots', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = spots;

    if (filterType !== 'all') {
      filtered = filtered.filter((spot) => spot.type === filterType);
    }

    if (showAvailableOnly) {
      filtered = filtered.filter((spot) => spot.status === 'available');
    }

    setFilteredSpots(filtered);
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
  };

  const handleReserveClick = () => {
    // Set default times
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60000); // 30 mins from now
    const end = new Date(start.getTime() + 2 * 3600000); // 2 hours later

    setStartTime(formatDateTimeLocal(start));
    setEndTime(formatDateTimeLocal(end));
    setShowReservationModal(true);
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const calculateCost = (): number => {
    if (!selectedSpot || !startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours * selectedSpot.pricePerHour;
  };

  const handleReservation = async () => {
    if (!selectedSpot) return;

    try {
      setIsReserving(true);
      const reservation = await reservationService.createReservation({
        spotId: selectedSpot.id,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        totalCost: calculateCost(),
      });

      notification.success(
        'Reservation created successfully!',
        `Transaction ID: ${reservation.blockchainTxHash || 'Pending'}`
      );
      setShowReservationModal(false);
      setSelectedSpot(null);
      await loadSpots(); // Refresh spots
    } catch (error: any) {
      notification.error(
        'Failed to create reservation',
        error.response?.data?.error || error.message || 'Please try again'
      );
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Parking & Charging Spots</h1>
        <p className="text-gray-600 mt-2">Browse and reserve available spots in real-time</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'parking' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('parking')}
              >
                <MapPin className="mr-1 h-4 w-4" />
                Parking
              </Button>
              <Button
                variant={filterType === 'ev_charging' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('ev_charging')}
              >
                <Zap className="mr-1 h-4 w-4" />
                EV Charging
              </Button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="availableOnly"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="availableOnly" className="ml-2 text-sm text-gray-700">
              Show available only
            </label>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            {filteredSpots.length} spot{filteredSpots.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </Card>

      {/* Map and Spots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OpenStreetMap Visualization */}
        <div className="lg:col-span-2">
          <Card title="Map View - Tangier, Morocco">
            <div className="rounded-lg h-[600px] overflow-hidden shadow-lg">
              <MapContainer
                center={[35.7595, -5.8340]} // Tangier, Morocco coordinates
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {filteredSpots.map((spot) => (
                  <Marker
                    key={spot.id}
                    position={[spot.location.latitude, spot.location.longitude]}
                    icon={createCustomIcon(spot.type, spot.status)}
                    eventHandlers={{
                      click: () => handleSpotClick(spot),
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold mb-1">{spot.location.address}</p>
                        <p className="text-gray-600">
                          {spot.type === 'ev_charging' ? '⚡ EV Charging' : '🅿️ Parking'}
                        </p>
                        <p className="font-medium text-blue-600">${spot.pricePerHour}/hour</p>
                        <p className={`text-xs mt-1 ${spot.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                          {spot.status.toUpperCase()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                <MapUpdater spot={selectedSpot} />
              </MapContainer>
            </div>
          </Card>
        </div>

        {/* Spot Details / List */}
        <div>
          {selectedSpot ? (
            <Card className="shadow-xl border-2 border-blue-100">
              <div className="mb-6">
                <div className="flex items-center mb-3 pb-3 border-b-2 border-gray-200">
                  {selectedSpot.type === 'ev_charging' ? (
                    <div className="p-3 bg-yellow-100 rounded-xl mr-3">
                      <Zap className="h-7 w-7 text-yellow-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-100 rounded-xl mr-3">
                      <MapPin className="h-7 w-7 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedSpot.type === 'ev_charging' ? 'EV Charging Station' : 'Parking Spot'}
                    </h3>
                    <p className="text-sm text-gray-600">Spot #{selectedSpot.spotNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-4 py-2 text-sm font-bold rounded-lg shadow-sm ${
                      selectedSpot.status === 'available'
                        ? 'bg-green-100 text-green-800 border-2 border-green-300'
                        : 'bg-red-100 text-red-800 border-2 border-red-300'
                    }`}
                  >
                    {selectedSpot.status.toUpperCase()}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${selectedSpot.pricePerHour}/hr
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {selectedSpot.location.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Hourly Rate</p>
                    <p className="font-bold text-xl text-blue-900">${selectedSpot.pricePerHour}</p>
                  </div>

                  {selectedSpot.chargingPower && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs font-semibold text-yellow-600 uppercase mb-1">Power</p>
                      <p className="font-bold text-xl text-yellow-900">{selectedSpot.chargingPower} kW</p>
                    </div>
                  )}
                </div>

                {selectedSpot.features && selectedSpot.features.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Features</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpot.features.map((feature, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-full shadow-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedSpot.status === 'available' ? (
                <Button onClick={handleReserveClick} className="w-full mb-3 py-3 text-lg font-semibold">
                  🎫 Reserve This Spot
                </Button>
              ) : (
                <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                  <p className="text-red-700 font-semibold">This spot is currently unavailable</p>
                </div>
              )}
              <Button variant="ghost" onClick={() => setSelectedSpot(null)} className="w-full">
                ← Back to List
              </Button>
            </Card>
          ) : (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Available Spots</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSpots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start">
                      {spot.type === 'ev_charging' ? (
                        <Zap className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      ) : (
                        <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{spot.location.address}</p>
                        <p className="text-xs text-gray-600">${spot.pricePerHour}/hr</p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredSpots.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No spots available</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedSpot && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[9999] p-4">
          <Card className="max-w-md w-full relative z-[10000]">
            <h2 className="text-2xl font-bold mb-4">Create Reservation</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{selectedSpot.location.address}</p>
              </div>

              <Input
                type="datetime-local"
                label="Start Time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />

              <Input
                type="datetime-local"
                label="End Time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Estimated Cost:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${calculateCost().toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Transaction will be recorded on blockchain
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleReservation}
                isLoading={isReserving}
                disabled={!startTime || !endTime}
                className="flex-1"
              >
                Confirm Reservation
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowReservationModal(false)}
                disabled={isReserving}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
