import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/web3modal-config";
import { GlobalOrderbookCacheProvider } from "@/contexts/GlobalOrderbookCache";

import { ViewProvider } from "@/contexts/ViewContext";
import Home from "./pages/Home";
import Trading from "./pages/Trading";
import Docs from "./pages/Docs";
import Mint from "./pages/Mint";
import NotFound from "./pages/NotFound";
import { ConfigTest } from "./components/ConfigTest";

const App = (): JSX.Element => (
  <WagmiProvider config={wagmiConfig}>
    <TooltipProvider>
      <GlobalOrderbookCacheProvider>
        <ViewProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/mint" element={<Mint />} />
              <Route path="/config" element={<ConfigTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ViewProvider>
      </GlobalOrderbookCacheProvider>
    </TooltipProvider>
  </WagmiProvider>
);

export default App;
