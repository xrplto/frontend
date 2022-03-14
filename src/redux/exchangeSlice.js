import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    rate: {
        USD:100,
        EUR:100,
        JPY:100,
        CNY:100
    },
    loading: false
}

export const exchangeSlice = createSlice({
    name: "exchange",
    initialState,
    reducers: {
        update_rate: (state, action) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the Immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.rate = action.payload;
        },
    },
});

export const { update_rate } = exchangeSlice.actions;

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched
export const incrementAsync = (amount) => (dispatch) => {
    setTimeout(() => {
        //dispatch(incrementByAmount(amount));
    }, 1000);
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectRate = (state) => state.exchange.rate;
export const selectLoading = (state) => state.exchange.loading;

export default exchangeSlice.reducer;
