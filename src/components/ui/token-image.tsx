import { getTokenImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TokenImageProps {
  symbol: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
  chainId?: number;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

// Chain avatar size mapping - smaller relative to token avatar
const chainSizeClasses = {
  sm: "w-2.5 h-2.5",
  md: "w-3 h-3",
  lg: "w-4 h-4",
  xl: "w-5 h-5",
};

// Chain image URL mapping for the specified testnets
const getChainImageUrl = (chainId: number): string | null => {
  switch (chainId) {
    case 114: // Coston2 testnet (Flare)
      return "https://dd.dexscreener.com/ds-data/chains/flare.png";
    case 84532: // Base Sepolia testnet
      return "https://dd.dexscreener.com/ds-data/chains/base.png";
    default:
      return null;
  }
};

export function TokenImage({
  symbol,
  size = "md",
  className = "",
  showFallback = true,
  chainId,
}: TokenImageProps): JSX.Element {
  const imageUrl = getTokenImageUrl(symbol);
  const sizeClass = sizeClasses[size];
  const chainSizeClass = chainSizeClasses[size];
  const chainImageUrl = chainId ? getChainImageUrl(chainId) : null;

  if (imageUrl) {
    return (
      <div className={cn("relative", sizeClass, className)}>
        <Avatar className={cn("w-full h-full")}>
          <AvatarImage
            src={imageUrl}
            alt={`${symbol} token`}
            className="object-cover"
          />
          {showFallback && (
            <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
              {symbol?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Chain avatar in bottom-right corner */}
        {chainId && chainImageUrl && (
          <div
            className={cn(
              "absolute bottom-0 right-0 rounded-full border-2 border-white shadow-sm",
              chainSizeClass,
            )}
          >
            <Avatar className="w-full h-full">
              <AvatarImage
                src={chainImageUrl}
                alt={`Chain ${chainId}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-500 text-white text-xs font-bold">
                {chainId}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    );
  }

  // Fallback when no image URL is available
  return (
    <div className={cn("relative", sizeClass, className)}>
      <Avatar className={cn("w-full h-full", "bg-blue-500")}>
        <AvatarFallback className="text-white text-xs font-bold">
          {symbol?.charAt(0)?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Chain avatar in bottom-right corner for fallback case too */}
      {chainId && chainImageUrl && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white shadow-sm",
            chainSizeClass,
          )}
        >
          <Avatar className="w-full h-full">
            <AvatarImage
              src={chainImageUrl}
              alt={`Chain ${chainId}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-500 text-white text-xs font-bold">
              {chainId}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
