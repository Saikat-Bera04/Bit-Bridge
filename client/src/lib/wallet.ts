import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      return { address, provider, signer };
    } catch (error) {
      console.error('User denied account access or error occurred:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask!');
  }
};

export const disconnectWallet = async () => {
  // Note: MetaMask doesn't have a built-in disconnect method
  // We can only clear our local state
  return true;
};