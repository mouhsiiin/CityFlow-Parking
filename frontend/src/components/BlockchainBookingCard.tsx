import React from 'react';
import { BlockchainLink } from './BlockchainLink';
import type { Reservation } from '../types';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  XCircle,
  Shield,
  Hash,
  Layers,
  Users,
  QrCode,
} from 'lucide-react';

interface BlockchainBookingCardProps {
  booking: Reservation;
  onClick?: () => void;
}

export const BlockchainBookingCard: React.FC<BlockchainBookingCardProps> = ({
  booking,
  onClick,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'active':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      className={`border-2 border-blue-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-blue-50/30 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-sm">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">Parking Reservation</h3>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-mono">Booking ID: {booking.id}</p>
          </div>
        </div>
        {getStatusIcon(booking.status)}
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Start</p>
            <p className="text-gray-600">{new Date(booking.startTime).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">End</p>
            <p className="text-gray-600">{new Date(booking.endTime).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Duration</p>
            <p className="text-gray-600">{booking.duration} hours</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Total Cost</p>
            <p className="text-gray-900 font-bold">${booking.totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      {booking.qrCode && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">QR Code:</span>
            <span className="text-xs font-mono text-gray-600">{booking.qrCode}</span>
          </div>
        </div>
      )}

      {/* Blockchain Information */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-bold text-purple-900">
            Blockchain Verified Booking
          </span>
          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
        </div>

        <div className="space-y-2">
          {/* Transaction Hash */}
          {booking.blockchainTxHash && (
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-700 mb-0.5">
                  Transaction Hash
                </p>
                <p className="font-mono text-xs text-gray-700 break-all bg-white/50 px-2 py-1 rounded">
                  {booking.blockchainTxHash}
                </p>
              </div>
            </div>
          )}

          {/* Block Number */}
          {booking.blockNumber !== undefined && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <span className="text-xs font-medium text-purple-700">Block:</span>
                <span className="ml-2 font-mono text-sm font-bold text-purple-900">
                  #{booking.blockNumber}
                </span>
              </div>
            </div>
          )}

          {/* Endorsing Organizations */}
          {booking.endorsingOrgs && booking.endorsingOrgs.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Endorsed by {booking.endorsingOrgs.length} Organization
                  {booking.endorsingOrgs.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {booking.endorsingOrgs.map((org, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded shadow-sm"
                    >
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Blockchain Link */}
        {booking.blockchainTxHash && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <BlockchainLink
              txHash={booking.blockchainTxHash}
              label="🔗 Verify on Blockchain Explorer"
            />
          </div>
        )}
      </div>

      {/* Footer Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>Spot: {booking.spotId.substring(0, 12)}...</span>
          {booking.paymentId && (
            <span className="text-green-600">
              💳 Payment: {booking.paymentId.substring(0, 12)}...
            </span>
          )}
          {booking.createdAt && (
            <span>
              Created: {new Date(booking.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
