import { useState, useEffect, useCallback } from "react";

interface HealthCheckResult {
  isOnline: boolean;
  isLoading: boolean;
  lastCheck: Date | null;
  error: string | null;
  performHealthCheck: () => Promise<void>;
}

// Extend Window interface for debugging functions
declare global {
  interface Window {
    testHealthCheck?: () => Promise<void>;
    getHealthStatus?: () => {
      isOnline: boolean;
      isLoading: boolean;
      lastCheck: Date | null;
      error: string | null;
    };
  }
}

export const useHealthCheck = (): HealthCheckResult => {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performHealthCheck = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the base URL from the current environment
      const baseUrl = import.meta.env.VITE_GRPC_WEB_PROXY_URL || "/api";

      // Only check the gRPC reflection endpoint - this is the real test
      const healthCheckUrls = [
        // Primary gRPC reflection endpoint
        `${baseUrl}/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo`,
      ];

      let success = false;
      let lastError = "";

      for (const url of healthCheckUrls) {
        try {
          // For gRPC reflection endpoint, try a proper reflection request
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Grpc-Timeout": "3S", // 3 second timeout
            },
            body: JSON.stringify({
              // Proper gRPC reflection request format
              message_request: {
                list_services: {},
              },
            }),
            // Set a reasonable timeout for health checks
            signal: AbortSignal.timeout(3000),
          });

          console.log(
            `Health check response: ${response.status} ${response.statusText}`,
          );

          if (response.ok) {
            // Try to parse the response to ensure it's actually a gRPC reflection response
            try {
              const responseText = await response.text();
              console.log(
                `Health check response body: ${responseText.substring(0, 200)}...`,
              );

              // More flexible check - look for various gRPC reflection response patterns
              const isGrpcReflectionResponse =
                // Standard gRPC reflection response
                (responseText.includes('"list_services_response"') &&
                  (responseText.includes('"services"') ||
                    responseText.includes('"service"'))) ||
                // Alternative response formats
                responseText.includes('"grpc.reflection"') ||
                responseText.includes('"ServerReflection"') ||
                responseText.includes('"reflection"') ||
                // Even an error response from gRPC means the server is reachable
                (responseText.includes('"error"') &&
                  (responseText.includes('"grpc"') ||
                    responseText.includes('"reflection"') ||
                    responseText.includes('"ServerReflection"'))) ||
                // Check if it's a valid JSON response (might be a different format)
                (responseText.trim().startsWith("{") &&
                  responseText.trim().endsWith("}"));

              if (isGrpcReflectionResponse) {
                success = true;
                // gRPC reflection endpoint responded correctly
                break;
              } else {
                // Fallback: if we get a 200 response but not gRPC format,
                // the server might be running but with different response format
                // Got 200 response but not gRPC format, checking if server is reachable

                // Try a simple ping test to see if the server is at least responding
                try {
                  const pingResponse = await fetch(url, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}),
                    signal: AbortSignal.timeout(2000),
                  });

                  if (pingResponse.ok) {
                    success = true;
                    // Server is responding (fallback ping test succeeded)
                    break;
                  }
                } catch {
                  // Fallback ping test failed
                }

                lastError = "Response doesn't look like valid gRPC reflection";
                console.log("Full response for debugging:", responseText);
              }
            } catch {
              lastError = "Failed to parse response";
            }
          } else {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            lastError = "Request timeout";
          } else {
            lastError = err instanceof Error ? err.message : "Request failed";
          }
        }
      }

      if (success) {
        setIsOnline(true);
        setLastCheck(new Date());
      } else {
        setIsOnline(false);
        setError(lastError);
        setLastCheck(new Date());
      }
    } catch (err) {
      setIsOnline(false);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setLastCheck(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Perform initial health check
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Set up periodic health checks every 10 seconds (more frequent for better responsiveness)
  useEffect(() => {
    const interval = setInterval(performHealthCheck, 10000);
    return () => clearInterval(interval);
  }, [performHealthCheck]);

  // Also perform health check when window regains focus
  useEffect(() => {
    const handleFocus = (): void => {
      performHealthCheck();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [performHealthCheck]);

  // Expose health check function globally for debugging - memoized to prevent recreation
  const debugFunctions = useCallback(() => {
    window.testHealthCheck = performHealthCheck;
    window.getHealthStatus = () => ({
      isOnline,
      isLoading,
      lastCheck,
      error,
    });
  }, [performHealthCheck, isOnline, isLoading, lastCheck, error]);

  useEffect(() => {
    debugFunctions();

    return () => {
      delete window.testHealthCheck;
      delete window.getHealthStatus;
    };
  }, [debugFunctions]);

  return {
    isOnline,
    isLoading,
    lastCheck,
    error,
    performHealthCheck, // Expose for manual refresh
  };
};
