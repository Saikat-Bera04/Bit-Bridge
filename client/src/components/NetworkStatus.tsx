import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getCurrentNetwork } from '@/config/network';

export const NetworkStatus = () => {
  const network = getCurrentNetwork();
  
  const getNetworkColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'mainnet':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'testnet':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'betanet':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getNetworkColor(network.name)} text-xs font-medium`}
    >
      {network.name}
    </Badge>
  );
};
