import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
  viewToggle?: ReactNode;
  scrollable?: boolean;
}

export const Layout = ({
  children,
  className = "",
  footerPosition = "fixed",
  viewToggle,
  scrollable = false,
}: LayoutProps): JSX.Element => {
  if (scrollable) {
    // Scrollable layout for pages like docs, mint, config
    return (
      <main className={`bg-neutral-soft/30 min-h-screen flex flex-col ${className}`}>
        <section className="container flex-shrink-0">
          <header className="p-3 sm:p-4 lg:p-6">
            <Navigation />
            {viewToggle && (
              <section className="mt-3 flex justify-center">
                {viewToggle}
              </section>
            )}
          </header>
        </section>
        <section className="flex-1 container px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
          {children}
        </section>
        {/* Footer flows naturally with content for scrollable pages - hidden on mobile */}
        <Footer className="bg-white border-t flex-shrink-0 mt-auto hidden sm:block" />
      </main>
    );
  }

  // Fixed layout for trading pages
  return (
    <main className={`bg-neutral-soft/30 relative h-screen flex flex-col ${className}`}>
      <section className="container flex-1 flex flex-col min-h-0">
        <header className="p-3 sm:p-4 lg:p-6 flex-shrink-0">
          <Navigation />
          {viewToggle && (
            <section className="mt-3 flex justify-center">
              {viewToggle}
            </section>
          )}
        </header>
        <section className="flex-1 px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-0 min-h-0 overflow-hidden">
          <article className="h-full lg:h-[calc(100vh-9rem)]">
            {children}
          </article>
        </section>
      </section>
      {/* Hide footer on mobile and tablet, only show on desktop (lg and above) */}
      <Footer
        className={`${footerPosition} bottom-0 left-0 right-0 hidden lg:block flex-shrink-0`}
      />
    </main>
  );
};
