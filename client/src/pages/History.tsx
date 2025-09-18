import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, RefreshCw, ExternalLink, Copy, Calendar, TrendingUp, TrendingDown, Wallet, BarChart3, Activity, Bell, BellOff } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { transactionService, AlgorandTransaction, TransactionFilters } from "@/services/transactionService";
import { useLiveTransactions } from "@/hooks/useLiveTransactions";
import { useLiveAnalytics } from "@/hooks/useLiveAnalytics";
import { toast } from "sonner";
import { format } from "date-fns";
import WalletManager from "@/utils/WalletManager";

const History = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 50
  });
  const [timeRange, setTimeRange] = useState("30d");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Check for wallet connection
  useEffect(() => {
    const checkWallet = async () => {
      const walletManager = WalletManager.getInstance();
      if (walletManager.isWalletConnected()) {
        const accounts = walletManager.getConnectedAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    checkWallet();
  }, []);

  // Use live transactions hook
  const {
    transactions,
    isLoading,
    error,
    refetch,
    lastUpdate,
    newTransactionCount,
    markAsViewed,
    isLive,
    toggleLive
  } = useLiveTransactions(walletAddress, filters, timeRange);

  // Use live analytics hook
  const {
    analytics,
    isLoading: analyticsLoading,
    lastUpdate: analyticsLastUpdate,
    refetch: refetchAnalytics
  } = useLiveAnalytics(walletAddress, timeRange);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-400/10";
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  // Helper functions
  const getTransactionType = (tx: AlgorandTransaction) => {
    if (!walletAddress) return 'unknown';
    return tx.receiver === walletAddress ? 'received' : 'sent';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openInExplorer = (txHash: string) => {
    const explorerUrl = `https://testnet.algoexplorer.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !transaction.id.toLowerCase().includes(query) &&
          !transaction.sender.toLowerCase().includes(query) &&
          !transaction.receiver.toLowerCase().includes(query) &&
          !(transaction.note && transaction.note.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'sent' && transaction.sender !== walletAddress) return false;
      if (activeTab === 'received' && transaction.receiver !== walletAddress) return false;

      // Amount filters
      if (filters.minAmount && transaction.amount < filters.minAmount) return false;
      if (filters.maxAmount && transaction.amount > filters.maxAmount) return false;

      return true;
    });
  }, [transactions, searchQuery, activeTab, walletAddress, filters]);

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Transaction History & Analytics</h1>
              <p className="text-blue-200">Track your Algorand transactions and portfolio in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-sm text-blue-200">
                  Last updated: {format(lastUpdate, 'HH:mm:ss')}
                </div>
              )}
              <Button
                onClick={toggleLive}
                variant={isLive ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isLive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {isLive ? 'Live' : 'Paused'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Portfolio Balance */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Portfolio Balance</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    ${analytics.totalBalance.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-200">
                    {analytics.algoBalance.toFixed(4)} ALGO
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {analytics.weeklyGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={analytics.weeklyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {Math.abs(analytics.weeklyGrowth).toFixed(1)}% this week
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Transaction Stats */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">Transactions</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {analytics.totalTransactions}
                  </div>
                  <div className="text-sm text-blue-200">
                    {analytics.todayTransactions} today
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">↗ {analytics.totalReceived}</span>
                    <span className="text-red-400">↙ {analytics.totalSent}</span>
                  </div>
                </div>
              </GlassCard>

              {/* Monthly Volume */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Monthly Volume</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    ${analytics.monthlyVolume.toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-200">
                    Total volume this month
                  </div>
                </div>
              </GlassCard>

              {/* Top Asset */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-semibold text-white">Top Asset</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    {analytics.topAssets[0]?.name || 'ALGO'}
                  </div>
                  <div className="text-sm text-blue-200">
                    ${analytics.topAssets[0]?.usdValue.toFixed(2) || '0.00'}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${analytics.topAssets[0]?.percentage || 0}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Asset Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Asset Distribution</h3>
                <div className="space-y-3">
                  {analytics.topAssets.slice(0, 5).map((asset, index) => (
                    <div key={asset.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-400' : 
                          index === 1 ? 'bg-green-400' : 
                          index === 2 ? 'bg-purple-400' : 
                          index === 3 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className="text-white font-medium">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          ${asset.usdValue.toFixed(2)}
                        </div>
                        <div className="text-sm text-blue-200">
                          {asset.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics.recentActivity.slice(0, 8).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'received' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className="text-white text-sm">
                          {activity.type === 'received' ? 'Received' : 'Sent'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium text-sm">
                          {activity.amount.toFixed(4)} {activity.currency}
                        </div>
                        <div className="text-xs text-blue-200">
                          {format(new Date(activity.timestamp), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <GlassCard className="p-6 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address or transaction hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 focus:border-primary"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* New Transaction Notification */}
        <AnimatePresence>
          {newTransactionCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <GlassCard className="p-4 bg-blue-500/20 border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">
                      {newTransactionCount} new transaction{newTransactionCount > 1 ? 's' : ''} available
                    </span>
                  </div>
                  <Button
                    onClick={markAsViewed}
                    size="sm"
                    variant="outline"
                    className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                  >
                    View Now
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {!walletAddress ? (
                <GlassCard className="p-8 text-center">
                  <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-blue-200 mb-4">
                    Connect your Pera Wallet to view your transaction history and analytics
                  </p>
                </GlassCard>
              ) : isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <GlassCard key={i} className="p-6">
                      <div className="animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-700 rounded w-32"></div>
                              <div className="h-3 bg-gray-700 rounded w-24"></div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-20"></div>
                            <div className="h-3 bg-gray-700 rounded w-16"></div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : error ? (
                <GlassCard className="p-8 text-center">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Error Loading Transactions</h3>
                  <p className="text-blue-200 mb-4">
                    {error.message || 'Failed to load transaction data'}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </GlassCard>
              ) : filteredTransactions.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
                  <p className="text-blue-200">
                    {searchQuery || filters.minAmount || filters.maxAmount
                      ? 'No transactions match your current filters'
                      : 'No transactions found for this wallet'}
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => {
                    const isReceived = transaction.receiver === walletAddress;
                    const isConfirmed = transaction.round > 0;
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GlassCard className="p-6 hover:bg-white/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isReceived ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {isReceived ? '↓' : '↑'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium">
                                    {isReceived ? 'Received from' : 'Sent to'}
                                  </span>
                                  <Badge variant={isConfirmed ? "default" : "secondary"}>
                                    {isConfirmed ? (
                                      <><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</>
                                    ) : (
                                      <><Clock className="w-3 h-3 mr-1" /> Pending</>
                                    )}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-blue-200">
                                  <span>{formatAddress(isReceived ? transaction.sender : transaction.receiver)}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(isReceived ? transaction.sender : transaction.receiver)}
                                    className="p-1 h-auto"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-semibold ${
                                isReceived ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {isReceived ? '+' : '-'}{transaction.amount.toFixed(4)} {transaction.currency}
                              </div>
                              {transaction.usdValue && (
                                <div className="text-sm text-blue-200">
                                  ${transaction.usdValue.toFixed(2)} USD
                                </div>
                              )}
                              <div className="text-xs text-blue-300 mt-1">
                                {formatDate(transaction.timestamp)}
                              </div>
                            </div>
                          </div>
                          
                          {transaction.note && (
                            <div className="mt-4 p-3 bg-white/5 rounded-lg">
                              <span className="text-sm text-blue-200">Note: {transaction.note}</span>
                            </div>
                          )}
                          
                          <div className="mt-4 flex items-center justify-between text-xs text-blue-300">
                            <div className="flex items-center space-x-4">
                              <span>Fee: {transaction.fee.toFixed(6)} ALGO</span>
                              {transaction.round > 0 && (
                                <span>Round: {transaction.round}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(transaction.id)}
                                className="p-1 h-auto"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Hash
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://testnet.algoexplorer.io/tx/${transaction.id}`, '_blank')}
                                className="p-1 h-auto"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Explorer
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default History;