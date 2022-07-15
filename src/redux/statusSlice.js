import { createSlice } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

const initialState = {
    metrics: {
        count: 0,
        length: 0,
        USD:100,
        EUR:100,
        JPY:100,
        CNY:100,
        H24: [0, 0, 0, 0],
        global: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    accountData: {
        balance: {},
        offers:[]
    },
    refreshAccount: 0
}

const statusSlice = createSlice({
    name: "status",
    initialState,
    reducers: {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        update_metrics: (state, action) => {
            Object.assign(state.metrics, action.payload);
            // state.metrics = action.payload;
        },
        updateAccountData: (state, action) => {
            state.accountData = action.payload;
        },
        refreshAccountData: (state, action) => {
            state.refreshAccount++;
        },
    },
});

export const { update_metrics, updateAccountData, refreshAccountData } = statusSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectMetrics = (state) => state.status.metrics;
export const selectAccountData = (state) => state.status.accountData;
export const selectRefreshAccount = (state) => state.status.refreshAccount;

export function configureRedux(data) {
    let defaultState = initialState;
    if (data) {
        defaultState = {
            metrics: {
                count: data.count,
                length: data.length,
                USD: data.exch.USD,
                EUR: data.exch.EUR,
                JPY: data.exch.JPY,
                CNY: data.exch.CNY,
                H24: data.H24,
                global: data.global
            },
            accountData: {
                balance: {},
                offers:[]
            },
            refreshAccount: 0
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
