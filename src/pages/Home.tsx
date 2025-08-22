import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useViewContext } from "@/hooks/useViewContext";

const Home = (): JSX.Element => {
  const navigate = useNavigate();
  const { setViewMode } = useViewContext();

  const handleProClick = (): void => {
    setViewMode("pro");
    navigate("/trading");
  };

  const handleSimpleClick = (): void => {
    setViewMode("simple");
    navigate("/trading");
  };

  return (
    <Layout footerPosition="fixed">
      <main className="flex items-center justify-center h-full">
        <section className="max-w-md w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Trade Glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleProClick}
              >
                Pro
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleSimpleClick}
              >
                Simple
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/docs")}
              >
                Docs
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/mint")}
              >
                Mint Test Tokens
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/config")}
              >
                Config
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </Layout>
  );
};

export default Home;
