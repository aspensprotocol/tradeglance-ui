import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useMediaQuery } from "react-responsive";

const Home = (): JSX.Element => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <Layout footerPosition="fixed">
      <main className="flex items-center justify-center h-full px-2 sm:px-4">
        <section className="max-w-md w-full space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-center text-xl sm:text-2xl md:text-3xl">
                Trade Glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
              {/* Hide Pro button on mobile */}
              {!isMobile && (
                <Link to="/pro" className="block">
                  <Button className="w-full py-3 sm:py-2" variant="outline">
                    Pro
                  </Button>
                </Link>
              )}
              <Link to="/simple" className="block">
                <Button className="w-full py-3 sm:py-2" variant="outline">
                  Simple
                </Button>
              </Link>
              <Link to="/docs" className="block">
                <Button className="w-full py-3 sm:py-2" variant="outline">
                  Docs
                </Button>
              </Link>
              <Link to="/mint" className="block">
                <Button className="w-full py-3 sm:py-2" variant="outline">
                  Mint Test Tokens
                </Button>
              </Link>
              <Link to="/config" className="block">
                <Button className="w-full py-3 sm:py-2" variant="outline">
                  Config
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </Layout>
  );
};

export default Home;
