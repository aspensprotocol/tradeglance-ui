import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
}

export const Layout = ({ children, className = "", footerPosition = "fixed" }: LayoutProps) => {
  return (
    <div className={`min-h-screen bg-neutral-soft/30 relative ${className}`}>
      <div className="container min-h-screen flex flex-col">
        <div className="p-4">
          <Navigation />
        </div>
        <div className="flex-1 px-4 pb-16">
          {children}
        </div>
      </div>
      <Footer className={`${footerPosition} bottom-0 left-0 right-0`} />
    </div>
  );
}; 