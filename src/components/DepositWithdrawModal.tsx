import React, { useState, useEffect, useMemo } from "react";
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
import { useAccount } from "wagmi";
import { useContract } from "@/hooks/useContract";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useTradeContracts } from "@/hooks/useTradeContract";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAllBalances } from "@/hooks/useAllBalances";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import {
  getEtherscanLink,
  shortenTxHash,
  triggerBalanceRefresh,
} from "@/lib/utils";
import type { Chain } from "@/protos/gen/arborter_config_pb";
import { formatDecimalConsistent } from "@/lib/number-utils";

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "deposit" | "withdraw"; // Make type optional since we'll handle it internally
  onSuccess?: () => void; // Callback for successful transactions
}

interface NetworkSwitcherProps {
  onNetworkSwitch: () => void;
}

// Component for switching to supported networks
const NetworkSwitcher = ({
  onNetworkSwitch,
}: NetworkSwitcherProps): JSX.Element => {
  const { switchToNetwork, getSupportedNetworks, isSwitching } =
    useNetworkSwitch();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const supportedChains = getSupportedNetworks();

  const handleNetworkSwitch = async (chainConfig: Chain) => {
    setSwitchingTo(chainConfig.network);
    try {
      const success = await switchToNetwork(chainConfig);
      if (success) {
        // Add a small delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 300));
        onNetworkSwitch();
      }
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <section className="space-y-4">
      <header className="text-center">
        <p className="text-red-600 mb-2">
          Current network is not supported for deposits/withdrawals
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Please switch to one of the supported networks:
        </p>
      </header>

      <nav className="space-y-2">
        {supportedChains.map((chain) => {
          const isCurrentlySwitching = switchingTo === chain.network;
          const isDisabled = isSwitching || isCurrentlySwitching;

          return (
            <Button
              key={chain.chainId}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleNetworkSwitch(chain)}
              disabled={isDisabled}
            >
              {isCurrentlySwitching ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
                  Switching to {chain.network}...
                </>
              ) : isSwitching ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></span>
                  Switching...
                </>
              ) : (
                <>
                  <span className="font-medium">{chain.network}</span>
                  <span className="text-gray-500 ml-2">
                    (Chain ID: {chain.chainId})
                  </span>
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {supportedChains.length === 0 && (
        <p className="text-center text-gray-500">
          No supported networks found. Please check your configuration.
        </p>
      )}

      <footer className="text-center text-xs text-gray-500">
        <p>
          If you don't see your network listed, please check your wallet
          settings or contact support.
        </p>
      </footer>
    </section>
  );
};

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
  const { deposit, withdraw, isLoading, isConfirming, error } = useContract();
  const { getAllChains } = useTradeContracts();
  const { currentChainId } = useChainMonitor();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  const chains = getAllChains();

  // Debug: Log the chains data
  console.log("DepositWithdrawModal: Available chains:", chains);
  console.log("DepositWithdrawModal: Current chain ID:", currentChainId);

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
    // Helper function to get chain prefix for tokens (same as mint/trade views)
    const getChainPrefix = (network: string): string => {
      if (network.includes("flare")) return "f"; // flare-coston2
      if (network.includes("base")) return "b"; // base-sepolia
      if (network.includes("mainnet")) return "m";
      if (network.includes("goerli")) return "g";
      if (network.includes("sepolia")) return "s";
      return network.charAt(0).toLowerCase(); // fallback to first letter
    };

    return chains.flatMap((chain: Chain) =>
      Object.entries(chain.tokens).map(([symbol, token]) => {
        const prefix = getChainPrefix(chain.network);
        const prefixedSymbol = `${prefix}${symbol}`;

        return {
          value: `${chain.network}:${symbol}`,
          label: `${prefixedSymbol} (${chain.network})`,
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

  // Debug logging
  console.log("DepositWithdrawModal balance data:", {
    selectedToken: selectedTokenData?.symbol,
    selectedChainId,
    allBalances,
    depositedBalanceData,
    depositedBalance,
    tokenBalance,
    balancesLoading,
    balanceLoading,
  });

  // Check if selected chain is supported
  const isSelectedChainSupported: boolean = chains.some(
    (chain: Chain) => chain.chainId === selectedChainId,
  );

  // Auto-select first token if available and none selected
  useEffect(() => {
    if (allTokens.length > 0 && !selectedToken) {
      console.log(
        "DepositWithdrawModal: Auto-selecting first token:",
        allTokens[0].value,
      );
      setSelectedToken(allTokens[0].value);
    }
  }, [allTokens, selectedToken]);

  // Auto-switch to the correct chain when a token is selected
  useEffect(() => {
    if (
      selectedTokenData &&
      selectedChainId &&
      selectedChainId !== currentChainId
    ) {
      console.log(
        "DepositWithdrawModal: Token requires chain",
        selectedChainId,
        "but user is on chain",
        currentChainId,
      );

      // With MetaMask Chain Permissions, we don't automatically switch networks
      // Instead, we provide guidance to the user
      if (currentChainId) {
        toast({
          title: "Network switch required",
          description: `Please manually switch to the ${selectedTokenData.network} network in MetaMask to ${activeType} ${selectedTokenData.symbol}`,
          variant: "default",
        });
      }
    }
  }, [
    selectedToken,
    selectedTokenData,
    selectedChainId,
    currentChainId,
    activeType,
    toast,
  ]);

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

    // Check if selected chain is supported
    if (!isSelectedChainSupported) {
      console.error("Selected chain is not supported for deposits/withdrawals");
      return;
    }

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
        console.log("DepositWithdrawModal: Triggering delayed balance refresh");
        triggerBalanceRefresh();

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }, 2000); // Wait 2 seconds for blockchain state to update

      // Add another refresh after a longer delay to catch any delayed updates
      setTimeout(() => {
        console.log("DepositWithdrawModal: Triggering final balance refresh");
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
            "RPC connection error. The network endpoint may be down. Please try refreshing the page or switching networks.";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage = `Insufficient funds for ${activeType}. Please check your balance.`;
        } else if (err.message?.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user.";
        } else if (err.message?.includes("reverted")) {
          errorMessage = `Transaction was reverted on the blockchain. This usually means the ${activeType} failed due to insufficient balance or other contract constraints.`;
        } else if (err.message?.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }
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

  const handleClose = (): void => {
    setAmount("");
    setSelectedToken("");
    setActiveType(initialType);
    onClose();
  };

  const handleNetworkSwitch = async (): Promise<void> => {
    // Add a small delay to allow the network switch to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Force a refresh of the chain monitor
    window.dispatchEvent(new Event("chainChanged"));

    // This will trigger a re-render when the network is switched
    // The useChainMonitor hook will detect the change and update isSupported
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <span className="text-lg sm:text-xl">
              {activeType === "deposit" ? "Deposit" : "Withdraw"} Tokens
            </span>
            <nav className="flex space-x-2 w-full sm:w-auto">
              <Button
                variant={activeType === "deposit" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("deposit")}
                className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                Deposit
              </Button>
              <Button
                variant={activeType === "withdraw" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType("withdraw")}
                className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                Withdraw
              </Button>
            </nav>
          </DialogTitle>
        </DialogHeader>

        {!isConnected ? (
          <section className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Please connect your wallet to continue
            </p>
          </section>
        ) : !currentChainId ? (
          <section className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Please connect to a supported network
            </p>
          </section>
        ) : !isSelectedChainSupported ? (
          <NetworkSwitcher onNetworkSwitch={handleNetworkSwitch} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {selectedChainId && (
              <fieldset className="space-y-2">
                <Label htmlFor="token">Select Token</Label>
                <Select value={selectedToken} onValueChange={setSelectedToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTokens.map((token) => (
                      <SelectItem key={token.value} value={token.value}>
                        {token.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentChain && (
                  <p className="text-xs text-gray-500">
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

            <fieldset className="space-y-2">
              <header className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                {selectedToken && (
                  <span className="text-xs text-gray-500">
                    {activeType === "deposit" ? (
                      // For deposits, show wallet balance
                      balanceLoading ? (
                        "Loading wallet balance..."
                      ) : balanceError ? (
                        <span className="text-red-500">
                          Error loading wallet balance
                        </span>
                      ) : (
                        `Wallet Balance: ${formatDecimalConsistent(tokenBalance)}`
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
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  required
                />
                {activeType === "withdraw" &&
                  depositedBalance &&
                  parseFloat(depositedBalance) > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                      onClick={() => setAmount(depositedBalance)}
                    >
                      Max
                    </Button>
                  )}
                {activeType === "deposit" &&
                  tokenBalance &&
                  parseFloat(tokenBalance) > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs"
                      onClick={() => setAmount(tokenBalance)}
                    >
                      Max
                    </Button>
                  )}
              </section>
            </fieldset>

            {error && <aside className="text-red-600 text-sm">{error}</aside>}

            <footer className="flex gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !amount || !selectedToken}
                className="flex-1 py-2 sm:py-2.5 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {isConfirming ? "Confirming..." : "Processing..."}
                  </>
                ) : (
                  `${activeType.charAt(0).toUpperCase() + activeType.slice(1)}`
                )}
              </Button>
            </footer>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositWithdrawModal;
