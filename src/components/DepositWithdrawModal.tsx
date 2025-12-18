import { useState, useEffect, useMemo } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/hooks/useContract";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAllBalances } from "@/hooks/useAllBalances";
import { getEtherscanLink, shortenTxHash } from "@/lib/utils";
import { formatDecimalConsistent } from "@/lib/number-utils";
import type { Chain } from "@/lib/shared-types";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "deposit" | "withdraw";
  onSuccess?: () => void;
}

const DepositWithdrawModal = ({
  isOpen,
  onClose,
  type: initialType = "deposit",
  onSuccess,
}: DepositWithdrawModalProps): JSX.Element => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [activeType, setActiveType] = useState<"deposit" | "withdraw">(
    initialType,
  );
  const { deposit, withdraw, isLoading, isConfirming, error, isWalletClientReady } = useContract();
  const { disconnect } = useDisconnect();
  const { getAllChains } = useTradeContracts();
  const { currentChainId } = useChainMonitor();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  const chains = getAllChains();

  // Get all tokens from all chains with chain prefixes
  const allTokens = useMemo((): {
    value: string;
    label: string;
    address: string;
    decimals: number;
    chainId: number;
    network: string;
    symbol: string;
  }[] => {
    return chains.flatMap((chain: Chain) =>
      Object.entries(chain.tokens).map(([symbol, token]) => {
        return {
          value: `${chain.network}:${symbol}`,
          label: `${symbol} (${chain.network})`,
          address: token.address,
          decimals: token.decimals,
          chainId: chain.chainId,
          network: chain.network,
          symbol,
        };
      }),
    );
  }, [chains]);

  // Get the currently selected token data
  const selectedTokenData = allTokens.find(
    (token) => token.value === selectedToken,
  );
  const selectedChainId: number | undefined = selectedTokenData?.chainId;
  const currentChain: Chain | undefined = chains.find(
    (chain: Chain) =>
      chain.chainId === selectedChainId || chain.chainId === currentChainId,
  );

  // Use the appropriate balance hooks based on operation type
  const {
    balance: tokenBalance,
    loading: balanceLoading,
    error: balanceError,
  } = useTokenBalance(
    selectedTokenData?.symbol || "",
    selectedChainId || currentChainId || 0,
  );
  const { balances: allBalances, loading: balancesLoading } = useAllBalances();

  // Extract deposited balance for the selected token and chain
  const depositedBalanceData = allBalances.find(
    (balance) =>
      balance.symbol === selectedTokenData?.symbol &&
      balance.chainId === selectedChainId,
  );
  const depositedBalance: string =
    depositedBalanceData?.depositedBalance || "0";
  const depositedBalanceLoading: boolean = balancesLoading;
  const depositedBalanceError = null; // useAllBalances doesn't provide per-token errors

  // Auto-select first token if available and none selected
  useEffect(() => {
    if (allTokens.length > 0 && !selectedToken) {
      setSelectedToken(allTokens[0].value);
    }
  }, [allTokens, selectedToken]);

  // Note: Network switching is now handled seamlessly in the useContract hook
  // No need to show manual switching messages - the hook will handle it automatically

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!amount || !selectedToken || !selectedChainId) {
      return;
    }

    // Validate amounts don't exceed available balances
    const amountNum: number = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (activeType === "withdraw") {
      // For withdrawals, check against deposited balance (available locked funds)
      const availableNum: number = parseFloat(depositedBalance);

      if (isNaN(availableNum)) {
        toast({
          title: "Error loading balance",
          description:
            "Unable to load your available balance. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (amountNum > availableNum) {
        toast({
          title: "Insufficient available balance",
          description: `You can only withdraw up to ${depositedBalance} ${selectedTokenData?.label.split(" ")[0] || selectedTokenData?.symbol || selectedToken}`,
          variant: "destructive",
        });
        return;
      }
    } else if (activeType === "deposit") {
      // For deposits, check against wallet balance
      const walletNum: number = parseFloat(tokenBalance);

      if (isNaN(walletNum)) {
        toast({
          title: "Error loading balance",
          description: "Unable to load your wallet balance. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (amountNum > walletNum) {
        toast({
          title: "Insufficient wallet balance",
          description: `You only have ${tokenBalance} ${selectedTokenData?.label.split(" ")[0] || selectedTokenData?.symbol || selectedToken} in your wallet`,
          variant: "destructive",
        });
        return;
      }
    }

    // Note: Network switching is now handled seamlessly in the useContract hook
    // No need to check chain support - the hook will handle network switching automatically

    // Find the selected token object to get the address
    const selectedTokenObj = allTokens.find(
      (token) => token.value === selectedToken,
    );
    if (!selectedTokenObj) {
      console.error("Selected token not found in available tokens");
      return;
    }

    try {
      let txHash: string | undefined;

      if (activeType === "deposit") {
        txHash = await deposit(
          amount,
          selectedTokenObj.address,
          selectedChainId,
        );
      } else {
        txHash = await withdraw(
          amount,
          selectedTokenObj.address,
          selectedChainId,
        );
      }

      // Transaction was successful (confirmed), now show success message
      if (txHash && selectedChainId) {
        const etherscanLink: string = getEtherscanLink(txHash, selectedChainId);
        const shortHash: string = shortenTxHash(txHash);

        toast({
          title: `${activeType === "deposit" ? "Deposit" : "Withdrawal"} successful`,
          description: (
            <article>
              <p>{`Successfully ${activeType === "deposit" ? "deposited" : "withdrew"} ${amount} ${selectedTokenObj.label.split(" ")[0]}`}</p>
              <a
                href={etherscanLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on Explorer: {shortHash}
              </a>
            </article>
          ),
        });
      } else {
        toast({
          title: `${activeType === "deposit" ? "Deposit" : "Withdrawal"} successful`,
          description: `Successfully ${activeType === "deposit" ? "deposited" : "withdrew"} ${amount} ${selectedTokenObj.label.split(" ")[0]}`,
        });
      }

      // Reset form
      setAmount("");
      setSelectedToken("");

      // Trigger immediate balance refresh
      triggerBalanceRefresh();

      // Add a delay and trigger another refresh to ensure blockchain state has updated
      setTimeout(() => {
        triggerBalanceRefresh();

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }, 2000); // Wait 2 seconds for blockchain state to update

      // Add another refresh after a longer delay to catch any delayed updates
      setTimeout(() => {
        triggerBalanceRefresh();
      }, 5000); // Wait 5 seconds for final blockchain state update

      // Close modal
      onClose();
    } catch (err: unknown) {
      console.error(`${activeType} failed:`, err);

      let errorMessage = `${activeType} failed`;

      // Type guard to check if err is an Error object
      if (err instanceof Error) {
        if (err.message?.includes("Internal JSON-RPC error")) {
          errorMessage =
            "RPC connection error. The network endpoint may be down. Please try refreshing the page or ensure you're on the correct network in MetaMask.";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage =
            "Insufficient funds for transaction. Please check your balance.";
        } else if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      toast({
        title: `${activeType === "deposit" ? "Deposit" : "Withdrawal"} failed`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClose = (): void => {
    setAmount("");
    setSelectedToken("");
    setActiveType(initialType);
    onClose();
  };

  const handleDisconnect = (): void => {
    disconnect();
    handleClose();
  };

  const triggerBalanceRefresh = (): void => {
    // Dispatch a custom event to trigger balance refresh
    window.dispatchEvent(new CustomEvent("balance-refresh"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl rounded-2xl overflow-hidden relative !fixed !left-[50%] !top-[50%] !translate-x-[-50%] !translate-y-[-50%]">
        {/* Floating decorative elements */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-blue-300/5 to-indigo-300/5 rounded-full blur-lg animate-pulse delay-300"></section>
          <section className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-indigo-300/5 to-purple-300/5 rounded-full blur-lg animate-pulse delay-700"></section>
        </section>

        <DialogHeader className="relative z-10">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <span className="text-base sm:text-lg text-neutral-900 font-bold">
              {activeType === "deposit" ? "Deposit" : "Withdraw"} Tokens
            </span>
            <nav className="flex space-x-2 w-full sm:w-auto">
              <Button
                variant={activeType === "deposit" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("deposit")}
                className={`flex-1 sm:flex-none text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 transform  ${
                  activeType === "deposit"
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl animate-pulse-glow"
                    : "bg-gradient-to-r from-gray-100 to-gray-200 text-neutral-800 border-2 border-gray-200 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:border-gray-300 shadow-md hover:shadow-lg"
                }`}
              >
                Deposit
              </Button>
              <Button
                variant={activeType === "withdraw" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("withdraw")}
                className={`flex-1 sm:flex-none text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 transform  ${
                  activeType === "withdraw"
                    ? "bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white border-0 shadow-lg hover:shadow-xl animate-pulse-glow"
                    : "bg-gradient-to-r from-gray-100 to-gray-200 text-neutral-800 border-2 border-gray-200 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:border-gray-300 shadow-md hover:shadow-lg"
                }`}
              >
                Withdraw
              </Button>
            </nav>
          </DialogTitle>
        </DialogHeader>

        {!isConnected ? (
          <section className="text-center py-4">
            <p className="text-neutral-700 mb-4 text-sm">
              Please connect your wallet to continue
            </p>
          </section>
        ) : chains.length === 0 ? (
          <section className="text-center py-4">
            <p className="text-neutral-700 mb-4 text-sm">
              Loading configuration...
            </p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {selectedChainId && (
              <fieldset className="space-y-3">
                <Label
                  htmlFor="token"
                  className="text-neutral-800 font-semibold text-xs"
                >
                  Select Token
                </Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-sm font-semibold text-neutral-900">
                    <SelectValue
                      placeholder="Choose a token"
                      className="text-sm font-semibold text-neutral-900"
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl rounded-xl">
                    {allTokens.map((token) => (
                      <SelectItem
                        key={token.value}
                        value={token.value}
                        className="hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 cursor-pointer transition-all duration-200 rounded-lg text-sm font-medium text-neutral-900 hover:text-neutral-900"
                      >
                        {token.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentChain && (
                  <p className="text-xs text-neutral-600">
                    Selected network: {currentChain.network}
                    {selectedChainId !== currentChainId && (
                      <span className="text-blue-500 ml-1">
                        (will switch automatically)
                      </span>
                    )}
                  </p>
                )}
              </fieldset>
            )}

            <fieldset className="space-y-3">
              <header className="flex items-center justify-between">
                <Label
                  htmlFor="amount"
                  className="text-neutral-800 font-semibold text-xs"
                >
                  Amount
                </Label>
                {selectedToken && (
                  <span className="text-xs text-neutral-700 bg-gradient-to-r from-blue-100 to-indigo-100 px-2 py-1 rounded-lg border border-blue-200">
                    {activeType === "deposit" ? (
                      // For deposits, show wallet balance
                      balanceLoading ? (
                        "Loading wallet balance..."
                      ) : balanceError ? (
                        <span className="text-red-500">
                          Error loading wallet balance
                        </span>
                      ) : (
                        `Wallet: ${formatDecimalConsistent(tokenBalance)}`
                      )
                    ) : // For withdrawals, show deposited balance (available locked funds)
                    depositedBalanceLoading ? (
                      "Loading available balance..."
                    ) : depositedBalanceError ? (
                      <span className="text-red-500">
                        Error loading available balance
                      </span>
                    ) : (
                      `Available: ${formatDecimalConsistent(depositedBalance)}`
                    )}
                  </span>
                )}
              </header>
              <section className="relative">
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith("-")) return; // Prevent negative numbers
                    setAmount(value);
                  }}
                  placeholder="0.0"
                  required
                  className="w-full pl-3 pr-3 py-3 rounded-xl bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 shadow-md hover:shadow-lg text-base font-semibold text-gray-800"
                />
                {activeType === "withdraw" &&
                  depositedBalance &&
                  parseFloat(amount) > parseFloat(depositedBalance) && (
                    <p className="text-red-500 text-xs mt-1">
                      Amount exceeds available balance
                    </p>
                  )}
                {activeType === "deposit" &&
                  tokenBalance &&
                  parseFloat(amount) > parseFloat(tokenBalance) && (
                    <p className="text-red-500 text-xs mt-1">
                      Amount exceeds wallet balance
                    </p>
                  )}
              </section>
            </fieldset>

            <footer className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-neutral-800 border-2 border-gray-200 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-300 hover:border-gray-300 shadow-md hover:shadow-lg rounded-xl font-semibold transition-all duration-300 transform "
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading || isConfirming || !selectedToken || !amount || !isWalletClientReady
                }
                className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl rounded-xl font-semibold transition-all duration-300 transform  animate-pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isWalletClientReady ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Connecting wallet...
                  </span>
                ) : isLoading || isConfirming ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {isConfirming ? "Confirming..." : "Processing..."}
                  </span>
                ) : (
                  `${activeType === "deposit" ? "Deposit" : "Withdraw"} ${selectedTokenData?.label.split(" ")[0] || "Tokens"}`
                )}
              </Button>
            </footer>

            {error && (
              <section className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </section>
            )}

            {/* Disconnect Section */}
            <section className="mt-6 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDisconnect}
                className="w-full text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              >
                <Power className="h-4 w-4" />
                Disconnect Wallet
              </Button>
            </section>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositWithdrawModal;
