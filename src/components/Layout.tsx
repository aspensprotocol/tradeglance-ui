import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
}

export const Layout = ({
  children,
  className = "",
  footerPosition = "fixed",
}: LayoutProps): JSX.Element => {
  return (
    <main className={`min-h-screen bg-neutral-soft/30 relative ${className}`}>
      <section className="container min-h-screen flex flex-col">
        <header className="p-2 sm:p-4">
          <Navigation />
        </header>
        <section className="flex-1 px-2 sm:px-4 pb-16">{children}</section>
      </section>
      <Footer className={`${footerPosition} bottom-0 left-0 right-0`} />
    </main>
  );
};
