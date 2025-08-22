import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = (): JSX.Element => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <section className="text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-6xl font-bold text-gray-900 mb-4">
              404
            </CardTitle>
            <h1 className="text-2xl font-semibold text-gray-700 mb-2">
              Page Not Found
            </h1>
            <p className="text-gray-500">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default NotFound;
