import axios from "axios";
import { create } from "zustand";

interface IPricesStore {
  ethUsd: number;
}

interface IPricesStoreAction {
  fetchPrice: () => Promise<void>;
}

export const usePrices = create<IPricesStore & IPricesStoreAction>((set) => ({
  ethUsd: 0,
  fetchPrice: async () => {
    const result = await axios.get(
      "https://api.coinbase.com/v2/exchange-rates?currency=ETH"
    );
    set({ ethUsd: result.data.data.rates.USD });
  },
}));
