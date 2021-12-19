import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '@material-ui/core/Card';
import Divider from '@material-ui/core/Divider';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ToggleSwitch from "components/toggleSwitch"
import ReactHighcharts from 'react-highcharts/ReactHighstock.src';
import XrpImage from "assets/images/xrp.webp"
import "./style.scss";

const options = {style: 'currency', currency: 'USD'};
const numberFormat = new Intl.NumberFormat('en-US', options);
const configPrice = {
      
  yAxis: [{
    offset: 20,
    opposite:false,
    labels: {
      formatter: function () {
        return numberFormat.format(this.value) 
      }
      ,
      x: 0,
      style: {
        "color": "#000", "position": "absolute"

      },
      align: 'left'
    },
  },
    
  ],
  tooltip: {
    shared: true,
    formatter: function () {
      return numberFormat.format(this.y, 0) +  '</b><br/>' + new Date(this.x).toLocaleDateString()
    }
  },
  plotOptions: {
    series: {
      showInNavigator: true,
      gapSize: 6,

    }
  },
  title: {
    text: ``
  },
  rangeSelector: {
    inputEnabled: false,
    enabled: false
  },
  chart: {
    height: 600,
  },
  credits: {
    enabled: false
  },

  legend: {
    enabled: true
  },
  xAxis: {
    type: 'date',
  },
  series: [{
    name: 'Price',
    type: 'spline',

    data: data,
    tooltip: {
      valueDecimals: 2
    },

  }
  ]
};
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
            <ReactHighcharts config = {configPrice}></ReactHighcharts>
          </Card>
          <Card className="p-3">
            <div className='text-2xl font-bold mb-4'>7-day price history</div>
            <Divider/>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">USD</TableCell>
                  <TableCell align="right">Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
                <TableRow >
                  <TableCell>December 17, 2021	Friday</TableCell>
                  <TableCell align="right">$0.807264</TableCell>
                  <TableCell align="right">-2.6%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
                
      </div>

    </>
    );
  }
  
  export default Tokens; 