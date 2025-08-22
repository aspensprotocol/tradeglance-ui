import { getTokenImageUrl } from "@/lib/utils";

interface TokenImageProps {
  symbol: string;
  size?: string;
  className?: string;
}

export function TokenImage({ 
  symbol, 
  size = "w-6 h-6", 
  className = "" 
}: TokenImageProps): JSX.Element {
  // Debug logging to see what symbols are being passed
  console.log("🔍 TokenImage component:", {
    originalSymbol: symbol,
    symbolType: typeof symbol,
    symbolLength: symbol?.length,
    trimmedSymbol: symbol?.trim(),
    upperSymbol: symbol?.toUpperCase(),
  });

  const imageUrl = getTokenImageUrl(symbol);
  
  console.log("🔍 TokenImage result:", {
    symbol,
    imageUrl,
    hasImage: !!imageUrl,
  });
  
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${symbol} token`}
        className={`${size} rounded-full object-cover ${className}`}
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
    );
  }

  // Fallback placeholder with first letter
  return (
    <span className={`${size} bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="text-white text-xs font-bold">
        {symbol?.charAt(0)?.toUpperCase() || "?"}
      </span>
    </span>
  );
}
