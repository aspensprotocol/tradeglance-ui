import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { configService, arborterService, testGrpcConnection } from '@/lib/grpc-client';
import { Side, ExecutionType } from '../proto/generated/src/proto/arborter';

const GrpcTest = () => {
  const [configResult, setConfigResult] = useState<any>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await testGrpcConnection();
      setConnectionResult(result);
    } catch (error) {
      setConnectionResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetConfig = async () => {
    setLoading(true);
    try {
      const result = await configService.getConfig();
      setConfigResult(result);
    } catch (error) {
      setConfigResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSendOrder = async () => {
    setLoading(true);
    try {
      // Create a test order using the protobuf types
      const testOrder = {
        side: Side.SIDE_BID,
        quantity: '1000000000000000000', // 1 ETH in wei
        price: '2500000000000000000000000000000000000', // $2500 in pair decimals
        marketId: '84532::0x036CbD53842c5426634e7929541eC2318f3dCF7c::11155420::0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
        baseAccountAddress: '0x1234567890123456789012345678901234567890',
        quoteAccountAddress: '0x1234567890123456789012345678901234567890',
        executionType: ExecutionType.EXECUTION_TYPE_UNSPECIFIED,
        matchingOrderIds: []
      };

      const signatureHash = new Uint8Array(32); // Mock signature
      const result = await arborterService.sendOrder(testOrder, signatureHash);
      setOrderResult(result);
    } catch (error) {
      setOrderResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">gRPC Protobuf Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              Test gRPC Connection
            </Button>
            {connectionResult && (
              <pre className="mt-4 text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(connectionResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Config Service</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGetConfig} 
              disabled={loading}
              className="w-full"
            >
              Get Config
            </Button>
            {configResult && (
              <pre className="mt-4 text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                {JSON.stringify(configResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Service</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSendOrder} 
              disabled={loading}
              className="w-full"
            >
              Send Test Order
            </Button>
            {orderResult && (
              <pre className="mt-4 text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protobuf Types Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Side enum values:</strong>
              <ul className="ml-4">
                <li>SIDE_UNSPECIFIED: {Side.SIDE_UNSPECIFIED}</li>
                <li>SIDE_BID: {Side.SIDE_BID}</li>
                <li>SIDE_ASK: {Side.SIDE_ASK}</li>
              </ul>
            </div>
            <div>
              <strong>ExecutionType enum values:</strong>
              <ul className="ml-4">
                <li>EXECUTION_TYPE_UNSPECIFIED: {ExecutionType.EXECUTION_TYPE_UNSPECIFIED}</li>
                <li>EXECUTION_TYPE_DISCRETIONARY: {ExecutionType.EXECUTION_TYPE_DISCRETIONARY}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrpcTest; 