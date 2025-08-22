import { useContext } from "react";
import { ViewContext } from "@/contexts/view-context";
import type { ViewContextType } from "@/lib/shared-types";

export function useViewContext(): ViewContextType {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
}
