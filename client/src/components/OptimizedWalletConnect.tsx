import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wallet, LogOut, User, QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PeraWalletConnect } from "@perawallet/connect";
import { getPeraWalletConfig, getCurrentNetwork } from "@/config/network";

// Singleton wallet instance with lazy initialization
class WalletManager {
  private static instance: WalletManager;
  private wallet: PeraWalletConnect | null = null;
  private initPromise: Promise<PeraWalletConnect | null> | null = null;
  private listeners: Set<() => void> = new Set();

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  async getWallet(): Promise<PeraWalletConnect | null> {
    if (this.wallet) return this.wallet;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initializeWallet();
    return this.initPromise;
  }

  private async initializeWallet(): Promise<PeraWalletConnect | null> {
    try {
      const config = getPeraWalletConfig();
      const network = getCurrentNetwork();
      
      console.log(`Initializing Pera Wallet for ${network.name} (chainId: ${config.chainId})`);
      
      this.wallet = new PeraWalletConnect(config);
      
      // Minimal initialization delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return this.wallet;
    } catch (error) {
      console.error('Failed to initialize Pera Wallet:', error);
      this.wallet = null;
      return null;
    } finally {
      this.initPromise = null;
    }
  }

  addListener(callback: () => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: () => void) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  async disconnect() {
    console.log('🔌 Disconnecting wallet...');
    if (this.wallet) {
      try {
        // Force disconnect even if it throws an error
        await this.wallet.disconnect();
        
        // Remove all event listeners
        if (this.wallet.connector?.off) {
          this.wallet.connector.off("disconnect");
          this.wallet.connector.off("connect");
        }
        
        // Clear the wallet instance
        this.wallet = null;
        this.initPromise = null;
        
        console.log('✅ Wallet disconnected successfully');
      } catch (error) {
        console.warn('⚠️ Error during wallet disconnect (forcing cleanup):', error);
        // Force cleanup even on error
        this.wallet = null;
        this.initPromise = null;
      }
      this.notifyListeners();
    }
  }
}

const walletManager = WalletManager.getInstance();

export const OptimizedWalletConnect = () => {
  const { login, logout: authLogout, user } = useAuth();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const mountedRef = useRef(true);

  // Memoized address formatter
  const formattedAddress = useMemo(() => {
    if (!accountAddress) return '';
    return `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`;
  }, [accountAddress]);

  const handleDisconnectWalletClick = useCallback(async () => {
    console.log('🚪 User requested wallet disconnect');
    
    try {
      // Always clear local state first
      if (mountedRef.current) {
        setAccountAddress(null);
        setIsConnected(false);
      }
      
      // Then disconnect from wallet
      await walletManager.disconnect();
      
      // Finally logout from auth context
      authLogout();
      
      toast.success("🎉 Wallet disconnected successfully!");
    } catch (error) {
      console.error("Error during disconnect:", error);
      
      // Force cleanup even on error
      if (mountedRef.current) {
        setAccountAddress(null);
        setIsConnected(false);
      }
      authLogout();
      toast.success("Wallet disconnected");
    }
  }, [authLogout]);

  const handleConnectWalletClick = useCallback(async () => {
    if (isConnectingRef.current) {
      toast.error("Connection already in progress. Please wait.");
      return;
    }
    
    isConnectingRef.current = true;
    setIsConnecting(true);
    
    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (isConnectingRef.current && mountedRef.current) {
        isConnectingRef.current = false;
        setIsConnecting(false);
        toast.error("Connection timeout. Please try again.");
      }
    }, 30000);
    
    try {
      const wallet = await walletManager.getWallet();
      if (!wallet) {
        throw new Error("Pera Wallet initialization failed");
      }

      const newAccounts = await wallet.connect();
      
      if (!newAccounts || newAccounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }
      
      // Clear timeout on success
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Setup disconnect listener
      if (wallet.connector?.on) {
        wallet.connector.on("disconnect", handleDisconnectWalletClick);
      }

      if (mountedRef.current) {
        setAccountAddress(newAccounts[0]);
        setIsConnected(true);
        
        // Create user data from wallet address
        const userData = {
          walletAddress: newAccounts[0],
          firstName: 'Pera',
          lastName: 'User',
          email: `${newAccounts[0].slice(0, 8)}@pera.wallet`,
          country: 'US',
          phoneNumber: '',
          kycStatus: 'pending',
          preferredCurrency: 'USD'
        };
        
        // Non-blocking login
        requestAnimationFrame(() => {
          login(userData, 'pera_auth_token_' + Date.now());
        });
        
        toast.success("Pera Wallet connected successfully!");
      }
    } catch (error: any) {
      console.error("Failed to connect Pera Wallet:", error);
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Handle specific Pera Wallet errors
      if (error?.name === 'PeraWalletConnectError' && error?.data?.type === 'CONNECT_MODAL_CLOSED') {
        return; // Exit early, don't show any error
      } else if (error?.message?.includes('User rejected') || error?.message?.includes('User cancelled')) {
        toast.error("Connection cancelled by user");
      } else if (error?.message?.includes('No accounts')) {
        toast.error("No accounts found in wallet");
      } else if (error?.message?.includes('initialization failed')) {
        toast.error("Pera Wallet is not available. Please install the Pera Wallet extension or use the mobile app.");
      } else {
        toast.error("Failed to connect Pera Wallet. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        isConnectingRef.current = false;
        setIsConnecting(false);
      }
    }
  }, [login, handleDisconnectWalletClick]);

  // Reconnection effect with debouncing
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    
    const reconnectSession = async () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      
      reconnectTimeout = setTimeout(async () => {
        if (!mountedRef.current) return;
        
        try {
          const wallet = await walletManager.getWallet();
          if (!wallet || !mountedRef.current) return;
          
          if (wallet.reconnectSession) {
            const accounts = await wallet.reconnectSession();
            
            if (!mountedRef.current) return;
            
            // Setup the disconnect event listener
            if (wallet.connector?.on) {
              wallet.connector.on("disconnect", handleDisconnectWalletClick);
            }

            if (accounts && accounts.length) {
              setAccountAddress(accounts[0]);
              setIsConnected(true);
              
              // Create user data from wallet address
              const userData = {
                walletAddress: accounts[0],
                firstName: 'Pera',
                lastName: 'User',
                email: `${accounts[0].slice(0, 8)}@pera.wallet`,
                country: 'US',
                phoneNumber: '',
                kycStatus: 'pending',
                preferredCurrency: 'USD'
              };
              
              login(userData, 'pera_auth_token_' + Date.now());
            }
          }
        } catch (e: any) {
          // Suppress modal closure errors during reconnection
          if (e?.name === 'PeraWalletConnectError' && e?.data?.type === 'CONNECT_MODAL_CLOSED') {
            return;
          }
          console.log('Reconnect session error:', e);
        }
      }, 500); // Increased debounce for better performance
    };
    
    reconnectSession();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [login, handleDisconnectWalletClick]);

  // Sync with AuthContext
  useEffect(() => {
    if (user?.walletAddress && !accountAddress && !isConnecting) {
      setAccountAddress(user.walletAddress);
      setIsConnected(true);
    }
  }, [user, accountAddress, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (accountAddress || isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {formattedAddress}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Connected with Pera Wallet
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnectWalletClick}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnectWalletClick}
      disabled={isConnecting}
      className="h-9 px-4 flex items-center gap-2"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
