import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContract } from "@/hooks/useContract";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { Loader2 } from "lucide-react";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
}

const DepositWithdrawModal = ({ isOpen, onClose, type }: DepositWithdrawModalProps) => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const { deposit, withdraw, isLoading, error, isConnected } = useContract();
  const { getAllChains, loading: configLoading, error: configError } = useTradeContracts();

  const chains = getAllChains();
  
  // Get available tokens from the selected chain
  const selectedChain = chains.find(chain => chain.chainId === selectedChainId);
  const availableTokens = selectedChain ? Object.entries(selectedChain.tokens).map(([symbol, token]) => ({
    value: symbol,
    label: `${token.symbol} (${symbol})`,
    address: token.address,
    decimals: token.decimals
  })) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !selectedToken || !selectedChainId) {
      return;
    }

    try {
      if (type === "deposit") {
        await deposit(amount, selectedToken, selectedChainId);
      } else {
        await withdraw(amount, selectedToken, selectedChainId);
      }
      
      // Reset form and close modal on success
      setAmount("");
      setSelectedToken("");
      setSelectedChainId(null);
      onClose();
    } catch (err) {
      // Error is handled by the hook
      console.error(`${type} failed:`, err);
    }
  };

  const handleClose = () => {
    setAmount("");
    setSelectedToken("");
    setSelectedChainId(null);
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
            <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            <p className="mt-2">Loading configuration...</p>
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
            <p className="text-red-600">Failed to load configuration: {configError}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="network">Select Network</Label>
              <Select 
                value={selectedChainId?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedChainId(parseInt(value));
                  setSelectedToken(""); // Reset token when chain changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a network" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain) => (
                    <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                      {chain.network} (Chain ID: {chain.chainId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChainId && (
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
                {selectedChain && (
                  <p className="text-xs text-gray-500">
                    Trade Contract: {selectedChain.tradeContractAddress}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !amount || !selectedToken || !selectedChainId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `${type === "deposit" ? "Deposit" : "Withdraw"}`
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