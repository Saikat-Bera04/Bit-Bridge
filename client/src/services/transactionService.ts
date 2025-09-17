import algosdk from 'algosdk';
import { getCurrentNetwork } from '@/config/network';

export interface AlgorandTransaction {
  id: string;
  type: 'payment' | 'asset-transfer' | 'application-call';
  sender: string;
  receiver?: string;
  amount: number;
  assetId?: number;
  fee: number;
  note?: string;
  timestamp: number;
  round: number;
  txHash: string;
  status: 'confirmed' | 'pending' | 'failed';
  currency: string;
  usdValue?: number;
}

export interface TransactionFilters {
  address?: string;
  minAmount?: number;
  maxAmount?: number;
  assetId?: number;
  afterTime?: Date;
  beforeTime?: Date;
  txType?: string;
  limit?: number;
}

class TransactionService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;

  constructor() {
    const network = getCurrentNetwork();
    
    // Initialize Algod client
    this.algodClient = new algosdk.Algodv2(
      network.algodToken,
      network.algodServer,
      network.algodPort
    );

    // Initialize Indexer client for historical data
    this.indexerClient = new algosdk.Indexer(
      '',
      'https://testnet-idx.algonode.cloud',
      443
    );
  }

  /**
   * Fetch transactions for a specific wallet address
   */
  async getWalletTransactions(
    address: string, 
    filters: TransactionFilters = {}
  ): Promise<AlgorandTransaction[]> {
    try {
      console.log('🔍 Fetching transactions for address:', address);
      
      const searchParams: any = {
        address: address,
        limit: filters.limit || 50,
      };

      if (filters.afterTime) {
        searchParams['after-time'] = filters.afterTime.toISOString();
      }
      if (filters.beforeTime) {
        searchParams['before-time'] = filters.beforeTime.toISOString();
      }
      if (filters.minAmount) {
        searchParams['currency-greater-than'] = filters.minAmount * 1000000; // Convert to microAlgos
      }
      if (filters.maxAmount) {
        searchParams['currency-less-than'] = filters.maxAmount * 1000000;
      }

      const response = await this.indexerClient.searchForTransactions()
        .address(address)
        .limit(filters.limit || 50)
        .do();

      console.log('📊 Raw transaction response:', response);

      const transactions: AlgorandTransaction[] = [];

      if (response.transactions) {
        for (const tx of response.transactions) {
          const processedTx = await this.processTransaction(tx, address);
          if (processedTx) {
            transactions.push(processedTx);
          }
        }
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);

      console.log('✅ Processed transactions:', transactions.length);
      return transactions;

    } catch (error) {
      console.error('❌ Error fetching wallet transactions:', error);
      
      // Return mock data for development
      return this.getMockTransactions(address);
    }
  }

  /**
   * Process raw Algorand transaction into our format
   */
  private async processTransaction(
    rawTx: any, 
    userAddress: string
  ): Promise<AlgorandTransaction | null> {
    try {
      const txType = this.getTransactionType(rawTx);
      const isIncoming = this.isIncomingTransaction(rawTx, userAddress);
      
      let amount = 0;
      let currency = 'ALGO';
      let assetId: number | undefined;

      // Handle different transaction types
      if (rawTx['payment-transaction']) {
        amount = rawTx['payment-transaction'].amount / 1000000; // Convert from microAlgos
        currency = 'ALGO';
      } else if (rawTx['asset-transfer-transaction']) {
        const assetTx = rawTx['asset-transfer-transaction'];
        amount = assetTx.amount;
        assetId = assetTx['asset-id'];
        
        // Try to get asset info for currency name
        try {
          const assetInfo = await this.algodClient.getAssetByID(assetId).do();
          currency = assetInfo.params['unit-name'] || `ASA-${assetId}`;
        } catch {
          currency = `ASA-${assetId}`;
        }
      }

      // Decode note if present
      let note: string | undefined;
      if (rawTx.note) {
        try {
          note = new TextDecoder().decode(new Uint8Array(rawTx.note));
        } catch {
          note = undefined;
        }
      }

      const transaction: AlgorandTransaction = {
        id: rawTx.id,
        type: txType,
        sender: rawTx.sender,
        receiver: rawTx['payment-transaction']?.receiver || 
                 rawTx['asset-transfer-transaction']?.receiver,
        amount,
        assetId,
        fee: rawTx.fee / 1000000, // Convert from microAlgos
        note,
        timestamp: rawTx['round-time'] * 1000, // Convert to milliseconds
        round: rawTx['confirmed-round'],
        txHash: rawTx.id,
        status: rawTx['confirmed-round'] ? 'confirmed' : 'pending',
        currency,
        usdValue: await this.getUSDValue(amount, currency)
      };

      return transaction;

    } catch (error) {
      console.error('Error processing transaction:', error);
      return null;
    }
  }

  /**
   * Determine transaction type
   */
  private getTransactionType(rawTx: any): 'payment' | 'asset-transfer' | 'application-call' {
    if (rawTx['payment-transaction']) return 'payment';
    if (rawTx['asset-transfer-transaction']) return 'asset-transfer';
    if (rawTx['application-transaction']) return 'application-call';
    return 'payment';
  }

  /**
   * Check if transaction is incoming for the user
   */
  private isIncomingTransaction(rawTx: any, userAddress: string): boolean {
    const receiver = rawTx['payment-transaction']?.receiver || 
                    rawTx['asset-transfer-transaction']?.receiver;
    return receiver === userAddress;
  }

  /**
   * Get USD value for amount (mock implementation)
   */
  private async getUSDValue(amount: number, currency: string): Promise<number> {
    // Mock exchange rates - in production, fetch from a real API
    const exchangeRates: { [key: string]: number } = {
      'ALGO': 0.25,
      'USDC': 1.00,
      'USDT': 1.00,
      'EURC': 1.08,
    };

    const rate = exchangeRates[currency] || 0;
    return amount * rate;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address: string): Promise<{
    algo: number;
    assets: Array<{ assetId: number; amount: number; name: string; }>
  }> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      
      const balance = {
        algo: Number(accountInfo.amount) / 1000000, // Convert from microAlgos
        assets: [] as Array<{ assetId: number; amount: number; name: string; }>
      };

      // Process asset holdings
      if (accountInfo.assets) {
        for (const asset of accountInfo.assets) {
          try {
            const assetInfo = await this.algodClient.getAssetByID(asset['asset-id']).do();
            balance.assets.push({
              assetId: asset['asset-id'],
              amount: Number(asset.amount) / Math.pow(10, assetInfo.params.decimals || 0),
              name: assetInfo.params['unit-name'] || `ASA-${asset['asset-id']}`
            });
          } catch (error) {
            console.error(`Error fetching asset info for ${asset['asset-id']}:`, error);
          }
        }
      }

      return balance;

    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { algo: 0, assets: [] };
    }
  }

  /**
   * Get transaction statistics for analysis
   */
  async getTransactionStats(
    address: string, 
    timeRange: string = '30d'
  ): Promise<{
    totalSent: number;
    totalReceived: number;
    totalTransactions: number;
    byDay: { [date: string]: { amount: number; count: number } };
    byType: { send: number; receive: number; swap: number };
  }> {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const afterTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const transactions = await this.getWalletTransactions(address, {
        afterTime,
        limit: 1000
      });

      const stats = {
        totalSent: 0,
        totalReceived: 0,
        totalTransactions: transactions.length,
        byDay: {} as { [date: string]: { amount: number; count: number } },
        byType: { send: 0, receive: 0, swap: 0 }
      };

      for (const tx of transactions) {
        const isReceived = tx.receiver === address;
        const usdAmount = tx.usdValue || 0;

        if (isReceived) {
          stats.totalReceived += usdAmount;
          stats.byType.receive++;
        } else {
          stats.totalSent += usdAmount;
          stats.byType.send++;
        }

        // Group by day
        const date = new Date(tx.timestamp).toISOString().split('T')[0];
        if (!stats.byDay[date]) {
          stats.byDay[date] = { amount: 0, count: 0 };
        }
        stats.byDay[date].amount += usdAmount;
        stats.byDay[date].count++;
      }

      return stats;

    } catch (error) {
      console.error('Error calculating transaction stats:', error);
      return this.getMockStats();
    }
  }

  /**
   * Convert time range string to days
   */
  private getTimeRangeDays(timeRange: string): number {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  /**
   * Mock transactions for development/fallback
   */
  private getMockTransactions(address: string): AlgorandTransaction[] {
    return [
      {
        id: 'mock-tx-1',
        type: 'payment',
        sender: 'ALGORAND1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7',
        receiver: address,
        amount: 100.5,
        fee: 0.001,
        note: 'Test payment',
        timestamp: Date.now() - 86400000,
        round: 12345678,
        txHash: 'mock-hash-1',
        status: 'confirmed',
        currency: 'ALGO',
        usdValue: 25.125
      },
      {
        id: 'mock-tx-2',
        type: 'asset-transfer',
        sender: address,
        receiver: 'ALGORAND9Z8Y7X6W5V4U3T2S1R0Q9P8O7N6M5L4K3J2I1H0G9F8E7D6C5B4A3',
        amount: 50.0,
        assetId: 31566704,
        fee: 0.001,
        note: 'USDC transfer',
        timestamp: Date.now() - 172800000,
        round: 12345677,
        txHash: 'mock-hash-2',
        status: 'confirmed',
        currency: 'USDC',
        usdValue: 50.0
      }
    ];
  }

  /**
   * Mock stats for development/fallback
   */
  private getMockStats() {
    return {
      totalSent: 300,
      totalReceived: 700,
      totalTransactions: 16,
      byDay: {
        '2025-09-10': { amount: 150, count: 3 },
        '2025-09-11': { amount: 200, count: 2 },
        '2025-09-12': { amount: 300, count: 4 },
        '2025-09-13': { amount: 180, count: 2 },
        '2025-09-14': { amount: 220, count: 3 },
        '2025-09-15': { amount: 280, count: 5 },
        '2025-09-16': { amount: 320, count: 4 }
      },
      byType: { send: 5, receive: 8, swap: 3 }
    };
  }
}

export const transactionService = new TransactionService();
