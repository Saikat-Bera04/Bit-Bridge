import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Wallet, LogOut, User, QrCode, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PeraWalletConnect } from "@perawallet/connect";
import { getMobilePeraWalletConfig, getCurrentNetwork } from "@/config/network";

// Mobile-optimized Pera Wallet initialization
let peraWallet: PeraWalletConnect | null = null;
let isInitializing = false;

const initializePeraWallet = async () => {
  if (peraWallet) return peraWallet;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return peraWallet;
  }
  
  isInitializing = true;
  try {
    const config = getMobilePeraWalletConfig();
    const network = getCurrentNetwork();
    
    console.log(`Initializing Mobile Pera Wallet for ${network.name} (chainId: ${config.chainId})`);
    
    peraWallet = new PeraWalletConnect(config);
    
    // Shorter delay for mobile
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return peraWallet;
  } catch (error) {
    console.error('Failed to initialize Pera Wallet:', error);
    return null;
  } finally {
    isInitializing = false;
  }
};

// Detect if user is on mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const MobileWalletConnect = () => {
  const { login, logout: authLogout, user } = useAuth();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const mobile = isMobile();

  const handleDisconnectWalletClick = useCallback(async () => {
    console.log('📱 Mobile wallet disconnect requested');
    
    try {
      // Clear local state first
      setAccountAddress(null);
      setIsConnected(false);
      
      // Try to disconnect wallet
      const wallet = await initializePeraWallet();
      if (wallet) {
        await wallet.disconnect();
        if (wallet.connector?.off) {
          wallet.connector.off("disconnect");
          wallet.connector.off("connect");
        }
      }
      
      // Clear global wallet instance
      peraWallet = null;
      
      // Logout from auth context
      authLogout();
      
      toast.success("🎉 Mobile wallet disconnected!");
    } catch (error) {
      console.error("Mobile wallet disconnect error:", error);
      
      // Force cleanup even on error
      setAccountAddress(null);
      setIsConnected(false);
      peraWallet = null;
      authLogout();
      
      toast.success("Wallet disconnected");
    }
  }, [authLogout]);

  useEffect(() => {
    if (user?.walletAddress && !isConnected) {
      setAccountAddress(user.walletAddress);
      setIsConnected(true);
    } else if (!user?.walletAddress && isConnected) {
      setAccountAddress(null);
      setIsConnected(false);
    }
  }, [user?.walletAddress, isConnected]);

  useEffect(() => {
    let mounted = true;
    
    const reconnectSession = async () => {
      // Prevent multiple reconnection attempts
      if (isConnected || user?.walletAddress) {
        return;
      }
      
      try {
        console.log('📱 Checking for existing mobile wallet session...');
        const wallet = await initializePeraWallet();
        if (!wallet || !mounted) return;
        
        if (wallet.reconnectSession) {
          try {
            const accounts = await wallet.reconnectSession();
            
            if (!mounted || isConnected) return;
            
            if (accounts && accounts.length) {
              console.log('✅ Mobile wallet session restored:', accounts[0]);
              setAccountAddress(accounts[0]);
              setIsConnected(true);
              
              // Update auth context
              login(accounts[0], 'pera_mobile_token_' + Date.now());
            }
          } catch (reconnectError: any) {
            // Silent handling of WebSocket and connection errors
            if (reconnectError?.message?.includes('WebSocket') || 
                reconnectError?.message?.includes('Insufficient resources')) {
              console.log('🔌 WebSocket connection issue (handled silently)');
            } else {
              console.log('📱 No existing mobile wallet session');
            }
          }
        }
      } catch (error: any) {
        // Silent error handling for initialization failures
        console.log('📱 Mobile wallet check skipped:', error?.message || 'Unknown error');
      }
    };
    // Only attempt reconnection once on mount
    reconnectSession();

    return () => {
      mounted = false;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const handleMobileConnect = async () => {
    if (isConnectingRef.current) {
      toast.error("Connection in progress...");
      return;
    }
    
    isConnectingRef.current = true;
    setIsConnecting(true);
    
    // Mobile-optimized timeout (shorter)
    connectionTimeoutRef.current = setTimeout(() => {
      if (isConnectingRef.current) {
        isConnectingRef.current = false;
        setIsConnecting(false);
        setShowMobileDialog(false);
        toast.error("Connection timeout. Please try again.");
      }
    }, 30000);
    
    try {
      const wallet = await initializePeraWallet();
      if (!wallet) {
        throw new Error("Pera Wallet not available");
      }

      // For mobile, show instructions first
      if (mobile) {
        setShowMobileDialog(true);
      }

      const newAccounts = await wallet.connect();
      
      if (!newAccounts || newAccounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (wallet.connector?.on) {
        wallet.connector.on("disconnect", handleDisconnectWalletClick);
      }

      setAccountAddress(newAccounts[0]);
      setIsConnected(true);
      setShowMobileDialog(false);
      
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
      
      login(userData, 'pera_auth_token_' + Date.now());
      toast.success("Wallet connected!");
    } catch (error: any) {
      console.error("Connection failed:", error);
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      if (error?.name === 'PeraWalletConnectError' && error?.data?.type === 'CONNECT_MODAL_CLOSED') {
        return; // Silently ignore modal closure
      } else if (error?.message?.includes('not available')) {
        toast.error("Please install Pera Wallet app");
      } else {
        toast.error("Connection failed. Try again.");
      }
      setShowMobileDialog(false);
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  };

  const openPeraWallet = () => {
    if (mobile) {
      // Try to open Pera Wallet app
      window.location.href = 'perawallet://';
      setTimeout(() => {
        // Fallback to app store if app not installed
        window.open('https://perawallet.app/', '_blank');
      }, 1000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (user?.walletAddress && !accountAddress) {
      setAccountAddress(user.walletAddress);
      setIsConnected(true);
    }
  }, [user]);

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
                  {formatAddress(accountAddress)}
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
    <div className="flex items-center gap-2">
      <Button
        onClick={handleMobileConnect}
        disabled={isConnecting}
        className="h-9 px-4 flex items-center gap-2"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <Dialog open={showMobileDialog} onOpenChange={(open) => {
        if (!open && isConnecting) {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          isConnectingRef.current = false;
          setIsConnecting(false);
          toast.error("Connection cancelled");
        }
        setShowMobileDialog(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Connect Pera Wallet
            </DialogTitle>
            <DialogDescription>
              {mobile ? 
                "Tap the button below to open Pera Wallet app and approve the connection." :
                "Scan the QR code with your Pera Wallet mobile app."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {mobile ? (
              <div className="text-center space-y-4">
                <Button
                  onClick={openPeraWallet}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Pera Wallet
                </Button>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>1. Tap "Open Pera Wallet" above</p>
                  <p>2. Approve the connection in the app</p>
                  <p>3. Return to this page</p>
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    QR Code will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
