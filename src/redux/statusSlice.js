import { createSlice, createSelector } from '@reduxjs/toolkit';
import { currencyConfig } from 'src/utils/constants';

const initialState = {
  metrics: {
    USD: 100,
    EUR: 100,
    JPY: 100,
    CNY: 100,
    XRP: 1,
    H24: {
      transactions24H: 0,
      tradedXRP24H: 0,
      tradedTokens24H: 0,
      activeAddresses24H: 0,
      totalTVL: 0,
      uniqueTraders24H: 0
    },
    global: {
      total: 0,
      gMarketcap: 0,
      gMarketcapPro: 0,
      gDexVolume: 0,
      gDexVolumePro: 0,
      gScamVolume: 0,
      gScamVolumePro: 0,
      gStableVolume: 0,
      gStableVolumePro: 0,
      gXRPdominance: 0,
      gXRPdominancePro: 0,
      sentimentScore: 0,
      totalAddresses: 0,
      totalOffers: 0,
      totalTrustLines: 0
    },
    tokenCreation: []
  },
  filteredCount: 0,
  activeFiatCurrency: currencyConfig.activeFiatCurrency
};

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    update_metrics: (state, action) => {
      const data = action.payload;
      state.metrics.global.total = data.total || 0;
      state.metrics.USD = data.exch?.USD || 100;
      state.metrics.EUR = data.exch?.EUR || 100;
      state.metrics.JPY = data.exch?.JPY || 100;
      state.metrics.CNY = data.exch?.CNY || 100;
      state.metrics.XRP = 1;
      state.metrics.H24 = data.H24 || initialState.metrics.H24;
      state.metrics.global = { ...state.metrics.global, ...data.global };
      state.metrics.tokenCreation = data.tokenCreation || state.metrics.tokenCreation;
    },
    update_filteredCount: (state, action) => {
      const data = action.payload;
      state.filteredCount = data.count;
    },
    update_activeCurrency: (state, action) => {
      const data = action.payload;
      state.activeFiatCurrency = data.activeFiatCurrency;
    }
  }
});

export const { update_metrics, update_filteredCount, update_activeCurrency } = statusSlice.actions;

// Simple selectors (no memoization needed for basic property access)
export const selectMetrics = (state) => state.status.metrics;
export const selectFilteredCount = (state) => state.status.filteredCount;
export const selectActiveFiatCurrency = (state) => state.status.activeFiatCurrency;
export const selectTokenCreation = (state) => state.status.metrics.tokenCreation;
export const selectGlobalMetrics = (state) => state.status.metrics.global;

// Memoized selector only for computed values
export const selectExchangeRate = createSelector(
  [selectMetrics, (state, currency) => currency],
  (metrics, currency) => metrics[currency] || 1
);

export default statusSlice.reducer;
