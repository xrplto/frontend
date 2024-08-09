const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
    chatOpen: false
}

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        toggleChatOpen: (state) => {
            state.chatOpen = !state.chatOpen;
        }
    }
});

export const { toggleChatOpen } = chatSlice.actions;
export const selectChatOpen = state => state.chat.chatOpen;
export default chatSlice.reducer;