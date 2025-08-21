import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/web3modal-config";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Simple from "./pages/Simple";
import Docs from "./pages/Docs";
import Mint from "./pages/Mint";
import NotFound from "./pages/NotFound";
import { ConfigTest } from "./components/ConfigTest";
import { ResponsiveRoute } from "./components/ResponsiveRoute";

const App = (): JSX.Element => (
  <WagmiProvider config={wagmiConfig}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/pro"
            element={
              <ResponsiveRoute hideOnMobile={true} redirectTo="/simple">
                <Index />
              </ResponsiveRoute>
            }
          />
          <Route path="/simple" element={<Simple />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/config" element={<ConfigTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </WagmiProvider>
);

export default App;
