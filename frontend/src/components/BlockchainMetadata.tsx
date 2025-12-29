import React from 'react';
import { Box, Hash, Users } from 'lucide-react';

interface BlockchainMetadataProps {
  txId?: string;
  blockNumber?: number;
  endorsingOrgs?: string[];
  timestamp?: string;
  compact?: boolean;
}

export const BlockchainMetadata: React.FC<BlockchainMetadataProps> = ({
  txId,
  blockNumber,
  endorsingOrgs,
  timestamp,
  compact = false,
}) => {
  if (!txId && !blockNumber && !endorsingOrgs) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {blockNumber && (
          <span className="flex items-center">
            <Box className="h-3 w-3 mr-1" />
            Block #{blockNumber}
          </span>
        )}
        {txId && (
          <span className="flex items-center font-mono">
            <Hash className="h-3 w-3 mr-1" />
            {txId.substring(0, 8)}...
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm border border-gray-200">
      <div className="flex items-center text-gray-700 font-medium">
        <Box className="h-4 w-4 mr-2 text-blue-600" />
        Blockchain Information
      </div>
      
      {txId && (
        <div className="flex items-start">
          <Hash className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
            <p className="font-mono text-xs break-all text-gray-900">{txId}</p>
          </div>
        </div>
      )}

      {blockNumber && (
        <div className="flex items-center">
          <Box className="h-4 w-4 mr-2 text-gray-400" />
          <div>
            <p className="text-xs text-gray-600">Block Number</p>
            <p className="font-semibold text-gray-900">{blockNumber}</p>
          </div>
        </div>
      )}

      {endorsingOrgs && endorsingOrgs.length > 0 && (
        <div className="flex items-start">
          <Users className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-600 mb-1">Endorsed By</p>
            <div className="flex flex-wrap gap-1">
              {endorsingOrgs.map((org, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {timestamp && (
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};
