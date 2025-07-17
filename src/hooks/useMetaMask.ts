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
      setState(prev => ({ ...prev, isInstalled }));
    };

    checkMetaMask();

    const handleAccountsChanged = (accounts: string[]) => {
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
        });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const connect = async () => {
    if (!state.isInstalled) {
      setState(prev => ({ ...prev, error: 'MetaMask is not installed' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });

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
      // Handle user rejection gracefully (error code 4001)
      if (error.code === 4001) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: null, // Don't show error for user rejection
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect to MetaMask',
      }));
    }
  };

  const disconnect = () => {
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

  return {
    ...state,
    connect,
    disconnect,
    formatAddress,
  };
};