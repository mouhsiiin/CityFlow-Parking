import React from 'react';
import { BlockchainLink } from './BlockchainLink';
import type { ChargingSession } from '../types';
import {
  Zap,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Shield,
  Hash,
  Layers,
  Users,
  Battery,
  Activity,
} from 'lucide-react';

interface BlockchainChargingCardProps {
  session: ChargingSession;
  onClick?: () => void;
}

export const BlockchainChargingCard: React.FC<BlockchainChargingCardProps> = ({
  session,
  onClick,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'starting':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'active':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'starting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div
      className={`border-2 border-green-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-green-50/30 ${
        onClick ? 'cursor-pointer hover:border-green-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-green-600 rounded-xl shadow-sm">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">Charging Session</h3>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                  session.status
                )}`}
              >
                {session.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-mono">Session ID: {session.id}</p>
          </div>
        </div>
        {getStatusIcon(session.status)}
      </div>

      {/* Session Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Battery className="h-4 w-4 text-green-600" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Energy Consumed</p>
            <p className="text-green-700 font-bold">{session.energyConsumed.toFixed(2)} kWh</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Rate</p>
            <p className="text-gray-600">${session.pricePerKwh.toFixed(2)}/kWh</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Duration</p>
            <p className="text-gray-600">{formatDuration(session.duration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <div className="text-sm">
            <p className="font-medium text-gray-700">Total Cost</p>
            <p className="text-gray-900 font-bold">${session.totalCost.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Time Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Start Time:</span>
            <span className="font-medium">{new Date(session.startTime).toLocaleString()}</span>
          </div>
          {session.endTime && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">End Time:</span>
              <span className="font-medium">{new Date(session.endTime).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Information */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-bold text-purple-900">
            Blockchain Verified Session
          </span>
          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
        </div>

        <div className="space-y-2">
          {/* Transaction Hash */}
          {session.blockchainTxHash && (
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-700 mb-0.5">
                  Transaction Hash
                </p>
                <p className="font-mono text-xs text-gray-700 break-all bg-white/50 px-2 py-1 rounded">
                  {session.blockchainTxHash}
                </p>
              </div>
            </div>
          )}

          {/* Block Number */}
          {session.blockNumber !== undefined && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <span className="text-xs font-medium text-purple-700">Block:</span>
                <span className="ml-2 font-mono text-sm font-bold text-purple-900">
                  #{session.blockNumber}
                </span>
              </div>
            </div>
          )}

          {/* Endorsing Organizations */}
          {session.endorsingOrgs && session.endorsingOrgs.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Endorsed by {session.endorsingOrgs.length} Organization
                  {session.endorsingOrgs.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {session.endorsingOrgs.map((org, index) => (
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
        {session.blockchainTxHash && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <BlockchainLink
              txHash={session.blockchainTxHash}
              label="🔗 Verify on Blockchain Explorer"
            />
          </div>
        )}
      </div>

      {/* Footer Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>Station: {session.stationId.substring(0, 12)}...</span>
          {session.paymentId && (
            <span className="text-green-600">
              💳 Payment: {session.paymentId.substring(0, 12)}...
            </span>
          )}
          {session.createdAt && (
            <span>
              Created: {new Date(session.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
