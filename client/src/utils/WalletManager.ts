import { PeraWalletConnect } from "@perawallet/connect";
import { getPeraWalletConfig, getCurrentNetwork } from "@/config/network";
import algosdk from "algosdk";

// Centralized Wallet Manager to prevent multiple instances
class WalletManager {
  private static instance: WalletManager;
  private peraWallet: PeraWalletConnect | null = null;
  private isInitializing = false;
  private initPromise: Promise<PeraWalletConnect | null> | null = null;
  private isConnected = false;
  private connectedAccounts: string[] = [];

  private constructor() {}

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  public async getWallet(): Promise<PeraWalletConnect | null> {
    if (this.peraWallet) {
      return this.peraWallet;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitializing) {
      // Wait for current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.peraWallet;
    }

    this.isInitializing = true;
    this.initPromise = this.initializeWallet();
    
    try {
      const wallet = await this.initPromise;
      return wallet;
    } finally {
      this.initPromise = null;
      this.isInitializing = false;
    }
  }

  private async initializeWallet(): Promise<PeraWalletConnect | null> {
    try {
      const config = getPeraWalletConfig();
      const network = getCurrentNetwork();
      
      console.log(`🔗 Initializing Pera Wallet for ${network.name} (chainId: ${config.chainId})`);
      
      this.peraWallet = new PeraWalletConnect({
        chainId: config.chainId,
        shouldShowSignTxnToast: config.shouldShowSignTxnToast
      });
      
      console.log('✅ Pera Wallet initialized successfully');
      return this.peraWallet;
    } catch (error) {
      console.error('❌ Failed to initialize Pera Wallet:', error);
      this.peraWallet = null;
      return null;
    }
  }

  public async connect(): Promise<string[]> {
    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error("PeraWalletConnect was not initialized correctly");
    }

    try {
      const accounts = await wallet.connect();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }
      
      // Store connection state
      this.isConnected = true;
      this.connectedAccounts = accounts;
      console.log('✅ Wallet connected and state saved:', accounts[0]);
      
      return accounts;
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      this.isConnected = false;
      this.connectedAccounts = [];
      throw error;
    }
  }

  public async reconnectSession(): Promise<string[]> {
    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error("PeraWalletConnect was not initialized correctly");
    }

    try {
      if (wallet.reconnectSession) {
        const accounts = await wallet.reconnectSession();
        if (accounts && accounts.length > 0) {
          this.isConnected = true;
          this.connectedAccounts = accounts;
          console.log('✅ Wallet reconnected and state saved:', accounts[0]);
        }
        return accounts || [];
      }
      return [];
    } catch (error: any) {
      console.error('❌ Wallet reconnection failed:', error);
      this.isConnected = false;
      this.connectedAccounts = [];
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.peraWallet) {
        // Clean up event listeners first
        if (this.peraWallet.connector?.off) {
          this.peraWallet.connector.off("disconnect");
          this.peraWallet.connector.off("connect");
        }

        // Attempt to disconnect
        try {
          await this.peraWallet.disconnect();
        } catch (disconnectError) {
          console.warn('Disconnect error (continuing cleanup):', disconnectError);
        }
      }
    } catch (error) {
      console.error('❌ Wallet disconnect error:', error);
    } finally {
      // Force cleanup regardless of errors
      this.peraWallet = null;
      this.isInitializing = false;
      this.initPromise = null;
      this.isConnected = false;
      this.connectedAccounts = [];
      console.log('🧹 Wallet cleanup completed');
    }
  }

  public async signTransaction(txns: algosdk.Transaction[]): Promise<Uint8Array[]> {
    // Check if wallet is connected first
    if (!this.isConnected || this.connectedAccounts.length === 0) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    const wallet = await this.getWallet();
    if (!wallet) {
      throw new Error("PeraWalletConnect was not initialized correctly");
    }

    try {
      console.log('🔐 Signing transaction with connected wallet...');
      // Convert transactions to SignerTransaction format for PeraWallet
      const signerTxns = txns.map(txn => ({ txn }));
      const signedTxns = await wallet.signTransaction([signerTxns]);
      console.log('✅ Transaction signed successfully');
      return signedTxns;
    } catch (error: any) {
      console.error('❌ Transaction signing failed:', error);
      throw error;
    }
  }

  public isWalletConnected(): boolean {
    return this.isConnected && this.connectedAccounts.length > 0;
  }

  public getConnectedAccounts(): string[] {
    return this.connectedAccounts;
  }

  public setConnectionState(isConnected: boolean, accounts: string[] = []): void {
    this.isConnected = isConnected;
    this.connectedAccounts = accounts;
    console.log(`🔄 Wallet state updated: connected=${isConnected}, accounts=${accounts.length}`);
  }

  public setupEventListeners(onDisconnect?: () => void): void {
    if (this.peraWallet?.connector?.on && onDisconnect) {
      try {
        this.peraWallet.connector.on("disconnect", () => {
          console.log('🔌 Wallet disconnected via event listener');
          this.setConnectionState(false, []);
          onDisconnect();
        });
      } catch (error) {
        console.warn('Failed to setup event listeners:', error);
      }
    }
  }

  public async forceDisconnect(): Promise<void> {
    console.log('🔌 Force disconnecting wallet...');
    
    try {
      if (this.peraWallet) {
        // Remove event listeners first
        if (this.peraWallet.connector?.off) {
          this.peraWallet.connector.off("disconnect");
          this.peraWallet.connector.off("connect");
        }

        // Attempt graceful disconnect
        try {
          await this.peraWallet.disconnect();
          console.log('✅ Wallet disconnected gracefully');
        } catch (disconnectError) {
          console.warn('⚠️ Graceful disconnect failed, forcing cleanup:', disconnectError);
        }
      }
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    } finally {
      // Force cleanup all state
      this.peraWallet = null;
      this.isInitializing = false;
      this.initPromise = null;
      this.isConnected = false;
      this.connectedAccounts = [];
      console.log('🧹 Wallet state completely cleared');
    }
  }

  public getAlgodClient(): algosdk.Algodv2 {
    const network = getCurrentNetwork();
    return new algosdk.Algodv2('', network.algodServer, network.algodPort);
  }
}

export default WalletManager;
