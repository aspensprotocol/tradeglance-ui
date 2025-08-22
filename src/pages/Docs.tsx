import { Layout } from "@/components/Layout";
import { DocumentationViewer } from "@/components/DocumentationViewer";
import { MarkdownRenderer } from "@/lib/markdown-utils";
import { useState, useEffect } from "react";

const Docs = (): JSX.Element => {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the markdown content from the docs directory
    const loadDocumentation = async () => {
      setLoading(true);
      try {
        const response = await fetch("/docs/README.md");
        if (response.ok) {
          const content = await response.text();
          setMarkdownContent(content);
        } else {
          // Fallback content if README is not found
          setMarkdownContent(`# 📈 Aspens App Example Demo

## 📈 Cross chain + CLOBs + TEEs = 😀

This is a simple cross chain limit order dex built to demonstrate what is possible to build using [Aspens](https://aspens.xyz/), a protocol that aims to **make cross chain chill** 😎. In this example, we're showing a dex that trades across chains, with 2 different modes, i.e. [pro](/pro) or [simple](/simple). For more information of what aspens is, read our [docs](https://docs.aspens.xyz). Here's a video demonstration of how to use the dapp:




## 🚀 Aspens for builders

This is only one example of many that we envision can be built on Aspens. When you build with Aspens, you are in charge. You will have your own **AMS**, Aspens Market Stack, which includes:

1. A TEE, you can choose and customize the provider, that controls and executes orders, trade matching and configuration by you.
2. Deployed smart contracts on the chains you want to support.

Since Aspens order book logic is hosted within a TEE, we can support any chain, EVM or non-EVM. You choose the chains you want to support, and the token pairs you want, and Aspens will seamlessly have your market created for you. You have full customization and can create markets for **token A on chain A -> token A on chain B**, **token A on chain A -> token B on chain B** or **token A on chain A -> token B on chain A**.

Some examples we thought about that can be built on top of Aspens include:

- Bridges
- Limit order book controlled dexes
- Portfolio management
- Memecoin launcher
- Chain agnostic private transaction protocol

We're currently looking for partner projects, so if you're a builder, and this sounds interesting to you, please [reach out to us](https://t.me/aspens_xyz) 🔧`);
        }
      } catch (error) {
        console.error("Error loading documentation:", error);
        setMarkdownContent(
          "# Error Loading Documentation\n\nPlease check the docs/README.md file.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDocumentation();
  }, []);

  if (loading) {
    return (
      <Layout scrollable>
        <main className="flex items-center justify-center py-16">
          <section className="text-center">
            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4 block"></span>
            <p className="text-gray-600">Loading documentation...</p>
          </section>
        </main>
      </Layout>
    );
  }

  return (
    <Layout scrollable>
      <main className="max-w-4xl mx-auto py-4 sm:py-6 lg:py-8">
        <DocumentationViewer>
          <MarkdownRenderer content={markdownContent} />
        </DocumentationViewer>
      </main>
    </Layout>
  );
};

export default Docs;
