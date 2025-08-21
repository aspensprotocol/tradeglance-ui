
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useMaterialize } from "@/lib/materialize-utils";

const Home = () => {
  useMaterialize();

  return (
    <Layout footerPosition="fixed">
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md w-full">
          <div className="card">
            <div className="card-content">
              <span className="card-title center-align">Trade Glance</span>
              <div className="section">
                <Link to="/pro" className="block mb-4">
                  <a className="btn btn-large waves-effect waves-light teal w-full">
                    <i className="material-icons left">trending_up</i>
                    Pro
                  </a>
                </Link>
                <Link to="/simple" className="block mb-4">
                  <a className="btn btn-large waves-effect waves-light blue w-full">
                    <i className="material-icons left">speed</i>
                    Simple
                  </a>
                </Link>
                <Link to="/docs" className="block mb-4">
                  <a className="btn btn-large waves-effect waves-light green w-full">
                    <i className="material-icons left">description</i>
                    Docs
                  </a>
                </Link>
                <Link to="/mint" className="block mb-4">
                  <a className="btn btn-large waves-effect waves-light orange w-full">
                    <i className="material-icons left">toll</i>
                    Mint Test Tokens
                  </a>
                </Link>
                <Link to="/config" className="block">
                  <a className="btn btn-large waves-effect waves-light purple w-full">
                    <i className="material-icons left">settings</i>
                    Config
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
