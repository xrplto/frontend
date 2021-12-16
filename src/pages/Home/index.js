import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
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
import XrpImage from "assets/images/xrp.webp"
import "./style.scss"
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
      
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Card className="col-span-2 p-3 font-bold">
            <div className='flex mb-2'>
              <img src={XrpImage} className='rounded-full' alt="xrp" width="28" />
              <span className='text-xl'> XRP (XRP)</span>
            </div>
            <span className='text-3xl'>$0.822563 </span><span className="text-2xl text-green-200"> 3.0%</span><br/><br/>
            <div className='grid grid-cols-2 gap-4'>
              <div className="flex justify-between">
                <span>Market Cap :</span>
                <span>$39,209,107,226</span>
              </div>
              <div className="flex justify-between">
                <span>24 Hour Trading Vol :</span>
                <span>$3,688,306,956</span>
              </div>
              <Divider/>
              <Divider/>
              <div className="flex justify-between">
                <span>Fully Diluted Valuation :</span>
                <span> $82,986,987,059</span>
              </div>
              <div className="flex justify-between">
                <span>Circulating Supply :</span>
                <span>47,247,295,769</span>
              </div>
              <Divider/>
              <Divider/>
              <div className="flex justify-between">
                <span>Total Supply :</span>
                <span>100,000,000,000</span>
              </div>
              <div className="flex justify-between">
                <span>Max Supply :</span>
                <span>100,000,000,000</span>
              </div>
              <Divider/>
              <Divider/>
            </div>
          </Card>
          <Card className="p-3 info">
            <span className='text-2xl font-bold'>Info</span>
            <Divider/>
            <div>
              <span>Website</span>
              <div>
                <a href='https://ripple.com/currency/'>ripple.com</a>
              </div>
            </div>
            <div>
              <span>Explorers</span>
              <div>
                <a href='https://blockchair.com/ripple'>Blockchair</a>
                <a href='https://xrpcharts.ripple.com/'>Ripple</a>
                <a href='https://xrpscan.com/'>Xrpscan</a>
                <a href='https://bithomp.com/explorer/'>Bithomp</a>
              </div>
            </div>
            <div>
              <span>Wallets</span>
              <div>
                <a href='https://gcko.io/6e6tltg'>Wallets Crypto.com - DeFi Wallet</a>
                <a href='https://gcko.io/ledger'>Ledger</a>
                <a href='https://gcko.io/trezor'>Trezor</a>
              </div>
            </div>
            <div>
              <span>Community</span>
              <div>
                <a href='https://reddit.com/r/ripple'>Reddit</a>
                <a href='https://twitter.com/Ripple'>Twitter</a>
                <a href='https://www.facebook.com/433523166761374'>Facebook</a>
                <a href='https://www.xrpchat.com/'>facebook.com</a>
              </div>
            </div>
            <div>
              <span>Source Code</span>
              <div>
                <a href='https://github.com/ripple'>Github</a>
              </div>
            </div>
          </Card>
          <Card className="p-3 col-span-2">
            <div className="flex justify-between">
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
          </Card>
          <Card className="p-3">
            Market Cap<br />
            $89,073,675,636<br />
            ▼ 0.18%
          </Card>
                
      </div>

    </>
    );
  }
  
  export default Tokens; 