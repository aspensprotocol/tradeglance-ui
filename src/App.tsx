import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./lib/web3modal-config";
import { GlobalOrderbookCacheProvider } from "@/contexts/GlobalOrderbookCache";
import { GlobalTradesCacheProvider } from "@/contexts/GlobalTradesCache";

import { ViewProvider } from "@/contexts/ViewContext";
import { RouteGuard } from "./components/RouteGuard";
import Home from "./pages/Home";
import Trading from "./pages/Trading";
import Docs from "./pages/Docs";
import Mint from "./pages/Mint";
import NotFound from "./pages/NotFound";
import { ConfigTest } from "./components/ConfigTest";
import { ThemeToggle } from "./components/ThemeToggle";

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <TooltipProvider>
        <GlobalOrderbookCacheProvider>
          <GlobalTradesCacheProvider>
            <ViewProvider>
              <Toaster />
              <Sonner />
              <ThemeToggle />
              <RouteGuard>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/trading" element={<Trading />} />
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/mint" element={<Mint />} />
                  <Route path="/config" element={<ConfigTest />} />

                  {/* Catch-all route for any other paths - this ensures React Router handles all routes */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteGuard>
            </ViewProvider>
          </GlobalTradesCacheProvider>
        </GlobalOrderbookCacheProvider>
      </TooltipProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
