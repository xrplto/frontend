import React from 'react';
import "./style.scss";

export default function ToggleSwitch({onChange, data}) {
  console.log(Object.keys(data))
  const handleClick = (key) => {
    let k = data;
    Object.keys(k).forEach( item => {
      if (item == key ) {
        k[item] = true
      } else {
        k[item] = false
      }
    })
    onChange({...k})
  }
  return (
    <div className="toggle">
        {
          Object.keys(data).map((key, index) => (
            <span className={data[key]? "active": ""} onClick={() => handleClick(key)}>{key}</span>
          ))
        }
      </div>
  );
}
