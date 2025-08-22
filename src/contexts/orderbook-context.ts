import { createContext } from "react";
import type { OrderbookContextType } from "../lib/shared-types";

export const OrderbookContext = createContext<OrderbookContextType | undefined>(
  undefined,
);
