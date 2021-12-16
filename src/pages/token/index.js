import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from "axios";
import Card from '@material-ui/core/Card';
import ToggleSwitch from "components/toggleSwitch"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush
} from "recharts";

const data = [
  {
    name: "Page A",
    uv: 4000,
    pv: 2400,
    amt: 2400
  },
  {
    name: "Page B",
    uv: 3000,
    pv: 1398,
    amt: 2210
  },
  {
    name: "Page C",
    uv: 2000,
    pv: 9800,
    amt: 2290
  },
  {
    name: "Page D",
    uv: 2780,
    pv: 3908,
    amt: 2000
  },
  {
    name: "Page E",
    uv: 1890,
    pv: 4800,
    amt: 2181
  },
  {
    name: "Page F",
    uv: 2390,
    pv: 3800,
    amt: 2500
  },
  {
    name: "Page G",
    uv: 3490,
    pv: 4300,
    amt: 2100
  }
];

const Tokens = () => {
    const { t } = useTranslation();
    const [ type, setType ] = useState({
       "Price": false,
       "Market Cap": false,
       "Trading View": false,
       "History": false,
    })
    const [ period, setPeriod ] = useState({
       "1D": false,
       "7D": false,
       "1M": false,
       "3M": false,
       "1Y": false,
       "YTD": false,
       "ALL": false,
       "Custom": false,
    })
    useEffect(() => {
     
    }, []);
    return (
    <>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="flex items-center justify-around p-3">      
            Rank #3
            Coin
            On 894 watchlists
            Binance Coin Price (BNB)
            $534.01
            0.18%
            0.01094 BTC0.47%
            0.1326 ETH3.55%
          </Card>
          <Card className="flex items-center justify-around p-3">
            Market Cap
            $89,073,675,636
            0.18%
          </Card>
          <Card className="flex items-center justify-around p-3">
            Fully Diluted Market Cap
            $89,073,675,636
            0.18%
          </Card>
          <Card className="flex items-center justify-around p-3">
            Volume
            24h
            $2,011,890,007
            3.04%
            Volume / Market Cap
            0.02268
          </Card>        
      </div>
      <div className="flex justify-around">
          <ToggleSwitch data={type} onChange={setType} />
          <ToggleSwitch data={period} onChange={setPeriod} />
      </div>
      <LineChart
        width={800}
        height={500}
        data={data}
        syncId="anyId"
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="pv" stroke="#82ca9d" fill="#82ca9d" />
        <Brush />
      </LineChart>
    </>
    );
  }
  
  export default Tokens; 