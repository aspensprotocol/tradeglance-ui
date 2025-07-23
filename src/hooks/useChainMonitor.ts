import { useState, useEffect } from 'react';
import { configUtils } from '../lib/config-utils';
import { useConfig } from './useConfig';

export const useChainMonitor = () => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const { config, loading: configLoading } = useConfig();

  useEffect(() => {
    // Don't check chain support until config is loaded
    if (configLoading || !config) {
      console.log('Chain monitor: Waiting for config to load...', { configLoading, hasConfig: !!config });
      return;
    }

    console.log('Chain monitor: Config loaded, checking chain support...');

    const getCurrentChainId = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdNumber = parseInt(chainId, 16);
          console.log('Chain monitor: Current chain ID from MetaMask:', chainIdNumber);
          console.log('Chain monitor: Chain ID type:', typeof chainIdNumber);
          setCurrentChainId(chainIdNumber);
          
          // Get trade contract info for this chain using configUtils directly
          const tradeContractAddress = configUtils.getTradeContractAddress(chainIdNumber);
          const chainConfig = configUtils.getChainByChainId(chainIdNumber);
          const supported = !!tradeContractAddress;
          
          console.log('Chain monitor: Chain analysis:', {
            chainId: chainIdNumber,
            chainIdType: typeof chainIdNumber,
            hasTradeContract: !!tradeContractAddress,
            tradeContractAddress,
            hasChainConfig: !!chainConfig,
            supported
          });
          
          if (supported && tradeContractAddress) {
            console.log(`✅ Supported chain detected!`);
            console.log(`🔗 Current Chain ID: ${chainIdNumber}`);
            console.log(`📋 Trade Contract for deposits/withdrawals: ${tradeContractAddress}`);
            console.log(`💡 You can now perform deposits and withdrawals on this chain`);
            
            // Log supported tokens for this chain
            if (chainConfig && chainConfig.tokens) {
              console.log(`🪙 Supported tokens on this chain:`);
              Object.entries(chainConfig.tokens).forEach(([symbol, token]) => {
                console.log(`   • ${token.symbol} (${symbol}): ${token.address}`);
              });
            }
            
            setIsSupported(true);
          } else {
            console.log(`❌ Unsupported chain detected!`);
            console.log(`🔗 Current Chain ID: ${chainIdNumber}`);
            console.log(`⚠️  This chain is not supported for deposits and withdrawals`);
            console.log(`💡 Please switch to a supported network in MetaMask`);
            
            // Log available chains for debugging
            const allChains = configUtils.getAllChains();
            console.log('Available chains in config:', allChains.map(c => ({ 
              chainId: c.chainId, 
              network: c.network,
              hasTradeContract: !!c.tradeContractAddress 
            })));
            
            // Show user-friendly message about supported networks
            console.log('💡 Supported networks you can switch to:');
            allChains.forEach(chain => {
              if (chain.tradeContractAddress) {
                console.log(`   • ${chain.network} (Chain ID: ${chain.chainId})`);
              }
            });
            
            setIsSupported(false);
          }
        } catch (error) {
          console.error('Error getting chain ID:', error);
          setCurrentChainId(null);
          setIsSupported(false);
        }
      } else {
        console.log('Chain monitor: MetaMask not available');
      }
    };

    // Get initial chain ID
    getCurrentChainId();

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
      console.log('Chain monitor: Chain changed to:', chainIdNumber);
      setCurrentChainId(chainIdNumber);
      
      // Get trade contract info for the new chain using configUtils directly
      const tradeContractAddress = configUtils.getTradeContractAddress(chainIdNumber);
      const chainConfig = configUtils.getChainByChainId(chainIdNumber);
      const supported = !!tradeContractAddress;
      
      if (supported && tradeContractAddress) {
        console.log(`✅ Network changed to supported chain!`);
        console.log(`🔗 New Chain ID: ${chainIdNumber}`);
        console.log(`📋 Trade Contract for deposits/withdrawals: ${tradeContractAddress}`);
        console.log(`💡 You can now perform deposits and withdrawals on this chain`);
        
        // Log supported tokens for this chain
        if (chainConfig && chainConfig.tokens) {
          console.log(`🪙 Supported tokens on this chain:`);
          Object.entries(chainConfig.tokens).forEach(([symbol, token]) => {
            console.log(`   • ${token.symbol} (${symbol}): ${token.address}`);
          });
        }
        
        setIsSupported(true);
      } else {
        console.log(`❌ Network changed to unsupported chain!`);
        console.log(`🔗 New Chain ID: ${chainIdNumber}`);
        console.log(`⚠️  This chain is not supported for deposits and withdrawals`);
        console.log(`💡 Please switch to a supported network in MetaMask`);
        setIsSupported(false);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [config, configLoading]);

  return {
    currentChainId,
    isSupported,
  };
}; 