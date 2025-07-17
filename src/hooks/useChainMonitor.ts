import { useState, useEffect } from 'react';
import { configUtils } from '../lib/config-utils';

export const useChainMonitor = () => {
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    const getCurrentChainId = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdNumber = parseInt(chainId, 16);
          setCurrentChainId(chainIdNumber);
          
          // Get trade contract info for this chain using configUtils directly
          const tradeContractAddress = configUtils.getTradeContractAddress(chainIdNumber);
          const chainConfig = configUtils.getChainByChainId(chainIdNumber);
          const supported = !!tradeContractAddress;
          
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
            setIsSupported(false);
          }
        } catch (error) {
          console.error('Error getting chain ID:', error);
          setCurrentChainId(null);
          setIsSupported(false);
        }
      }
    };

    // Get initial chain ID
    getCurrentChainId();

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      const chainIdNumber = parseInt(chainId, 16);
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
  }, []);

  return {
    currentChainId,
    isSupported,
  };
}; 