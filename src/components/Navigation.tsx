import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Coins,
  BarChart3,
  Home,
} from "lucide-react";
import WalletButton from "./WalletButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useViewContext } from "@/hooks/useViewContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  className?: string;
  variant?: "default" | "materialize";
  materializeColor?:
    | "blue"
    | "teal"
    | "green"
    | "orange"
    | "red"
    | "cyan"
    | "grey lighten-4"
    | "grey darken-4";
  materializeBrand?: string;
  materializeTransparent?: boolean;
  materializeExtended?: boolean;
}

export const Navigation = ({
  className = "",
  variant = "default",
  materializeColor = "blue",
  materializeBrand = "Trade Glance",
  materializeTransparent = false,
  materializeExtended = false,
}: NavigationProps): JSX.Element => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { viewMode } = useViewContext();
  const location = useLocation();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Check if we're on the trading page
  const isOnTradingPage = location.pathname === "/trading";
  const isOnDocsPage = location.pathname === "/docs";

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, []);

  // Handle Materialize variant
  if (variant === "materialize") {
    const navbarClasses = ["navbar-fixed"];
    if (materializeTransparent) navbarClasses.push("transparent");
    if (materializeExtended) navbarClasses.push("extended");
    if (materializeColor) navbarClasses.push(materializeColor);

    return (
      <>
        <nav className={navbarClasses.join(" ")}>
          <section className="nav-wrapper">
            <header className="container">
              {/* Brand/Logo */}
              <a href="#" className="brand-logo">
                {materializeBrand}
              </a>

              {/* Desktop Navigation */}
              <ul className="right hide-on-med-and-down">
                <li>
                  <Link
                    to="/trading?view=pro"
                    className={
                      isOnTradingPage && viewMode === "pro" ? "active" : ""
                    }
                  >
                    Pro
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trading?view=simple"
                    className={
                      isOnTradingPage && viewMode === "simple" ? "active" : ""
                    }
                  >
                    Simple
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className={isOnDocsPage ? "active" : ""}>
                    Docs
                  </Link>
                </li>
              </ul>

              {/* Mobile Menu Button */}
              <a
                href="#"
                data-target="mobile-nav"
                className="sidenav-trigger right"
              >
                <i className="material-icons">menu</i>
              </a>

              {/* Right side items */}
              <section className="right hide-on-med-and-down">
                <WalletButton />
              </section>
            </header>
          </section>

          {/* Extended navbar content */}
          {materializeExtended && (
            <section className="nav-content">
              <header className="container">
                {/* Additional content can go here */}
              </header>
            </section>
          )}
        </nav>

        {/* Mobile Navigation Sidenav */}
        <ul className="sidenav" id="mobile-nav">
          <li>
            <Link to="/" onClick={closeMobileMenu}>
              <Button variant="materializeFlat" fullWidth>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </li>
          <li>
            <Link to="/docs" onClick={closeMobileMenu}>
              <Button variant="materializeFlat" fullWidth>
                Docs
              </Button>
            </Link>
          </li>
          <li>
            <Link to="/mint" onClick={closeMobileMenu}>
              <Button variant="materializeFlat" fullWidth>
                Mint Test Tokens
              </Button>
            </Link>
          </li>
        </ul>
      </>
    );
  }

  // Default behavior for existing variant
  return (
    <nav className={`flex justify-between items-center ${className}`}>
      {/* Desktop Navigation */}
      <section className="hidden md:flex gap-6">
        <Link
          to="/"
          className={`text-base font-semibold transition-all duration-300 transform  flex items-center gap-2 ${
            location.pathname === "/"
              ? "tab-active-blue animate-pulse-glow"
              : "text-neutral-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600"
          }`}
        >
          <Home className="h-5 w-5" />
          Home
        </Link>

        {/* Enhanced Trading Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-base font-semibold text-neutral-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 hover:bg-transparent p-0 h-auto transition-all duration-300 transform  group"
            >
              Trading
              <ChevronDown className="ml-1 h-4 w-4 text-purple-500 group-hover:text-purple-600 transition-colors duration-300 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 card-gradient-purple border-2 border-purple-200 shadow-2xl rounded-xl p-2"
          >
            <DropdownMenuLabel className="text-purple-800 font-semibold text-center py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              🚀 Trading Interfaces
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gradient-to-r from-purple-200 to-pink-200" />
            <DropdownMenuItem
              asChild
              className="rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-200 cursor-pointer group"
            >
              <Link
                to="/trading?view=pro"
                className="flex items-center gap-3 p-2 w-full"
              >
                <BarChart3 className="h-5 w-5 text-purple-500 group-hover:text-purple-600 transition-colors duration-200" />
                <span className="font-medium">Pro Trading</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-lg hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 cursor-pointer group"
            >
              <Link
                to="/trading?view=simple"
                className="flex items-center gap-3 p-2 w-full"
              >
                <BarChart3 className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors duration-200" />
                <span className="font-medium">Simple Swap</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gradient-to-r from-purple-200 to-pink-200" />
            <DropdownMenuItem
              asChild
              className="rounded-lg hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 transition-all duration-200 cursor-pointer group"
            >
              <Link to="/mint" className="flex items-center gap-3 p-2 w-full">
                <Coins className="h-5 w-5 text-orange-500 group-hover:text-orange-600 transition-colors duration-200" />
                <span className="font-medium">Mint Test Tokens</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Resources Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-base font-semibold text-neutral-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 hover:bg-transparent p-0 h-auto transition-all duration-300 transform  group"
            >
              Resources
              <ChevronDown className="ml-1 h-4 w-4 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-300 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 card-gradient-blue border-2 border-indigo-200 shadow-2xl rounded-xl p-2"
          >
            <DropdownMenuLabel className="text-indigo-800 font-semibold text-center py-2 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg">
              📚 Documentation & Help
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gradient-to-r from-indigo-200 to-blue-200" />
            <DropdownMenuItem
              asChild
              className="rounded-lg hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 cursor-pointer group"
            >
              <Link to="/docs" className="flex items-center gap-3 p-2 w-full">
                <BookOpen className="h-5 w-5 text-indigo-500 group-hover:text-indigo-600 transition-colors duration-200" />
                <span className="font-medium">Documentation</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gradient-to-r from-indigo-200 to-blue-200" />
            <DropdownMenuItem
              asChild
              className="rounded-lg hover:bg-gradient-to-r hover:from-teal-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer group"
            >
              <a
                href="https://t.me/aspens_xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 w-full"
              >
                <BookOpen className="h-5 w-5 text-teal-500 group-hover:text-teal-600 transition-colors duration-200" />
                <span className="font-medium">Support</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Mobile Menu Button */}
      <section className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-3 text-neutral-900 hover:text-blue-600 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </section>

      {/* Mobile Navigation Modal */}
      {isMobileMenuOpen && (
        <aside
          ref={mobileMenuRef}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
        >
          <section className="absolute top-0 left-0 right-0 bottom-0 bg-white">
            {/* Header with close button */}
            <header className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                Navigation
              </h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </header>

            {/* Homepage content */}
            <main className="p-3 sm:p-4">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-center text-lg sm:text-xl text-neutral-900">
                    Trade Glance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Link
                    to="/trading?view=simple"
                    className="block"
                    onClick={closeMobileMenu}
                  >
                    <Button
                      className="w-full py-2.5 sm:py-3 text-xs sm:text-sm"
                      variant="outline"
                    >
                      Simple
                    </Button>
                  </Link>
                  <Link to="/docs" className="block" onClick={closeMobileMenu}>
                    <Button
                      className="w-full py-2.5 sm:py-3 text-xs sm:text-sm"
                      variant="outline"
                    >
                      Docs
                    </Button>
                  </Link>
                  <Link to="/mint" className="block" onClick={closeMobileMenu}>
                    <Button
                      className="w-full py-2.5 sm:py-3 text-xs sm:text-sm"
                      variant="outline"
                    >
                      Mint Test Tokens
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </main>
          </section>
        </aside>
      )}

      <section className="flex gap-2 sm:gap-3 items-center">
        <WalletButton />
      </section>
    </nav>
  );
};
