import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { AlgorandTransaction } from '@/services/transactionService';

interface LiveAnalytics {
  totalBalance: number;
  algoBalance: number;
  usdBalance: number;
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  todayTransactions: number;
  weeklyGrowth: number;
  monthlyVolume: number;
  topAssets: Array<{ name: string; amount: number; usdValue: number; percentage: number }>;
  recentActivity: Array<{ type: 'sent' | 'received'; amount: number; currency: string; timestamp: number }>;
  transactionTrends: Array<{ date: string; sent: number; received: number; volume: number }>;
}

interface UseLiveAnalyticsReturn {
  analytics: LiveAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refetch: () => void;
}

export const useLiveAnalytics = (
  walletAddress: string | null,
  timeRange: string = '30d'
): UseLiveAnalyticsReturn => {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch account balance
  const { data: balanceData, refetch: refetchBalance } = useQuery({
    queryKey: ['live-balance', walletAddress],
    queryFn: () => walletAddress ? transactionService.getAccountBalance(walletAddress) : null,
    enabled: !!walletAddress,
    refetchInterval: 30000, // Update balance every 30 seconds
  });

  // Fetch transaction statistics
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['live-stats', walletAddress, timeRange],
    queryFn: () => walletAddress ? transactionService.getTransactionStats(walletAddress, timeRange) : null,
    enabled: !!walletAddress,
    refetchInterval: 15000, // Update stats every 15 seconds
  });

  // Fetch recent transactions for trends
  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['live-transactions-analytics', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return transactionService.getWalletTransactions(walletAddress, {
        afterTime: thirtyDaysAgo,
        limit: 100
      });
    },
    enabled: !!walletAddress,
    refetchInterval: 20000, // Update transactions every 20 seconds
  });

  // Calculate analytics from raw data
  const analytics: LiveAnalytics | null = useState(() => {
    if (!balanceData || !statsData || !transactions) return null;

    // Calculate balances
    const algoBalance = balanceData.algo;
    const algoUsdValue = algoBalance * 0.25; // Mock ALGO price
    
    let totalUsdBalance = algoUsdValue;
    const topAssets = [
      {
        name: 'ALGO',
        amount: algoBalance,
        usdValue: algoUsdValue,
        percentage: 0
      }
    ];

    // Add other assets
    balanceData.assets.forEach(asset => {
      const mockPrice = asset.name === 'USDC' ? 1.0 : asset.name === 'USDT' ? 1.0 : 0.1;
      const usdValue = asset.amount * mockPrice;
      totalUsdBalance += usdValue;
      
      topAssets.push({
        name: asset.name,
        amount: asset.amount,
        usdValue,
        percentage: 0
      });
    });

    // Calculate percentages
    topAssets.forEach(asset => {
      asset.percentage = totalUsdBalance > 0 ? (asset.usdValue / totalUsdBalance) * 100 : 0;
    });

    // Sort by USD value
    topAssets.sort((a, b) => b.usdValue - a.usdValue);

    // Calculate today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = transactions.filter(tx => 
      new Date(tx.timestamp) >= today
    ).length;

    // Calculate recent activity (last 10 transactions)
    const recentActivity = transactions.slice(0, 10).map(tx => ({
      type: (tx.receiver === walletAddress ? 'received' : 'sent') as 'sent' | 'received',
      amount: tx.amount,
      currency: tx.currency,
      timestamp: tx.timestamp
    }));

    // Calculate transaction trends (last 7 days)
    const transactionTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= date && txDate < nextDay;
      });
      
      const sent = dayTransactions
        .filter(tx => tx.sender === walletAddress)
        .reduce((sum, tx) => sum + (tx.usdValue || 0), 0);
      
      const received = dayTransactions
        .filter(tx => tx.receiver === walletAddress)
        .reduce((sum, tx) => sum + (tx.usdValue || 0), 0);
      
      transactionTrends.push({
        date: date.toISOString().split('T')[0],
        sent,
        received,
        volume: sent + received
      });
    }

    // Calculate weekly growth
    const lastWeekVolume = transactionTrends.slice(0, 3).reduce((sum, day) => sum + day.volume, 0);
    const thisWeekVolume = transactionTrends.slice(4, 7).reduce((sum, day) => sum + day.volume, 0);
    const weeklyGrowth = lastWeekVolume > 0 ? ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100 : 0;

    return {
      totalBalance: totalUsdBalance,
      algoBalance,
      usdBalance: totalUsdBalance,
      totalTransactions: statsData.totalTransactions,
      totalSent: statsData.totalSent,
      totalReceived: statsData.totalReceived,
      todayTransactions,
      weeklyGrowth,
      monthlyVolume: statsData.totalSent + statsData.totalReceived,
      topAssets: topAssets.slice(0, 5), // Top 5 assets
      recentActivity,
      transactionTrends
    };
  })[0];

  // Update analytics when data changes
  useEffect(() => {
    if (balanceData && statsData && transactions) {
      setLastUpdate(new Date());
    }
  }, [balanceData, statsData, transactions]);

  const refetch = useCallback(() => {
    Promise.all([
      refetchBalance(),
      refetchStats(),
      refetchTransactions()
    ]).then(() => {
      setLastUpdate(new Date());
    });
  }, [refetchBalance, refetchStats, refetchTransactions]);

  return {
    analytics,
    isLoading: !balanceData || !statsData || !transactions,
    error: null,
    lastUpdate,
    refetch
  };
};
