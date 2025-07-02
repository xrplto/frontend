import hashicon from 'hashicon';
import axios from 'axios';

function getHashIcon(account) {
  let url = '/static/account_logo.webp';
  try {
    const icon = hashicon(account);
    url = icon.toDataURL();
  } catch (e) {}
  return url;
}

export function checkExpiration(expiration) {
  if (expiration) {
    const now = Date.now();
    const expire = (expiration > 946684800 ? expiration : expiration + 946684800) * 1000;

    if (expire < now) return true;
  } else {
    return false;
  }
}

async function getTokens(
  sortBy = 'vol24hxrp',
  sortType = 'desc',
  tags = 'yes',
  showNew = false,
  showSlug = false
) {
  const BASE_URL = process.env.API_URL;
  let data = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/tokens?start=0&limit=100&sortBy=${sortBy}&sortType=${sortType}&filter=&tags=${tags}&showNew=${showNew}&showSlug=${showSlug}`
    );

    const essentialTokenFields = [
      'md5',
      'currency',
      'issuer',
      'name',
      'pro24h',
      'pro1h',
      'pro5m',
      'pro7d',
      'vol24hxrp',
      'vol24htx',
      'exch',
      'tags',
      'holders',
      'amount',
      'id',
      'user',
      'slug',
      'date',
      'dateon',
      'tvl',
      'origin',
      'isOMCF',
      'marketcap'
    ];

    data = {
      ...res.data,
      tokens: res.data.tokens.map((token) => {
        const filteredToken = {};
        essentialTokenFields.forEach((field) => {
          if (token[field] !== undefined) {
            filteredToken[field] = token[field];
          }
        });

        // Add calculated fields
        filteredToken.bearbull = token.pro24h < 0 ? -1 : 1;
        filteredToken.time = Date.now();

        return filteredToken;
      })
    };
  } catch (error) {
    console.error(`Error fetching tokens (sortBy: ${sortBy}):`, error);
  }
  return data;
}

export { getHashIcon, getTokens };
