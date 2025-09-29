// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import statusReducer from './statusSlice';
import transactionReducer from './transactionSlice';

export function configureRedux(data) {
  const preloadedState = data
    ? {
        status: {
          metrics: {
            USD: data.exch?.USD || null,
            EUR: data.exch?.EUR || null,
            JPY: data.exch?.JPY || null,
            CNY: data.exch?.CNY || null,
            XRP: 1,
            H24: data.H24 || {},
            global: {
              total: data.total || 0,
              ...data.global
            },
            tokenCreation: data.tokenCreation || []
          },
          filteredCount: data.count || 0,
          activeFiatCurrency: 'XRP'
        }
      }
    : undefined;

  return configureStore({
    reducer: {
      status: statusReducer,
      transaction: transactionReducer
    },
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production'
  });
}
