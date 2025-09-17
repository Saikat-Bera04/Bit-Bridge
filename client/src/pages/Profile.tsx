import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Loader2, 
  Edit2, 
  Check, 
  X, 
  Upload, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  LogIn,
  Copy,
  Wallet,
  Download,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { format } from 'date-fns';
import { transactionService } from '@/services/transactionService';
import { profileService, UserProfile } from '@/services/profileService';

import WalletManager from '@/utils/WalletManager';
import { WalletConnect } from '@/components/WalletConnect';
import { getCurrentNetwork } from "@/config/network";

type ProfileData = {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  walletAddress: string;
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const queryClient = useQueryClient();
  
  // Load profile from localStorage
  const [profileData, setProfileData] = useState<UserProfile>(() => {
    return profileService.getProfile() || profileService.updateProfile({
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      country: user?.country || '',
      phoneNumber: user?.phoneNumber || '',
      walletAddress: user?.walletAddress || ''
    });
  });
  
  const [walletInfo, setWalletInfo] = useState({
    balance: "0",
    algoBalance: "0",
    kycStatus: "not_verified",
    accountAge: "Not connected"
  });

  const walletManager = WalletManager.getInstance();

  // Check for existing wallet connection
  useEffect(() => {
    const checkWallet = async () => {
      if (walletManager.isWalletConnected()) {
        const accounts = walletManager.getConnectedAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await handleWalletLogin(accounts[0]);
        }
      }
    };

    checkWallet();
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const accounts = await walletManager.connect();
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await handleWalletLogin(accounts[0]);
        toast.success('Wallet connected successfully');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to connect wallet');
      } else {
        toast.error('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    toast.success('Wallet disconnected');
  };

  const handleWalletLogin = async (address: string) => {
    try {
      // Update the user's wallet address in the backend
      await updateProfileMutation.mutateAsync({ walletAddress: address });
      toast.success('Wallet connected successfully');
    } catch (error) {
      console.error('Wallet login failed:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Update profile completion on data change
  useEffect(() => {
    setProfileCompletion(profileService.getProfileCompletion());
  }, [profileData]);

  // Update profile mutation using localStorage
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => {
      return Promise.resolve(profileService.updateProfile(data));
    },
    onSuccess: (updatedProfile) => {
      setProfileData(updatedProfile);
      setProfileCompletion(profileService.getProfileCompletion());
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  // Sync profile data when user data changes
  useEffect(() => {
    if (user) {
      const updatedProfile = profileService.updateProfile({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        country: user.country || '',
        phoneNumber: user.phoneNumber || '',
        walletAddress: user.walletAddress || ''
      });
      setProfileData(updatedProfile);
    }
  }, [user]);

  // Update wallet info when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      setWalletInfo({
        balance: "1,250.45",
        algoBalance: "150.25",
        kycStatus: "verified",
        accountAge: "8 months"
      });
    } else {
      setWalletInfo({
        balance: "0",
        algoBalance: "0",
        kycStatus: "not_verified",
        accountAge: "Not connected"
      });
    }
  }, [walletAddress]);

  // Mock transaction data
  const mockTransactions = [
    {
      id: '1',
      type: 'send' as const,
      amount: '250.00',
      currency: 'USDC',
      status: 'completed' as const,
      timestamp: '2025-09-15T14:30:00Z',
      recipient: 'ALGORAND9A8B7C6D5E4F3G2H1',
      note: 'Dinner with friends'
    },
    {
      id: '2',
      type: 'receive' as const,
      amount: '500.00',
      currency: 'USDC',
      status: 'completed' as const,
      timestamp: '2025-09-10T09:15:00Z',
      sender: 'ALGORAND1A2B3C4D5E6F7G8H9',
      note: 'Freelance payment'
    },
    {
      id: '3',
      type: 'send' as const,
      amount: '50.25',
      currency: 'ALGO',
      status: 'pending' as const,
      timestamp: '2025-09-17T10:45:00Z',
      recipient: 'ALGORANDZ9Y8X7W6V5U4T3S2R1',
      note: 'NFT purchase'
    },
    {
      id: '4',
      type: 'receive' as const,
      amount: '1000.00',
      currency: 'USDC',
      status: 'completed' as const,
      timestamp: '2025-08-28T16:20:00Z',
      sender: 'ALGORAND9Z8Y7X6W5V4U3T2S1',
      note: 'Salary'
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload this to your backend
    toast.info('File upload functionality coming soon');
  };

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        country: user.country || prev.country,
        phoneNumber: user.phoneNumber || prev.phoneNumber,
        walletAddress: user.walletAddress || prev.walletAddress
      }));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <div className="space-y-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-primary/30">
                    <AvatarImage src="/api/placeholder/96/96" alt="Profile" />
                    <AvatarFallback className="text-lg bg-gradient-primary text-white">
                      {profileData.firstName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <h3 className="text-xl font-semibold mt-4">{profileData.firstName} {profileData.lastName}</h3>
                <p className="text-muted-foreground">{profileData.email}</p>

                {/* Profile Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      disabled={!isEditing}
                      className="bg-white/5 border-white/20 focus:border-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="mt-6" 
                    onClick={handleEdit}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="wallet">
              <GlassCard className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Connection</span>
                </h3>
                
                {!walletAddress ? (
                  <div className="text-center py-8">
                    <WalletIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">Connect Your Pera Wallet</h4>
                    <p className="text-muted-foreground mb-6">
                      Connect your Pera Wallet to view balance and manage transactions
                    </p>
                    <WalletConnect />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm bg-white/5 p-2 rounded border">
                          {walletAddress}
                        </p>
                        <Button variant="ghost" size="sm" className="shrink-0">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">USDC Balance</p>
                        <p className="text-2xl font-bold mt-1">{walletInfo.balance} USDC</p>
                      </div>
                      
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">ALGO Balance</p>
                        <p className="text-2xl font-bold mt-1">{walletInfo.algoBalance} ALGO</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 mt-6">
                      <h4 className="font-medium mb-3">Recent Transactions</h4>
                      {mockTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {mockTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${
                                  tx.type === 'receive' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                                }`}>
                                  {tx.type === 'receive' ? (
                                    <ArrowDownLeft className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {tx.type === 'receive' ? 'Received' : 'Sent'} {tx.amount} {tx.currency}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={tx.status === 'completed' ? 'default' : 'outline'}>
                                {tx.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No transactions yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </GlassCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;