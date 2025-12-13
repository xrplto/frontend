import Decimal from 'decimal.js-light';
import { encodeAccountID } from 'ripple-address-codec';
const CryptoJS = require('crypto-js');

// Removed ripple-keypairs for security (compromised in 2025)
const { xAddressToClassicAddress } = require('ripple-address-codec');

// Inline from txflags.js - only need Payment flags
const txFlags = {
  Payment: {
    PartialPayment: 0x00020000
  }
};

const dropsInXRP = 1000000;

// https://xrpl.org/accounts.html#special-addresses
const BLACKHOLE_ACCOUNTS = [
  'rrrrrrrrrrrrrrrrrrrrrhoLvTp',
  'rrrrrrrrrrrrrrrrrrrrBZbvji',
  'rrrrrrrrrrrrrrrrrNAMEtxvNvQ',
  'rrrrrrrrrrrrrrrrrrrn5RM1rHd'
];

function adjustQualityForXRP(quality, takerGetsCurrency, takerPaysCurrency) {
  // quality = takerPays.value/takerGets.value
  // using drops (1e-6 XRP) for XRP values
  const numeratorShift = takerPaysCurrency === 'XRP' ? -6 : 0;
  const denominatorShift = takerGetsCurrency === 'XRP' ? -6 : 0;
  const shift = numeratorShift - denominatorShift;
  return shift === 0 ? quality : new Decimal(quality).mul(Decimal.pow(10, shift)).toString();
}

function parseQuality(quality) {
  if (typeof quality !== 'number') {
    return undefined;
  }
  try {
    return new Decimal(quality).div(Decimal.pow(10, 9)).toNumber();
  } catch (error) {
    console.error('Error in parseQuality:', error);
    return undefined;
  }
}

function parseTimestamp(rippleTime) {
  if (typeof rippleTime !== 'number') {
    return undefined;
  }
  return rippleTimeToISO8601(rippleTime);
}

function isPartialPayment(tx) {
  // tslint:disable-next-line:no-bitwise
  return (tx.Flags & txFlags.Payment.PartialPayment) !== 0;
}

function hexToString(hex) {
  return hex ? Buffer.from(hex, 'hex').toString('utf-8') : undefined;
}

function isValidSecret(secret) {
  // Basic validation - removed ripple-keypairs for security
  // XRP secrets are typically 29 chars starting with 's'
  return secret && typeof secret === 'string' && secret.length === 29 && secret.startsWith('s');
}

function dropsToXrp(drops) {
  // Handle undefined, null, or empty values
  if (drops === undefined || drops === null || drops === '') {
    return '0';
  }

  if (typeof drops === 'string') {
    if (!drops.match(/^-?[0-9]*\.?[0-9]*$/)) {
      console.error(
        `dropsToXrp: invalid value '${drops}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`
      );
      return '0';
    } else if (drops === '.') {
      console.error(
        `dropsToXrp: invalid value '${drops}',` + ` should be a BigNumber or string-encoded number.`
      );
      return '0';
    }
  }

  // Converting to BigNumber and then back to string should remove any
  // decimal point followed by zeros, e.g. '1.00'.
  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  try {
    drops = new Decimal(drops).toString();
  } catch (err) {
    console.error(`dropsToXrp: error converting '${drops}':`, err);
    return '0';
  }

  // drops are only whole units
  if (drops.includes('.')) {
    console.error(`dropsToXrp: value '${drops}' has` + ` too many decimal places.`);
  }

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!drops.match(/^-?[0-9]+$/)) {
    console.error(
      `dropsToXrp: failed sanity check -` + ` value '${drops}',` + ` does not match (^-?[0-9]+$).`
    );
  }

  return new Decimal(drops).div(1000000.0).toString();
}

function xrpToDrops(xrp) {
  if (typeof xrp === 'string') {
    if (!xrp.match(/^-?[0-9]*\.?[0-9]*$/)) {
      console.error(
        `xrpToDrops: invalid value '${xrp}',` +
          ` should be a number matching (^-?[0-9]*\\.?[0-9]*$).`
      );
    } else if (xrp === '.') {
      console.error(
        `xrpToDrops: invalid value '${xrp}',` + ` should be a BigNumber or string-encoded number.`
      );
    }
  }

  // Important: specify base 10 to avoid exponential notation, e.g. '1e-7'.
  xrp = new Decimal(xrp).toString();

  // This should never happen; the value has already been
  // validated above. This just ensures BigNumber did not do
  // something unexpected.
  if (!xrp.match(/^-?[0-9.]+$/)) {
    console.error(
      `xrpToDrops: failed sanity check -` + ` value '${xrp}',` + ` does not match (^-?[0-9.]+$).`
    );
  }

  const components = xrp.split('.');
  if (components.length > 2) {
    console.error(
      `xrpToDrops: failed sanity check -` + ` value '${xrp}' has` + ` too many decimal points.`
    );
  }

  const fraction = components[1] || '0';
  if (fraction.length > 6) {
    console.error(`xrpToDrops: value '${xrp}' has` + ` too many decimal places.`);
  }

  return new Decimal(xrp).mul(1000000.0).floor().toString();
}

function toRippledAmount(amount) {
  if (typeof amount === 'string') return amount;

  if (amount.currency === 'XRP') {
    return xrpToDrops(amount.value);
  }
  if (amount.currency === 'drops') {
    return amount.value;
  }

  let issuer = amount.counterparty || amount.issuer;
  let tag = false;

  try {
    ({ classicAddress: issuer, tag } = xAddressToClassicAddress(issuer));
  } catch (e) {
    /* not an X-address */
  }

  if (tag !== false) {
    console.error('Issuer X-address includes a tag');
  }

  return {
    currency: amount.currency,
    issuer,
    value: amount.value
  };
}

function removeUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

/**
 * @param {Number} rpepoch (seconds since 1/1/2000 GMT)
 * @return {Number} s since unix epoch
 */
function rippleToUnixTime(rpepoch) {
  return rpepoch + 0x386d4380;
}

/**
 * @param {Number} rpepoch (seconds since 1/1/2000 GMT)
 * @return {Number} ms since unix epoch
 */
function rippleToUnixTimestamp(rpepoch) {
  return rippleToUnixTime(rpepoch) * 1000;
}

/**
 * @param {Number|Date} timestamp (ms since unix epoch)
 * @return {Number} seconds since ripple epoch (1/1/2000 GMT)
 */
function unixToRippleTimestamp(timestamp) {
  return Math.round(timestamp / 1000) - 0x386d4380;
}

function rippleTimeToISO8601(rippleTime) {
  if (rippleTime == null || typeof rippleTime !== 'number' || isNaN(rippleTime)) {
    return null;
  }
  const timestamp = rippleToUnixTimestamp(rippleTime);
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

/**
 * @param {string} iso8601 international standard date format
 * @return {number} seconds since ripple epoch (1/1/2000 GMT)
 */
function iso8601ToRippleTime(iso8601) {
  return unixToRippleTimestamp(Date.parse(iso8601));
}

function normalizeNode(affectedNode) {
  const diffType = Object.keys(affectedNode)[0];
  const node = affectedNode[diffType];
  return Object.assign({}, node, {
    diffType,
    entryType: node.LedgerEntryType,
    ledgerIndex: node.LedgerIndex,
    newFields: node.NewFields || {},
    finalFields: node.FinalFields || {},
    previousFields: node.PreviousFields || {}
  });
}

function normalizeNodes(metadata) {
  if (!metadata.AffectedNodes) {
    return [];
  }
  return metadata.AffectedNodes.map(normalizeNode);
}

/**
 * IEEE 754 floating-point.
 *
 * Supports single- or double-precision
 */

var allZeros = /^0+$/;
var allOnes = /^1+$/;

const IEEE754_fromBytes = (bytes) => {
  // Render in binary.  Hackish.
  var b = '';
  for (var i = 0, n = bytes.length; i < n; i++) {
    var bits = (bytes[i] & 0xff).toString(2);
    while (bits.length < 8) bits = '0' + bits;
    b += bits;
  }

  // Determine configuration.  This could have all been precomputed but it is fast enough.
  var exponentBits = bytes.length === 4 ? 4 : 11;
  var mantissaBits = bytes.length * 8 - exponentBits - 1;
  var bias = Math.pow(2, exponentBits - 1) - 1;
  var minExponent = 1 - bias - mantissaBits;

  // Break up the binary representation into its pieces for easier processing.
  var s = b[0];
  var e = b.substring(1, exponentBits + 1);
  var m = b.substring(exponentBits + 1);

  var value = 0;
  var multiplier = s === '0' ? 1 : -1;

  if (allZeros.test(e)) {
    // Zero or denormalized
    if (allZeros.test(m)) {
      // Value is zero
    } else {
      value = parseInt(m, 2) * Math.pow(2, minExponent);
    }
  } else if (allOnes.test(e)) {
    // Infinity or NaN
    if (allZeros.test(m)) {
      value = Infinity;
    } else {
      value = NaN;
    }
  } else {
    // Normalized
    var exponent = parseInt(e, 2) - bias;
    var mantissa = parseInt(m, 2);
    value = (1 + mantissa * Math.pow(2, -mantissaBits)) * Math.pow(2, exponent);
  }

  return value * multiplier;
};

const HexEncoding = {
  toBinary: (hex) => {
    return hex ? Buffer.from(hex, 'hex') : undefined;
  },

  toString: (hex) => {
    return hex ? Buffer.from(hex, 'hex').toString('utf8') : undefined;
  },

  toHex: (text) => {
    return text ? Buffer.from(text).toString('hex') : undefined;
  },

  toUTF8: (hex) => {
    if (!hex) return undefined;

    const buffer = Buffer.from(hex, 'hex');
    const isValid = Buffer.compare(Buffer.from(buffer.toString(), 'utf8'), buffer) === 0;

    if (isValid) {
      return buffer.toString('utf8');
    }
    return hex;
  }
};

function convertDemurrageToUTF8(demurrageCode) {
  let bytes = Buffer.from(demurrageCode, 'hex');
  let code =
    String.fromCharCode(bytes[1]) + String.fromCharCode(bytes[2]) + String.fromCharCode(bytes[3]);
  let interest_start = (bytes[4] << 24) + (bytes[5] << 16) + (bytes[6] << 8) + bytes[7];
  let interest_period = IEEE754_fromBytes(bytes.slice(8, 16));
  const year_seconds = 31536000; // By convention, the XRP Ledger's interest/demurrage rules use a fixed number of seconds per year (31536000), which is not adjusted for leap days or leap seconds
  let interest_after_year = precision(
    Math.pow(Math.E, (interest_start + year_seconds - interest_start) / interest_period),
    14
  );
  let interest = interest_after_year * 100 - 100;

  return `${code} (${interest}% pa)`;
}

function precision(num, precision) {
  return +(Math.round(Number(num + 'e+' + precision)) + 'e-' + precision);
}

function normalizeCurrencyCode(currencyCode, maxLength = 20) {
  if (!currencyCode) return '';

  // Native XRP
  if (currencyCode === 'XRP') {
    return currencyCode;
  }

  // IOU claims as XRP which consider as fake XRP
  if (currencyCode.toLowerCase() === 'xrp') {
    return 'FakeXRP';
  }

  // IOU
  // currency code is hex try to decode it
  if (currencyCode.match(/^[A-F0-9]{40}$/)) {
    let decoded = '';

    //check for demurrage
    if (currencyCode.startsWith('01')) decoded = convertDemurrageToUTF8(currencyCode);
    // check for XLS15d
    else if (currencyCode.startsWith('02')) {
      try {
        const binary = HexEncoding.toBinary(currencyCode);
        decoded = binary.slice(8).toString('utf-8');
      } catch {
        decoded = HexEncoding.toString(currencyCode);
      }
    } else {
      decoded = HexEncoding.toString(currencyCode);
    }

    if (decoded) {
      // cleanup break lines and null bytes
      const clean = decoded.replace(/\0/g, '').replace(/(\r\n|\n|\r)/gm, ' ');

      // check if decoded contains xrp
      if (clean.toLowerCase().trim() === 'xrp') {
        return 'FakeXRP';
      }
      return clean;
    }

    // if not decoded then return truncated hex value
    return `${currencyCode.slice(0, 4)}...`;
  }

  return currencyCode;
}

function parseFlags(value, keys, options = {}) {
  const flags = {};
  for (const flagName in keys) {
    // tslint:disable-next-line:no-bitwise
    if (value & keys[flagName]) {
      flags[flagName] = true;
    } else {
      if (!options.excludeFalse) {
        flags[flagName] = false;
      }
    }
  }
  return flags;
}

export const getNftCoverUrl = (nft, size = 'medium', type = '') => {
  if (!nft) return '';

  const fileTypes = type ? [type] : ['video', 'animation', 'image']; // order is important
  const files = nft.files?.filter(
    (file) => fileTypes.includes(file.type) /* && file.thumbnail?.[size]*/
  );

  if (files?.length) {
    for (const type of fileTypes) {
      const file = files.find((f) => f.type === type);
      if (file) {
        // return medium thumbnail if required size fails, fallback to large, then small
        const thumbnail =
          file.thumbnail?.[size] ||
          file.thumbnail?.medium ||
          file.thumbnail?.large ||
          file.thumbnail?.small ||
          file.convertedFile ||
          (!file.isIPFS && file.dfile ? file.dfile : '');
        if (thumbnail) {
          return `https://s1.xrpl.to/nft/${thumbnail}`;
        }
        // Skip IPFS - only use cached/converted files
      }
    }
  }

  // Fallback to meta fields for unparsed NFTs
  if (!files?.length && nft.meta) {
    let metaUrl = '';
    if (type === 'video' && nft.meta.video) {
      metaUrl = nft.meta.video;
    } else if (type === 'animation' && nft.meta.animation) {
      metaUrl = nft.meta.animation;
    } else if ((type === 'image' || !type) && nft.meta.image) {
      metaUrl = nft.meta.image;
    }

    if (metaUrl && typeof metaUrl === 'string') {
      // Convert IPFS URLs to gateway URLs
      if (metaUrl.startsWith('ipfs://')) {
        const ipfsPath = metaUrl.replace('ipfs://', '');
        const pathParts = ipfsPath.split('/');
        const encodedPath = pathParts.map(encodeURIComponent).join('/');
        return `https://ipfs.io/ipfs/${encodedPath}`;
      } else if (metaUrl.startsWith('Qm') || metaUrl.startsWith('bafy')) {
        // Raw IPFS CID (v0 starts with Qm, v1 starts with bafy)
        const pathParts = metaUrl.split('/');
        const encodedPath = pathParts.map(encodeURIComponent).join('/');
        return `https://ipfs.io/ipfs/${encodedPath}`;
      }
      return metaUrl;
    }
  }

  // type is usually requested at page for og:*, so if no type requested showing no image
  if (!type) {
    return '/static/nft_no_image.webp';
  }

  return '';
};

export const getNftFilesUrls = (nft, type = 'image') => {
  if (!nft) return '';
  const files = nft.files?.filter((file) => file.type === type);
  if (files?.length) {
    for (const file of files) {
      // Now serving convertedFile whever possible
      if (!file.isIPFS && file.dfile) {
        const fileName = file.convertedFile ?? file.dfile;
        file.cachedUrl = `https://s1.xrpl.to/nft/${fileName}`;
      } else if (file.isIPFS && file.convertedFile) {
        file.cachedUrl = `https://s1.xrpl.to/nft/${file.convertedFile}`;
      } else {
        // Skip IPFS - only use converted files
        file.cachedUrl = null;
      }
    }
    return files;
  }

  // Fallback to meta fields for unparsed NFTs
  if (!files?.length && nft.meta) {
    let metaUrl = '';
    if (type === 'video' && nft.meta.video) {
      metaUrl = nft.meta.video;
    } else if (type === 'animation' && nft.meta.animation) {
      metaUrl = nft.meta.animation;
    } else if (type === 'image' && nft.meta.image) {
      metaUrl = nft.meta.image;
    }

    if (metaUrl && typeof metaUrl === 'string') {
      // Convert IPFS URLs to gateway URLs
      if (metaUrl.startsWith('ipfs://')) {
        const ipfsPath = metaUrl.replace('ipfs://', '');
        const pathParts = ipfsPath.split('/');
        const encodedPath = pathParts.map(encodeURIComponent).join('/');
        metaUrl = `https://ipfs.io/ipfs/${encodedPath}`;
      } else if (metaUrl.startsWith('Qm') || metaUrl.startsWith('bafy')) {
        // Raw IPFS CID (v0 starts with Qm, v1 starts with bafy)
        const pathParts = metaUrl.split('/');
        const encodedPath = pathParts.map(encodeURIComponent).join('/');
        metaUrl = `https://ipfs.io/ipfs/${encodedPath}`;
      }
      return [{ cachedUrl: metaUrl, type }];
    }
  }
};

export function cipheredTaxon(tokenSeq, taxon) {
  // An issuer may issue several NFTs with the same taxon; to ensure that NFTs
  // are spread across multiple pages we lightly mix the taxon up by using the
  // sequence (which is not under the issuer's direct control) as the seed for
  // a simple linear congruential generator.
  //
  // From the Hull-Dobell theorem we know that f(x)=(m*x+c) mod n will yield a
  // permutation of [0, n) when n is a power of 2 if m is congruent to 1 mod 4
  // and c is odd.
  //
  // Here we use m = 384160001 and c = 2459. The modulo is implicit because we
  // use 2^32 for n and the arithmetic gives it to us for "free".
  //
  // Note that the scramble value we calculate is not cryptographically secure
  // but that's fine since all we're looking for is some dispersion.
  //
  // **IMPORTANT** Changing these numbers would be a breaking change requiring
  //               an amendment along with a way to distinguish token IDs that
  //               were generated with the old code.
  // tslint:disable-next-line:no-bitwise
  return taxon ^ (384160001 * tokenSeq + 2459);
}

export function parseNFTokenID(NFTokenID) {
  //   A   B                      C                        D        E
  // 0008 1388 2177B00DF84CA4B8DD59778594F472EF0F56E435 99AE2184 00000DEA
  if (!NFTokenID || NFTokenID.length !== 64) return { flag: 0, royalty: 0, issuer: '', taxon: 0 };
  const flag = parseInt(NFTokenID.slice(0, 4), 16);
  const royalty = parseInt(NFTokenID.slice(4, 8), 16);
  const issuer = encodeAccountID(Buffer.from(NFTokenID.slice(8, 48), 'hex'));
  const scrambledTaxon = parseInt(NFTokenID.slice(48, 56), 16);
  const tokenSeq = parseInt(NFTokenID.slice(56, 64), 16);

  const taxon = cipheredTaxon(tokenSeq, scrambledTaxon);

  let transferFee = 0;
  try {
    if (royalty)
      transferFee = new Decimal(royalty).div('1000').toDP(3, Decimal.ROUND_DOWN).toNumber();
  } catch (e) {}

  return { flag, royalty, issuer, taxon, transferFee };
}

export function convertHexToString(hex, encoding = 'utf8') {
  let ret = '';
  try {
    ret = Buffer.from(hex, 'hex').toString(encoding);
  } catch (err) {}
  return ret;
}

// Parse amount function (from amount.js)
export function parseAmount(amount) {
  if (typeof amount === 'string') {
    return {
      issuer: 'XRPL',
      currency: 'XRP',
      name: 'XRP',
      value: dropsToXrp(amount)
    };
  }
  return {
    issuer: amount.issuer,
    currency: amount.currency,
    name: normalizeCurrencyCode(amount.currency),
    value: amount.value
  };
}

// ==== CURRENCY CODE NORMALIZERS (from normalizers.js) ====

// IEEE 754 floating-point implementation
function fromBytesIEEE754(bytes) {
  var b = '';
  for (var i = 0, n = bytes.length; i < n; i++) {
    var bits = (bytes[i] & 0xff).toString(2);
    while (bits.length < 8) bits = '0' + bits;
    b += bits;
  }

  var exponentBits = bytes.length === 4 ? 4 : 11;
  var mantissaBits = bytes.length * 8 - exponentBits - 1;
  var bias = Math.pow(2, exponentBits - 1) - 1;
  var minExponent = 1 - bias - mantissaBits;

  var s = b[0];
  var e = b.substring(1, exponentBits + 1);
  var m = b.substring(exponentBits + 1);

  var allZeros = /^0+$/;
  var allOnes = /^1+$/;

  var value = 0;
  var multiplier = s === '0' ? 1 : -1;

  if (allZeros.test(e)) {
    if (allZeros.test(m)) {
      // Value is zero
    } else {
      value = parseInt(m, 2) * Math.pow(2, minExponent);
    }
  } else if (allOnes.test(e)) {
    if (allZeros.test(m)) {
      value = Infinity;
    } else {
      value = NaN;
    }
  } else {
    var exponent = parseInt(e, 2) - bias;
    var mantissa = parseInt(m, 2);
    value = (1 + mantissa * Math.pow(2, -mantissaBits)) * Math.pow(2, exponent);
  }

  return value * multiplier;
}

function isHex(string) {
  return /^[0-9A-Fa-f]*$/.test(string);
}

export function currencyCodeUTF8ToHexIfUTF8(currencyCode) {
  if (currencyCode) {
    if (currencyCode.length === 3) return currencyCode;
    else if (currencyCode.length === 40 && isHex(currencyCode)) return currencyCode;
    else return Buffer.from(currencyCode, 'utf-8').toString('hex');
  } else {
    return '';
  }
}

export function currencyCodeHexToUTF8Trimmed(currencyCode) {
  if (currencyCode && currencyCode.length === 40 && isHex(currencyCode)) {
    while (currencyCode.endsWith('00')) {
      currencyCode = currencyCode.substring(0, currencyCode.length - 2);
    }
  }

  if (currencyCode) {
    if (currencyCode.length > 3 && isHex(currencyCode)) {
      if (currencyCode.startsWith('01')) return convertDemurrageToUTF8(currencyCode);
      else return Buffer.from(currencyCode, 'hex').toString('utf-8').trim();
    } else {
      return currencyCode;
    }
  } else {
    return '';
  }
}

export function currencyCodeUTF8ToHex(currencyCode) {
  if (currencyCode && currencyCode.length === 40) {
    while (currencyCode.endsWith('00')) {
      currencyCode = currencyCode.substring(0, currencyCode.length - 2);
    }
  }

  let output;
  if (currencyCode.length > 3) output = Buffer.from(currencyCode.trim(), 'utf-8').toString('hex');
  else output = currencyCode;

  return output;
}

export function getCurrencyCodeForXRPL(currencyCode) {
  let returnString = '';
  if (currencyCode) {
    let currency = currencyCode.trim();

    if (currency && currency.length > 3) {
      if (!isHex(currency)) currency = Buffer.from(currency, 'utf-8').toString('hex');

      while (currency.length < 40) currency += '0';

      returnString = currency.toUpperCase();
    } else {
      returnString = currency;
    }
  }

  return returnString;
}

export function rippleEpocheTimeToUTC(rippleEpocheTime) {
  return (rippleEpocheTime + 946684800) * 1000;
}

export function utcToRippleEpocheTime(utcTime) {
  return utcTime / 1000 - 946684800;
}

export function normalizeAmount(Amount) {
  if (!Amount) return { issuer: '', currency: '', amount: '' };

  let issuer = 'XRPL';
  let currency = 'XRP';
  let amount = '';
  let name = 'XRP';
  if (typeof Amount === 'object') {
    issuer = Amount.issuer;
    currency = Amount.currency;
    amount = new Decimal(Amount.value).toNumber();
    name = normalizeCurrencyCode(currency);
  } else {
    amount = new Decimal(Amount).div(1000000).toNumber();
  }
  return { name, issuer, currency, amount };
}

// ==== ORDERBOOK SERVICE (from orderbookService.js) ====

export const calculateSpread = (bids, asks) => {
  if (!bids || !asks || bids.length === 0 || asks.length === 0) {
    return {
      spreadAmount: 0,
      spreadPercentage: 0,
      highestBid: 0,
      lowestAsk: 0
    };
  }

  const highestBid = Math.max(
    ...bids.map((bid) => bid.price).filter((p) => !isNaN(p) && isFinite(p))
  );
  const lowestAsk = Math.min(
    ...asks.map((ask) => ask.price).filter((p) => !isNaN(p) && isFinite(p))
  );

  if (!isFinite(highestBid) || !isFinite(lowestAsk) || highestBid <= 0 || lowestAsk <= 0) {
    return {
      spreadAmount: 0,
      spreadPercentage: 0,
      highestBid: 0,
      lowestAsk: 0
    };
  }

  const spreadAmount = lowestAsk - highestBid;
  const spreadPercentage = (spreadAmount / highestBid) * 100;

  return {
    spreadAmount,
    spreadPercentage: isNaN(spreadPercentage) ? 0 : spreadPercentage,
    highestBid,
    lowestAsk
  };
};

export const processOrderbookOffers = (offers, orderType = 'bids') => {
  if (!offers || offers.length === 0) return [];

  const processed = [];
  let sumAmount = 0;
  let sumValue = 0;

  const firstOffer = offers[0];
  const isXRPGets =
    firstOffer &&
    (typeof firstOffer.TakerGets === 'string' || firstOffer.TakerGets?.currency === 'XRP');
  const isXRPPays =
    firstOffer &&
    (typeof firstOffer.TakerPays === 'string' || firstOffer.TakerPays?.currency === 'XRP');

  const XRP_MULTIPLIER = 1000000;

  offers.forEach((offer) => {
    let price = parseFloat(offer.quality) || 1;
    let quantity = 0;
    let total = 0;

    if (orderType === 'asks') {
      if (typeof offer.TakerGets === 'string') {
        quantity = parseFloat(offer.TakerGets) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerGets === 'object') {
        quantity = parseFloat(offer.TakerGets.value) || 0;
      }

      if (typeof offer.TakerPays === 'string') {
        total = parseFloat(offer.TakerPays) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerPays === 'object') {
        total = parseFloat(offer.TakerPays.value) || 0;
      }

      price = quantity > 0 ? total / quantity : 0;
    } else {
      if (typeof offer.TakerGets === 'string') {
        total = parseFloat(offer.TakerGets) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerGets === 'object') {
        total = parseFloat(offer.TakerGets.value) || 0;
      }

      if (typeof offer.TakerPays === 'string') {
        quantity = parseFloat(offer.TakerPays) / XRP_MULTIPLIER;
      } else if (typeof offer.TakerPays === 'object') {
        quantity = parseFloat(offer.TakerPays.value) || 0;
      }

      price = quantity > 0 ? total / quantity : 0;
    }

    if (price > 0 && quantity > 0 && total > 0 && !isNaN(price) && isFinite(price)) {
      sumAmount += quantity;
      sumValue += total;

      processed.push({
        price: price,
        amount: quantity,
        total: total,
        value: total,
        sumAmount: sumAmount,
        sumValue: sumValue,
        avgPrice: sumAmount > 0 ? sumValue / sumAmount : 0,
        isNew: false,
        Account: offer.Account
      });
    }
  });

  processed.sort((a, b) => {
    return orderType === 'bids' ? b.price - a.price : a.price - b.price;
  });

  let cumSum = 0;
  let cumValue = 0;
  processed.forEach((order) => {
    cumSum += order.amount;
    cumValue += order.total;
    order.sumAmount = cumSum;
    order.sumValue = cumValue;
    order.avgPrice = cumSum > 0 ? cumValue / cumSum : 0;
  });

  return processed;
};

// ==== OFFER CHANGES PARSING (from OfferChanges.js) ====

function convertStringToHex(string) {
  let ret = '';
  try {
    ret = Buffer.from(string, 'utf8').toString('hex').toUpperCase();
  } catch (err) {}
  return ret;
}

export function configureMemos(type, format, data) {
  const Memo = {};

  if (type) Memo.MemoType = convertStringToHex(type);
  if (format) Memo.MemoFormat = convertStringToHex(format);
  if (data) Memo.MemoData = convertStringToHex(data);

  const Memos = [
    {
      Memo
    }
  ];

  return Memos;
}

function getPair(gets, pays) {
  const t1 = gets.issuer + '_' + gets.currency;
  const t2 = pays.issuer + '_' + pays.currency;
  let pair = t1 + t2;
  if (t1.localeCompare(t2) > 0) pair = t2 + t1;
  return CryptoJS.MD5(pair).toString();
}

function hasAffectedNodes(tx) {
  if (!tx) return false;
  const meta = tx.meta || tx.metaData;
  if (!meta) return false;
  if (meta.AffectedNodes === undefined) return false;
  if (meta.AffectedNodes?.length === 0) return false;
  return true;
}

function isCreateOfferNode(affectedNode) {
  return (
    affectedNode.CreatedNode?.LedgerEntryType === 'Offer' && affectedNode.CreatedNode?.NewFields
  );
}

function isModifyOfferNode(affectedNode) {
  return (
    affectedNode.ModifiedNode?.LedgerEntryType === 'Offer' && affectedNode.ModifiedNode?.FinalFields
  );
}

function isDeleteOfferNode(affectedNode) {
  return (
    affectedNode.DeletedNode?.LedgerEntryType === 'Offer' && affectedNode.DeletedNode?.FinalFields
  );
}

function parseCreateOfferNode(affectedNode, hash, time) {
  const field = affectedNode.CreatedNode.NewFields;
  const data = {
    status: 'created',
    account: field.Account,
    seq: field.Sequence,
    flags: field.Flags || 0,
    gets: parseAmount(field.TakerGets),
    pays: parseAmount(field.TakerPays)
  };

  data.pair = getPair(data.gets, data.pays);

  if (typeof field.Expiration === 'number') {
    data.expire = rippleToUnixTimestamp(field.Expiration);
  }

  data.chash = hash;
  data.ctime = time;

  return data;
}

function parseModifyOfferNode(affectedNode, hash, time) {
  const field = affectedNode.ModifiedNode.FinalFields;
  const data = {
    status: 'modified',
    account: field.Account,
    seq: field.Sequence,
    flags: field.Flags || 0,
    gets: parseAmount(field.TakerGets),
    pays: parseAmount(field.TakerPays)
  };

  data.pair = getPair(data.gets, data.pays);

  if (typeof field.Expiration === 'number') {
    data.expire = rippleToUnixTimestamp(field.Expiration);
  }

  data.mhash = hash;
  data.mtime = time;

  return data;
}

function parseDeleteOfferNode(affectedNode, hash, time) {
  const field = affectedNode.DeletedNode.FinalFields;
  const data = {
    status: 'deleted',
    account: field.Account,
    seq: field.Sequence
  };

  data.dhash = hash;
  data.dtime = time;

  return data;
}

export function parseOfferChanges(paramTx, close_time) {
  const changes = [];

  if (!hasAffectedNodes(paramTx)) {
    return [];
  }

  const hash = paramTx.hash || paramTx.transaction?.hash || paramTx.tx?.hash;
  const time = rippleToUnixTimestamp(close_time);
  const meta = paramTx.meta || paramTx.metaData;

  for (const affectedNode of meta.AffectedNodes) {
    if (isCreateOfferNode(affectedNode)) {
      changes.push(parseCreateOfferNode(affectedNode, hash, time));
    } else if (isModifyOfferNode(affectedNode)) {
      changes.push(parseModifyOfferNode(affectedNode, hash, time));
    } else if (isDeleteOfferNode(affectedNode)) {
      changes.push(parseDeleteOfferNode(affectedNode, hash, time));
    }
  }

  return changes;
}

export {
  parseQuality,
  hexToString,
  parseTimestamp,
  adjustQualityForXRP,
  isPartialPayment,
  dropsToXrp,
  xrpToDrops,
  toRippledAmount,
  removeUndefined,
  rippleToUnixTime,
  rippleToUnixTimestamp,
  rippleTimeToISO8601,
  iso8601ToRippleTime,
  isValidSecret,
  normalizeNodes,
  normalizeCurrencyCode,
  parseFlags,
  BLACKHOLE_ACCOUNTS
};
