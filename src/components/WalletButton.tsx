import React from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/button'
import { useWeb3Modal } from '@web3modal/wagmi/react'

export const WalletButton: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm">
          <div className="font-medium">{formatAddress(address)}</div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
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