import React, { useState, useEffect, useRef, useCallback } from "react";
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
import WalletManager from "@/utils/WalletManager";

export const WalletConnect = () => {
  const { login, logout: authLogout, user } = useAuth();
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const walletManager = WalletManager.getInstance();

  const handleDisconnectWalletClick = useCallback(async () => {
    try {
      console.log('🔌 Initiating wallet disconnect...');
      
      // Force disconnect using the enhanced method
      await walletManager.forceDisconnect();
      
      // Clear local component state
      setAccountAddress(null);
      setIsConnected(false);
      
      // Clear auth context
      authLogout();
      
      toast.success("Pera Wallet disconnected successfully!");
    } catch (error) {
      console.error("Failed to disconnect Pera Wallet:", error);
      
      // Force cleanup even if disconnect fails
      setAccountAddress(null);
      setIsConnected(false);
      walletManager.setConnectionState(false, []);
      authLogout();
      
      toast.success("Wallet disconnected");
    }
  }, [authLogout, walletManager]);

  // Sync wallet state with auth context and WalletManager
  useEffect(() => {
    const syncWalletState = () => {
      const walletConnected = walletManager.isWalletConnected();
      const connectedAccounts = walletManager.getConnectedAccounts();
      
      if (user?.walletAddress && !isConnected && walletConnected) {
        setAccountAddress(user.walletAddress);
        setIsConnected(true);
        console.log('🔄 Synced wallet state from auth context');
      } else if (!user?.walletAddress && isConnected) {
        setAccountAddress(null);
        setIsConnected(false);
        walletManager.setConnectionState(false, []);
        console.log('🔄 Cleared wallet state from auth context');
      } else if (walletConnected && connectedAccounts.length > 0 && !isConnected) {
        // Sync from WalletManager state
        setAccountAddress(connectedAccounts[0]);
        setIsConnected(true);
        console.log('🔄 Synced wallet state from WalletManager');
      }
    };

    syncWalletState();
  }, [user?.walletAddress, isConnected, walletManager]);

  // One-time wallet reconnection on mount only
  useEffect(() => {
    let mounted = true;
    let hasAttemptedReconnect = false;
    
    const reconnectSession = async () => {
      // Prevent multiple reconnection attempts
      if (hasAttemptedReconnect || isConnected || user?.walletAddress) {
        return;
      }
      
      hasAttemptedReconnect = true;
      
      try {
        console.log('🔄 Attempting one-time wallet reconnection...');
        if (!mounted) return;
        
        const accounts = await walletManager.reconnectSession();
        
        if (!mounted || isConnected) return;
        
        if (accounts && accounts.length) {
          console.log('✅ Wallet session reconnected:', accounts[0]);
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
      } catch (e: any) {
        // Suppress modal closure errors during reconnection
        if (e?.name === 'PeraWalletConnectError' && e?.data?.type === 'CONNECT_MODAL_CLOSED') {
          return; // Silently ignore modal closure errors
        }
        console.log('Reconnect session error:', e);
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

  const handleConnectWalletClick = useCallback(async () => {
    if (isConnectingRef.current) {
      console.log('⚠️ Connection already in progress, ignoring click');
      return;
    }

    setIsConnecting(true);
    isConnectingRef.current = true;
    
    // Set connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      if (isConnectingRef.current) {
        console.log('⏰ Connection timeout reached');
        setIsConnecting(false);
        isConnectingRef.current = false;
        toast.error("Connection timeout. Please try again.");
      }
    }, 30000);

    try {
      console.log('🔗 Starting wallet connection...');
      const accounts = await walletManager.connect();
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        // Update all states consistently
        setAccountAddress(address);
        setIsConnected(true);
        walletManager.setConnectionState(true, accounts);
        
        // Update auth context
        login(address, 'pera_auth_token_' + Date.now());
        
        toast.success("Pera Wallet connected successfully!");
        console.log('✅ Wallet connected and all states synced:', address);
      }
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      
      // Clear all states consistently
      setAccountAddress(null);
      setIsConnected(false);
      walletManager.setConnectionState(false, []);
      
      if (error.message?.includes('User rejected')) {
        toast.error("Connection cancelled by user");
      } else if (error.message?.includes('timeout')) {
        toast.error("Connection timeout. Please try again.");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
      isConnectingRef.current = false;
      
      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
  }, [login, walletManager]);

  const handleQRConnect = useCallback(async () => {
    if (isConnectingRef.current) {
      toast.error("Connection already in progress. Please wait.");
      return;
    }
    
    setShowQRDialog(true);
    // Use the same connection logic as regular connect
    await handleConnectWalletClick();
  }, [handleConnectWalletClick]);


  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    // If we have a user from AuthContext but no account address, update it
    if (user?.walletAddress && !accountAddress && !isConnecting) {
      setAccountAddress(user.walletAddress);
      setIsConnected(true);
    }
  }, [user, accountAddress, isConnecting]);

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
        onClick={handleConnectWalletClick}
        disabled={isConnecting}
        className="h-9 px-4 flex items-center gap-2"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <Dialog open={showQRDialog} onOpenChange={(open) => {
        if (!open && isConnecting) {
          // Cancel connection if dialog is closed while connecting
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          isConnectingRef.current = false;
          setIsConnecting(false);
          toast.error("Connection cancelled");
        }
        setShowQRDialog(open);
      }}>
        <DialogTrigger asChild>
          <Button
            onClick={handleQRConnect}
            disabled={isConnecting}
            variant="outline"
            className="h-9 px-3"
            title="Connect with QR Code"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Connect Mobile Wallet
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your Pera Wallet mobile app to connect.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  QR Code will appear here when connecting
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Steps to connect:</p>
              <ol className="text-xs text-gray-600 mt-1 space-y-1">
                <li>1. Open Pera Wallet on your mobile device</li>
                <li>2. Tap "Connect to dApp"</li>
                <li>3. Scan this QR code</li>
                <li>4. Approve the connection</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};