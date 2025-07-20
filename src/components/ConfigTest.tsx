import React from 'react';
import { useConfig } from '../hooks/useConfig';
import { Configuration, Chain, Market, Token } from '../proto/generated/src/proto/arborter_config';

export const ConfigTest: React.FC = () => {
  const { config, loading, error, refetch } = useConfig();

  if (loading) {
    return <div>Loading config...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error: {error}</div>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!config) {
    return <div>No config data</div>;
  }

  // Debug: Log the config structure
  console.log('Config structure:', JSON.stringify(config, null, 2));

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Arborter Config</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Chains ({config.chains?.length || 0})</h3>
        {config.chains?.map((chain: any, index) => (
          <div key={index} className="border p-3 mb-2 rounded">
            <div><strong>Network:</strong> {chain.network}</div>
            <div><strong>Chain ID:</strong> {chain.chainId || chain.chain_id}</div>
            <div><strong>RPC URL:</strong> {chain.rpcUrl || chain.rpc_url}</div>
            <div><strong>Service Address:</strong> {chain.serviceAddress || chain.service_address}</div>
            {chain.tradeContract && (
              <div><strong>Trade Contract:</strong> {chain.tradeContract.address}</div>
            )}
            <div><strong>Tokens:</strong> {Object.keys(chain.tokens || {}).length}</div>
            {chain.tokens && Object.entries(chain.tokens).map(([symbol, token]) => (
              <div key={symbol} className="ml-4 mt-1">
                <div><strong>{symbol}:</strong> {(token as any).address} (decimals: {(token as any).decimals})</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Markets ({config.markets?.length || 0})</h3>
        {config.markets?.map((market: any, index) => (
          <div key={index} className="border p-3 mb-2 rounded">
            <div><strong>Name:</strong> {market.name}</div>
            <div><strong>Slug:</strong> {market.slug}</div>
            <div><strong>Base Chain:</strong> {market.baseChainNetwork || market.base_chain_network}</div>
            <div><strong>Quote Chain:</strong> {market.quoteChainNetwork || market.quote_chain_network}</div>
            <div><strong>Base Token:</strong> {market.baseChainTokenSymbol || market.base_chain_token_symbol}</div>
            <div><strong>Quote Token:</strong> {market.quoteChainTokenSymbol || market.quote_chain_token_symbol}</div>
            <div><strong>Market ID:</strong> {market.marketId || market.market_id}</div>
          </div>
        ))}
      </div>

      <button 
        onClick={refetch}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Config
      </button>
    </div>
  );
}; 