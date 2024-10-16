import React from 'react';

const ApiDocumentation = () => {
  return `
# XRPL.to API Documentation

## Introduction

Welcome to the XRPL.to API! Our comprehensive API provides access to XRPL.to endpoints, offering a wide range of XRP Ledger data, metrics, and insights. Whether you're building a trading platform, analytics tool, or researching the XRP ecosystem, our API delivers the data you need.

Key Features:

1. **Comprehensive Token Support**: Access data for all tokens on the XRP Ledger, including popular assets and newly issued tokens.
2. **Multi-Currency Price Feeds**: Get token prices in multiple fiat currencies for global market analysis.
3. **DEX and AMM Volume Tracking**: Monitor decentralized exchange (DEX) and Automated Market Maker (AMM) trading volumes for all XRP Ledger tokens.
4. **XRP On-chain Statistics**: Retrieve detailed on-chain data for XRP, including transaction volumes and network metrics.
5. **Trading Data**: Access comprehensive trading information, including price charts and historical data.
6. **Project Information**: Get rich metadata for tokens and projects, including logos, descriptions, and social links.

Our API is designed for developers, researchers, and businesses looking to integrate XRP Ledger data into their applications or analysis. We offer language bindings in Shell, JavaScript, Python, and Ruby to facilitate easy integration into your preferred development environment.

You can view code examples in the dark area to the right and switch the programming language of the examples with the tabs in the top right.

Let's explore how to leverage the power of XRP Ledger data in your projects with the XRPL.to API!

## Tokens

### Get All Tokens

This endpoint retrieves tokens.

#### HTTP Request

\`GET https://api.xrpl.to/api/tokens?start=0&limit=20&sortBy=vol24hxrp&sortType=desc&filter=\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| start | 0 | start value for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |
| sortBy | vol24hxrp | Can be one of these values: name, exch, pro24h, pro7d, vol24hxrp, vol24htx, marketcap, trustlines, supply |
| sortType | desc | asc, desc |

The parameter \`amount\` in JSON object is Total Supply value, \`supply\` is Circulating Supply Value.

### Get a Specific Token Info


This endpoint retrieves information about a specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/token/<issuer>_<currencyCode>\`

or

\`GET https://api.xrpl.to/api/token/<slug>?desc=yes\`

#### URL Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| issuer_currencyCode | | The issuer address followed by an underscore and the currency code. This is the recommended method. |
| slug | | Alternatively, you can use the URL slug of the token to retrieve or md5 value of the token. |
| desc | no | yes or no, if yes, returns the description of the token in markdown language. |



### Get Sparkline of a token

#### HTTP Request

\`GET https://api.xrpl.to/api/sparkline/<md5>\`

#### Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |

#### Example

\`https://api.xrpl.to/api/sparkline/0413ca7cfc258dfaf698c02fe304e607\`

### Get MD5 value of the token

\`\`\`javascript
const CryptoJS = require('crypto-js');

const md5 = CryptoJS.MD5(issuer + '_' + currency).toString();
\`\`\`

### Get Rich List of a Token


This endpoint retrieves rich list of the specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/richlist/<md5>?start=0&limit=20\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |
| start | 0 | start value for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |

You can see the example of Richlist here: https://xrpl.to/token/sologenic-solo/trustlines

### Get Exchange history of a Token



This endpoint retrieves exchange history of the specific token.

#### HTTP Request

\`GET https://api.xrpl.to/api/history?md5=<md5>&page=0&limit=10\`

#### Query Parameters

| Parameter | Default | Description |
| --------- | ------- | ----------- |
| md5 | | md5 value of the token |
| page | 0 | page number for pagination. |
| limit | 100 | limit count value for pagination.(limit<100) |

You can see the example of Exchange History here: https://xrpl.to/token/sologenic-solo/historical-data

### Get the current status

This endpoint retrieves the current status of the platform, or XRPL. It returns the metrics of 24 hours and Global, and the current exchange rates compared to XRP.

#### HTTP Request

\`GET https://api.xrpl.to/api/status\`

### Get Account Offers



This endpoint retrieves all offers of the account.

#### HTTP Request

\`GET https://api.xrpl.to/api/account/offers/<account>\`

## Errors

The XRPL.to API uses the following error codes:

| Error Code | Meaning |
|------------|---------|
| 400 | Bad Request -- Your request is invalid. |
| 401 | Unauthorized -- Your API key is wrong. |
| 403 | Forbidden -- The token requested is hidden for administrators only. |
| 404 | Not Found -- The specified token could not be found. |
| 405 | Method Not Allowed -- You tried to access a token with an invalid method. |
| 410 | Gone -- The token requested has been removed from our servers. |
| 418 | I'm a teapot. |
| 429 | Too Many Requests -- You're requesting too many tokens! Slow down! |
| 500 | Internal Server Error -- We had a problem with our server. Try again later. |
| 503 | Service Unavailable -- We're temporarily offline for maintenance. Please try again later. |
`;
};

export default ApiDocumentation;
