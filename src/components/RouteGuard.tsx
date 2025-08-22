import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps): JSX.Element {
  const location = useLocation();

  useEffect(() => {
    // Log route changes for debugging
    console.log("🔍 RouteGuard: Route changed to:", location.pathname);
  }, [location.pathname]);

  return <>{children}</>;
}
