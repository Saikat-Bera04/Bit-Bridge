export interface AssetData {
  amount: number;
  usdValue: number;
  percentage: number;
}

export interface PortfolioData {
  assets: Record<string, AssetData>;
  totalValue: number;
  lastUpdated: string;
}

export interface TransactionStats {
  byDay: Record<string, {
    amount: number;
    count: number;
  }>;
  byType: Record<string, number>;
  totalSent: number;
  totalReceived: number;
  totalTransactions: number;
}

export interface AnalysisData {
  portfolio: PortfolioData;
  stats: TransactionStats;
}
