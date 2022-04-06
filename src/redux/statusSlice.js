import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    status: {
        session:0,
        USD:100,
        EUR:100,
        JPY:100,
        CNY:100,
        token_count:0
    },
    reset: false
}

export const statusSlice = createSlice({
    name: "status",
    initialState,
    reducers: {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        update_status: (state, action) => {
            state.status = action.payload;
        },
        do_reset: (state, action) => {
            state.reset = action.payload;
        },
    },
});

export const { update_status, do_reset } = statusSlice.actions;

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
export const selectStatus = (state) => state.status.status;
export const selectReset = (state) => state.status.reset;

export default statusSlice.reducer;
