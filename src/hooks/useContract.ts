import { useState } from 'react';
import { useMetaMask } from './useMetaMask';
import MidribV2ABI from '@/lib/abi/MidribV2.json';

// You'll need to set this to your deployed contract address
const MIDRIB_CONTRACT_ADDRESS = '0x...'; // Replace with actual contract address

export const useContract = () => {
  const { account, isConnected } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = () => {
    if (!window.ethereum || !isConnected) {
      throw new Error('MetaMask not connected');
    }

    const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new (window as any).ethers.Contract(MIDRIB_CONTRACT_ADDRESS, MidribV2ABI, signer);
  };

  const deposit = async (amount: string, token: string) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract();
      
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = (window as any).ethers.utils.parseEther(amount);
      
      // Call deposit function from the contract
      const tx = await contract.deposit(token, amountWei);
      
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

  const withdraw = async (amount: string, token: string) => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = getContract();
      
      // Convert amount to wei (assuming 18 decimals)
      const amountWei = (window as any).ethers.utils.parseEther(amount);
      
      // Call withdraw function from the contract
      const tx = await contract.withdraw(token, amountWei);
      
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
    isLoading,
    error,
    isConnected,
    account
  };
};