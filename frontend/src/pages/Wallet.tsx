import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { walletService as apiWalletService } from '../services/apiService';
import { Card, Button, Input, TransactionDetailsModal, BlockchainTransactionCard } from '../components';
import type { Transaction, WalletInfo } from '../types';
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Download,
  Shield,
  Layers,
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const notification = useNotification();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [totalSpent, setTotalSpent] = useState<number>(0);

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((t) => t.type === filterType));
    }
  }, [filterType, transactions]);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const [wallet, txns, spending] = await Promise.all([
        apiWalletService.getWallet(),
        apiWalletService.getTransactions(),
        apiWalletService.getTotalSpending().catch(() => ({ totalSpent: 0 })),
      ]);
      setWalletInfo(wallet);
      setTransactions(txns);
      setFilteredTransactions(txns);
      setTotalSpent(spending.totalSpent);
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
      await apiWalletService.addFunds({ amount: amountNum });
      notification.success(
        'Deposit successful!',
        `Added $${amountNum.toFixed(2)} to your wallet`
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
      // Withdrawal is not directly supported, would need to implement via payment processing
      notification.warning('Withdraw not available', 'Please contact support for withdrawals');
      setShowWithdrawModal(false);
      setAmount('');
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
      <Card className="mb-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-200" />
              <p className="text-blue-100 text-sm">Blockchain Wallet Balance</p>
            </div>
            <h2 className="text-5xl font-bold mb-2">${user?.balance.toFixed(2)}</h2>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <Layers className="h-4 w-4" />
              <span>Secured by Hyperledger Fabric</span>
            </div>
          </div>
          <WalletIcon className="h-16 w-16 text-blue-200 opacity-50" />
        </div>

        <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <p className="text-blue-100 text-xs mb-1">Wallet Address (Blockchain ID)</p>
          <p className="font-mono text-sm break-all">{walletInfo?.address || user?.walletAddress}</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowDepositModal(true)}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
          >
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Add Funds
          </Button>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
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
                ${totalSpent.toFixed(2)}
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
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Blockchain Transaction History</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Transactions</option>
                <option value="deposit">Deposits</option>
                <option value="payment">Payments</option>
                <option value="refund">Refunds</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadWalletData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <WalletIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {filterType === 'all' ? 'No transactions yet' : `No ${filterType} transactions`}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              All transactions are recorded on the blockchain
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <BlockchainTransactionCard
                key={transaction.id}
                transaction={transaction}
                onClick={() => setSelectedTransaction(transaction)}
              />
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

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};
