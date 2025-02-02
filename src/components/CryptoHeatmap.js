import axios from 'axios';
import Decimal from 'decimal.js';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsTreemap from 'highcharts/modules/treemap';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import { fCurrency, fNumberWithCurreny } from 'src/utils/formatNumber';
import { FormControl, Select, MenuItem } from '@mui/material';

function CryptoHeatmap({ exchRate }) {
  if (typeof Highcharts === 'object') {
    HighchartsTreemap(Highcharts);
  }

  const { activeFiatCurrency } = useContext(AppContext);
  const [markets, setMarkets] = useState([]);
  const [sortBy, setSortBy] = useState('vol24hxrp');

  useEffect(() => {
    const getTokenData = async () => {
      try {
        const BASE_URL = process.env.API_URL;
        const res = await axios.get(
          `${BASE_URL}/tokens?start=1&limit=100&sortBy=${sortBy}&sortType=desc&filter=&tags=yes&showNew=false&showSlug=false`
        );

        let data = res.data;
        if (data) {
          const tokens = data.tokens;
          let marketData = [];

          tokens.map((token) => {
            const market = {
              name: token.name,
              original: token.user,
              value: sortBy === 'marketcap' ? token.marketcap : token.vol24hxrp,
              displayValue: token.exch,
              priceChange: token.pro24h,
              price: token.exch,
              slug: token.slug,
              md5: token.md5,
              color: token.pro24h >= 0 ? '#16c784' : '#a4111a',
              trustlines: token.trustlines,
              holders: token.holders,
              verified: token.verified,
              kyc: token.kyc
            };
            marketData.push(market);
          });

          setMarkets(marketData);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getTokenData();
  }, [sortBy]);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const options = {
    series: [
      {
        type: 'treemap',
        cursor: 'pointer',
        layoutAlgorithm: 'squarified',
        data: markets,
        dataLabels: {
          useHTML: true,
          layoutAlgorithm: 'squarified',
          style: {},
          formatter: function () {
            const price = this.point.displayValue;
            const formattedPrice =
              price < 0.001 ? price.toFixed(8) : price < 1 ? price.toFixed(6) : fCurrency(price);

            if (this.point.shapeArgs.width > this.point.shapeArgs.height) {
              return `<div style="color: #fff;"> <div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 10
              }px;">${this.key}</div><div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 12
              }px;">${
                currencySymbols[activeFiatCurrency]
              } ${formattedPrice}</div><div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 12
              }px;">${fCurrency(this.point.priceChange)}% </div></div>`;
            } else {
              return `<div style="color: #fff;"> <div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 10
              }px;">${this.key}</div><div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 12
              }px;">${
                currencySymbols[activeFiatCurrency]
              } ${formattedPrice}</div><div style="text-align: center; font-size:${
                this.point.shapeArgs.height / 12
              }px;">${fCurrency(this.point.priceChange)}% </div></div>`;
            }
          }
        },
        events: {
          click: function (event) {
            window.location.href = '/token/' + event.point.slug;
          }
        }
      }
    ],
    title: {
      text: null
    },
    colorAxis: {
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0]
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0)',
      shadow: false,
      borderWidth: 0,
      useHTML: true,
      style: {
        zIndex: 100
      },
      formatter: function () {
        const verifiedBadge = this.point.verified ? '✓ ' : '';
        const holders = this.point.holders ? this.point.holders.toLocaleString() : '0';
        const trustlines = this.point.trustlines ? this.point.trustlines.toLocaleString() : '0';
        const nameDisplay = this.point.original
          ? `${this.point.name}: ${this.point.original}`
          : this.point.name;

        const price = this.point.price;
        const formattedPrice =
          price < 0.001
            ? price.toFixed(8)
            : price < 1
            ? price.toFixed(6)
            : fNumberWithCurreny(price, exchRate);

        const tokenImage = this.point.md5
          ? `<img src="https://s1.xrpl.to/token/${this.point.md5}" style="width:32px;height:32px;vertical-align:middle;margin-right:8px;">`
          : '';

        const priceChange = this.point.priceChange;
        const changeColor = priceChange >= 0 ? '#16c784' : '#ea3943';
        const changeSymbol = priceChange >= 0 ? '+' : '';
        const formattedChange = `<span style="color:${changeColor}">${changeSymbol}${fCurrency(
          priceChange
        )}%</span>`;

        return `
          <p style="color:#9ab;font-family:DobloxSans,sans-serif;border-radius:3px;font-size:11px;text-align:left;margin:0;padding:10px;border:1px solid black;background-color:#151519">
            <strong style="color:#99a5bb;font-weight:normal;font-size:14px;">
              ${tokenImage}${verifiedBadge}${nameDisplay}<br>
              Price: ${currencySymbols[activeFiatCurrency]} ${formattedPrice} ${formattedChange}<br>
              Volume: ${fCurrency(this.point.value)}<br>
              Holders: ${holders}<br>
              Trustlines: ${trustlines}
            </strong>
          </p>`;
      }
    }
  };

  return (
    <div>
      <FormControl sx={{ mb: 2, minWidth: 200 }}>
        <Select
          value={sortBy}
          onChange={handleSortChange}
          displayEmpty
          size="small"
          sx={{
            backgroundColor: 'background.paper',
            '& .MuiSelect-select': { py: 1 }
          }}
        >
          <MenuItem value="vol24hxrp">Sort by Volume</MenuItem>
          <MenuItem value="marketcap">Sort by Market Cap</MenuItem>
        </Select>
      </FormControl>

      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{
          style: {
            height: 'calc(62.5em - 94px)'
          }
        }}
      />
    </div>
  );
}

export default CryptoHeatmap;
