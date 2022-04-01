import { useEffect } from 'react';
// ----------------------------------------------------------------------
import {
    Toolbar
} from '@mui/material';
// ----------------------------------------------------------------------
import { useDispatch } from "react-redux";
import { update_status } from "../redux/statusSlice";
import useWebSocket, { ReadyState } from 'react-use-websocket';
// ----------------------------------------------------------------------

export default function TopMark({ md5 }) {
    const dispatch = useDispatch();

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(`wss://ws.xrpl.to/api/ws/detail/${md5}`);

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    } [readyState];

    useEffect(() => {
        try {
            const res = lastMessage.data;
            const json = JSON.parse(res);
            console.log(json);
            const status = {
                session: json.session,
                USD: json.exch.USD,
                EUR: json.exch.EUR,
                JPY: json.exch.JPY,
                CNY: json.exch.CNY,
                token_count: json.token_count
            };
            dispatch(update_status(status));
        } catch(err) {}
    }, [lastMessage, dispatch]);

    useEffect(() => {
        function getStatus() {
            //if (connectionStatus === 'open')
            if (md5)
                sendMessage(md5);
            else
                sendMessage('Hello');
        }
        
        const timer = setInterval(() => getStatus(), 10000)

        return () => {
            clearInterval(timer);
        }
    }, [readyState, sendMessage, md5]);

    return (
        <Toolbar id="back-to-top-anchor" />
    );
}
