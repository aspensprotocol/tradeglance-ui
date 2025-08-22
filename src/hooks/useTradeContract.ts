import { configUtils } from "../lib/config-utils";
import type { Chain } from "../protos/gen/arborter_config_pb";
import type { TradingPair } from "../lib/shared-types";

export const useTradeContracts = (): {
  getAllChains: () => Chain[];
  getTradingPairs: () => TradingPair[];
} => {
  const getAllChains = (): Chain[] => {
    const chains: Chain[] = configUtils.getAllChains();
    return chains;
  };

  const getTradingPairs = (): TradingPair[] => {
    // This would return trading pairs if needed
    return [];
  };

  return {
    getAllChains,
    getTradingPairs,
  };
};
