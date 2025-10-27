import { useConfig } from "../hooks/useConfig";
import { Layout } from "./Layout";
import type { Chain, Market } from "../protos/gen/arborter_config_pb";

export const ConfigTest = (): JSX.Element => {
  const { config, loading, error, refetch } = useConfig();

  if (loading) {
    return (
      <Layout scrollable>
        <main className="text-center py-8 relative">
          {/* Floating decorative elements matching Pro view aesthetic */}
          <section className="absolute inset-0 pointer-events-none overflow-hidden">
            <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-300"></section>
            <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse delay-700"></section>
            <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse delay-1000"></section>
          </section>

          <article className="text-center relative z-10">
            <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 block"></span>
            <h2 className="text-xl font-bold mb-2">Loading Configuration...</h2>
            <p className="text-gray-600">
              Fetching configuration from backend...
            </p>
          </article>
        </main>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout scrollable>
        <main className="relative">
          {/* Floating decorative elements matching Pro view aesthetic */}
          <section className="absolute inset-0 pointer-events-none overflow-hidden">
            <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
            <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
            <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-lg animate-pulse delay-1000"></section>
          </section>

          <article className="bg-gradient-to-br from-red-50 via-white to-red-100 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8 relative z-10 shadow-lg">
            <h2 className="text-xl font-bold text-red-800 mb-4">
              Configuration Error
            </h2>
            <section className="text-red-700 mb-4">
              <p className="mb-2">
                <strong>Error:</strong> {error}
              </p>
              <p className="text-sm">This usually means:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>The backend service is not running</li>
                <li>There's a network connectivity issue</li>
                <li>The gRPC endpoint is not accessible</li>
                <li>There's a configuration issue with the backend</li>
              </ul>
            </section>
            <nav className="flex gap-3">
              <button
                onClick={refetch}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Reload Page
              </button>
            </nav>
          </article>
        </main>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout scrollable>
        <article className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            No Configuration Data
          </h2>
          <p className="text-yellow-700 mb-4">
            The configuration was loaded but contains no data. This might
            indicate:
          </p>
          <ul className="list-disc list-inside text-yellow-700 text-sm mb-4 space-y-1">
            <li>The backend service is running but has no configuration</li>
            <li>There's an issue with the configuration format</li>
            <li>The backend needs to be initialized</li>
          </ul>
          <button
            onClick={refetch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </article>
      </Layout>
    );
  }

  if (!config.chains || !config.markets) {
    return (
      <Layout scrollable>
        <article className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            Incomplete Configuration
          </h2>
          <section className="text-yellow-700 mb-4">
            <p className="mb-2">Configuration structure is incomplete:</p>
            <section className="grid grid-cols-2 gap-4 text-sm">
              <span>
                <span className="text-yellow-600">Chains:</span>{" "}
                {config.chains ? config.chains.length : "Missing"}
              </span>
              <span>
                <span className="text-yellow-600">Markets:</span>{" "}
                {config.markets ? config.markets.length : "Missing"}
              </span>
            </section>
          </section>
          <button
            onClick={refetch}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </article>
      </Layout>
    );
  }

  // Debug: Log the config structure

  return (
    <Layout scrollable>
      <main className="relative">
        {/* Floating decorative elements matching Pro view aesthetic */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-lg animate-pulse delay-1000"></section>
        </section>

        <article className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-xl font-bold text-neutral-900">
            Arborter Configuration
          </h2>
          <button
            onClick={refetch}
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-glow relative overflow-hidden group"
          >
            {/* Floating sparkle */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></span>

            {/* Glowing effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></span>

            <span className="relative z-10 font-bold">🔄 Refresh Config</span>
          </button>
        </article>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-neutral-900">
            🔗 Chains ({config.chains.length})
          </h3>
          {config.chains.map((chain: Chain, index: number) => (
            <article
              key={index}
              className="bg-gradient-to-r from-white via-blue-50/10 to-indigo-50/10 border-2 border-blue-200/50 p-4 mb-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden animate-pulse-glow"
            >
              {/* Enhanced hover effect overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-indigo-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

              {/* Floating sparkles on hover */}
              <span className="absolute -top-1 -left-1 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping transition-all duration-300 pointer-events-none"></span>
              <span className="absolute -top-1 -right-1 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping delay-300 transition-all duration-300 pointer-events-none"></span>
              <section className="space-y-2 relative z-10">
                <p className="break-words text-neutral-900">
                  <strong>🌐 Network:</strong> {chain.network}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>🔗 Chain ID:</strong> {chain.chainId}
                </p>
                <p className="break-all text-neutral-900">
                  <strong>🔌 RPC URL:</strong>{" "}
                  <span className="text-xs sm:text-sm">{chain.rpcUrl}</span>
                </p>
                <p className="break-all text-neutral-900">
                  <strong>🏢 Service Address:</strong>{" "}
                  <span className="text-xs sm:text-sm">
                    {chain.serviceAddress}
                  </span>
                </p>
                <p className="break-all text-neutral-900">
                  <strong>📝 Trade Contract:</strong>{" "}
                  <span className="text-xs sm:text-sm">
                    {chain.tradeContract?.address || "Not configured"}
                  </span>
                </p>
                <p className="break-words text-neutral-900">
                  <strong>⚖️ Base or Quote:</strong>{" "}
                  <span className="text-amber-600">
                    {chain.baseOrQuote ? `Legacy: ${chain.baseOrQuote}` : "Not set"} 
                    <br />
                    <span className="text-xs">(Now determined by market configuration)</span>
                  </span>
                </p>
              </section>

              <section className="mt-4 relative z-10">
                <p className="text-neutral-900">
                  <strong>🪙 Tokens:</strong>
                </p>
                <nav className="ml-4 mt-2 space-y-1">
                  {Object.entries(chain.tokens).map(([symbol, token]) => (
                    <p
                      key={symbol}
                      className="text-sm break-all text-neutral-900"
                    >
                      <strong>{symbol}:</strong>{" "}
                      <span className="text-xs">{token.address}</span>{" "}
                      (Decimals: {token.decimals})
                    </p>
                  ))}
                </nav>
              </section>
            </article>
          ))}
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-neutral-900">
            📊 Markets ({config.markets.length})
          </h3>
          {config.markets.map((market: Market, index: number) => (
            <article
              key={index}
              className="bg-gradient-to-r from-white via-emerald-50/10 to-teal-50/10 border-2 border-emerald-200/50 p-4 mb-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group relative overflow-hidden animate-pulse-glow"
            >
              {/* Enhanced hover effect overlay */}
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-teal-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></span>

              {/* Floating sparkles on hover */}
              <span className="absolute -top-1 -left-1 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping transition-all duration-300 pointer-events-none"></span>
              <span className="absolute -top-1 -right-1 w-1 h-1 bg-teal-400 rounded-full opacity-0 group-hover:opacity-75 group-hover:animate-ping delay-300 transition-all duration-300 pointer-events-none"></span>
              <section className="space-y-2 relative z-10">
                <p className="break-words text-neutral-900">
                  <strong>📝 Name:</strong> {market.name}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>🏷️ Slug:</strong> {market.slug}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>🔗 Base Chain:</strong> {market.baseChainNetwork}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>🔗 Quote Chain:</strong> {market.quoteChainNetwork}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>🪙 Base Token:</strong> {market.baseChainTokenSymbol}
                </p>
                <p className="break-words text-neutral-900">
                  <strong>💎 Quote Token:</strong>{" "}
                  {market.quoteChainTokenSymbol}
                </p>
                <p className="break-all text-neutral-900">
                  <strong>🆔 Market ID:</strong>{" "}
                  <span className="text-xs sm:text-sm">
                    {market.marketId || "Not assigned"}
                  </span>
                </p>
              </section>
            </article>
          ))}
        </section>
      </main>
    </Layout>
  );
};
