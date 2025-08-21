import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, BookOpen, Coins } from "lucide-react";

const Home = (): JSX.Element => {
  return (
    <main className="flex items-center justify-center h-full px-2 sm:px-4">
      <section className="max-w-md w-full space-y-4 sm:space-y-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome to Trade Glance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-sm sm:text-base">
              Your gateway to cross-chain trading with advanced order management
              and real-time market data.
            </p>

            <nav className="grid gap-3">
              <Link to="/pro">
                <Button className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Pro Trading
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/simple">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Simple Trading
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/docs">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Documentation
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </nav>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Home;
