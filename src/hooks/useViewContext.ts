import { useContext } from "react";
import { ViewContext, type ViewContextType } from "@/contexts/view-context";

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
};
