import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { configService, testGrpcConnection } from '@/lib/grpc-client';

export default function GrpcWebTest() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    
    try {
      const isConnected = await testGrpcConnection();
      if (isConnected) {
        setConnectionStatus('success');
        
        // Test getting config
        try {
          const configResponse = await configService.getConfig();
          setConfig(configResponse);
        } catch (configError) {
          console.warn('Config fetch failed:', configError);
        }
        
        // Test getting version
        try {
          const versionResponse = await configService.getVersion();
          setVersion(versionResponse);
        } catch (versionError) {
          console.warn('Version fetch failed:', versionError);
        }
      } else {
        setConnectionStatus('error');
        setError('Failed to connect to gRPC service');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  useEffect(() => {
    // Auto-test on component mount
    testConnection();
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'testing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success': return 'Connected';
      case 'error': return 'Failed';
      case 'testing': return 'Testing...';
      default: return 'Idle';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>gRPC-Web Proxy Test</CardTitle>
          <CardDescription>
            Test the connection to your arborter service through the gRPC-Web proxy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Button 
              onClick={testConnection} 
              disabled={connectionStatus === 'testing'}
              variant="outline"
              size="sm"
            >
              Test Connection
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {connectionStatus === 'success' && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">
                  ✅ Successfully connected to arborter service via gRPC-Web proxy!
                </p>
              </div>

              {version && (
                <div>
                  <h4 className="font-medium mb-2">Version Info:</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(version, null, 2)}
                  </pre>
                </div>
              )}

              {config && (
                <div>
                  <h4 className="font-medium mb-2">Configuration:</h4>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p><strong>Proxy URL:</strong> {process.env.REACT_APP_GRPC_WEB_PROXY_URL || 'http://localhost:8083/grpc'}</p>
            <p><strong>Target Service:</strong> localhost:50051</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 