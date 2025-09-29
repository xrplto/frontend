import { createSlice } from '@reduxjs/toolkit';

// Transaction processing states
export const TX_STATE = {
  INITIAL: 0,
  SIGNING: 1,
  SUCCESS: 2,
  REJECTED: 3
};

const initialState = {
  isProcessing: TX_STATE.INITIAL,
  txHash: ''
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    updateProcess: (state, action) => {
      state.isProcessing = action.payload;
    },

    updateTxHash: (state, action) => {
      state.txHash = action.payload;
    }
  }
});

export const { updateProcess, updateTxHash } = transactionSlice.actions;
export const selectProcess = (state) => state.transaction.isProcessing;
export const selectTxHash = (state) => state.transaction.txHash;

export default transactionSlice.reducer;
