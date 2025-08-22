import { createContext } from "react";
import type { GlobalOrderbookCacheContextType } from "../lib/shared-types";

export const GlobalOrderbookCacheContext = createContext<GlobalOrderbookCacheContextType | null>(null);
