import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PeraWalletConnect } from '@perawallet/connect';
import { getPeraWalletConfig } from '@/config/network';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress: string;
  kycStatus: string;
  kycDocuments: any[];
  twoFactorEnabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferredCurrency: string;
  country: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  peraWallet: PeraWalletConnect | null;
  connectWallet: () => Promise<string[] | undefined>;
  disconnectWallet: () => Promise<void>;
  login: (userData: any, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const login = useCallback((userData: any, token: string) => {
    const userDataString = JSON.stringify(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('mockUserData', userDataString);
    
    const userProfile = {
      id: userData.walletAddress || 'pera_user_' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      walletAddress: userData.walletAddress,
      kycStatus: userData.kycStatus,
      kycDocuments: [],
      twoFactorEnabled: false,
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      preferredCurrency: userData.preferredCurrency,
      country: userData.country,
      phoneNumber: userData.phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setUser(userProfile);
    setIsAuthenticated(true);
    console.log('✅ Wallet authentication completed (offline mode)');
  }, []);

  const logout = useCallback(() => {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockUserData');
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
    navigate('/');
  }, [navigate, queryClient]);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = () => {
      try {
        const wallet = new PeraWalletConnect(getPeraWalletConfig());
        
        if (!mounted) return;
        setPeraWallet(wallet);

        wallet.reconnectSession()
          .then((accounts) => {
            if (accounts.length && mounted) {
              const userData = {
                walletAddress: accounts[0],
                firstName: 'Pera',
                lastName: 'User',
                email: `${accounts[0].slice(0, 8)}@pera.wallet`,
              };
              
              // Use microtask to defer state update
              queueMicrotask(() => {
                if (mounted) {
                  login(userData, localStorage.getItem('authToken') || 'pera_auth_token_' + Date.now());
                }
              });
            }
          })
          .catch(() => {
            console.log('No existing wallet session found');
          })
          .finally(() => {
            if (mounted) {
              queueMicrotask(() => {
                if (mounted) {
                  setIsLoading(false);
                  wallet.connector?.on("disconnect", logout);
                }
              });
            }
          });
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          queueMicrotask(() => {
            if (mounted) {
              setIsLoading(false);
            }
          });
        }
      }
    };

    // Use microtask to defer initialization
    queueMicrotask(initializeAuth);

    return () => {
      mounted = false;
      if (peraWallet?.connector?.off) {
        peraWallet.connector.off("disconnect");
      }
    };
  }, [login, logout]);


  const connectWallet = useCallback(async () => {
    if (!peraWallet) return;
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length) {
        const userData = {
          walletAddress: accounts[0],
          firstName: 'Pera',
          lastName: 'User',
          email: `${accounts[0].slice(0, 8)}@pera.wallet`,
          // ... other default fields
        };
        login(userData, 'pera_auth_token_' + Date.now());
      }
      return accounts;
    } catch (error) {
      console.error(error);
    }
  }, [peraWallet, login]);

  const disconnectWallet = useCallback(async () => {
    if (peraWallet) {
        await peraWallet.disconnect();
    }
    logout();
  }, [peraWallet, logout]);

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated,
        isLoading,
        peraWallet,
        connectWallet,
        disconnectWallet,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
