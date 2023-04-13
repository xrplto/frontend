import { createSlice } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

const initialState = {
    metrics: {
        total: 0,
        USD:100,
        EUR:100,
        JPY:100,
        CNY:100,
        H24: {
            transactions24H: 0,
            tradedXRP24H: 0,
            tradedTokens24H: 0,
            activeAddresses24H: 0,
            totalAddresses: 0,
            totalOffers: 0,
            totalTrustLines: 0
        },
        global: {
            gMarketcap: 0, gMarketcapPro: 0,
            gDexVolume: 0, gDexVolumePro: 0,
            gScamVolume: 0, gScamVolumePro: 0,
            gStableVolume: 0, gStableVolumePro: 0,
            gXRPdominance: 0, gXRPdominancePro: 0
        },
    },
    filteredCount: 0
}

const statusSlice = createSlice({
    name: "status",
    initialState,
    reducers: {
        update_metrics: (state, action) => {
            const data = action.payload;
            const metrics = {
                total: data.total || 0,
                USD: data.exch?.USD || 100,
                EUR: data.exch?.EUR || 100,
                JPY: data.exch?.JPY || 100,
                CNY: data.exch?.CNY || 100,
                H24: data.H24 || initialState.metrics.H24,
                global: data.global || initialState.metrics.global,
            };
            Object.assign(state.metrics, metrics);
        },
        update_filteredCount: (state, action) => {
            const data = action.payload;
            state.filteredCount = data.count;
        }
    },
});

export const { update_metrics, update_filteredCount } = statusSlice.actions;

export const selectMetrics = (state) => state.status.metrics;
export const selectFilteredCount = (state) => state.status.filteredCount;

export function configureRedux(data) {
    let defaultState = initialState;
    if (data) {
        defaultState = {
            metrics: {
                total: data.total,
                USD: data.exch.USD,
                EUR: data.exch.EUR,
                JPY: data.exch.JPY,
                CNY: data.exch.CNY,
                H24: data.H24,
                global: data.global,
            },
            filteredCount: data.count
        }
    }

    const store = configureStore({
        reducer: {
            status: statusSlice.reducer
        },
        preloadedState: {status: defaultState}
    });

    return store;
}
