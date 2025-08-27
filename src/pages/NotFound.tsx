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
            <CardTitle className="text-5xl font-bold text-neutral-900 mb-4">
              404 - Page Not Found
            </CardTitle>
            <h1 className="text-xl font-semibold text-neutral-800 mb-2">
              Oops! The page you're looking for doesn't exist.
            </h1>
            <p className="text-neutral-600 text-sm">
              Please check the URL or navigate back to the homepage.
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
