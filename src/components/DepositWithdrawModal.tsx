import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContract } from "@/hooks/useContract";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAccount } from "wagmi";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "deposit" | "withdraw"; // Make type optional since we'll handle it internally
  onSuccess?: () => void; // Callback for successful transactions
}

const DepositWithdrawModal = ({ isOpen, onClose, type: initialType = "deposit", onSuccess }: DepositWithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [activeType, setActiveType] = useState<"deposit" | "withdraw">(initialType);
  const { deposit, withdraw, isLoading, error } = useContract();
  const { getAllChains, loading: configLoading, error: configError } = useTradeContracts();
  const { currentChainId, isSupported } = useChainMonitor();
  const { isConnected } = useAccount();
  
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
      if (activeType === "deposit") {
        await deposit(amount, selectedTokenObj.address, currentChainId);
      } else {
        await withdraw(amount, selectedTokenObj.address, currentChainId);
      }
      
      // Reset form and close modal on success
      setAmount("");
      setSelectedToken("");
      onClose();
      
      // Call success callback to refresh balances
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Error is handled by the hook
      console.error(`${activeType} failed:`, err);
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedToken("");
    onClose();
  };

  if (configLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{activeType} Funds</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading configuration...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (configError) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{activeType} Funds</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">Failed to load configuration</p>
            <p className="text-sm text-gray-600">{configError}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter out any chains with invalid chainId
  const validChains = chains.filter(chain => chain && chain.chainId != null && chain.chainId !== undefined);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Funds</DialogTitle>
        </DialogHeader>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeType === "deposit"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveType("deposit")}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeType === "withdraw"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveType("withdraw")}
          >
            Withdraw
          </button>
        </div>
        
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
          </div>
        ) : !currentChainId ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Please connect to a supported network</p>
          </div>
        ) : !isSupported ? (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">Current network is not supported for deposits/withdrawals</p>
            <p className="text-sm text-gray-600">Please switch to a supported network in your wallet</p>
          </div>
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
                    Processing...
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