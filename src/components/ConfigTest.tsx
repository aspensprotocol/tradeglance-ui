import React from 'react';
import { useConfig } from '../hooks/useConfig';
import { Navigation } from './Navigation';

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

  if (!config.chains || !config.markets) {
    return (
      <div>
        <div>Config structure is incomplete</div>
        <div>Chains: {config.chains ? 'present' : 'missing'}</div>
        <div>Markets: {config.markets ? 'present' : 'missing'}</div>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  // Debug: Log the config structure
  console.log('Config structure:', JSON.stringify(config, null, 2));
  console.log('Config type:', typeof config);
  console.log('Config chains:', config.chains);
  console.log('Config markets:', config.markets);
  console.log('Config chains length:', config.chains?.length);
  console.log('Config markets length:', config.markets?.length);

  return (
    <div className="min-h-screen bg-neutral-soft/30">
      <div className="container mx-auto">
        <div className="p-4">
          <Navigation />
        </div>
        
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Arborter Config</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Chains ({config.chains.length})</h3>
        {config.chains.map((chain, index) => (
          <div key={index} className="border p-3 mb-2 rounded">
            <div><strong>Network:</strong> {chain.network}</div>
            <div><strong>Chain ID:</strong> {chain.chainId}</div>
            <div><strong>RPC URL:</strong> {chain.rpcUrl}</div>
            <div><strong>Service Address:</strong> {chain.serviceAddress}</div>
            <div><strong>Trade Contract:</strong> {chain.tradeContract.address}</div>
            {chain.explorerUrl && (
              <div>
                <strong>Scanner:</strong> <a href={chain.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{chain.explorerUrl}</a>
              </div>
            )}
            <div><strong>Tokens:</strong> {Object.keys(chain.tokens).length}</div>
            {Object.entries(chain.tokens).map(([symbol, token]) => (
              <div key={symbol} className="ml-4 mt-1">
                <div><strong>{symbol}:</strong> {token.address} (decimals: {token.decimals})</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Markets ({config.markets.length})</h3>
        {config.markets.map((market, index) => (
          <div key={index} className="border p-3 mb-2 rounded">
            <div><strong>Name:</strong> {market.name}</div>
            <div><strong>Slug:</strong> {market.slug}</div>
            <div><strong>Base Chain:</strong> {market.baseChainNetwork}</div>
            <div><strong>Quote Chain:</strong> {market.quoteChainNetwork}</div>
            <div><strong>Base Token:</strong> {market.baseChainTokenSymbol}</div>
            <div><strong>Quote Token:</strong> {market.quoteChainTokenSymbol}</div>
            <div><strong>Market ID:</strong> {market.marketId}</div>
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
      </div>
    </div>
  );
}; 