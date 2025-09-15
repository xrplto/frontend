// src/redux/store.js
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import statusReducer from './statusSlice';
import transactionReducer from './transactionSlice';

const rootReducer = combineReducers({
  status: statusReducer,
  transaction: transactionReducer
});

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production'
});

export default store;


export function configureRedux(data) {
  const preloadedState = data ? {
    status: {
      metrics: {
        USD: data.exch?.USD || 100,
        EUR: data.exch?.EUR || 100,
        JPY: data.exch?.JPY || 100,
        CNY: data.exch?.CNY || 100,
        XRP: 1,
        H24: data.H24 || {},
        global: {
          total: data.total || 0,
          ...data.global
        },
        tokenCreation: data.tokenCreation || []
      },
      filteredCount: data.count || 0,
      activeFiatCurrency: 'USD'
    }
  } : undefined;

  return configureStore({
    reducer: {
      status: statusReducer,
      transaction: transactionReducer
    },
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production'
  });
}
