import React from "react";
import useCBFeed from "./hooks/useCBFeed";
import OBP from "./OBP";
import "./styles.css";

const OB = ({ product_id }) => {
  const { asks, buys } = useCBFeed(product_id);
  //console.log("OB");
  //console.log(asks);
  //console.log(buys);

  let spread = "...";
  if (asks[0] && buys[0]) {
    spread = (Number(asks[0][0]) - Number(buys[0][0])).toFixed(2);
  }

  return (
    <div className="OB">
      <OBP type="ask" orders={asks} product_id={product_id} />
      <div className="OB__S">
        <div className="OB__SL">Spread:</div>
        <div className="OB__SP">{spread}</div>
      </div>
      <OBP type="buy" orders={buys} product_id={product_id} />
      <div className="OB__header">
        <div className="OB__header1">Order Book</div>
        <div className="OB__header2">
          <div>Size</div>
          <div>Price</div>
        </div>
      </div>
    </div>
  );
};

export default OB;
