import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useContract } from "@/hooks/useContract";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { getEtherscanLink, shortenTxHash, triggerBalanceRefresh } from "@/lib/utils";
import { configUtils } from "@/lib/config-utils";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "deposit" | "withdraw"; // Make type optional since we'll handle it internally
  onSuccess?: () => void; // Callback for successful transactions
}

// Component for switching to supported networks
const NetworkSwitcher = ({ onNetworkSwitch }: { onNetworkSwitch: () => void }) => {
  const { switchToNetwork, getSupportedNetworks, isSwitching } = useNetworkSwitch();

  const supportedChains = getSupportedNetworks();

  const handleNetworkSwitch = async (chainConfig: any) => {
    const success = await switchToNetwork(chainConfig);
    if (success) {
      onNetworkSwitch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-red-600 mb-2">Current network is not supported for deposits/withdrawals</p>
        <p className="text-sm text-gray-600 mb-4">Please switch to one of the supported networks:</p>
      </div>
      
      <div className="space-y-2">
        {supportedChains.map((chain) => (
          <Button
            key={chain.chainId}
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleNetworkSwitch(chain)}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Switching...
              </>
            ) : (
              <>
                <span className="font-medium">{chain.network}</span>
                <span className="text-gray-500 ml-2">(Chain ID: {chain.chainId})</span>
              </>
            )}
          </Button>
        ))}
      </div>
      
      {supportedChains.length === 0 && (
        <p className="text-center text-gray-500">
          No supported networks found. Please check your configuration.
        </p>
      )}
      
      <div className="text-center text-xs text-gray-500">
        <p>If you don't see your network listed, please check your wallet settings or contact support.</p>
      </div>
    </div>
  );
};

const DepositWithdrawModal = ({ isOpen, onClose, type: initialType = "deposit", onSuccess }: DepositWithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [activeType, setActiveType] = useState<"deposit" | "withdraw">(initialType);
  const { deposit, withdraw, isLoading, isConfirming, error } = useContract();
  const { getAllChains, loading: configLoading, error: configError } = useTradeContracts();
  const { currentChainId, isSupported } = useChainMonitor();
  const { isConnected } = useAccount();
  const { toast } = useToast();
  
  // Use the new token balance hook
  const { balance: tokenBalance, loading: balanceLoading, error: balanceError } = useTokenBalance(selectedToken, currentChainId || 0);

  const chains = getAllChains();
  
  // Debug: Log the chains data
  console.log('DepositWithdrawModal: Available chains:', chains);
  console.log('DepositWithdrawModal: Current chain ID:', currentChainId);
  
  // Get available tokens from the current connected chain
  const currentChain = chains.find(chain => chain.chainId === currentChainId);
  const availableTokens = currentChain ? Object.entries(currentChain.tokens).map(([symbol, token]) => ({
    value: symbol,
    label: `${token.symbol} (${symbol})`,
    address: token.address,
    decimals: token.decimals
  })) : [];

  // Auto-select first token if available and none selected
  useEffect(() => {
    if (availableTokens.length > 0 && !selectedToken) {
      console.log('DepositWithdrawModal: Auto-selecting first token:', availableTokens[0].value);
      setSelectedToken(availableTokens[0].value);
    }
  }, [availableTokens, selectedToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !selectedToken || !currentChainId) {
      return;
    }

    // Check if current chain is supported
    if (!isSupported) {
      console.error('Current chain is not supported for deposits/withdrawals');
      return;
    }

    // Find the selected token object to get the address
    const selectedTokenObj = availableTokens.find(token => token.value === selectedToken);
    if (!selectedTokenObj) {
      console.error('Selected token not found in available tokens');
      return;
    }

    try {
      let txHash: string | undefined;
      
      if (activeType === "deposit") {
        txHash = await deposit(amount, selectedTokenObj.address, currentChainId);
      } else {
        txHash = await withdraw(amount, selectedTokenObj.address, currentChainId);
      }
      
      // Transaction was successful (confirmed), now show success message
      if (txHash && currentChainId) {
        const etherscanLink = getEtherscanLink(txHash, currentChainId);
        const shortHash = shortenTxHash(txHash);
        
        toast({
          title: `${activeType === "deposit" ? "Deposit" : "Withdrawal"} successful`,
          description: (
            <div>
              <p>{`Successfully ${activeType === "deposit" ? "deposited" : "withdrew"} ${amount} ${selectedTokenObj.label.split(' ')[0]}`}</p>
              <a 
                href={etherscanLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on Explorer: {shortHash}
              </a>
            </div>
          ),
        });
      } else {
        toast({
          title: `${activeType === "deposit" ? "Deposit" : "Withdrawal"} successful`,
          description: `Successfully ${activeType === "deposit" ? "deposited" : "withdrew"} ${amount} ${selectedTokenObj.label.split(' ')[0]}`,
        });
      }
      
      // Reset form
      setAmount("");
      setSelectedToken("");
      
      // Add a delay before calling success callback to allow blockchain state to update
      setTimeout(() => {
        // Trigger global balance refresh for all components
        triggerBalanceRefresh();
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }, 1000); // Wait 1 second for blockchain state to update
      
      // Close modal
      onClose();
    } catch (err: any) {
      console.error(`${activeType} failed:`, err);
      
      let errorMessage = `${activeType} failed`;
      
      if (err.message?.includes('Internal JSON-RPC error')) {
        errorMessage = 'RPC connection error. The network endpoint may be down. Please try refreshing the page or switching networks.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = `Insufficient funds for ${activeType}. Please check your balance.`;
      } else if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (err.message?.includes('reverted')) {
        errorMessage = `Transaction was reverted on the blockchain. This usually means the ${activeType} failed due to insufficient balance or other contract constraints.`;
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast({
        title: `${activeType} failed`,
        description: errorMessage,
        variant: "destructive",
      });
      
      // Trigger global balance refresh even on error to ensure UI is up to date
      triggerBalanceRefresh();
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedToken("");
    setActiveType(initialType);
    onClose();
  };

  const handleNetworkSwitch = () => {
    // This will trigger a re-render when the network is switched
    // The useChainMonitor hook will detect the change and update isSupported
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{activeType === "deposit" ? "Deposit" : "Withdraw"} Tokens</span>
            <div className="flex space-x-2 mr-3">
              <Button
                variant={activeType === "deposit" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("deposit")}
              >
                Deposit
              </Button>
              <Button
                variant={activeType === "withdraw" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("withdraw")}
              >
                Withdraw
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
          </div>
        ) : !currentChainId ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Please connect to a supported network</p>
          </div>
        ) : !isSupported ? (
          <NetworkSwitcher onNetworkSwitch={handleNetworkSwitch} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {currentChainId && (
              <div className="space-y-2">
                <Label htmlFor="token">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTokens.map((token) => (
                      <SelectItem key={token.value} value={token.value}>
                        {token.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentChain && (
                  <p className="text-xs text-gray-500">
                    Available tokens on {currentChain.network}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                {selectedToken && (
                  <span className="text-xs text-gray-500">
                    {balanceLoading ? (
                      "Loading balance..."
                    ) : balanceError ? (
                      <span className="text-red-500">Error loading balance</span>
                    ) : (
                      `Balance: ${tokenBalance}`
                    )}
                  </span>
                )}
              </div>
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !amount || !selectedToken}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isConfirming ? "Confirming..." : "Processing..."}
                  </>
                ) : (
                  `${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositWithdrawModal;