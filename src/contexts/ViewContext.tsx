import React, { useState, useCallback } from "react";
import type { ViewContextType } from "../lib/shared-types";
import { ViewContext } from "./view-context";

interface ViewProviderProps {
  children: React.ReactNode;
}

export function ViewProvider({ children }: ViewProviderProps): JSX.Element {
  const [viewMode, setViewModeState] = useState<'simple' | 'pro'>('pro');

  const setViewMode = useCallback((mode: 'simple' | 'pro') => {
    console.log("🔄 ViewContext: Switching view mode:", {
      from: viewMode,
      to: mode,
      timestamp: new Date().toISOString(),
    });
    setViewModeState(mode);
  }, [viewMode]);

  const contextValue: ViewContextType = {
    viewMode,
    setViewMode,
  };

  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
}
