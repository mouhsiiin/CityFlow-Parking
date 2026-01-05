import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { walletService } from '../services/apiService';
import { Card, TransactionDetailsModal, BlockchainTransactionCard, BlockchainStats } from '../components';
import type { Transaction } from '../types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  Download,
  Search,
  Wallet as WalletIcon,
  Shield,
  Layers,
} from 'lucide-react';

export const TransactionHistory: React.FC = () => {
  const notification = useNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, filterStatus, searchTerm, dateRange, transactions]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const txns = await walletService.getTransactions();
      // Sort by timestamp descending (newest first)
      const sortedTxns = txns.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setTransactions(sortedTxns);
      setFilteredTransactions(sortedTxns);
    } catch (error) {
      console.error('Error loading transactions:', error);
      notification.error('Failed to load transactions', 'Please try refreshing the page');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((t) => new Date(t.timestamp) >= cutoffDate);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term) ||
          t.blockchainTxHash?.toLowerCase().includes(term) ||
          t.type.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'credit':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'withdrawal':
      case 'debit':
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

  const calculateStats = () => {
    const totalIn = filteredTransactions
      .filter(
        (t) =>
          (t.type === 'deposit' || t.type === 'credit' || t.type === 'refund') &&
          t.status === 'confirmed'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOut = filteredTransactions
      .filter(
        (t) =>
          (t.type === 'payment' || t.type === 'debit' || t.type === 'withdrawal') &&
          t.status === 'confirmed'
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIn, totalOut, netChange: totalIn - totalOut };
  };

  const stats = calculateStats();

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Status', 'Description', 'Transaction Hash'].join(','),
      ...filteredTransactions.map((t) =>
        [
          new Date(t.timestamp).toLocaleString(),
          t.type,
          t.amount.toFixed(2),
          t.status,
          `"${t.description}"`,
          t.blockchainTxHash || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Transaction History</h1>
        </div>
        <p className="text-gray-600">
          All transactions are permanently recorded on the Hyperledger Fabric blockchain with multi-organization endorsement
        </p>
      </div>

      {/* Blockchain Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Immutable Ledger</h3>
            <p className="text-blue-100 text-sm">
              Every transaction is cryptographically secured, distributed across multiple nodes, and verified by endorsing organizations
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Statistics */}
      <BlockchainStats transactions={filteredTransactions} />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total In</p>
              <p className="text-2xl font-bold text-green-600">+${stats.totalIn.toFixed(2)}</p>
            </div>
            <ArrowDownCircle className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Out</p>
              <p className="text-2xl font-bold text-red-600">-${stats.totalOut.toFixed(2)}</p>
            </div>
            <ArrowUpCircle className="h-8 w-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Change</p>
              <p
                className={`text-2xl font-bold ${
                  stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stats.netChange >= 0 ? '+' : ''}${stats.netChange.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <WalletIcon className="h-8 w-8 text-gray-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="payment">Payments</option>
              <option value="refund">Refunds</option>
              <option value="credit">Credits</option>
              <option value="debit">Debits</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <WalletIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your blockchain transaction history will appear here'}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {filteredTransactions.map((transaction) => (
              <BlockchainTransactionCard
                key={transaction.id}
                transaction={transaction}
                onClick={() => setSelectedTransaction(transaction)}
              />
            ))}
          </>
        )}
      </div>

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
