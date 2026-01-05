import React from 'react';
import { Card } from './Card';
import { Shield, Layers, Users, Activity } from 'lucide-react';
import type { Transaction } from '../types';

interface BlockchainStatsProps {
  transactions: Transaction[];
}

export const BlockchainStats: React.FC<BlockchainStatsProps> = ({ transactions }) => {
  // Calculate blockchain statistics
  const totalBlocks = new Set(transactions.map(t => t.blockNumber).filter(Boolean)).size;
  const totalOrgs = new Set(
    transactions.flatMap(t => t.endorsingOrgs || [])
  ).size;
  const confirmedTxs = transactions.filter(
    t => t.status === 'confirmed' || t.status === 'completed'
  ).length;
  const successRate = transactions.length > 0 
    ? ((confirmedTxs / transactions.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">Blockchain Transactions</p>
            <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-700">Blocks Used</p>
            <p className="text-2xl font-bold text-purple-900">{totalBlocks}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-700">Endorsing Orgs</p>
            <p className="text-2xl font-bold text-indigo-900">{totalOrgs || 'N/A'}</p>
          </div>
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600 rounded-xl shadow-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">Success Rate</p>
            <p className="text-2xl font-bold text-green-900">{successRate}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
