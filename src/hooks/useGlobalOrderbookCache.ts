import { useContext } from "react";
import { GlobalOrderbookCacheContext } from "../contexts/global-orderbook-context";

export function useGlobalOrderbookCache() {
  const context = useContext(GlobalOrderbookCacheContext);
  if (!context) {
    throw new Error("useGlobalOrderbookCache must be used within a GlobalOrderbookCacheProvider");
  }
  return context;
}
