import { useConfig } from "./useConfig";
import { Chain } from "../protos/gen/arborter_config_pb";

export const useChainNetwork = (): {
  getChainNetwork: (chainId: number | null) => string | null;
} => {
  const { config } = useConfig();

  const getChainNetwork = (chainId: number | null): string | null => {
    if (!chainId || !config || !config.chains) return null;

    const chain: Chain | undefined = config.chains.find((c: Chain) => {
      const configChainId: number =
        typeof c.chainId === "string" ? parseInt(c.chainId, 10) : c.chainId;
      return configChainId === chainId;
    });

    return chain?.network || null;
  };

  return { getChainNetwork };
};
