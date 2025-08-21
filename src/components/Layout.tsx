import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { useMaterialize } from "@/lib/materialize-utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
}

export const Layout = ({ children, className = "", footerPosition = "fixed" }: LayoutProps) => {
  useMaterialize();

  return (
    <div className={`min-h-screen grey lighten-4 ${className}`}>
      <Navigation />
      <main className="container section">
        {children}
      </main>
      <Footer className={`${footerPosition} bottom-0 left-0 right-0`} />
    </div>
  );
}; 