import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';
import { useConfig, useOrderService, useOrderbookStream, useTradesStream, useConfigService } from '../hooks/useGrpcService';

export const GrpcExample: React.FC = () => {
  const { toast } = useToast();
  const [marketId, setMarketId] = useState('1::0x123::2::0x456'); // Example market ID
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [baseAccountAddress, setBaseAccountAddress] = useState('0x1234567890123456789012345678901234567890');
  const [quoteAccountAddress, setQuoteAccountAddress] = useState('0x0987654321098765432109876543210987654321');
  const [token] = useState('your-auth-token'); // In real app, get from auth context

  // Configuration hook
  const { data: config, loading: configLoading, error: configError, refetch: refetchConfig } = useConfig(token);

  // Order service hook
  const { sendOrder, cancelOrder, loading: orderLoading, error: orderError } = useOrderService(token);

  // Orderbook stream
  const { entries: orderbookEntries, error: orderbookError } = useOrderbookStream(marketId, token);

  // Trades stream
  const { trades, error: tradesError } = useTradesStream(marketId, token);

  // Config service hook
  const { addMarket, deleteMarket, deployContract, loading: configServiceLoading, error: configServiceError } = useConfigService(token);

  const handleSendOrder = async (side: 'bid' | 'ask') => {
    if (!quantity || !price) {
      toast({
        title: 'Error',
        description: 'Please enter quantity and price',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In a real app, you would generate a proper signature hash
      const signatureHash = new Uint8Array(32); // Placeholder
      
      const result = await sendOrder({
        side,
        quantity,
        price,
        marketId,
        baseAccountAddress,
        quoteAccountAddress,
        executionType: 'direct',
      }, signatureHash);

      toast({
        title: 'Order Sent',
        description: `Order ${result.orderInBook ? 'added to book' : 'filled immediately'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send order',
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      // In a real app, you would generate a proper signature hash
      const signatureHash = new Uint8Array(32); // Placeholder
      
      const result = await cancelOrder(
        marketId,
        'bid', // You'd get this from the order
        '0x123', // Token address
        orderId,
        signatureHash
      );

      if (result.orderCanceled) {
        toast({
          title: 'Order Cancelled',
          description: 'Order cancelled successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Order not found or already cancelled',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel order',
        variant: 'destructive',
      });
    }
  };

  const handleAddMarket = async () => {
    try {
      const result = await addMarket({
        baseChainNetwork: 'base-sepolia',
        quoteChainNetwork: 'op-sepolia',
        baseChainTokenSymbol: 'USDC',
        quoteChainTokenSymbol: 'USDC',
        baseChainTokenAddress: '0x1234567890123456789012345678901234567890',
        quoteChainTokenAddress: '0x0987654321098765432109876543210987654321',
        baseChainTokenDecimals: 6,
        quoteChainTokenDecimals: 6,
        pairDecimals: 6,
      });

      if (result.success) {
        toast({
          title: 'Market Added',
          description: 'New market added successfully',
        });
        refetchConfig();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add market',
        variant: 'destructive',
      });
    }
  };

  const handleDeployContract = async () => {
    try {
      const result = await deployContract('base-sepolia', 'base');
      toast({
        title: 'Contract Deployed',
        description: `Base: ${result.baseAddress}, Quote: ${result.quoteAddress}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to deploy contract',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Arborter gRPC Interface</h1>
      
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>System configuration and markets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading && <div>Loading configuration...</div>}
          {configError && <div className="text-red-500">Error: {configError}</div>}
          
          {config && (
            <div className="space-y-4">
              <div>
                <Label>Chains: {config.chains.length}</Label>
                <div className="text-sm text-gray-500">
                  {config.chains.map(chain => chain.network).join(', ')}
                </div>
              </div>
              <div>
                <Label>Markets: {config.markets.length}</Label>
                <div className="text-sm text-gray-500">
                  {config.markets.map(market => market.name).join(', ')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMarket} disabled={configServiceLoading}>
                  {configServiceLoading ? 'Adding...' : 'Add Market'}
                </Button>
                <Button onClick={handleDeployContract} disabled={configServiceLoading}>
                  {configServiceLoading ? 'Deploying...' : 'Deploy Contract'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Section */}
      <Card>
        <CardHeader>
          <CardTitle>Send Order</CardTitle>
          <CardDescription>Place buy or sell orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marketId">Market ID</Label>
              <Input
                id="marketId"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
                placeholder="1::0x123::2::0x456"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1000000"
                step="1"
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1000000"
                step="1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleSendOrder('bid')}
                disabled={orderLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {orderLoading ? 'Sending...' : 'Buy'}
              </Button>
              <Button
                onClick={() => handleSendOrder('ask')}
                disabled={orderLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {orderLoading ? 'Sending...' : 'Sell'}
              </Button>
            </div>
          </div>
          
          {orderError && (
            <div className="text-red-500">Error: {orderError}</div>
          )}
        </CardContent>
      </Card>

      {/* Orderbook Section */}
      <Card>
        <CardHeader>
          <CardTitle>Orderbook Stream</CardTitle>
          <CardDescription>Real-time orderbook updates for {marketId}</CardDescription>
        </CardHeader>
        <CardContent>
          {orderbookError && <div className="text-red-500">Stream Error: {orderbookError}</div>}
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {orderbookEntries.slice(-10).map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-semibold">
                    {entry.side === 'bid' ? 'BID' : 'ASK'} #{entry.orderId}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()} - {entry.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${parseFloat(entry.price) / 1000000}</div>
                  <div className="text-sm">Qty: {parseFloat(entry.quantity) / 1000000}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trades Section */}
      <Card>
        <CardHeader>
          <CardTitle>Trades Stream</CardTitle>
          <CardDescription>Real-time trade updates for {marketId}</CardDescription>
        </CardHeader>
        <CardContent>
          {tradesError && <div className="text-red-500">Stream Error: {tradesError}</div>}
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {trades.slice(-10).map((trade, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <div className="font-semibold">Trade #{trade.orderHit}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${parseFloat(trade.price) / 1000000}</div>
                  <div className="text-sm">Qty: {parseFloat(trade.qty) / 1000000}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 