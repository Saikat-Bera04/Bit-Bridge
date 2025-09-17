import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionService, AlgorandTransaction } from '@/services/transactionService';
import { toast } from 'sonner';

interface LiveTransactionHook {
  transactions: AlgorandTransaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  lastUpdate: Date | null;
  newTransactionCount: number;
  markAsViewed: () => void;
  isLive: boolean;
  toggleLive: () => void;
}

export const useLiveTransactions = (
  walletAddress: string | null,
  filters: any = {},
  timeRange: string = '30d'
): LiveTransactionHook => {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newTransactionCount, setNewTransactionCount] = useState(0);
  const [previousTxCount, setPreviousTxCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTxHashRef = useRef<string | null>(null);

  // Main query for transactions
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch: queryRefetch
  } = useQuery<AlgorandTransaction[]>({
    queryKey: ['live-transactions', walletAddress, filters, timeRange],
    queryFn: async () => {
      if (!walletAddress) return [];
      
      console.log('🔄 Fetching live transactions for:', walletAddress);
      const timeFilters = getTimeRangeFilters(timeRange);
      const result = await transactionService.getWalletTransactions(walletAddress, {
        ...filters,
        ...timeFilters
      });
      
      setLastUpdate(new Date());
      return result;
    },
    enabled: !!walletAddress,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchInterval: isLive ? 15000 : false, // Refetch every 15 seconds when live
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Get time range filters
  const getTimeRangeFilters = (range: string) => {
    const now = new Date();
    let afterTime: Date;
    
    switch (range) {
      case '7d':
        afterTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        afterTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        afterTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        afterTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        afterTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return { afterTime };
  };

  // Check for new transactions
  useEffect(() => {
    if (transactions.length > 0) {
      const currentTxCount = transactions.length;
      const latestTxHash = transactions[0]?.txHash;

      // Check if we have new transactions
      if (previousTxCount > 0 && currentTxCount > previousTxCount) {
        const newTxs = currentTxCount - previousTxCount;
        setNewTransactionCount(prev => prev + newTxs);
        
        // Show notification for new transactions
        toast.success(`${newTxs} new transaction${newTxs > 1 ? 's' : ''} detected!`, {
          action: {
            label: 'View',
            onClick: () => {
              setNewTransactionCount(0);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        });
      }

      // Check if the latest transaction changed (new transaction at top)
      if (lastTxHashRef.current && latestTxHash && lastTxHashRef.current !== latestTxHash) {
        const newTx = transactions[0];
        const isReceived = newTx.receiver === walletAddress;
        
        toast.success(
          `${isReceived ? 'Received' : 'Sent'} ${newTx.amount.toFixed(4)} ${newTx.currency}`,
          {
            description: `${isReceived ? 'From' : 'To'}: ${(isReceived ? newTx.sender : newTx.receiver)?.slice(0, 8)}...`,
            action: {
              label: 'View Details',
              onClick: () => {
                // Could open transaction details modal
                window.open(`https://testnet.algoexplorer.io/tx/${newTx.txHash}`, '_blank');
              }
            }
          }
        );
      }

      setPreviousTxCount(currentTxCount);
      lastTxHashRef.current = latestTxHash || null;
    }
  }, [transactions, previousTxCount, walletAddress]);

  // Manual refetch function
  const refetch = useCallback(() => {
    console.log('🔄 Manual refetch triggered');
    setLastUpdate(new Date());
    return queryRefetch();
  }, [queryRefetch]);

  // Mark new transactions as viewed
  const markAsViewed = useCallback(() => {
    setNewTransactionCount(0);
  }, []);

  // Toggle live updates
  const toggleLive = useCallback(() => {
    setIsLive(prev => {
      const newState = !prev;
      console.log('🔴 Live updates:', newState ? 'ON' : 'OFF');
      
      if (newState) {
        toast.success('Live updates enabled');
        // Immediate refetch when enabling live mode
        refetch();
      } else {
        toast.info('Live updates paused');
      }
      
      return newState;
    });
  }, [refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Background sync when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isLive && walletAddress) {
        console.log('🔄 Tab became visible, syncing transactions...');
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLive, walletAddress, refetch]);

  return {
    transactions,
    isLoading,
    error,
    refetch,
    lastUpdate,
    newTransactionCount,
    markAsViewed,
    isLive,
    toggleLive
  };
};
