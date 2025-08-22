import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
  viewToggle?: ReactNode;
}

export const Layout = ({
  children,
  className = "",
  footerPosition = "fixed",
  viewToggle,
}: LayoutProps): JSX.Element => {
  return (
    <main className={`min-h-screen bg-neutral-soft/30 relative ${className}`}>
      <section className="container min-h-screen flex flex-col">
        <header className="p-3 sm:p-4 lg:p-6">
          <Navigation />
          {viewToggle && (
            <div className="mt-3 flex justify-center">
              {viewToggle}
            </div>
          )}
        </header>
        <section className="flex-1 px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-20">
          {children}
        </section>
      </section>
      {/* Hide footer on mobile and tablet, only show on desktop (lg and above) */}
      <Footer
        className={`${footerPosition} bottom-0 left-0 right-0 hidden lg:block`}
      />
    </main>
  );
};
