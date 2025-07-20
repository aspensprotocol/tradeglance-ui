import { useState } from 'react';
import { useMetaMask } from './useMetaMask';
import { configUtils } from '../lib/config-utils';
import MidribV2ABI from '@/lib/abi/MidribV2.json';
import { createWalletClient, createPublicClient, parseEther, custom, defineChain, http } from 'viem';
import { parseUnits, encodeFunctionData } from 'viem';
import { anvil } from 'viem/chains';

export const useContract = () => {
  const { account, isConnected } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNetworkToMetaMask = async () => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x14a34', // 84548 in hex
          chainName: 'Anvil Local',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['http://localhost:8545'],
          blockExplorerUrls: ['http://localhost:8545'],
        }],
      });
      return true;
    } catch (error: any) {
      console.error('Failed to add network:', error);
      return false;
    }
  };

  const switchToNetwork = async (chainId: number) => {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      console.error('Failed to switch network:', error);
      // If the network doesn't exist, try to add it
      if (error.code === 4902) {
        console.log('Network not found, attempting to add it...');
        return await addNetworkToMetaMask();
      }
      return false;
    }
  };

  // ERC-20 approve function
  const approve = async (token: string, spender: string, amount: bigint, targetChainId: number) => {
    try {
      console.log(`Approving ${amount} tokens for spender ${spender}`);
      
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });

      // Standard ERC20 ABI for approve function
      const erc20Abi = [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
          ],
          outputs: [{ name: '', type: 'bool' }]
        },
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }]
        }
      ];

      // Create custom chain that matches your actual Anvil configuration
      // Note: Your Anvil instance uses chain ID 84548 (0x14a34), not 84532
      const customAnvilChain = defineChain({
        id: 84548, // Use the actual Anvil chain ID from your instance
        name: 'Anvil Local',
        network: 'anvil',
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: ['http://localhost:8545'] },
          public: { http: ['http://localhost:8545'] },
        },
        blockExplorers: {
          default: { name: 'Anvil', url: 'http://localhost:8545' },
        },
      });

      // ERC-20 approve function - let MetaMask handle the chain
      const hash = await walletClient.writeContract({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, amount],
        chain: customAnvilChain,
        account: account as `0x${string}`,
      });

      console.log('Approval transaction hash:', hash);
      return hash;
    } catch (error) {
      console.error('Approval failed:', error);
      throw error;
    }
  };

  const deposit = async (amount: string, token: string, targetChainId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.ethereum || !isConnected) {
        throw new Error('MetaMask not connected');
      }

      // Ensure we're on the correct network (Anvil chain ID 84548)
      console.log('Ensuring correct network...');
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainIdNumber = parseInt(currentChainId, 16);
      
      if (currentChainIdNumber !== 84548) {
        console.log(`Switching from chain ${currentChainIdNumber} to Anvil chain 84548...`);
        const switched = await switchToNetwork(84548);
        if (!switched) {
          throw new Error('Failed to switch to Anvil network. Please add the network manually in MetaMask.');
        }
        console.log('Successfully switched to Anvil network');
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(`No trade contract found for chain ID ${targetChainId}`);
      }

      // Create custom chain that matches your actual Anvil configuration
      // Note: Your Anvil instance uses chain ID 84548 (0x14a34), not 84532
      const customAnvilChain = defineChain({
        id: 84548, // Use the actual Anvil chain ID from your instance
        name: 'Anvil Local',
        network: 'anvil',
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: ['http://localhost:8545'] },
          public: { http: ['http://localhost:8545'] },
        },
        blockExplorers: {
          default: { name: 'Anvil', url: 'http://localhost:8545' },
        },
      });

      // Create public client for gas estimation
      const publicClient = createPublicClient({
        chain: customAnvilChain,
        transport: http('http://localhost:8545'),
      });

      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(symbol => 
        chainConfig?.tokens[symbol].address.toLowerCase() === token.toLowerCase()
      );
      const decimals = tokenSymbol ? chainConfig?.tokens[tokenSymbol].decimals : 18;
      
      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals);

      console.log(`Converting ${amount} with ${decimals} decimals to: ${amountWei}`);

      // First, try to simulate the deposit to see if it needs approval
      console.log('Simulating deposit to check if approval is needed...');
      try {
        await publicClient.simulateContract({
          address: tradeContractAddress as `0x${string}`,
          abi: MidribV2ABI.abi as any,
          functionName: 'deposit',
          args: [token, amountWei],
          account: account as `0x${string}`,
        });
        console.log('Simulation successful - no approval needed');
      } catch (simulationError: any) {
        console.log('Simulation failed, approval needed:', simulationError.message);
        
        // If simulation fails, try approval first
        console.log('Approving tokens for deposit...');
        await approve(token, tradeContractAddress, amountWei, targetChainId);
        console.log('Approval successful');
      }
      
      // Now attempt the actual deposit
      console.log('Attempting deposit...');
      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi as any,
        functionName: 'deposit',
        args: [token, amountWei],
        chain: customAnvilChain,
        account: account as `0x${string}`,
      });

      console.log('Deposit successful:', hash);
      return hash;
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (amount: string, token: string, targetChainId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!window.ethereum || !isConnected) {
        throw new Error('MetaMask not connected');
      }

      // Ensure we're on the correct network (Anvil chain ID 84548)
      console.log('Ensuring correct network...');
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainIdNumber = parseInt(currentChainId, 16);
      
      if (currentChainIdNumber !== 84548) {
        console.log(`Switching from chain ${currentChainIdNumber} to Anvil chain 84548...`);
        const switched = await switchToNetwork(84548);
        if (!switched) {
          throw new Error('Failed to switch to Anvil network. Please add the network manually in MetaMask.');
        }
        console.log('Successfully switched to Anvil network');
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(`No trade contract found for chain ID ${targetChainId}`);
      }

      // Create custom chain that matches your actual Anvil configuration
      // Note: Your Anvil instance uses chain ID 84548 (0x14a34), not 84532
      const customAnvilChain = defineChain({
        id: 84548, // Use the actual Anvil chain ID from your instance
        name: 'Anvil Local',
        network: 'anvil',
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: ['http://localhost:8545'] },
          public: { http: ['http://localhost:8545'] },
        },
        blockExplorers: {
          default: { name: 'Anvil', url: 'http://localhost:8545' },
        },
      });

      // Create public client for gas estimation
      const publicClient = createPublicClient({
        chain: customAnvilChain,
        transport: http('http://localhost:8545'),
      });

      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
      });

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(symbol => 
        chainConfig?.tokens[symbol].address.toLowerCase() === token.toLowerCase()
      );
      const decimals = tokenSymbol ? chainConfig?.tokens[tokenSymbol].decimals : 18;
      
      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals);

      console.log(`Converting ${amount} with ${decimals} decimals to: ${amountWei}`);

      // Estimate gas first
      const gasEstimate = await publicClient.estimateContractGas({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi as any,
        functionName: 'withdraw',
        args: [token, amountWei],
        account: account as `0x${string}`,
      });

      console.log('Gas estimate:', gasEstimate);

      // Call withdraw function using wallet client with estimated gas
      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi as any,
        functionName: 'withdraw',
        args: [token, amountWei],
        gas: gasEstimate,
        chain: customAnvilChain,
        account: account as `0x${string}`,
      });

      console.log('Withdrawal successful:', hash);
      return hash;
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
    approve,
    switchToNetwork,
    isLoading,
    error,
  };
};