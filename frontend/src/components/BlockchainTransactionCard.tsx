import React from 'react';
import { Card } from './Card';
import { BlockchainLink } from './BlockchainLink';
import type { Transaction } from '../types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Hash,
  Layers,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Wallet as WalletIcon,
} from 'lucide-react';

interface BlockchainTransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  showFull?: boolean;
}

export const BlockchainTransactionCard: React.FC<BlockchainTransactionCardProps> = ({
  transaction,
  onClick,
  showFull = false,
}) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'credit':
        return <ArrowDownCircle className="h-6 w-6 text-green-500" />;
      case 'withdrawal':
      case 'debit':
        return <ArrowUpCircle className="h-6 w-6 text-red-500" />;
      case 'payment':
        return <TrendingDown className="h-6 w-6 text-orange-500" />;
      case 'refund':
        return <TrendingUp className="h-6 w-6 text-blue-500" />;
      default:
        return <WalletIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isCredit =
    transaction.type === 'deposit' ||
    transaction.type === 'credit' ||
    transaction.type === 'refund';

  return (
    <div
      className={`border-2 border-blue-100 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-blue-50/30 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      {/* Header with Icon and Amount */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
            {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {transaction.type.replace('_', ' ')}
              </h3>
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600">{transaction.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${
              isCredit ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
          </p>
          {transaction.balanceAfter !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: ${transaction.balanceAfter.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Blockchain Information - Prominent Display */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-bold text-purple-900">
            Blockchain Verified Transaction
          </span>
          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
        </div>

        <div className="space-y-2">
          {/* Transaction Hash */}
          {transaction.blockchainTxHash && (
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-700 mb-0.5">
                  Transaction Hash
                </p>
                <p className="font-mono text-xs text-gray-700 break-all bg-white/50 px-2 py-1 rounded">
                  {transaction.blockchainTxHash}
                </p>
              </div>
            </div>
          )}

          {/* Block Number */}
          {transaction.blockNumber !== undefined && (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              <div className="flex-1">
                <span className="text-xs font-medium text-purple-700">Block:</span>
                <span className="ml-2 font-mono text-sm font-bold text-purple-900">
                  #{transaction.blockNumber}
                </span>
              </div>
            </div>
          )}

          {/* Endorsing Organizations */}
          {transaction.endorsingOrgs && transaction.endorsingOrgs.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  Endorsed by {transaction.endorsingOrgs.length} Organization
                  {transaction.endorsingOrgs.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1">
                  {transaction.endorsingOrgs.map((org, index) => (
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
        {transaction.blockchainTxHash && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <BlockchainLink
              txHash={transaction.blockchainTxHash}
              label="🔗 Verify on Blockchain Explorer"
            />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(transaction.timestamp).toLocaleString()}
        </span>
        <span className="font-mono">ID: {transaction.id}</span>
        {transaction.reservationId && (
          <span className="text-blue-600">
            🅿️ Booking: {transaction.reservationId.substring(0, 8)}...
          </span>
        )}
        {transaction.sessionId && (
          <span className="text-green-600">
            ⚡ Session: {transaction.sessionId.substring(0, 8)}...
          </span>
        )}
      </div>

      {showFull && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {transaction.walletId && (
              <div>
                <p className="text-xs text-gray-500">Wallet ID</p>
                <p className="font-mono text-xs text-gray-900">{transaction.walletId}</p>
              </div>
            )}
            {transaction.userId && (
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="font-mono text-xs text-gray-900">{transaction.userId}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
