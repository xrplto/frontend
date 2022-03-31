import { createSlice } from "@reduxjs/toolkit";
import { fPercent } from '../utils/formatNumber';
import { update_status } from "../redux/statusSlice";

import axios from 'axios'

const initialState = {
    content:{
        page: 0,
        order: 'desc',
        orderBy: 'marketcap',
        rowsPerPage: 100,
        tokens: []
    },
    offset: 0
}

export const tokenSlice = createSlice({
    name: "token",
    initialState,
    reducers: {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        setOffset: (state, action) => {
            state.offset = action.payload;
        },
        setPage: (state, action) => {
            state.content.page = action.payload;
        },
        setRowsPerPage: (state, action) => {
            state.content.rowsPerPage = action.payload;
        },
        setOrder: (state, action) => {
            state.content.order = action.payload;
        },
        setOrderBy: (state, action) => {
            state.content.orderBy = action.payload;
        },
        setTokens: (state, action) => {
            const tokens = action.payload.tokens;
            //let newTokens = [];
            state.content.tokens = [];
            for (var i in tokens) {
                let token = tokens[i];
                //const md5 = token.md5;
                token.price = token.exch;
                token.amount = token.amt;
                token.marketcap = token.amt * token.price;
                token.pro7d = fPercent(token.pro7d);
                token.pro24h = fPercent(token.pro24h);
                state.content.tokens.push(token);
            }
            //state.tokens.push(newTokens);
        },
    },
});

export const { setOffset, setTokens, setOrder, setOrderBy, setPage, setRowsPerPage } = tokenSlice.actions;

const BASE_URL = 'https://ws.xrpl.to/api';
//const BASE_URL = 'http://localhost/api';

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(loadTokens())`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched
export const loadTokens = (offset) => (dispatch, getState) => {
    
    // https://livenet.xrpl.org/api/v1/token/top
    // https://ws.xrpl.to/api/tokens/-1
    // https://github.com/WietseWind/fetch-xrpl-transactions
    //const offset = getState().token.offset;
    console.log("Loading tokens!!! " + offset);
    axios.get(`${BASE_URL}/tokens/${offset}`)
    .then(res => {
        try {
            if (res.status === 200 && res.data) {
                const ret = res.data;
                const status = {
                    session: 0,
                    USD: ret.exch.USD,
                    EUR: ret.exch.EUR,
                    JPY: ret.exch.JPY,
                    CNY: ret.exch.CNY,
                    token_count: ret.token_count
                };
                dispatch(update_status(status));
                dispatch(setTokens(ret));
                //if (offset === 0) dispatch(setOffset(-1));
            }
        } catch (error) {
            console.log(error);
        }
        //dispatch(concatinate(res.data.assets));
        //if(res.data.assets.length < 20) setHasMore(false);
        //setOffset(offset + 1);
    }).catch(err => {
        console.log("err->>", err);
    }).then(function () {
        // always executed
        if (offset === 0) dispatch(loadTokens(-1));
        setTimeout(() => {
            //dispatch(loadTokens(amount));
        }, 1000);
    });
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectContent = (state) => state.token.content;

export default tokenSlice.reducer;
