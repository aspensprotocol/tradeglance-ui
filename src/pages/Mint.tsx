import React, { useState } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWriteContract, useSimulateContract } from 'wagmi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { configUtils } from '@/lib/config-utils';
import { useChainMonitor } from '@/hooks/useChainMonitor';
import { WalletButton } from '@/components/WalletButton';

// Standard ERC20 ABI with mint function
const ERC20_ABI = [
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const Mint = () => {
  const [isMinting, setIsMinting] = useState(false);
  const { address, isConnected } = useAccount();
  const { currentChainId } = useChainMonitor();
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContract } = useWriteContract();

  const handleMint = async (chainId: number, tokenAddress: string, tokenSymbol: string, decimals: number) => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to mint tokens",
        variant: "destructive",
      });
      return;
    }

    // Switch to the target chain if not already on it
    if (currentChainId !== chainId) {
      try {
        await switchChain({ chainId });
        toast({
          title: "Switching network",
          description: `Switching to chain ${chainId}...`,
        });
        // Wait a bit for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        toast({
          title: "Network switch failed",
          description: error.message || "Failed to switch network",
          variant: "destructive",
        });
        return;
      }
    }

    setIsMinting(true);

    try {
      // Mint 1000 tokens (adjust amount as needed)
      const mintAmount = BigInt(1000 * Math.pow(10, decimals));
      
      console.log('Minting tokens:', {
        chainId,
        tokenAddress,
        tokenSymbol,
        decimals,
        mintAmount: mintAmount.toString(),
        userAddress: address
      });

      // Call the mint function
      const hash = await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address as `0x${string}`, mintAmount],
      });
      
      console.log('Mint transaction hash:', hash);

      toast({
        title: "Mint successful",
        description: `Successfully minted 1000 ${tokenSymbol} on chain ${chainId}`,
      });

    } catch (error: any) {
      console.error('Mint error:', error);
      toast({
        title: "Mint failed",
        description: error.message || "Failed to mint tokens",
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const getChains = () => {
    return configUtils.getAllChains();
  };

  const chains = getChains();

  return (
    <div className="min-h-screen bg-neutral-soft/30">
      <div className="container mx-auto">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <div className="flex gap-6">
            <Link to="/pro" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Pro
            </Link>
            <Link to="/simple" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Simple
            </Link>
            <Link to="/docs" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              Docs
            </Link>
          </div>
          
          <div className="flex gap-3 items-center">
            {currentChainId && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                ✅ {currentChainId}
              </div>
            )}
            <WalletButton />
          </div>
        </div>
        
        <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Token Minting</h1>
          <p className="text-gray-600">
            Mint test tokens for both chains to test the trading functionality.
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-600">
                Please connect your wallet to mint test tokens.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {chains.map((chain) => {
              const tokenSymbol = Object.keys(chain.tokens)[0]; // Get first token
              const tokenConfig = chain.tokens[tokenSymbol];
              
              if (!tokenConfig) return null;

              return (
                <Card key={chain.chainId} className="border-2 border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{chain.network}</span>
                      <span className="text-sm text-gray-500">Chain ID: {chain.chainId}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Token:</span>
                        <span className="font-medium">{tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Address:</span>
                        <span className="text-xs font-mono text-gray-500">
                          {tokenConfig.address.slice(0, 8)}...{tokenConfig.address.slice(-6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Decimals:</span>
                        <span className="font-medium">{tokenConfig.decimals}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleMint(
                        typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId,
                        tokenConfig.address,
                        tokenSymbol,
                        tokenConfig.decimals
                      )}
                      disabled={isMinting}
                      className="w-full"
                    >
                      {isMinting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Minting...
                        </div>
                      ) : (
                        `Mint 1000 ${tokenSymbol}`
                      )}
                    </Button>

                    {currentChainId === (typeof chain.chainId === 'string' ? parseInt(chain.chainId, 10) : chain.chainId) && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✓ Currently on this network
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connect your wallet to mint test tokens</li>
            <li>• Click "Mint" on each chain to get 1000 test tokens</li>
            <li>• The app will automatically switch networks if needed</li>
            <li>• Use these tokens to test deposits and trading</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Mint; 