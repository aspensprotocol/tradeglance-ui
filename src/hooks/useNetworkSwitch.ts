import { useState } from 'react';
import { configUtils } from '../lib/config-utils';
import { useToast } from './use-toast';

export const useNetworkSwitch = () => {
  const [isSwitching, setIsSwitching] = useState(false);
  const { toast } = useToast();

  const switchToNetwork = async (chainConfig: any) => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to switch networks",
        variant: "destructive",
      });
      return false;
    }

    setIsSwitching(true);
    try {
      const chainId = typeof chainConfig.chainId === 'string' ? parseInt(chainConfig.chainId, 10) : chainConfig.chainId;
      const chainIdHex = `0x${chainId.toString(16)}`;
      
      console.log(`Attempting to switch to network: ${chainConfig.network} (${chainIdHex})`);
      
      // Try to switch to the network first
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        console.log(`Successfully switched to network ${chainConfig.network}`);
        
        toast({
          title: "Network switched",
          description: `Successfully switched to ${chainConfig.network}`,
        });
        
        return true;
      } catch (switchError: any) {
        console.log('Switch error:', switchError);
        
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log(`Network ${chainConfig.network} not found, adding it...`);
          
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chainIdHex,
                chainName: chainConfig.network,
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [chainConfig.rpcUrl],
                blockExplorerUrls: chainConfig.explorerUrl ? [chainConfig.explorerUrl] : [],
              }],
            });
            
            console.log(`Successfully added and switched to network ${chainConfig.network}`);
            
            toast({
              title: "Network added and switched",
              description: `Successfully added and switched to ${chainConfig.network}`,
            });
            
            return true;
          } catch (addError: any) {
            console.error('Error adding network:', addError);
            throw new Error(`Failed to add network: ${addError.message || 'Unknown error'}`);
          }
        } else {
          // Handle other switch errors
          if (switchError.code === 4001) {
            throw new Error('User rejected the network switch');
          } else {
            throw new Error(`Failed to switch network: ${switchError.message || 'Unknown error'}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast({
        title: "Network switch failed",
        description: error.message || "Failed to switch network",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSwitching(false);
    }
  };

  const getSupportedNetworks = () => {
    return configUtils.getAllChains().filter(chain => chain.tradeContractAddress);
  };

  return {
    switchToNetwork,
    getSupportedNetworks,
    isSwitching,
  };
}; 