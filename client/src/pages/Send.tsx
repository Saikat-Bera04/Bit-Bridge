import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send as SendIcon, DollarSign, User, MessageSquare, Loader2, Wallet } from "lucide-react";
import algosdk from "algosdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import WalletManager from "@/utils/WalletManager";
import { WalletConnect } from "@/components/WalletConnect";

const Send = () => {
  const { user } = useAuth();
  const walletManager = WalletManager.getInstance();
  const [formData, setFormData] = useState({
    recipient: "",
    currency: "",
    amount: "",
    note: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check wallet connection status from auth context
  useEffect(() => {
    if (user?.walletAddress) {
      setWalletAddress(user.walletAddress);
      setIsWalletConnected(true);
    } else {
      setWalletAddress(null);
      setIsWalletConnected(false);
    }
  }, [user]);

  const currencies = [
    { value: "ALGO", label: "ALGO (Algorand)" },
    { value: "USDC", label: "USDC (USD Coin) - Coming Soon" },
    { value: "USDT", label: "USDT (Tether) - Coming Soon" },
  ];

  const handleConnectWallet = async () => {
    try {
      const accounts = await walletManager.connect();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
        toast.success('Wallet connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient || !formData.currency || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check wallet connection using WalletManager
    if (!walletManager.isWalletConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isWalletConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    
    try {
      const algodClient = walletManager.getAlgodClient();
      
      // Get suggested transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Convert amount to microAlgos (1 ALGO = 1,000,000 microAlgos)
      const amountInMicroAlgos = Math.floor(parseFloat(formData.amount) * 1000000);
      
      let txn;
      
      if (formData.currency === 'ALGO') {
        // Create ALGO payment transaction
        txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: walletAddress!,
          receiver: formData.recipient,
          amount: amountInMicroAlgos,
          note: formData.note ? new Uint8Array(Buffer.from(formData.note)) : undefined,
          suggestedParams
        });
      } else {
        // For ASA transfers (USDC, USDT), we'll use a mock for now
        // In production, you'd need the actual asset IDs
        toast.error('ASA transfers not implemented yet. Please use ALGO for now.');
        return;
      }
      
      // Sign transaction with Pera Wallet
      const signedTxns = await walletManager.signTransaction([txn]);
      
      // Submit transaction to network
      const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
      const txId = response.txid;
      
      // Wait for confirmation
      toast.success('Transaction submitted!', {
        description: `Transaction ID: ${txId}`
      });
      
      // Optionally wait for confirmation
      try {
        await algosdk.waitForConfirmation(algodClient, txId, 4);
        toast.success('Transaction confirmed!', {
          description: `Transaction ${txId} confirmed on Algorand`
        });
      } catch (confirmError) {
        console.log('Confirmation timeout, but transaction was submitted');
      }
        
      // Reset form
      setFormData({
        recipient: "",
        currency: "",
        amount: "",
        note: "",
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient')) {
        toast.error('Insufficient balance for transaction');
      } else {
        toast.error('Transaction failed', {
          description: error.message || 'Please try again'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    try {
      setFormData(prev => ({ ...prev, [field]: value }));
    } catch (error) {
      console.error('Error updating form data:', error);
      toast.error('Error updating form field');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Send <span className="bg-gradient-primary bg-clip-text text-transparent">Money</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Fast, secure, and affordable cross-border transfers
            </p>
          </div>

          {/* Wallet Connection Status */}
          {!isWalletConnected ? (
            <GlassCard className="p-6 mb-6">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your Pera wallet to send transactions
                </p>
                <WalletConnect />
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Wallet Connected</span>
                  <span className="text-xs text-muted-foreground">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </span>
                </div>
                <WalletConnect />
              </div>
            </GlassCard>
          )}

          {/* Send Form */}
          <GlassCard className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient Address */}
              <div className="space-y-2">
                <Label htmlFor="recipient" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Recipient Address</span>
                </Label>
                <Input
                  id="recipient"
                  placeholder="Enter Algorand wallet address"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange("recipient", e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-primary"
                  required
                />
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Currency</span>
                </Label>
                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <div
                      key={currency.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.currency === currency.value
                          ? 'border-primary bg-primary/10'
                          : 'border-white/20 bg-white/5 hover:border-primary/50'
                      }`}
                      onClick={() => {
                        console.log('Currency selected:', currency.value);
                        handleInputChange("currency", currency.value);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{currency.label}</span>
                        {formData.currency === currency.value && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Amount</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-primary"
                  required
                />
              </div>

              {/* Optional Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Note (Optional)</span>
                </Label>
                <Textarea
                  id="note"
                  placeholder="Add a note for the recipient"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  className="bg-white/5 border-white/20 focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              {/* Transaction Summary */}
              {formData.amount && formData.currency && (
                <motion.div
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-semibold mb-2">Transaction Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span>{formData.amount} {formData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network Fee:</span>
                      <span>0.001 ALGO</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold">{formData.amount} {formData.currency} + 0.001 ALGO</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="w-full">
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !isWalletConnected}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-4 h-4" />
                      Send {formData.amount} {formData.currency}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>

          {/* Security Notice */}
          <motion.div
            className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-sm text-center text-primary/80">
              🔒 All transactions are secured by the Algorand blockchain. 
              Always verify recipient addresses before sending.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Send;