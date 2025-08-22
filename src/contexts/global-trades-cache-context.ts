import { createContext } from "react";
import type { GlobalTradesCacheContextType } from "../lib/shared-types";

export const GlobalTradesCacheContext = createContext<GlobalTradesCacheContextType | undefined>(undefined);
