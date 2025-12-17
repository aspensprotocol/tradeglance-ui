import { Layout } from "@/components/Layout";
import { DocumentationViewer } from "@/components/DocumentationViewer";
import { MarkdownRenderer } from "@/lib/markdown-utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TypographyP } from "@/components/ui/typography";

// Import the README content from docs-source
import readmeContent from "../../docs-source/README.md?raw";

const Docs = (): JSX.Element => {
  const navigate = useNavigate();
  const content = readmeContent;

  return (
    <Layout scrollable>
      <main className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8 relative">
        {/* Floating decorative elements matching Pro view aesthetic */}
        <section className="absolute inset-0 pointer-events-none overflow-hidden">
          <section className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full blur-xl animate-pulse delay-300"></section>
          <section className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-teal-400/5 rounded-full blur-xl animate-pulse delay-700"></section>
          <section className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/5 to-pink-400/5 rounded-full blur-lg animate-pulse delay-1000"></section>
        </section>

        <DocumentationViewer>
          <MarkdownRenderer content={content} />
          <section className="mt-8 space-y-4">
            <TypographyP>
              Ready to start trading? Choose your preferred interface below.
            </TypographyP>
            <nav className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/trading")}
                className="px-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Trading
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/mint")}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Mint Test Tokens
              </Button>
            </nav>
          </section>
        </DocumentationViewer>
      </main>
    </Layout>
  );
};

export default Docs;
