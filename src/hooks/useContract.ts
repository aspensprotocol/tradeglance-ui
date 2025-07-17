import { useState } from 'react';
import { useMetaMask } from './useMetaMask';
import MidribV2ABI from '@/lib/abi/MidribV2.json';
import { config, networks } from '@/lib/config';

export const useContract = () => {
  const { account, isConnected } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchToNetwork = async (chainId: number) => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // If network doesn't exist, add it
      if (error.code === 4902) {
        return await addNetwork(chainId);
      }
      console.error('Failed to switch network:', error);
      return false;
    }
  };

  const addNetwork = async (chainId: number) => {
    if (!window.ethereum) return false;
    
    const network = Object.values(networks).find(n => n.chainId === chainId);
    if (!network) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: network.currency,
            symbol: network.currency,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
        }],
      });
      return true;
    } catch (error) {
      console.error('Failed to add network:', error);
      return false;
    }
  };
  const getContract = () => {
    if (!window.ethereum || !isConnected) {
      throw new Error('MetaMask not connected');
    }

    const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new (window as any).ethers.Contract(config.MIDRIB_CONTRACT_ADDRESS, MidribV2ABI, signer);
  };

  const deposit = async (amount: string, token: string, targetChainId?: number) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    // Switch to target network if specified
    if (targetChainId && targetChainId !== config.DEFAULT_CHAIN_ID) {
      const switched = await switchToNetwork(targetChainId);
      if (!switched) {
        setError('Failed to switch to required network');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract();
      
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = (window as any).ethers.utils.parseEther(amount);
      
      // Call deposit function with gas settings
      const tx = await contract.deposit(token, amountWei, {
        gasLimit: config.DEFAULT_GAS_LIMIT,
        gasPrice: config.DEFAULT_GAS_PRICE,
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      console.log('Deposit successful:', tx.hash);
      return tx;
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (amount: string, token: string, targetChainId?: number) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    // Switch to target network if specified
    if (targetChainId && targetChainId !== config.DEFAULT_CHAIN_ID) {
      const switched = await switchToNetwork(targetChainId);
      if (!switched) {
        setError('Failed to switch to required network');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract();
      
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = (window as any).ethers.utils.parseEther(amount);
      
      // Call withdraw function with gas settings
      const tx = await contract.withdraw(token, amountWei, {
        gasLimit: config.DEFAULT_GAS_LIMIT,
        gasPrice: config.DEFAULT_GAS_PRICE,
      });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      console.log('Withdrawal successful:', tx.hash);
      return tx;
    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setError(err.message || 'Withdrawal failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deposit,
    withdraw,
    switchToNetwork,
    addNetwork,
    isLoading,
    error,
    isConnected,
    account,
    config,
    networks
  };
};