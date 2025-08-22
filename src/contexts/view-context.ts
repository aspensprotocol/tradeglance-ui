import { createContext } from "react";
import type { ViewContextType } from "../lib/shared-types";

export const ViewContext = createContext<ViewContextType | undefined>(undefined);