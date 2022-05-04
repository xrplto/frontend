import { useEffect, useState } from "react";

//https://api-public.sandbox.pro.coinbase.com
//const client = new W3CWebSocket('wss://ws-feed-public.sandbox.pro.coinbase.com');
const client = new WebSocket("wss://ws-feed.pro.coinbase.com");

const useCBFeed = (product_id, depth = undefined) => {
  const [ob, setOB] = useState({
    product_id: product_id,
    buys: [],
    asks: []
  });

  useEffect(() => {
    client.onopen = () => {
      client.send(
        JSON.stringify({
          type: "subscribe",
          product_ids: [product_id],
          channels: ["level2"]
        })
      );
    };

    client.onmessage = (message) => {
      //console.log(message);

      const data = JSON.parse(message.data);
      if (data.type === "snapshot") {
        setOB((prevOB) => {
          data.asks.sort((a, b) =>
            Number(a[0]) < Number(b[0])
              ? -1
              : Number(a[0]) > Number(b[0])
              ? 1
              : 0
          );
          data.bids.sort((a, b) =>
            Number(a[0]) < Number(b[0])
              ? 1
              : Number(a[0]) > Number(b[0])
              ? -1
              : 0
          );
          //console.log('setting from snapshot');
          //console.log({...prevOB, asks: data.asks, buys: data.bids });
          return {
            ...prevOB,
            asks: data.asks.slice(0, depth),
            buys: data.bids.slice(0, depth)
          };
        });
      } else if (data.type === "l2update") {
        const removedItems = data.changes.filter((el) => Number(el[2]) === 0);
        const removedAsks = removedItems
          .filter((el) => el[0] === "sell")
          .map((el) => el[1]);
        const removedBuys = removedItems
          .filter((el) => el[0] === "buy")
          .map((el) => el[1]);
        const addedItems = data.changes.filter((el) => Number(el[2]) !== 0);
        const addedAsks = addedItems
          .filter((el) => el[0] === "sell")
          .map((el) => el.slice(1));
        const addedBuys = addedItems
          .filter((el) => el[0] === "buy")
          .map((el) => el.slice(1));
        setOB((prevOB) => {
          const asks = [...prevOB.asks]
            .filter((ask) => !removedAsks.includes(ask[0]))
            .concat(addedAsks);
          const buys = [...prevOB.buys]
            .filter((buy) => !removedBuys.includes(buy[0]))
            .concat(addedBuys);
          asks.sort((a, b) =>
            Number(a[0]) < Number(b[0])
              ? -1
              : Number(a[0]) > Number(b[0])
              ? 1
              : 0
          );
          buys.sort((a, b) =>
            Number(a[0]) < Number(b[0])
              ? 1
              : Number(a[0]) > Number(b[0])
              ? -1
              : 0
          );
          //console.log("setting from update");
          //console.log(prevOB);
          //console.log({...prevOB, asks: asks, buys: buys });
          return {
            ...prevOB,
            asks: asks.slice(0, depth),
            buys: buys.slice(0, depth)
          };
        });
      } else if (data.type === "subscriptions") {
      } else {
        throw new Error();
      }
    };

    setTimeout(() => {
      client.close();
    }, 4000);

    return () => {
      //console.log('unmounted');
      client.close();
    };
  }, [product_id, depth]);

  return ob;
};

export default useCBFeed;
