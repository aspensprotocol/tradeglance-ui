interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps): JSX.Element {
  return <>{children}</>;
}
