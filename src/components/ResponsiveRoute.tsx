import React from "react";
import { useMediaQuery } from "react-responsive";
import { Navigate } from "react-router-dom";

interface ResponsiveRouteProps {
  children: React.ReactNode;
  hideOnMobile?: boolean;
  redirectTo?: string;
}

export const ResponsiveRoute = ({
  children,
  hideOnMobile = false,
  redirectTo = "/simple",
}: ResponsiveRouteProps): JSX.Element => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // If this route should be hidden on mobile and we're on mobile, redirect
  if (hideOnMobile && isMobile) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
