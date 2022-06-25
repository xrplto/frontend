import { createSlice } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

const initialState = {
    metrics: {
        session:0,
        USD:100,
        EUR:100,
        JPY:100,
        CNY:100,
        token_count:0,
        filter_count:0,
        transactions24H: 0,
        tradedXRP24H: 0,
        tradedTokens24H: 0,
        timeCalc24H: 0,
        timeSchedule: 0,
        countApiCall: 0,
        timeTokens: 0
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
                session: 0,
                USD: data.exch.USD,
                EUR: data.exch.EUR,
                JPY: data.exch.JPY,
                CNY: data.exch.CNY,
                token_count: data.token_count,
                filter_count: data.filter_count,
                transactions24H: data.transactions24H,
                tradedXRP24H: data.tradedXRP24H,
                tradedTokens24H: data.tradedTokens24H,
                timeCalc24H: data.timeCalc24H,
                timeSchedule: data.timeSchedule,
                countApiCall: data.countApiCall,
                timeTokens: data.took
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
