import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  footerPosition?: "fixed" | "absolute";
  viewToggle?: ReactNode;
  scrollable?: boolean;
  // Materialize navigation props
  navigationVariant?: "default" | "materialize";
  materializeNavColor?:
    | "blue"
    | "teal"
    | "green"
    | "orange"
    | "red"
    | "cyan"
    | "grey lighten-4"
    | "grey darken-4";
  materializeNavBrand?: string;
  materializeNavTransparent?: boolean;
  materializeNavExtended?: boolean;
}

export const Layout = ({
  children,
  className = "",
  footerPosition = "fixed",
  viewToggle,
  scrollable = false,
  navigationVariant = "default",
  materializeNavColor = "blue",
  materializeNavBrand = "Trade Glance",
  materializeNavTransparent = false,
  materializeNavExtended = false,
}: LayoutProps): JSX.Element => {
  if (scrollable) {
    // Scrollable layout for pages like docs, mint, config
    return (
      <main
        className={`bg-neutral-soft/30 min-h-screen flex flex-col relative overflow-hidden ${className}`}
      >
        {/* Floating decorative elements for extra eye candy */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-lg blur-lg animate-pulse delay-1000"></section>
        </section>

        <section className="container flex-shrink-0 relative z-20">
          <header className="p-3 sm:p-4 lg:p-6">
            <Navigation
              variant={navigationVariant}
              materializeColor={materializeNavColor}
              materializeBrand={materializeNavBrand}
              materializeTransparent={materializeNavTransparent}
              materializeExtended={materializeNavExtended}
            />
            {viewToggle && (
              <section className="mt-3 flex justify-center">
                {viewToggle}
              </section>
            )}
          </header>
        </section>
        <section className="flex-1 container px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 relative z-0">
          {children}
        </section>
        {/* Footer flows naturally with content for scrollable pages - hidden on mobile */}
        <Footer className="bg-white border-t flex-shrink-0 mt-auto hidden sm:block" />
      </main>
    );
  }

  // Fixed layout for trading pages
  return (
    <main
      className={`bg-neutral-soft/30 relative h-screen flex flex-col overflow-hidden ${className}`}
    >
      {/* Floating decorative elements for extra eye candy */}
      <section className="absolute inset-0 pointer-events-none overflow-hidden">
        <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
        <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
        <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-lg blur-lg animate-pulse delay-1000"></section>
      </section>

      <section className="container flex-1 flex flex-col min-h-0 relative z-20">
        <header className="p-3 sm:p-4 lg:p-6 flex-shrink-0">
          <Navigation
            variant={navigationVariant}
            materializeColor={materializeNavColor}
            materializeBrand={materializeNavBrand}
            materializeTransparent={materializeNavTransparent}
            materializeExtended={materializeNavExtended}
          />
          {viewToggle && (
            <section className="mt-3 flex justify-center">{viewToggle}</section>
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
