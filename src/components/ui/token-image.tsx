import { getTokenImageUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TokenImageProps {
  symbol: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function TokenImage({
  symbol,
  size = "md",
  className = "",
  showFallback = true,
}: TokenImageProps): JSX.Element {
  const imageUrl = getTokenImageUrl(symbol);
  const sizeClass = sizeClasses[size];

  if (imageUrl) {
    return (
      <Avatar className={cn(sizeClass, className)}>
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
    );
  }

  // Fallback when no image URL is available
  return (
    <Avatar className={cn(sizeClass, "bg-blue-500", className)}>
      <AvatarFallback className="text-white text-xs font-bold">
        {symbol?.charAt(0)?.toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
