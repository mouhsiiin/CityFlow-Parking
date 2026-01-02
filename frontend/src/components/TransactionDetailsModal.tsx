import React from 'react';
import { Card, BlockchainLink } from '../components';
import type { Transaction } from '../types';
import {
  X,
  Clock,
  Hash,
  Layers,
  User,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Circle,
} from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'pending':
        return <Circle className="h-6 w-6 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'credit':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'debit':
      case 'payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isCredit =
    transaction.type === 'deposit' ||
    transaction.type === 'credit' ||
    transaction.type === 'refund';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon(transaction.status)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
              <p className="text-sm text-gray-500">ID: {transaction.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                transaction.status
              )}`}
            >
              {transaction.status.toUpperCase()}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
              {transaction.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transaction Amount</p>
              <p className={`text-4xl font-bold ${getTypeColor(transaction.type)}`}>
                {isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
              </p>
            </div>
            {isCredit ? (
              <TrendingUp className="h-12 w-12 text-green-500 opacity-50" />
            ) : (
              <TrendingDown className="h-12 w-12 text-red-500 opacity-50" />
            )}
          </div>

          {(transaction.balanceBefore !== undefined || transaction.balanceAfter !== undefined) && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-4">
                {transaction.balanceBefore !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Balance Before</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${transaction.balanceBefore.toFixed(2)}
                    </p>
                  </div>
                )}
                {transaction.balanceAfter !== undefined && (
                  <div>
                    <p className="text-xs text-gray-600">Balance After</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${transaction.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transaction Information */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-gray-900">{transaction.description}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Timestamp</p>
              <p className="text-gray-900">
                {new Date(transaction.timestamp).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>

          {transaction.userId && (
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">User ID</p>
                <p className="text-gray-900 font-mono text-sm">{transaction.userId}</p>
              </div>
            </div>
          )}

          {transaction.walletId && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Wallet ID</p>
                <p className="text-gray-900 font-mono text-sm">{transaction.walletId}</p>
              </div>
            </div>
          )}
        </div>

        {/* Related References */}
        {(transaction.paymentId || transaction.reservationId || transaction.sessionId) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Related References</h3>
            <div className="space-y-2">
              {transaction.paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {transaction.paymentId}
                  </span>
                </div>
              )}
              {transaction.reservationId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reservation ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {transaction.reservationId}
                  </span>
                </div>
              )}
              {transaction.sessionId && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Session ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {transaction.sessionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blockchain Information */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Blockchain Information
          </h3>

          <div className="space-y-3">
            {transaction.blockchainTxHash && (
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">Transaction Hash</p>
                  <p className="text-gray-900 font-mono text-xs break-all">
                    {transaction.blockchainTxHash}
                  </p>
                  <div className="mt-2">
                    <BlockchainLink
                      txHash={transaction.blockchainTxHash}
                      label="View on Blockchain Explorer"
                    />
                  </div>
                </div>
              </div>
            )}

            {transaction.blockNumber !== undefined && (
              <div className="flex items-start gap-3">
                <Layers className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Block Number</p>
                  <p className="text-gray-900 font-mono">{transaction.blockNumber}</p>
                </div>
              </div>
            )}

            {transaction.endorsingOrgs && transaction.endorsingOrgs.length > 0 && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Endorsing Organizations</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {transaction.endorsingOrgs.map((org, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded"
                      >
                        {org}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
};
