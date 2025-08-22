import { createContext } from "react";

export type ViewMode = "pro" | "simple";

export interface ViewContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewContext = createContext<ViewContextType | undefined>(undefined);
