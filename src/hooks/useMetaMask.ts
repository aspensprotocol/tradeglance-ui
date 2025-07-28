import { useState, useEffect } from 'react';

interface MetaMaskState {
  isConnected: boolean;
  account: string | null;
  isInstalled: boolean;
  isConnecting: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (data: any) => void) => void;
      removeListener: (event: string, callback: (data: any) => void) => void;
    };
  }
}

export const useMetaMask = () => {
  const [state, setState] = useState<MetaMaskState>({
    isConnected: false,
    account: null,
    isInstalled: false,
    isConnecting: false,
    error: null,
  });

  useEffect(() => {
    const checkMetaMask = () => {
      const isInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
      console.log('MetaMask check:', { 
        ethereumExists: typeof window.ethereum !== 'undefined',
        isMetaMask: window.ethereum?.isMetaMask 
      });
      setState(prev => ({ ...prev, isInstalled }));
    };

    checkMetaMask();

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('MetaMask accounts changed:', accounts);
      if (accounts.length === 0) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          account: null,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accounts[0],
          error: null,
        }));
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          console.log('Initial MetaMask accounts:', accounts);
          if (accounts.length > 0) {
            setState(prev => ({
              ...prev,
              isConnected: true,
              account: accounts[0],
            }));
          }
        })
        .catch((error) => {
          console.error('Error checking accounts:', error);
          setState(prev => ({
            ...prev,
            error: 'Failed to check MetaMask accounts'
          }));
        });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connect = async () => {
    console.log('Attempting to connect to MetaMask...');
    
    if (!state.isInstalled) {
      const error = 'MetaMask is not installed';
      console.error(error);
      setState(prev => ({ ...prev, error }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      console.log('Requesting MetaMask accounts...');
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });

      console.log('MetaMask connection successful:', accounts);
      if (accounts.length > 0) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          account: accounts[0],
          isConnecting: false,
          error: null,
        }));
      }
    } catch (error: any) {
      console.error('MetaMask connection failed:', error);
      
      // Handle user rejection gracefully (error code 4001)
      if (error.code === 4001) {
        console.log('User rejected MetaMask connection');
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: null, // Don't show error for user rejection
        }));
        return;
      }

      // Handle other common MetaMask errors
      let errorMessage = 'Failed to connect to MetaMask';
      if (error.code === 4001) {
        errorMessage = 'User rejected connection';
      } else if (error.code === -32002) {
        errorMessage = 'MetaMask connection request already pending. Please check your MetaMask extension.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  };

  const disconnect = () => {
    console.log('Disconnecting from MetaMask');
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      error: null,
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTokenBalance = async (tokenSymbol: string, chainId: number): Promise<string> => {
    console.log('getTokenBalance: Starting with token:', tokenSymbol, 'chainId:', chainId);
    console.log('getTokenBalance: Wallet connected:', state.isConnected, 'account:', state.account);
    
    if (!state.isConnected || !state.account) {
      console.log('getTokenBalance: Wallet not connected or no account');
      return "0";
    }

    try {
      // Get the token address from the config
      const { configUtils } = await import('../lib/config-utils');
      const tokenAddress = configUtils.getTokenAddress(chainId, tokenSymbol);
      
      console.log('getTokenBalance: Token address:', tokenAddress);
      
      if (!tokenAddress) {
        console.error(`Token address not found for ${tokenSymbol} on chain ${chainId}`);
        return "0";
      }

      // ERC-20 token balance call
      const balance = await window.ethereum!.request({
        method: 'eth_call',
        params: [
          {
            to: tokenAddress,
            data: '0x70a08231' + '000000000000000000000000' + state.account.slice(2), // balanceOf(address)
          },
          'latest'
        ]
      });

      console.log('getTokenBalance: Raw balance response:', balance);

      // Convert hex balance to decimal
      const balanceDecimal = parseInt(balance, 16);
      
      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(chainId);
      const tokenConfig = chainConfig?.tokens[tokenSymbol];
      const decimals = tokenConfig?.decimals || 18;
      
      console.log('getTokenBalance: Balance decimal:', balanceDecimal, 'decimals:', decimals);
      
      // Convert to human readable format
      const formattedBalance = (balanceDecimal / Math.pow(10, decimals)).toFixed(6);
      
      console.log(`Token balance for ${tokenSymbol}:`, formattedBalance);
      return formattedBalance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return "0";
    }
  };

  return {
    ...state,
    connect,
    disconnect,
    formatAddress,
    getTokenBalance,
  };
};