import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useViewContext } from "@/hooks/useViewContext";

const Home = (): JSX.Element => {
  const navigate = useNavigate();
  const { setViewMode } = useViewContext();

  const handleProClick = (): void => {
    setViewMode("pro");
    navigate("/trading");
  };

  const handleSimpleClick = (): void => {
    setViewMode("simple");
    navigate("/trading");
  };

  return (
    <Layout footerPosition="fixed">
      <main className="flex items-center justify-center h-full relative">
        {/* Floating decorative elements matching Pro view aesthetic */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-lg animate-pulse delay-1000"></section>
        </section>

        <section className="max-w-md w-full space-y-6 relative z-10">
          <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 border border-blue-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-neutral-900 text-lg sm:text-xl">
                Welcome to Trade Glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hide Pro button on mobile, show on tablet and desktop */}
              <Button
                className="w-full hidden sm:block bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transform hover:scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                onClick={handleProClick}
              >
                {/* Subtle floating sparkles */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-blue-200 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-1 h-1 bg-indigo-200 rounded-full animate-ping opacity-60 delay-300"></span>

                {/* Subtle glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10 font-bold tracking-wide">
                  🚀 Pro
                </span>
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-slate-50 via-emerald-50 to-teal-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transform hover:scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                onClick={handleSimpleClick}
              >
                {/* Subtle floating sparkles */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-emerald-200 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-1 h-1 bg-teal-200 rounded-full animate-ping opacity-60 delay-300"></span>

                {/* Subtle glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 rounded opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10 font-bold tracking-wide">
                  💎 Simple
                </span>
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-slate-50 via-purple-50 to-pink-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transform hover:scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                onClick={() => navigate("/docs")}
              >
                {/* Subtle floating sparkles */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-purple-200 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-1 h-1 bg-pink-200 rounded-full animate-ping opacity-60 delay-300"></span>

                {/* Subtle glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 rounded opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10 font-bold tracking-wide">
                  📚 Docs
                </span>
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-slate-50 via-orange-50 to-red-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transform hover:scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                onClick={() => navigate("/mint")}
              >
                {/* Subtle floating sparkles */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-orange-200 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-1 h-1 bg-red-200 rounded-full animate-ping opacity-60 delay-300"></span>

                {/* Subtle glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 rounded opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10 font-bold tracking-wide">
                  🪙 Mint Test Tokens
                </span>
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-slate-50 via-indigo-50 to-blue-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transform hover:scale-105 hover:scale-110 transition-all duration-300 relative overflow-hidden group"
                onClick={() => navigate("/config")}
              >
                {/* Subtle floating sparkles */}
                <span className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-indigo-200 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -top-1 -right-1 w-1 h-1 bg-blue-200 rounded-full animate-ping opacity-60 delay-300"></span>

                {/* Subtle glowing effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-blue-100 to-cyan-100 rounded opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300"></span>

                <span className="relative z-10 font-bold tracking-wide">
                  ⚙️ Config
                </span>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </Layout>
  );
};

export default Home;
