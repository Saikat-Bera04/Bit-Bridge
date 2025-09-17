// Algorand Network Configuration
export type AlgorandChainIDs = 416001 | 416002 | 416003 | 4160;

export interface NetworkConfig {
  chainId: AlgorandChainIDs;
  name: string;
  algodServer: string;
  algodToken: string;
  algodPort: string;
  explorerUrl: string;
}

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    chainId: 416001,
    name: 'MainNet',
    algodServer: 'https://mainnet-api.algonode.cloud',
    algodToken: '',
    algodPort: '',
    explorerUrl: 'https://explorer.perawallet.app'
  },
  testnet: {
    chainId: 416002,
    name: 'TestNet',
    algodServer: 'https://testnet-api.algonode.cloud',
    algodToken: '',
    algodPort: '',
    explorerUrl: 'https://testnet.explorer.perawallet.app'
  },
  betanet: {
    chainId: 416003,
    name: 'BetaNet',
    algodServer: 'https://betanet-api.algonode.cloud',
    algodToken: '',
    algodPort: '',
    explorerUrl: 'https://betanet.explorer.perawallet.app'
  }
};

// Current network - change this to switch networks
export const CURRENT_NETWORK = 'testnet'; // Change to 'mainnet' or 'betanet' as needed

// Get current network configuration
export const getCurrentNetwork = (): NetworkConfig => {
  return NETWORKS[CURRENT_NETWORK];
};

// Pera Wallet Connect configuration
export const getPeraWalletConfig = () => {
  const network = getCurrentNetwork();
  return {
    chainId: network.chainId,
    shouldShowSignTxnToast: false,
  };
};

// Mobile Pera Wallet Connect configuration
export const getMobilePeraWalletConfig = () => {
  const network = getCurrentNetwork();
  return {
    chainId: network.chainId,
    shouldShowSignTxnToast: false,
    compactMode: true,
  };
};
