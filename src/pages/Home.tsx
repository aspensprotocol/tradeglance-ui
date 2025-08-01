
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";

const Home = () => {
  return (
    <Layout footerPosition="fixed">
      <div className="flex items-center justify-center h-full">
        <div className="max-w-md w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Trade Glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/pro" className="block">
                <Button className="w-full" variant="outline">
                  Pro
                </Button>
              </Link>
              <Link to="/simple" className="block">
                <Button className="w-full" variant="outline">
                  Simple
                </Button>
              </Link>
              <Link to="/docs" className="block">
                <Button className="w-full" variant="outline">
                  Docs
                </Button>
              </Link>
              <Link to="/mint" className="block">
                <Button className="w-full" variant="outline">
                  Mint Test Tokens
                </Button>
              </Link>
              <Link to="/config" className="block">
                <Button className="w-full" variant="outline">
                  Config
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
