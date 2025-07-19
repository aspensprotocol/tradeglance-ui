
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Bridge from "./pages/Bridge";
import NotFound from "./pages/NotFound";
import { ConfigTest } from "./components/ConfigTest";
import GrpcWebTest from "./components/GrpcWebTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trade" element={<Index />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/bridge" element={<Bridge />} />
          <Route path="/config" element={<ConfigTest />} />
          <Route path="/grpc-test" element={<GrpcWebTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
