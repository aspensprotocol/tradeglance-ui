import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import the generated gRPC-Web client and proto files (CommonJS format)
import '../proto/grpc_web/arborter_pb.js';
import '../proto/grpc_web/arborter_grpc_web_pb.js';

// Access the global proto object
declare global {
  interface Window {
    proto: any;
  }
}

const GrpcWebStreamTest: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [orderbookData, setOrderbookData] = useState<any[]>([]);

  const startOrderbookStream = async () => {
    try {
      setIsStreaming(true);
      setMessages([]);
      setError(null);
      setOrderbookData([]);

      console.log('Starting orderbook stream...');
      setMessages(prev => [...prev, 'Starting orderbook stream...']);

      // Access the global proto object
      const proto = window.proto;
      if (!proto) {
        throw new Error('Proto object not found. Make sure the proto files are loaded.');
      }

      // Create the gRPC-Web client
      const ArborterServiceClient = proto.xyz?.aspens?.arborter?.v1?.ArborterServiceClient;
      const OrderbookRequest = proto.xyz?.aspens?.arborter?.v1?.OrderbookRequest;

      if (!ArborterServiceClient) {
        throw new Error('ArborterServiceClient not found');
      }

      if (!OrderbookRequest) {
        throw new Error('OrderbookRequest not found');
      }

      const arborterClient = new ArborterServiceClient('http://localhost:8083/grpc', null, null);

      // Create the request
      const request = new OrderbookRequest();
      request.setContinueStream(true);
      request.setMarketId("84532::0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9::11155420::0xbCF26943C0197d2eE0E5D05c716Be60cc2761508");
      request.setHistoricalOpenOrders(true);

      console.log('Request created:', request.toObject());
      setMessages(prev => [...prev, `Request created: ${JSON.stringify(request.toObject(), null, 2)}`]);

      // Start the stream
      const stream = arborterClient.orderbook(request, {});

      stream.on('data', (response: any) => {
        console.log('Orderbook data received:', response.toObject());
        const data = response.toObject();
        setOrderbookData(prev => [...prev, data]);
        setMessages(prev => [...prev, `Orderbook data: ${JSON.stringify(data, null, 2)}`]);
      });

      stream.on('error', (err: any) => {
        console.error('Stream error:', err);
        setError(`Stream error: ${err.message}`);
        setIsStreaming(false);
      });

      stream.on('end', () => {
        console.log('Stream ended');
        setMessages(prev => [...prev, 'Stream ended']);
        setIsStreaming(false);
      });

      stream.on('status', (status: any) => {
        console.log('Stream status:', status);
        setMessages(prev => [...prev, `Stream status: ${JSON.stringify(status, null, 2)}`]);
      });

    } catch (err: any) {
      console.error('Error starting stream:', err);
      setError(`Error: ${err.message}`);
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    setIsStreaming(false);
    setMessages(prev => [...prev, 'Stream stopped by user']);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>gRPC-Web Streaming Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={startOrderbookStream} 
              disabled={isStreaming}
              variant="default"
            >
              Start Orderbook Stream
            </Button>
            <Button 
              onClick={stopStream} 
              disabled={!isStreaming}
              variant="destructive"
            >
              Stop Stream
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Stream Messages:</h3>
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages yet. Click "Start Orderbook Stream" to begin.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                      {msg}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Orderbook Data ({orderbookData.length} items):</h3>
              {orderbookData.length === 0 ? (
                <p className="text-gray-500">No orderbook data received yet.</p>
              ) : (
                <div className="space-y-2">
                  {orderbookData.map((data, index) => (
                    <div key={index} className="text-sm font-mono bg-white p-2 rounded border">
                      <div className="font-bold">Order {index + 1}:</div>
                      <div>Price: {data.price}</div>
                      <div>Quantity: {data.quantity}</div>
                      <div>Side: {data.side}</div>
                      <div>Status: {data.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrpcWebStreamTest; 