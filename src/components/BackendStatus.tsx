import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { testGrpcConnection } from '@/lib/grpc-client';

interface BackendStatusProps {
  className?: string;
}

const BackendStatus = ({ className }: BackendStatusProps) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setStatus('checking');
        const result = await testGrpcConnection();
        
        if (result.success) {
          setStatus('connected');
          setError(null);
        } else {
          setStatus('disconnected');
          setError(result.error || 'Backend not available');
        }
      } catch (err) {
        setStatus('disconnected');
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Checking backend...</span>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <Badge variant="secondary" className="text-xs">
          Backend Connected
        </Badge>
      </div>
    );
  }

  return (
    <Alert className={`${className} border-orange-200 bg-orange-50`}>
      <AlertDescription className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        <span className="text-sm">
          Using mock data - Backend server not available
        </span>
      </AlertDescription>
    </Alert>
  );
};

export default BackendStatus; 