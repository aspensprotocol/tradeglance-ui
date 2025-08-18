import React, { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import DepositWithdrawModal from './DepositWithdrawModal'

export const WalletButton: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [modalOpen, setModalOpen] = useState(false)
  const { open } = useWeb3Modal()
  
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
          onSuccess={() => {}} // No refreshBalance here as it's removed
        />
      </div>
    )
  }
  
  return (
    <Button onClick={() => open()}>
      Connect Wallet
    </Button>
  )
}