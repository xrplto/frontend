import React from "react";

const OBP = ({ orders, type, product_id, depth = 20 }) => {
  //console.log("OBP");
  //console.log(type);
  //console.log(orders);
  return (
    <div className={type === "ask" ? "OBP OBP--ask" : "OBP OBP--sell"}>
      {orders.slice(0, depth).map((order, index) => {
        return (
          <div className="OBP__order" key={index}>
            <div className="OBP__size">
              <div
                className="OBP__bar"
                style={{ width: Math.min((order[1] / 5) * 25, 25) }}
              ></div>
              {order[1]}
            </div>
            <div className="OBP__price">{order[0]}</div>
          </div>
        );
      })}
    </div>
  );
};

export default OBP;
