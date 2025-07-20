import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContract } from "@/hooks/useContract";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useAccount } from "wagmi";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
}

const DepositWithdrawModal = ({ isOpen, onClose, type }: DepositWithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [tokenBalance, setTokenBalance] = useState<string>("");
  const { deposit, withdraw, isLoading, error } = useContract();
  const { getAllChains, loading: configLoading, error: configError } = useTradeContracts();
  const { currentChainId, isSupported } = useChainMonitor();
  const { isConnected } = useAccount();

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

  // Fetch token balance when token selection changes
  useEffect(() => {
    const fetchBalance = async () => {
      console.log('DepositWithdrawModal: Fetching balance for token:', selectedToken, 'on chain:', currentChainId);
      
      if (selectedToken && currentChainId) {
        try {
          // For now, set a placeholder balance since we don't have getTokenBalance in WalletConnect
          setTokenBalance("0.00");
        } catch (error) {
          console.error('Error fetching token balance:', error);
          setTokenBalance("0");
        }
      } else {
        console.log('DepositWithdrawModal: No token selected or no chain ID');
        setTokenBalance("");
      }
    };

    fetchBalance();
  }, [selectedToken, currentChainId]);

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
      if (type === "deposit") {
        await deposit(amount, selectedTokenObj.address, currentChainId);
      } else {
        await withdraw(amount, selectedTokenObj.address, currentChainId);
      }
      
      // Reset form and close modal on success
      setAmount("");
      setSelectedToken("");
      setTokenBalance("");
      onClose();
    } catch (err) {
      // Error is handled by the hook
      console.error(`${type} failed:`, err);
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedToken("");
    setTokenBalance("");
    onClose();
  };

  if (configLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{type} Funds</DialogTitle>
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
            <DialogTitle className="capitalize">{type} Funds</DialogTitle>
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
          <DialogTitle className="capitalize">{type} Funds</DialogTitle>
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
                {tokenBalance && (
                  <span className="text-xs text-gray-500">
                    Balance: {tokenBalance}
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
                  `${type.charAt(0).toUpperCase() + type.slice(1)}`
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