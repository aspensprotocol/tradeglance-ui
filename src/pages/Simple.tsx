import React from "react";
import { Layout } from "@/components/Layout";
import SimpleForm from "@/components/SimpleForm";
import { useTradingPairs } from "@/hooks/useTradingPairs";

const Simple = (): JSX.Element => {
  const { tradingPairs } = useTradingPairs();
  const defaultPair = tradingPairs[0];

  return (
    <Layout footerPosition="absolute">
      <main className="flex items-center justify-center h-full px-3 sm:px-4 lg:px-6 pb-0">
        <SimpleForm tradingPair={defaultPair} />
      </main>
    </Layout>
  );
};

export default Simple;
