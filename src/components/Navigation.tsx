import { Link } from "react-router-dom";
import { WalletButton } from "./WalletButton";
import { useChainMonitor } from "@/hooks/useChainMonitor";
import { useChainNetwork } from "@/hooks/useChainNetwork";
import { useMaterialize } from "@/lib/materialize-utils";

interface NavigationProps {
  className?: string;
}

export const Navigation = ({ className = "" }: NavigationProps) => {
  const { currentChainId, isSupported } = useChainMonitor();
  const { getChainNetwork } = useChainNetwork();
  useMaterialize();

  return (
    <nav className="nav-wrapper teal">
      <div className="container">
        <Link to="/" className="brand-logo">
          <i className="material-icons">trending_up</i>
          TradeGlance
        </Link>
        
        {/* Desktop Navigation */}
        <ul id="nav-mobile" className="right hide-on-med-and-down">
          <li><Link to="/pro">Pro</Link></li>
          <li><Link to="/simple">Simple</Link></li>
          <li><Link to="/docs">Docs</Link></li>
          <li>
            {currentChainId && (
              <span className={`chip ${isSupported ? 'green lighten-4' : 'red lighten-4'}`}>
                {isSupported ? '✅' : '❌'} {getChainNetwork(currentChainId) || currentChainId}
              </span>
            )}
          </li>
          <li><WalletButton /></li>
        </ul>

        {/* Mobile Navigation Trigger */}
        <a href="#" data-target="mobile-demo" className="sidenav-trigger">
          <i className="material-icons">menu</i>
        </a>
      </div>

      {/* Mobile Sidenav */}
      <ul className="sidenav" id="mobile-demo">
        <li><Link to="/pro">Pro</Link></li>
        <li><Link to="/simple">Simple</Link></li>
        <li><Link to="/docs">Docs</Link></li>
        <li><div className="divider"></div></li>
        <li>
          {currentChainId && (
            <div className={`chip ${isSupported ? 'green lighten-4' : 'red lighten-4'}`}>
              {isSupported ? '✅' : '❌'} {getChainNetwork(currentChainId) || currentChainId}
            </div>
          )}
        </li>
        <li><WalletButton /></li>
      </ul>
    </nav>
  );
}; 