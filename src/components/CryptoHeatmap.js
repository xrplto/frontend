import Decimal from 'decimal.js';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsTreemap from 'highcharts/modules/treemap';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import { fCurrency, fNumberWithCurreny } from 'src/utils/formatNumber';

function CryptoHeatmap({ tokens, exchRate }) {
  if (typeof Highcharts === 'object') {
    HighchartsTreemap(Highcharts);
  }

  const { activeFiatCurrency } = useContext(AppContext);
  const [markets, setMarkets] = useState([]);

  useEffect(() => {
    if (tokens.length) {
      let marketData = [];
      tokens.map((token) => {
        const market = {
          name: token.name,
          original: token.user,
          value: token.vol24hxrp,
          priceChange: token.pro24h,
          price: token.exch,
          color: token.pro24h >= 0 ? "#16c784" : "#a4111a"
        };
        marketData.push(market);
      });

      setMarkets(marketData);
    }
  }, [tokens])

  const options = {
    series: [
      {
        type: 'treemap',
        layoutAlgorithm: 'squarified',
        data: markets,
        dataLabels: {
          useHTML: true,
          layoutAlgorithm: 'squarified',
          style: {},
          formatter: function () {
            const marketcap = Decimal.div(this.point.value, exchRate).toNumber();
            if (this.point.shapeArgs.width > this.point.shapeArgs.height) {
              return `<div style="color: #fff;"> <div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 10}px;">${this.key}</div><div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 12}px;">${currencySymbols[activeFiatCurrency]} ${fCurrency(marketcap)}</div><div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 12}px;">${fCurrency(this.point.priceChange)}% </div></div>`;
            } else {
              return `<div style="color: #fff;"> <div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 10}px;">${this.key}</div><div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 12}px;">${fCurrency(marketcap)}</div><div style="text-align: center; font-size:${(this.point.shapeArgs.height) / 12}px;">${fCurrency(this.point.priceChange)}% </div></div>`;
            }
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
        return `<p style="color:#9ab;font-family:DobloxSans,sans-serif;border-radius:3px;font-size:11px;text-align:left;margin:0;padding:10px;border:1px solid black;background-color:#151519"><strong style="color:#99a5bb;font-weight:normal;font-size:14px;">${this.point.name}: ${this.point.original}<br> Price: ${currencySymbols[activeFiatCurrency]} ${fNumberWithCurreny(this.point.price, exchRate)}<br> Volume: ${fCurrency(this.point.value)}</strong></p>`;
      }
    }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{
        style: {
          height: "calc(62.5em - 94px)"
        }
      }}
    />
  )
}

export default CryptoHeatmap;