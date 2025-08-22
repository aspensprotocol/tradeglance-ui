import { useConfig } from "../hooks/useConfig";
import { Layout } from "./Layout";
import type { Chain, Market } from "../protos/gen/arborter_config_pb";

export const ConfigTest = (): JSX.Element => {
  const { config, loading, error, refetch } = useConfig();

  if (loading) {
    return (
      <Layout scrollable>
        <article className="text-center py-8">
          <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 block"></span>
          <h2 className="text-xl font-bold mb-2">
            Loading Configuration...
          </h2>
          <p className="text-gray-600">
            Fetching configuration from backend...
          </p>
        </article>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout scrollable>
        <article className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
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
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </nav>
        </article>
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
  console.log("Config structure:", JSON.stringify(config, null, 2));
  console.log("Config type:", typeof config);
  console.log("Config chains:", config.chains);
  console.log("Config markets:", config.markets);
  console.log("Config chains length:", config.chains?.length);
  console.log("Config markets length:", config.markets?.length);

  return (
    <Layout scrollable>
      <article className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Arborter Configuration</h2>
        <button
          onClick={refetch}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Config
        </button>
      </article>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Chains ({config.chains.length})
        </h3>
        {config.chains.map((chain: Chain, index: number) => (
          <article key={index} className="border p-4 mb-3 rounded bg-white overflow-hidden">
            <section className="space-y-2">
              <p className="break-words">
                <strong>Network:</strong> {chain.network}
              </p>
              <p className="break-words">
                <strong>Chain ID:</strong> {chain.chainId}
              </p>
              <p className="break-all">
                <strong>RPC URL:</strong> <span className="text-xs sm:text-sm">{chain.rpcUrl}</span>
              </p>
              <p className="break-all">
                <strong>Service Address:</strong> <span className="text-xs sm:text-sm">{chain.serviceAddress}</span>
              </p>
              <p className="break-all">
                <strong>Trade Contract:</strong>{" "}
                <span className="text-xs sm:text-sm">{chain.tradeContract?.address || "Not configured"}</span>
              </p>
              <p className="break-words">
                <strong>Base or Quote:</strong>{" "}
                {chain.baseOrQuote || "Not set"}
              </p>
            </section>

            <section className="mt-4">
              <p>
                <strong>Tokens:</strong>
              </p>
              <nav className="ml-4 mt-2 space-y-1">
                {Object.entries(chain.tokens).map(([symbol, token]) => (
                  <p key={symbol} className="text-sm break-all">
                    <strong>{symbol}:</strong> <span className="text-xs">{token.address}</span> (Decimals: {token.decimals})
                  </p>
                ))}
              </nav>
            </section>
          </article>
        ))}
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Markets ({config.markets.length})
        </h3>
        {config.markets.map((market: Market, index: number) => (
          <article key={index} className="border p-4 mb-3 rounded bg-white overflow-hidden">
            <section className="space-y-2">
              <p className="break-words">
                <strong>Name:</strong> {market.name}
              </p>
              <p className="break-words">
                <strong>Slug:</strong> {market.slug}
              </p>
              <p className="break-words">
                <strong>Base Chain:</strong> {market.baseChainNetwork}
              </p>
              <p className="break-words">
                <strong>Quote Chain:</strong> {market.quoteChainNetwork}
              </p>
              <p className="break-words">
                <strong>Base Token:</strong> {market.baseChainTokenSymbol}
              </p>
              <p className="break-words">
                <strong>Quote Token:</strong> {market.quoteChainTokenSymbol}
              </p>
              <p className="break-all">
                <strong>Market ID:</strong>{" "}
                <span className="text-xs sm:text-sm">{market.marketId || "Not assigned"}</span>
              </p>
            </section>
          </article>
        ))}
      </section>
    </Layout>
  );
};
