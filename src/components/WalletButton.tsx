import React, { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import DepositWithdrawModal from './DepositWithdrawModal'
import { useBalanceManager } from '@/hooks/useBalanceManager'
import { useTradingPairs } from '@/hooks/useTradingPairs'

export const WalletButton: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [modalOpen, setModalOpen] = useState(false)
  
  const { tradingPairs } = useTradingPairs()
  
  // Get the first available trading pair for balance display
  const firstTradingPair = tradingPairs.length > 0 ? tradingPairs[0] : null
  
  // Get trading balances for the first available trading pair
  const { availableBalance: depositedBalance, balanceLoading, refreshBalance } = useBalanceManager(firstTradingPair)

  // Debug logging
  console.log('WalletButton Debug:', {
    firstTradingPair,
    baseSymbol: firstTradingPair?.baseSymbol || "TTK",
    depositedBalance,
    balanceLoading
  })

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleAddressClick = () => {
    setModalOpen(true)
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div 
          className="text-sm border border-gray-300 rounded px-2 py-0.5 bg-white/60 text-gray-900 cursor-pointer hover:bg-white/80 transition-colors"
          onClick={handleAddressClick}
          title="Click to deposit/withdraw funds"
        >
          <div className="font-medium">{formatAddress(address)}</div>
          <div className="text-xs text-gray-600">
            {balanceLoading ? "Loading..." : `Deposited: ${parseFloat(depositedBalance || "0").toFixed(4)} ${firstTradingPair?.baseSymbol || "TTK"}`}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
        
        <DepositWithdrawModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={refreshBalance}
        />
      </div>
    )
  }

  const { open } = useWeb3Modal()
  
  return (
    <Button onClick={() => open()}>
      Connect Wallet
    </Button>
  )
}