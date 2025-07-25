import { useState, useEffect } from 'react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { createPublicClient, http, parseUnits } from 'viem';
import { mainnet, sepolia, baseSepolia } from 'viem/chains';
import MidribV2ABI from '@/lib/abi/MidribV2.json';
import { configUtils } from '../lib/config-utils';

export const useContract = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get the correct chain based on chain ID
  const getChainById = (id: number) => {
    switch (id) {
      case 1:
        return mainnet;
      case 11155111:
        return sepolia;
      case 84532:
        return baseSepolia;
      case 114:
        // Custom chain: Anvil 1
        return {
          id: 114,
          name: 'Anvil 1 - 8545',
          network: 'anvil-1',
          nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
            public: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
          },
        };
      default:
        // For unknown chains, create a custom chain object
        return {
          id,
          name: `Chain ${id}`,
          network: `chain-${id}`,
          nativeCurrency: {
            decimals: 18,
            name: 'Ether',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: { http: [] },
            public: { http: [] },
          },
        };
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      // Create a Viem client
      const client = createPublicClient({
        chain: mainnet, // You might want to make this configurable
        transport: http(),
      });

      // Create contract instance
      const contractInstance = {
        address: '0x...', // Replace with your contract address
        abi: MidribV2ABI as any,
        client,
      };

      setContract(contractInstance);
    } else {
      setContract(null);
    }
  }, [isConnected, address]);

  const deposit = async (amount: string, token: string, targetChainId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isConnected || !address || !walletClient) {
        throw new Error('Wallet not connected or wallet client not available');
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(`No trade contract found for chain ID ${targetChainId}`);
      }

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(symbol => 
        chainConfig?.tokens[symbol].address.toLowerCase() === token.toLowerCase()
      );
      const decimals = tokenSymbol ? chainConfig?.tokens[tokenSymbol].decimals : 18;
      
      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals);

      console.log(`Converting ${amount} with ${decimals} decimals to: ${amountWei}`);
      console.log(`Current wallet chain ID: ${chainId}, Target chain ID: ${targetChainId}`);

      // Check if wallet is on the correct chain
      if (chainId !== targetChainId) {
        throw new Error(`Wallet is on chain ${chainId} but transaction requires chain ${targetChainId}. Please switch to the correct network.`);
      }

      // First, approve the contract to spend our tokens
      console.log('Approving token spending...');
      const tokenContract = {
        address: token as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"name": "spender", "type": "address"},
              {"name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ] as any,
      };

      const approveHash = await walletClient.writeContract({
        address: token as `0x${string}`,
        abi: tokenContract.abi,
        functionName: 'approve',
        args: [tradeContractAddress, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
      });

      console.log('Approval successful:', approveHash);

      // Wait a moment for the approval to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now attempt the deposit
      console.log('Attempting deposit with:', {
        contractAddress: tradeContractAddress,
        tokenAddress: token,
        amountWei: amountWei.toString(),
        account: address,
        chain: getChainById(targetChainId)
      });
      
      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi as any,
        functionName: 'deposit',
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
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
      if (!isConnected || !address || !walletClient) {
        throw new Error('Wallet not connected or wallet client not available');
      }

      const tradeContractAddress = configUtils.getTradeContractAddress(targetChainId);
      if (!tradeContractAddress) {
        throw new Error(`No trade contract found for chain ID ${targetChainId}`);
      }

      // Get token decimals from config
      const chainConfig = configUtils.getChainByChainId(targetChainId);
      const tokenSymbol = Object.keys(chainConfig?.tokens || {}).find(symbol => 
        chainConfig?.tokens[symbol].address.toLowerCase() === token.toLowerCase()
      );
      const decimals = tokenSymbol ? chainConfig?.tokens[tokenSymbol].decimals : 18;
      
      // Convert amount using correct decimals
      const amountWei = parseUnits(amount, decimals);

      console.log(`Converting ${amount} with ${decimals} decimals to: ${amountWei}`);
      console.log(`Current wallet chain ID: ${chainId}, Target chain ID: ${targetChainId}`);

      // Check if wallet is on the correct chain
      if (chainId !== targetChainId) {
        throw new Error(`Wallet is on chain ${chainId} but transaction requires chain ${targetChainId}. Please switch to the correct network.`);
      }

      // Attempt the withdrawal
      console.log('Attempting withdrawal with:', {
        contractAddress: tradeContractAddress,
        tokenAddress: token,
        amountWei: amountWei.toString(),
        account: address,
        chain: getChainById(targetChainId)
      });
      
      const hash = await walletClient.writeContract({
        address: tradeContractAddress as `0x${string}`,
        abi: MidribV2ABI.abi as any,
        functionName: 'withdraw',
        args: [token, amountWei],
        account: address as `0x${string}`,
        chain: getChainById(targetChainId),
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
    contract, 
    isConnected, 
    account: address, 
    deposit, 
    withdraw, 
    isLoading, 
    error 
  };
};