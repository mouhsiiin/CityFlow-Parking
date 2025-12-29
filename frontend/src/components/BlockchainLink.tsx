import React from 'react';
import { ExternalLink } from 'lucide-react';
import { BLOCKCHAIN_EXPLORER_URL } from '../config/api';

interface BlockchainLinkProps {
  txHash: string;
  label?: string;
  className?: string;
}

export const BlockchainLink: React.FC<BlockchainLinkProps> = ({
  txHash,
  label = 'View on Blockchain',
  className = '',
}) => {
  // Don't render if no blockchain explorer is configured
  if (!BLOCKCHAIN_EXPLORER_URL) {
    return null;
  }

  const url = `${BLOCKCHAIN_EXPLORER_URL}/${txHash}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium ${className}`}
    >
      {label}
      <ExternalLink className="ml-1 h-4 w-4" />
    </a>
  );
};
