import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import WalletButton from "./WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useChainNetwork } from "@/hooks/useChainNetwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  className?: string;
}

export const Navigation = ({ className = "" }: NavigationProps): JSX.Element => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentChainId, isSupported } = useChainMonitor();
  const { getChainNetwork } = useChainNetwork();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, []);

  return (
    <nav className={`flex justify-between items-center ${className}`}>
      {/* Desktop Navigation */}
      <section className="hidden md:flex gap-6">
        <Link to="/pro" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
          Pro
        </Link>
        <Link to="/simple" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
          Simple
        </Link>
        <Link to="/docs" className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
          Docs
        </Link>
      </section>

      {/* Mobile Menu Button */}
      <section className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-3 text-gray-900 hover:text-blue-600 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Navigation</h2>
              <button
                onClick={closeMobileMenu}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </header>
            
            {/* Homepage content */}
            <main className="p-3 sm:p-4">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-center text-xl sm:text-2xl text-gray-900">Trade Glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Link to="/simple" className="block" onClick={closeMobileMenu}>
                    <Button className="w-full py-2.5 sm:py-3 text-sm sm:text-base" variant="outline">
                      Simple
                    </Button>
                  </Link>
                  <Link to="/docs" className="block" onClick={closeMobileMenu}>
                    <Button className="w-full py-2.5 sm:py-3 text-sm sm:text-base" variant="outline">
                      Docs
                    </Button>
                  </Link>
                  <Link to="/mint" className="block" onClick={closeMobileMenu}>
                    <Button className="w-full py-2.5 sm:py-3 text-sm sm:text-base" variant="outline">
                      Mint Test Tokens
                    </Button>
                  </Link>
                  <Link to="/config" className="block" onClick={closeMobileMenu}>
                    <Button className="w-full py-2.5 sm:py-3 text-sm sm:text-base" variant="outline">
                      Config
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </main>
          </section>
        </aside>
      )}
      
      <section className="flex gap-2 sm:gap-3 items-center">
        {currentChainId && (
          <span className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium ${
            isSupported 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isSupported ? '✅' : '❌'} {getChainNetwork(currentChainId) || currentChainId}
          </span>
        )}
        <WalletButton />
      </section>
    </nav>
  );
};