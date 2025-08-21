import React, { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span 
          className="chip blue lighten-4 cursor-pointer waves-effect"
          onClick={handleAddressClick}
          title="Click to deposit/withdraw funds"
          style={{ 
            margin: '0', 
            height: '32px', 
            lineHeight: '32px',
            display: 'inline-flex', 
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '13px',
            verticalAlign: 'middle',
            boxSizing: 'border-box'
          }}
        >
          <i className="material-icons left" style={{ fontSize: '16px', marginRight: '4px', lineHeight: '16px' }}>account_balance_wallet</i>
          {formatAddress(address)}
        </span>
        <a 
          className="btn-small red waves-effect waves-light"
          onClick={() => disconnect()}
          style={{ 
            margin: '0', 
            height: '32px',
            lineHeight: '32px',
            display: 'inline-flex', 
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '13px',
            verticalAlign: 'middle',
            boxSizing: 'border-box',
            textDecoration: 'none'
          }}
        >
          <i className="material-icons left" style={{ fontSize: '16px', marginRight: '4px', lineHeight: '16px' }}>power_settings_new</i>
          Disconnect
        </a>
        
        <DepositWithdrawModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {}} // No refreshBalance here as it's removed
        />
      </div>
    )
  }
  
  return (
    <a 
      className="btn waves-effect waves-light blue" 
      onClick={() => open()}
      style={{ 
        margin: '0', 
        height: '32px',
        lineHeight: '32px',
        display: 'inline-flex', 
        alignItems: 'center',
        padding: '0 12px',
        fontSize: '13px',
        verticalAlign: 'middle',
        boxSizing: 'border-box',
        textDecoration: 'none'
      }}
    >
      <i className="material-icons left" style={{ fontSize: '16px', marginRight: '4px', lineHeight: '16px' }}>account_balance_wallet</i>
      Connect Wallet
    </a>
  )
}