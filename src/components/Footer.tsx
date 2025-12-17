import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Info,
} from "lucide-react";
import { getShortGitCommitHash } from "@/lib/version";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { useState } from "react";

const attestationData = {
  tee_tcb_svn: "06010300000000000000000000000000",
  mr_seam:
    "5b38e33a6487958b72c3c12a938eaa5e3fd4510c51aeeab58c7d5ecee41d7c436489d6c8e4f92f160b7cad34207b00c1",
  mr_signer_seam:
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  seam_attributes: "0000000000000000",
  td_attributes: "0000001000000000",
  xfam: "e702060000000000",
  mr_td:
    "c68518a0ebb42136c12b2275164f8c72f25fa9a34392228687ed6e9caeb9c0f1dbd895e9cf475121c029dc47e70e91fd",
  mr_config_id:
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  mr_owner:
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  mr_owner_config:
    "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  rt_mr0:
    "85e0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08218ae5fe872fcb86967fd2449c29e22e59dc9fec998cb6547",
  rt_mr1:
    "9b43f9f34a64bc7191352585be0da1774a1499e698ba77cbf6184547d53d1770d6524c1cfa00b86352f273fc272a8cfe",
  rt_mr2:
    "7cc2dadd5849bad220ab122c4fbf25a74dc91cc12702447d3b5cac0f49b2b139994f5cd936b293e5f0f14dea4262d668",
  rt_mr3:
    "2c482b5b34f6902293bc203696f407241bfa319d2410a04c604d1021888d6028bf4bd280ff859ee270a0429aac5f0d82",
  report_data:
    "afab9790acb13c4c651c1933a22b5f0663ef22927120dd08cc8291d7e0912d8b1c36eb75cf661a64735042f8e81bbe42cb9ab310ca95bf8d36c44cb8835c901f",
};

interface FooterProps {
  className?: string;
}

export const Footer = ({ className = "" }: FooterProps): JSX.Element => {
  const { isOnline, isLoading, lastCheck, error, performHealthCheck } =
    useHealthCheck();
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  // Determine button styling based on health status
  const getStatusButtonClasses = (): string => {
    if (isLoading || isManualRefreshing) {
      return "bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white hover:from-yellow-600 hover:via-orange-600 hover:to-red-600";
    }
    if (isOnline) {
      return "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600";
    }
    return "bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white hover:from-red-600 hover:via-pink-600 hover:to-rose-600";
  };

  const getStatusText = (): string => {
    if (isManualRefreshing) return "🔄 refreshing...";
    if (isLoading) return "🟡 checking...";
    if (isOnline) return "🟢 online";
    return "🔴 offline";
  };

  const getStatusTooltip = (): string => {
    if (isManualRefreshing) return "Manually refreshing connection status...";
    if (isLoading) return "Checking connection status...";
    if (isOnline)
      return `Connected to gRPC server (Last check: ${lastCheck?.toLocaleTimeString()}) - Click to refresh`;
    return `Connection failed: ${error || "Unknown error"} (Last check: ${lastCheck?.toLocaleTimeString()}) - Click to retry`;
  };

  const handleStatusClick = async (): Promise<void> => {
    if (!isLoading && !isManualRefreshing) {
      setIsManualRefreshing(true);
      try {
        await performHealthCheck();
      } finally {
        setIsManualRefreshing(false);
      }
    }
  };

  return (
    <footer
      className={`bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-t border-blue-200 py-1 text-xs relative overflow-hidden ${className}`}
    >
      {/* Floating decorative elements */}
      <section className="absolute inset-0 pointer-events-none overflow-hidden">
        <section className="absolute top-2 left-1/4 w-8 h-8 bg-gradient-to-br from-blue-300/5 to-indigo-300/5 rounded-full blur-md animate-pulse delay-300"></section>
        <section className="absolute bottom-2 right-1/4 w-6 h-6 bg-gradient-to-br from-emerald-300/5 to-teal-300/5 rounded-full blur-md animate-pulse delay-700"></section>
        <section className="absolute top-1/2 left-1/3 w-4 h-4 bg-gradient-to-br from-purple-300/5 to-pink-300/5 rounded-full blur-md animate-pulse delay-1000"></section>
      </section>

      <section className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-4 sm:px-0 relative z-10">
        <nav className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            className={`${getStatusButtonClasses()} border-none text-xs px-4 py-2 h-auto font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-glow relative overflow-hidden group cursor-pointer`}
            onClick={handleStatusClick}
            title={getStatusTooltip()}
            disabled={isLoading || isManualRefreshing}
          >
            {/* Floating sparkle */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>

            {/* Glowing effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></span>

            <span className="relative z-10">{getStatusText()}</span>
          </Button>
          {lastCheck && (
            <span className="text-xs text-neutral-600 bg-white/40 backdrop-blur-sm px-2 py-1 rounded border border-neutral-200">
              Last: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <span className="text-neutral-800 text-xs font-medium bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-200 shadow-sm">
            version {getShortGitCommitHash()}
          </span>

          {/* Enhanced Info Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-neutral-800 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 p-2 h-auto text-xs font-semibold bg-white/60 backdrop-blur-sm rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 group"
              >
                <Info className="h-3 w-3 mr-1 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
                Info
                <ChevronDown className="ml-1 h-3 w-3 text-blue-500 group-hover:text-blue-600 transition-colors duration-300 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 card-gradient-blue border-2 border-blue-200 shadow-2xl rounded-xl p-2"
            >
              <DropdownMenuLabel className="text-blue-800 font-semibold text-center py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                🔍 System Information
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gradient-to-r from-blue-200 to-indigo-200" />
              <DropdownMenuItem
                asChild
                className="rounded-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer group"
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 w-full text-left p-2">
                      <Info className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
                      📊 Attestation Data
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200 shadow-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-blue-800 font-bold">
                        🔍 Attestation Data
                      </DialogTitle>
                    </DialogHeader>
                    <pre className="bg-white/80 backdrop-blur-sm p-4 rounded-xl text-sm overflow-auto border border-blue-200 shadow-inner">
                      <code className="text-neutral-900">
                        {JSON.stringify(attestationData, null, 2)}
                      </code>
                    </pre>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

      </section>
    </footer>
  );
};
