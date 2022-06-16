import { useEffect } from 'react';
// ----------------------------------------------------------------------
import {
    Toolbar
} from '@mui/material';
// ----------------------------------------------------------------------
import { useDispatch } from "react-redux";
import { update_status } from "../redux/statusSlice";
import useWebSocket/*, { ReadyState }*/ from 'react-use-websocket';
// ----------------------------------------------------------------------

export default function TopMark({ md5 }) {
    const dispatch = useDispatch();

    const {
        sendMessage,
        lastMessage,
        readyState,
    } = useWebSocket(`wss://api.xrpl.to/ws/detail/${md5}`);

    /*const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    } [readyState];*/

    useEffect(() => {
        try {
            /*
            "transactions24H": 52976,
            "tradedXRP24H": 9163859.547288,
            "tradedTokens24H": 743,
            "timeCalc24H": "353.36",
            "timeSchedule": "5411.07",
            */
            const res = lastMessage.data;
            const json = JSON.parse(res);
            const exch = json.exch;
            //console.log(json);
            const status = {
                session: json.session,
                USD: exch.USD,
                EUR: exch.EUR,
                JPY: exch.JPY,
                CNY: exch.CNY,
                token_count: json.token_count,
                transactions24H: json.transactions24H,
                tradedXRP24H: json.tradedXRP24H,
                tradedTokens24H: json.tradedTokens24H,
                timeCalc24H: json.timeCalc24H,
                timeSchedule: json.timeSchedule,
                countApiCall: json.countApiCall,
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
