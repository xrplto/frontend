// src/redux/store.js
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import statusReducer from "./statusSlice";
import { CookieStorage } from "redux-persist-cookie-storage";
import Cookies from "./customCookiesParser";
import { persistReducer, persistStore } from "redux-persist";

const persistConfig = {
  key: "root",
  storage: new CookieStorage(Cookies /*, options */),
};

const persistedReducer = persistReducer(persistConfig, combineReducers({
    status : statusReducer
}));

export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = globalThis.window ? persistStore(store) : store;
