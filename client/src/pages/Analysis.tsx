import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, PieChart as PieChartIcon, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { transactionService } from '@/services/transactionService';
import { PortfolioData, TransactionStats } from '@/types/analysis';
import WalletManager from '@/utils/WalletManager';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Analysis Content Component
const AnalysisContent = ({ 
  portfolioData, 
  statsData, 
  timeRange, 
  setTimeRange, 
  refetchStats, 
  activeTab, 
  setActiveTab,
  isDemoMode = false 
}: {
  portfolioData: PortfolioData | undefined;
  statsData: TransactionStats | undefined;
  timeRange: string;
  setTimeRange: (value: string) => void;
  refetchStats: () => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
  isDemoMode?: boolean;
}) => {
  // Prepare data for charts
  const preparePortfolioData = () => {
    if (!portfolioData?.assets) return [];
    
    return Object.entries(portfolioData.assets).map(([asset, data]) => ({
      name: asset,
      value: parseFloat(Number(data.amount || 0).toFixed(2)),
      percentage: data.percentage ? Number(data.percentage).toFixed(1) : '0.0'
    }));
  };

  const prepareTransactionData = () => {
    if (!statsData?.byDay) return [];
    
    try {
      return Object.entries(statsData.byDay)
        .map(([date, data]: [string, any]) => ({
          date: format(new Date(date), 'MMM d'),
          amount: data?.amount || 0,
          count: data?.count || 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error preparing transaction data:', error);
      return [];
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      {isDemoMode && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You're viewing demo data. Connect to see your actual transaction analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format((statsData?.totalSent || 0) + (statsData?.totalReceived || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  across {statsData?.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sent</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  -{new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(statsData?.totalSent || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsData?.byType?.send || 0} transactions
                </p>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Received</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  +{new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(statsData?.totalReceived || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statsData?.byType?.receive || 0} transactions
                </p>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-transparent border border-border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetchStats()}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareTransactionData()}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'amount' ? `$${value}` : value,
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="amount" name="Amount ($)" fill="#8884d8" />
                    <Bar dataKey="count" name="Transaction Count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Sent', value: statsData?.byType?.send || 0, color: '#ff6b6b' },
                          { name: 'Received', value: statsData?.byType?.receive || 0, color: '#51cf66' },
                          { name: 'Swaps', value: statsData?.byType?.swap || 0, color: '#fcc419' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Sent', color: '#ff6b6b' },
                          { name: 'Received', color: '#51cf66' },
                          { name: 'Swaps', color: '#fcc419' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          props.payload.name,
                          `${value} transactions`
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <CardHeader>
                <CardTitle>Asset Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={preparePortfolioData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preparePortfolioData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${props.payload.name}: ${value} (${props.payload.percentage}%)`,
                        'Amount'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </GlassCard>

            <div className="space-y-6">
              <GlassCard>
                <CardHeader>
                  <CardTitle>Portfolio Value</CardTitle>
                  <div className="text-3xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(portfolioData?.totalValue || 0)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {preparePortfolioData().map((asset, index) => (
                      <div key={asset.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{asset.name}</span>
                        </div>
                        <div className="text-right">
                          <div>{asset.value}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlassCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

const Analysis = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDemoData, setShowDemoData] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const walletManager = WalletManager.getInstance();

  // Get connected wallet address
  useEffect(() => {
    const checkWallet = () => {
      if (walletManager.isWalletConnected()) {
        const accounts = walletManager.getConnectedAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkWallet();
  }, []);

  // Fetch portfolio data (account balance)
  const { 
    data: portfolioData, 
    isLoading: portfolioLoading, 
    error: portfolioError 
  } = useQuery<PortfolioData, Error>({
    queryKey: ['portfolio', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('No wallet connected');
      
      const balance = await transactionService.getAccountBalance(walletAddress);
      
      // Convert balance data to portfolio format
      const assets: Record<string, any> = {};
      let totalValue = 0;
      
      // Add ALGO
      if (balance.algo > 0) {
        const algoValue = balance.algo * 0.25; // Mock price
        assets.ALGO = {
          amount: balance.algo,
          usdValue: algoValue,
          percentage: 0 // Will calculate after
        };
        totalValue += algoValue;
      }
      
      // Add other assets
      balance.assets.forEach(asset => {
        const mockPrice = asset.name === 'USDC' ? 1.0 : 0.1;
        const usdValue = asset.amount * mockPrice;
        assets[asset.name] = {
          amount: asset.amount,
          usdValue,
          percentage: 0 // Will calculate after
        };
        totalValue += usdValue;
      });
      
      // Calculate percentages
      Object.keys(assets).forEach(key => {
        assets[key].percentage = totalValue > 0 ? (assets[key].usdValue / totalValue) * 100 : 0;
      });
      
      return {
        assets,
        totalValue,
        lastUpdated: new Date().toISOString()
      };
    },
    enabled: !!walletAddress,
    retry: 2
  });

  // Fetch transaction statistics
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery<TransactionStats, Error>({
    queryKey: ['transactionStats', walletAddress, timeRange],
    queryFn: () => {
      if (!walletAddress) throw new Error('No wallet connected');
      return transactionService.getTransactionStats(walletAddress, timeRange);
    },
    enabled: !!walletAddress,
    retry: 2
  });

  // Prepare data for charts
  const preparePortfolioData = () => {
    if (!portfolioData?.assets) return [];
    
    return Object.entries(portfolioData.assets).map(([asset, data]) => ({
      name: asset,
      value: parseFloat(Number(data.amount || 0).toFixed(2)),
      percentage: data.percentage ? Number(data.percentage).toFixed(1) : '0.0'
    }));
  };

  const prepareTransactionData = () => {
    if (!statsData?.byDay) return [];
    
    try {
      return Object.entries(statsData.byDay)
        .map(([date, data]: [string, any]) => ({
          date: format(new Date(date), 'MMM d'),
          amount: data?.amount || 0,
          count: data?.count || 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error preparing transaction data:', error);
      return [];
    }
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Show wallet connection prompt if no wallet
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
            <p className="text-xl text-muted-foreground">
              Insights and analytics for your transactions
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <GlassCard>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your Pera Wallet to view detailed transaction analytics and portfolio insights.
                </p>
                <Button onClick={() => window.location.href = '/profile'} className="w-full">
                  Connect Wallet
                </Button>
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  if (portfolioLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
            <p className="text-xl text-muted-foreground">
              Loading your analytics...
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Analyzing your transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle errors with fallback data
  if (portfolioError || statsError) {
    const hasPortfolioData = portfolioData && Object.keys(portfolioData).length > 0;
    const hasStatsData = statsData && Object.keys(statsData).length > 0;
    
    // If we have some data, show it with a warning
    if (hasPortfolioData || hasStatsData) {
      return (
        <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
              <p className="text-xl text-muted-foreground">
                Insights and analytics for your transactions
              </p>
            </div>

            {/* Warning banner */}
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Some data may be outdated due to network issues. 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-yellow-700 underline ml-1"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['portfolio'] });
                        queryClient.invalidateQueries({ queryKey: ['transactionStats', timeRange] });
                      }}
                    >
                      Refresh now
                    </Button>
                  </p>
                </div>
              </div>
            </div>

            {/* Show available data */}
            <AnalysisContent 
              portfolioData={portfolioData} 
              statsData={statsData} 
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              refetchStats={refetchStats}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
        </div>
      );
    }

    // If no data available, show error with demo data option
    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
            <p className="text-xl text-muted-foreground">
              Insights and analytics for your transactions
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <GlassCard>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
                <p className="text-muted-foreground mb-4">
                  We're having trouble connecting to our servers. Your transaction data is safe.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
                      queryClient.invalidateQueries({ queryKey: ['transactionStats', timeRange] });
                    }}
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowDemoData(true)}
                    className="w-full"
                  >
                    View Demo Data
                  </Button>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // Show demo data if requested
  if (showDemoData) {
    const demoPortfolio = {
      assets: {
        ALGO: { amount: 1000.5, usdValue: 250.25, percentage: 60.5 },
        USDC: { amount: 500, usdValue: 500, percentage: 30.2 },
        YLDY: { amount: 10000, usdValue: 150.75, percentage: 9.3 }
      },
      totalValue: 901,
      lastUpdated: new Date().toISOString()
    };
    const demoStats = {
      totalSent: 1250,
      totalReceived: 2100,
      totalTransactions: 45,
      byType: { send: 20, receive: 18, swap: 7 },
      byDay: {
        '2025-09-10': { amount: 150, count: 3 },
        '2025-09-11': { amount: 200, count: 2 },
        '2025-09-12': { amount: 300, count: 4 },
        '2025-09-13': { amount: 180, count: 2 },
        '2025-09-14': { amount: 220, count: 3 },
        '2025-09-15': { amount: 280, count: 5 },
        '2025-09-16': { amount: 320, count: 4 }
      }
    };

    return (
      <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
            <p className="text-xl text-muted-foreground">
              Insights and analytics for your transactions
            </p>
          </div>

          <AnalysisContent 
            portfolioData={demoPortfolio} 
            statsData={demoStats} 
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            refetchStats={refetchStats}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDemoMode={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Transaction Analysis</h1>
          <p className="text-xl text-muted-foreground">
            Insights and analytics for your transactions
          </p>
          {walletAddress && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Analyzing wallet: <span className="font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
              </p>
            </div>
          )}
        </div>

        <AnalysisContent 
          portfolioData={portfolioData} 
          statsData={statsData} 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          refetchStats={refetchStats}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default Analysis;
