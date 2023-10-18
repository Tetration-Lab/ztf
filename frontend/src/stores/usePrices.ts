import axios from "axios";
import { create } from "zustand";

interface IPricesStore {
  usd: { [denom: string]: number };
}

interface IPricesStoreAction {
  fetchPrice: () => Promise<void>;
  getPrice: (denom: string) => number;
}

export const usePrices = create<IPricesStore & IPricesStoreAction>(
  (set, get) => ({
    usd: {},
    fetchPrice: async () => {
      const result = await axios.get(
        "https://api.coinbase.com/v2/exchange-rates?currency=USD"
      );
      set({
        usd: result.data.data.rates,
      });
    },
    getPrice: (denom: string) => {
      const d = denom.toUpperCase();
      if (d === "SDAI") return 1.04;
      if (d === "WETH") return get().getPrice("ETH");
      const price = get().usd[d];
      return price ? 1 / price : 0;
    },
  })
);
