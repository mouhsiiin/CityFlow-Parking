import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Card, Button, BlockchainLink } from '../components';
import { reservationService, spotService, walletService } from '../services';
import type { Reservation, ParkingSpot, WalletInfo } from '../types';
import { MapPin, Calendar, Clock, DollarSign, Zap, AlertCircle, Shield, Layers } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const notification = useNotification();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [spots, setSpots] = useState<Map<string, ParkingSpot>>(new Map());
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [userReservations, allSpots, wallet] = await Promise.all([
        reservationService.getUserReservations(),
        spotService.getAllSpots(),
        walletService.getWalletInfo().catch(() => null),
      ]);


      // Handle both array and wrapped object responses for reservations
      let reservationsArray = Array.isArray(userReservations)
        ? userReservations
        : (userReservations?.data && Array.isArray(userReservations.data)
          ? userReservations.data
          : (userReservations?.reservations && Array.isArray(userReservations.reservations)
            ? userReservations.reservations
            : (userReservations?.bookings && Array.isArray(userReservations.bookings)
              ? userReservations.bookings
              : [])));

      // Map API response fields to Reservation type
      const mappedReservations = reservationsArray.map((booking: any) => ({
        id: booking.bookingId || booking.id,
        spotId: booking.spotId,
        userId: booking.userId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        actualCheckIn: booking.actualCheckIn,
        actualCheckOut: booking.actualCheckOut,
        duration: booking.duration,
        pricePerHour: booking.pricePerHour,
        totalCost: booking.totalCost,
        status: booking.status,
        qrCode: booking.qrCode,
        paymentId: booking.paymentId,
        blockchainTxHash: booking.blockchainTxHash,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }));

      setReservations(mappedReservations);

      // Handle both array and wrapped object responses for spots
      let spotsArray = Array.isArray(allSpots)
        ? allSpots
        : (allSpots?.data && Array.isArray(allSpots.data)
          ? allSpots.data
          : (allSpots?.spots && Array.isArray(allSpots.spots)
            ? allSpots.spots
            : []));

      // Map API response fields to ParkingSpot type
      const mappedSpots = spotsArray.map((spot: any) => ({
        id: spot.spotId || spot.id,
        spotNumber: spot.spotNumber,
        location: typeof spot.location === 'string'
          ? { latitude: spot.latitude || 0, longitude: spot.longitude || 0, address: spot.location }
          : spot.location,
        type: spot.spotType === 'standard' ? 'parking' : spot.spotType === 'ev_charging' ? 'ev_charging' : (spot.type || 'parking'),
        status: spot.status || 'available',
        pricePerHour: spot.pricePerHour,
        features: spot.features,
        hasEVCharging: spot.hasEVCharging,
        operatorId: spot.operatorId,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
      }));

      const spotMap = new Map(mappedSpots.map((spot) => [spot.id, spot]));
      setSpots(spotMap);
      setWalletInfo(wallet);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      notification.error('Failed to load dashboard', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    // In a real app, you'd use a proper modal confirmation. For now, using browser confirm.
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      await reservationService.cancelReservation(id);
      notification.success('Reservation cancelled', 'Your reservation has been cancelled successfully');
      await loadDashboardData();
    } catch (error: any) {
      notification.error('Failed to cancel reservation', error.response?.data?.error || error.message || 'Please try again');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeReservations = reservations.filter((r) => r.status === 'active' || r.status === 'pending' || r.status === 'confirmed');
  const pastReservations = reservations.filter((r) => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.email}</h1>
        <p className="text-gray-600 mt-2">Manage your parking and charging reservations</p>
      </div>

      {/* Blockchain Info Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Shield className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">Blockchain-Secured Platform</h3>
              <Layers className="h-5 w-5" />
            </div>
            <p className="text-purple-100 text-sm">
              All your reservations, payments, and transactions are permanently recorded on Hyperledger Fabric blockchain with multi-organization verification
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Reservations</p>
              <p className="text-2xl font-semibold text-gray-900">{activeReservations.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-semibold text-gray-900">${walletInfo?.balance?.toFixed(2) || '0.00'}</p>
              {walletInfo && (
                <p className="text-xs text-gray-500 mt-1">Blockchain Wallet</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reservations</p>
              <p className="text-2xl font-semibold text-gray-900">{reservations.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/map')}>
              <MapPin className="mr-2 h-5 w-5" />
              Find Parking Spot
            </Button>
            <Button variant="secondary" onClick={() => navigate('/wallet')}>
              <DollarSign className="mr-2 h-5 w-5" />
              Manage Wallet
            </Button>
          </div>
        </Card>
      </div>

      {/* Active Reservations */}
      {activeReservations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Reservations</h2>
          <div className="space-y-4">
            {activeReservations.map((reservation) => {
              const spot = spots.get(reservation.spotId);
              return (
                <Card key={reservation.id}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {spot?.type === 'ev_charging' ? (
                          <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                        ) : (
                          <MapPin className="h-5 w-5 text-blue-500 mr-2" />
                        )}
                        <h3 className="text-lg font-semibold">
                          {spot?.type === 'ev_charging' ? 'EV Charging Station' : 'Parking Spot'}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                          {reservation.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {spot?.location.address || 'Location unavailable'}
                        </p>
                        <p className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}
                        </p>
                        <p className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Total Cost: ${reservation.totalCost.toFixed(2)}
                        </p>
                        {reservation.blockchainTxHash && (
                          <div className="mt-2">
                            <BlockchainLink txHash={reservation.blockchainTxHash} />
                          </div>
                        )}
                      </div>

                      {/* QR Code Display */}
                      {reservation.qrCode && (
                        <div className="mt-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center justify-center gap-2">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                              Check-in QR Code
                            </p>
                            <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                              <QRCodeSVG
                                value={reservation.qrCode}
                                size={200}
                                level="H"
                                includeMargin={true}
                                fgColor="#1e40af"
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-3 font-medium">📱 Scan this code at the parking spot to check in</p>
                            <p className="text-xs text-gray-500 mt-1 font-mono break-all">{reservation.qrCode}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col gap-2">
                      {reservation.qrCode && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(reservation.qrCode || '');
                            notification.success('QR Code copied!', 'The QR code has been copied to your clipboard');
                          }}
                        >
                          Copy QR Code
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reservation History</h2>
          <div className="space-y-4">
            {pastReservations.slice(0, 5).map((reservation) => {
              const spot = spots.get(reservation.spotId);
              return (
                <Card key={reservation.id} className="opacity-75">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {spot?.type === 'ev_charging' ? (
                          <Zap className="h-5 w-5 text-gray-400 mr-2" />
                        ) : (
                          <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-700">
                          {spot?.type === 'ev_charging' ? 'EV Charging Station' : 'Parking Spot'}
                        </h3>
                        <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                          {reservation.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{new Date(reservation.startTime).toLocaleDateString()}</p>
                        <p>${reservation.totalCost.toFixed(2)}</p>
                        {reservation.blockchainTxHash && (
                          <BlockchainLink txHash={reservation.blockchainTxHash} />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {reservations.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservations Yet</h3>
            <p className="text-gray-600 mb-4">Start by finding available parking spots on the map</p>
            <Button onClick={() => navigate('/map')}>
              <MapPin className="mr-2 h-5 w-5" />
              Browse Available Spots
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
