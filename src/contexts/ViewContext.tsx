import React, { useState, useEffect, type ReactNode } from "react";
import { ViewContext, type ViewContextType } from "./view-context";

interface ViewProviderProps {
  children: ReactNode;
}

export const ViewProvider = ({ children }: ViewProviderProps): JSX.Element => {
  const [viewMode, setViewMode] = useState<ViewContextType["viewMode"]>(() => {
    const saved = localStorage.getItem("tradingViewMode");
    console.log("🔍 ViewContext: Initializing with localStorage value:", saved);
    const initialValue = (saved === "pro" || saved === "simple") ? saved : "simple";
    console.log("🔍 ViewContext: Setting initial viewMode to:", initialValue);
    return initialValue;
  });

  const handleSetViewMode = (mode: ViewContextType["viewMode"]): void => {
    console.log("🔄 ViewContext: Changing view mode from", viewMode, "to", mode);
    setViewMode(mode);
    localStorage.setItem("tradingViewMode", mode);
    console.log("💾 ViewContext: Saved to localStorage:", mode);
  };

  // Debug: Track viewMode changes
  useEffect(() => {
    console.log("👀 ViewContext: viewMode changed to:", viewMode);
  }, [viewMode]);

  return (
    <ViewContext.Provider value={{ viewMode, setViewMode: handleSetViewMode }}>
      {children}
    </ViewContext.Provider>
  );
};
