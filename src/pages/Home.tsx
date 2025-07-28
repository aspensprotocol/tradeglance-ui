
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen bg-neutral-soft/30 relative pb-12">
      <div className="container py-8">
        <div className="max-w-md mx-auto space-y-6">
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
      
      <Footer className="fixed bottom-0 left-0 right-0" />
    </div>
  );
};

export default Home;
