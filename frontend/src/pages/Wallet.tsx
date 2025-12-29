import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { walletService } from '../services';
import { Card, Button, Input, BlockchainLink } from '../components';
import type { Transaction, WalletInfo } from '../types';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const notification = useNotification();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const [wallet, txns] = await Promise.all([
        walletService.getWalletInfo(),
        walletService.getTransactions(),
      ]);
      setWalletInfo(wallet);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      notification.error('Failed to load wallet data', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      notification.warning('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    try {
      setIsProcessing(true);
      const transaction = await walletService.deposit(amountNum);
      notification.success(
        'Deposit successful!',
        `Transaction Hash: ${transaction.blockchainTxHash}`
      );
      setShowDepositModal(false);
      setAmount('');
      await loadWalletData();
      await refreshUser();
    } catch (error: any) {
      notification.error('Deposit failed', error.response?.data?.error || error.message || 'Please try again');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      notification.warning('Invalid amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (walletInfo && amountNum > walletInfo.balance) {
      notification.warning('Insufficient balance', `Your balance is $${walletInfo.balance.toFixed(2)}`);
      return;
    }

    try {
      setIsProcessing(true);
      const transaction = await walletService.withdraw(amountNum);
      notification.success(
        'Withdrawal successful!',
        `Transaction Hash: ${transaction.blockchainTxHash}`
      );
      setShowWithdrawModal(false);
      setAmount('');
      await loadWalletData();
      await refreshUser();
    } catch (error: any) {
      notification.error('Withdrawal failed', error.response?.data?.error || error.message || 'Please try again');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'payment':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'refund':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <WalletIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-2">Manage your funds and view transaction history</p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="mb-8 bg-gradient-to-br from-blue-500 to-blue-700 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Balance</p>
            <h2 className="text-4xl font-bold">${user?.balance.toFixed(2)}</h2>
          </div>
          <WalletIcon className="h-12 w-12 text-blue-200" />
        </div>

        <div className="mb-4">
          <p className="text-blue-100 text-sm">Wallet Address</p>
          <p className="font-mono text-sm break-all">{walletInfo?.address || user?.walletAddress}</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowDepositModal(true)}
            className="flex-1 bg-blue-800 hover:bg-blue-50 hover:text-white"
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Deposit
          </Button>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 bg-blue-800 text-white hover:bg-blue-900"
          >
            <ArrowUpCircle className="mr-2 h-5 w-5" />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowDownCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deposits</p>
              <p className="text-xl font-semibold text-gray-900">
                ${transactions
                  .filter((t) => t.type === 'deposit' && t.status === 'confirmed')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-xl font-semibold text-gray-900">
                ${transactions
                  .filter((t) => t.type === 'payment' && t.status === 'confirmed')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <WalletIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-xl font-semibold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card title="Transaction History">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">{getTransactionIcon(transaction.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {transaction.type.replace('_', ' ')}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{transaction.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(transaction.timestamp).toLocaleString()}
                        </span>
                        {transaction.reservationId && (
                          <span>Reservation: {transaction.reservationId.substring(0, 8)}...</span>
                        )}
                      </div>
                      {transaction.blockchainTxHash && (
                        <div className="mt-2">
                          <BlockchainLink
                            txHash={transaction.blockchainTxHash}
                            label="View Transaction"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'deposit' || transaction.type === 'refund'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[9999] p-4">
          <Card className="max-w-md w-full relative z-[10000]">
            <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
            <p className="text-gray-600 mb-6">
              Add funds to your wallet. Transaction will be recorded on the blockchain.
            </p>

            <Input
              type="number"
              label="Amount ($)"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="mb-6"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleDeposit}
                isLoading={isProcessing}
                disabled={!amount}
                className="flex-1"
              >
                Confirm Deposit
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDepositModal(false);
                  setAmount('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[9999] p-4">
          <Card className="max-w-md w-full relative z-[10000]">
            <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
            <p className="text-gray-600 mb-2">
              Withdraw funds from your wallet. Transaction will be recorded on the blockchain.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Available balance: ${user?.balance.toFixed(2)}
            </p>

            <Input
              type="number"
              label="Amount ($)"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              max={user?.balance}
              className="mb-6"
            />

            <div className="flex gap-3">
              <Button
                onClick={handleWithdraw}
                isLoading={isProcessing}
                disabled={!amount}
                className="flex-1"
              >
                Confirm Withdrawal
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setAmount('');
                }}
                disabled={isProcessing}
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
