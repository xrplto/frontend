import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useWebSocket from 'react-use-websocket';
import { update_metrics } from 'src/redux/statusSlice';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import Link from 'next/link';
import { rippleTimeToISO8601, dropsToXrp, normalizeCurrencyCode } from 'src/utils/parse/utils';
import { formatDistanceToNow } from 'date-fns';
import BigNumber from 'bignumber.js';
import CryptoJS from 'crypto-js';
import { getHashIcon } from 'src/utils/extra';

const ipfsToGateway = (uri) => {
  if (!uri || !uri.startsWith('ipfs://')) {
    return uri;
  }
  // Use a public IPFS gateway to display the image
  return `https://ipfs.io/ipfs/${uri.substring(7)}`;
};

const KNOWN_SOURCE_TAGS = {
  101102979: { name: 'xrp.cafe', url: 'https://xrp.cafe' }
};

// Helper to render key-value pairs and make certain values clickable
const JsonViewer = ({ data }) => (
  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#fff' }}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

const DetailRow = ({ label, children, ...props }) => (
  <Grid container item xs={12} sx={{ mb: 2, pb: 2, ...props }}>
    <Grid item xs={12} md={3}>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Grid>
    <Grid item xs={12} md={9}>
      {children}
    </Grid>
  </Grid>
);

const TokenTooltipContent = ({ md5, tokenInfo, loading, error }) => {
  if (error) return <Typography sx={{ p: 1 }}>{error}</Typography>;
  if (loading) return <Typography sx={{ p: 1 }}>Loading...</Typography>;
  if (!tokenInfo || tokenInfo.res !== 'success' || !tokenInfo.token)
    return <Typography sx={{ p: 1 }}>No data available.</Typography>;

  const { token } = tokenInfo;
  const imageUrl = md5 ? `https://s1.xrpl.to/token/${md5}` : null;

  return (
    <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
      {imageUrl && <Avatar src={imageUrl} sx={{ mr: 1.5, width: 48, height: 48 }} />}
      <Box>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          {token.name}
        </Typography>
        {token.issuer && (
          <Typography variant="caption">
            Issuer: {token.issuer.slice(0, 9)}...{token.issuer.slice(-5)}
          </Typography>
        )}
        {token.domain && <Typography variant="body2">Domain: {token.domain}</Typography>}
        {token.user && (
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            "{token.user}"
          </Typography>
        )}
        {token.tags && token.tags.length > 0 && (
          <Typography variant="body2">Tags: {token.tags.join(', ')}</Typography>
        )}
        {token.marketcap > 0 && (
          <Typography variant="body2">
            Market Cap: {new BigNumber(token.marketcap).toFormat(2)} XRP
          </Typography>
        )}
        {token.vol24h > 0 && (
          <Typography variant="body2">
            24h Volume: {new BigNumber(token.vol24h).toFormat(2)} XRP
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const TokenLinkWithTooltip = ({ slug, currency, rawCurrency, md5, variant = 'body1' }) => {
  const theme = useTheme();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLpToken = rawCurrency && rawCurrency.length === 40 && /^[A-F0-9]{40}$/i.test(rawCurrency);

  useEffect(() => {
    const fetchTokenName = async () => {
      if (isLpToken) {
        setLoading(true);
        try {
          const response = await axios.get(`https://api.xrpl.to/api/token/${md5}`);
          setTokenInfo(response.data);
        } catch (err) {
          console.error('Failed to fetch token info for LP token', err);
          setError('Could not load token data.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTokenName();
  }, [isLpToken, md5]);

  const handleFetchTokenInfo = async () => {
    if (tokenInfo || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://api.xrpl.to/api/token/${md5}`);
      setTokenInfo(response.data);
    } catch (err) {
      console.error('Failed to fetch token info', err);
      setError('Could not load token data.');
    } finally {
      setLoading(false);
    }
  };

  let displayText = currency;
  if (isLpToken) {
    if (loading) {
      displayText = '...';
    } else if (tokenInfo?.token) {
      displayText = tokenInfo.token.name || tokenInfo.token.user || 'LP Token';
    } else {
      displayText = 'LP Token';
    }
  }

  const link = (
    <Link href={`/token/${slug}`} passHref>
      <Typography
        component="a"
        variant={variant}
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          ml: 0.5
        }}
      >
        {displayText}
      </Typography>
    </Link>
  );

  return (
    <Tooltip
      title={
        <TokenTooltipContent md5={md5} tokenInfo={tokenInfo} loading={loading} error={error} />
      }
      onOpen={handleFetchTokenInfo}
      placement="top"
      arrow
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: `1px solid ${theme.palette.divider}`
          }
        }
      }}
    >
      {link}
    </Tooltip>
  );
};

const AccountAvatar = ({ account }) => {
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/account/${account}`);

  const handleImageError = () => {
    setImgSrc(getHashIcon(account));
  };

  return <Avatar src={imgSrc} onError={handleImageError} sx={{ width: 32, height: 32, mr: 1 }} />;
};

const TokenDisplay = ({ slug, currency, rawCurrency, variant = 'body1' }) => {
  const stringToHash = slug.replace('-', '_');
  const md5 = CryptoJS.MD5(stringToHash).toString();
  const imageUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar src={imageUrl} sx={{ width: 20, height: 20, mr: 0.5 }} />
      <TokenLinkWithTooltip
        slug={slug}
        currency={currency}
        rawCurrency={rawCurrency}
        md5={md5}
        variant={variant}
      />
    </Box>
  );
};

const AmountDisplay = ({ amount, variant = 'body1' }) => {
  const theme = useTheme();
  if (typeof amount === 'string') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar
          src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
          sx={{ width: 20, height: 20, mr: 0.5 }}
        />
        <Typography variant={variant}>{dropsToXrp(amount)} XRP</Typography>
      </Box>
    );
  }
  if (typeof amount === 'object') {
    const currency = normalizeCurrencyCode(amount.currency);
    const slug = amount.issuer ? `${amount.issuer}-${amount.currency}` : null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant={variant} component="span">
          {new BigNumber(amount.value).toFormat()}{' '}
        </Typography>
        {slug ? (
          <TokenDisplay
            slug={slug}
            currency={currency}
            rawCurrency={amount.currency}
            variant={variant}
          />
        ) : (
          <Typography
            variant={variant}
            component="span"
            sx={{ color: theme.palette.primary.main, ml: 0.5 }}
          >
            {currency}
          </Typography>
        )}
      </Box>
    );
  }
  return null;
};

function getPaymentFlagExplanation(flags) {
  const explanations = [];
  if (flags & 0x00020000)
    // tfPartialPayment
    explanations.push({
      title: 'Allow partial payment',
      description:
        'The payment is allowed to be partially executed, delivering less than the Amount.'
    });
  if (flags & 0x00010000)
    // tfNoDirectRipple
    explanations.push({
      title: 'No direct ripple',
      description: 'The payment is not allowed to use a direct path between sender and receiver.'
    });
  return explanations;
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TransactionDetails = ({ txData, theme }) => {
  const [moreVisible, setMoreVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [rawVisible, setRawVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const {
    hash,
    ledger_index,
    meta,
    TransactionType,
    date,
    Account,
    Sequence,
    TakerGets,
    TakerPays,
    Fee,
    Flags,
    LastLedgerSequence,
    ctid,
    Amount,
    Destination,
    SendMax,
    Paths,
    Memos,
    SourceTag,
    OfferSequence,
    LimitAmount,
    Amount2,
    Asset,
    Asset2,
    NFTokenOffers,
    NFTokenTaxon,
    TransferFee,
    URI,
    OracleDocumentID,
    LastUpdateTime,
    PriceDataSeries,
    Provider,
    LPTokenIn,
    NFTokenSellOffer,
    NFTokenBuyOffer,
    NFTokenID
  } = txData;

  const clientInfo = KNOWN_SOURCE_TAGS[SourceTag];

  const { meta: metaToExclude, ...rawData } = txData;
  const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;

  const txUrl = `https://xrpl.to/tx/${hash}`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(txUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const txResult = meta?.TransactionResult;
  const transactionIndex = meta?.TransactionIndex;

  const [acceptedNftInfo, setAcceptedNftInfo] = useState(null);
  const [nftInfoLoading, setNftInfoLoading] = useState(false);
  const [offerNftInfo, setOfferNftInfo] = useState(null);
  const [offerNftInfoLoading, setOfferNftInfoLoading] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrency = (amount) => {
    if (typeof amount === 'string') return 'XRP';
    if (typeof amount === 'object' && amount && amount.currency) {
      return normalizeCurrencyCode(amount.currency);
    }
    return 'XRP';
  };

  const isConversion =
    TransactionType === 'Payment' &&
    (Boolean(Paths) || (SendMax && getCurrency(Amount) !== getCurrency(SendMax)));

  const getBalanceChanges = () => {
    if (!meta || !meta.AffectedNodes) return { balanceChanges: [], exchanges: [] };

    const balanceChanges = {};
    const exchanges = [];

    for (const affectedNode of meta.AffectedNodes) {
      const node = affectedNode.ModifiedNode || affectedNode.DeletedNode;
      if (!node || !node.LedgerEntryType) continue;

      const finalFields = node.FinalFields || {};
      const previousFields = node.PreviousFields || {};

      if (node.LedgerEntryType === 'AccountRoot' && previousFields.Balance) {
        const account = finalFields.Account;
        const change = new BigNumber(finalFields.Balance).minus(previousFields.Balance);
        if (!balanceChanges[account]) balanceChanges[account] = [];
        balanceChanges[account].push({ currency: 'XRP', value: dropsToXrp(change.toString()) });
      } else if (node.LedgerEntryType === 'RippleState' && previousFields.Balance) {
        const lowAccount = finalFields.LowLimit.issuer;
        const highAccount = finalFields.HighLimit.issuer;
        const currency = finalFields.Balance.currency;
        const finalBalance = new BigNumber(finalFields.Balance.value);
        const prevBalance = new BigNumber(previousFields.Balance?.value || 0);
        const change = finalBalance.minus(prevBalance);

        if (!change.isZero()) {
          const normCurr = normalizeCurrencyCode(currency);

          let issuer = highAccount;
          // If balance is negative, the low account is the issuer.
          if (new BigNumber(finalFields.Balance.value).isNegative()) {
            issuer = lowAccount;
          } else if (
            finalBalance.isZero() &&
            previousFields.Balance &&
            new BigNumber(previousFields.Balance.value).isNegative()
          ) {
            // If final balance is 0 and previous was negative, low account was issuer.
            issuer = lowAccount;
          }

          if (!balanceChanges[lowAccount]) balanceChanges[lowAccount] = [];
          balanceChanges[lowAccount].push({
            currency: normCurr,
            rawCurrency: currency,
            value: change.toString(),
            issuer
          });

          if (!balanceChanges[highAccount]) balanceChanges[highAccount] = [];
          balanceChanges[highAccount].push({
            currency: normCurr,
            rawCurrency: currency,
            value: change.negated().toString(),
            issuer
          });
        }
      } else if (
        node.LedgerEntryType === 'Offer' &&
        node.PreviousFields?.TakerPays &&
        node.PreviousFields?.TakerGets
      ) {
        const maker = node.FinalFields.Account;

        const prevPays = node.PreviousFields.TakerPays;
        const finalPays = node.FinalFields.TakerPays;
        const prevGets = node.PreviousFields.TakerGets;
        const finalGets = node.FinalFields.TakerGets;

        const paid =
          typeof prevPays === 'object'
            ? new BigNumber(prevPays.value || 0).minus(finalPays.value || 0)
            : new BigNumber(prevPays || 0).minus(finalPays || 0);

        const got =
          typeof prevGets === 'object'
            ? new BigNumber(prevGets.value || 0).minus(finalGets.value || 0)
            : new BigNumber(prevGets || 0).minus(finalGets || 0);

        if (!paid.isZero() && !got.isZero()) {
          const paidAmount = {};
          if (typeof finalPays === 'object') {
            paidAmount.value = paid.toString();
            paidAmount.currency = normalizeCurrencyCode(finalPays.currency);
            paidAmount.rawCurrency = finalPays.currency;
            paidAmount.issuer = finalPays.issuer;
          } else {
            paidAmount.value = dropsToXrp(paid.toString());
            paidAmount.currency = 'XRP';
          }

          const gotAmount = {};
          if (typeof finalGets === 'object') {
            gotAmount.value = got.toString();
            gotAmount.currency = normalizeCurrencyCode(finalGets.currency);
            gotAmount.rawCurrency = finalGets.currency;
            gotAmount.issuer = finalGets.issuer;
          } else {
            gotAmount.value = dropsToXrp(got.toString());
            gotAmount.currency = 'XRP';
          }

          exchanges.push({ maker, paid: paidAmount, got: gotAmount });
        }
      }
    }

    const finalChanges = Object.entries(balanceChanges).map(([account, changes]) => ({
      account,
      changes
    }));
    return { balanceChanges: finalChanges, exchanges };
  };

  const getCancelledOfferDetails = () => {
    if (TransactionType !== 'OfferCancel' || !meta || !meta.AffectedNodes) {
      return null;
    }
    const deletedOfferNode = meta.AffectedNodes.find(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'Offer'
    );
    if (deletedOfferNode) {
      return deletedOfferNode.DeletedNode.FinalFields;
    }
    return null;
  };

  const acceptedOfferDetails = useMemo(() => {
    if (TransactionType !== 'NFTokenAcceptOffer' || !meta || !meta.AffectedNodes) {
      return null;
    }
    const offerNode = meta.AffectedNodes.find(
      (node) => node.DeletedNode && node.DeletedNode.LedgerEntryType === 'NFTokenOffer'
    );
    if (offerNode) {
      const { NFTokenID, Owner, Destination } = offerNode.DeletedNode.FinalFields;
      let uri = null;

      for (const affectedNode of meta.AffectedNodes) {
        const node = affectedNode.ModifiedNode || affectedNode.DeletedNode;
        if (node?.LedgerEntryType === 'NFTokenPage') {
          const nftList = node.PreviousFields?.NFTokens || node.FinalFields?.NFTokens;
          if (nftList) {
            const nft = nftList.find((item) => item.NFToken.NFTokenID === NFTokenID);
            if (nft?.NFToken.URI) {
              uri = nft.NFToken.URI;
              break;
            }
          }
        }
      }

      return {
        nftokenID: NFTokenID,
        seller: Owner,
        buyer: Destination || Account,
        uri
      };
    }
    return null;
  }, [TransactionType, meta, Account]);

  useEffect(() => {
    if (acceptedOfferDetails?.nftokenID) {
      const fetchNftInfo = async () => {
        setNftInfoLoading(true);
        try {
          const response = await axios.get(
            `https://api.xrpnft.com/api/nft/${acceptedOfferDetails.nftokenID}`
          );
          if (response.data.res === 'success') {
            setAcceptedNftInfo(response.data.nft);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            // NFT not found via API, this is handled gracefully by falling back to metadata.
          } else {
            console.error('Failed to fetch accepted NFT info', err);
          }
        } finally {
          setNftInfoLoading(false);
        }
      };
      fetchNftInfo();
    }
  }, [acceptedOfferDetails]);

  useEffect(() => {
    if (TransactionType === 'NFTokenCreateOffer' && NFTokenID) {
      const fetchNftInfo = async () => {
        setOfferNftInfoLoading(true);
        try {
          const response = await axios.get(`https://api.xrpnft.com/api/nft/${NFTokenID}`);
          if (response.data.res === 'success') {
            setOfferNftInfo(response.data.nft);
          }
        } catch (err) {
          // silent fail is ok
        } finally {
          setOfferNftInfoLoading(false);
        }
      };
      fetchNftInfo();
    }
  }, [TransactionType, NFTokenID]);

  const { balanceChanges, exchanges } = getBalanceChanges();

  const initiatorChanges = balanceChanges.find((bc) => bc.account === Account);

  let conversionExchange;
  if (isConversion && exchanges.length === 0 && deliveredAmount) {
    // Find initiator's XRP balance change
    const initiatorXrpChange = balanceChanges
      .find((bc) => bc.account === Account)
      ?.changes.find((c) => c.currency === 'XRP');

    if (initiatorXrpChange) {
      const paidValue = new BigNumber(initiatorXrpChange.value).abs().minus(dropsToXrp(Fee));

      conversionExchange = {
        paid: {
          value: paidValue.toString(),
          currency: 'XRP'
        },
        got: {
          value: deliveredAmount.value,
          currency: normalizeCurrencyCode(deliveredAmount.currency),
          rawCurrency: deliveredAmount.currency,
          issuer: deliveredAmount.issuer
        }
      };
    }
  }

  const cancelledOffer = getCancelledOfferDetails();
  const trustSetState = useMemo(() => {
    if (TransactionType !== 'TrustSet' || !meta || !meta.AffectedNodes) {
      return null;
    }

    const rippleStateNode = meta.AffectedNodes.find((node) => {
      const n = node.ModifiedNode || node.DeletedNode || node.CreatedNode;
      return n && n.LedgerEntryType === 'RippleState';
    });

    if (!rippleStateNode) return null;

    let fields;
    if (rippleStateNode.CreatedNode) {
      fields = rippleStateNode.CreatedNode.NewFields;
    } else {
      const node = rippleStateNode.ModifiedNode || rippleStateNode.DeletedNode;
      fields = rippleStateNode.DeletedNode ? node.PreviousFields : node.FinalFields;
    }

    if (!fields || typeof fields.Flags === 'undefined' || !fields.LowLimit) return null;

    const flags = fields.Flags;
    const lowIssuer = fields.LowLimit.issuer;
    const isLowAccount = Account === lowIssuer;

    const noRipple = isLowAccount ? (flags & 0x00100000) !== 0 : (flags & 0x00200000) !== 0;
    const frozen = isLowAccount ? (flags & 0x00400000) !== 0 : (flags & 0x00800000) !== 0;
    const authorized = isLowAccount ? (flags & 0x00040000) !== 0 : (flags & 0x00080000) !== 0;

    return {
      rippling: !noRipple,
      frozen,
      authorized
    };
  }, [TransactionType, meta, Account]);

  const getFlagExplanation = (flags, type) => {
    const explanations = [];
    if (type === 'OfferCreate') {
      if (flags & 0x00010000)
        explanations.push(
          'Passive: The offer does not consume offers that exactly match the price. It will be killed if it crosses the spread.'
        );
      if (flags & 0x00020000)
        explanations.push(
          'Immediate or Cancel: The offer executes immediately against existing offers, or is canceled.'
        );
      if (flags & 0x00040000)
        explanations.push('Fill or Kill: The offer must be fully filled or it is killed.');
      if (flags & 0x00080000) explanations.push('Sell: The offer is a sell offer.');
    }
    return explanations;
  };

  const getNFTokenMintFlagExplanation = (flags) => {
    const explanations = [];
    if (flags & 1) explanations.push('Burnable');
    if (flags & 2) explanations.push('OnlyXRP');
    if (flags & 8) explanations.push('Transferable');
    return explanations.join(', ');
  };

  const getAMMWithdrawFlagExplanation = (flags) => {
    if (flags & 0x00010000) return 'Withdraw all tokens';
    if (flags & 0x00100000) return 'Withdraw single asset by LP amount';
    if (flags & 0x00040000) return 'Withdraw single asset by asset amount';
    if (flags & 0x00200000) return 'Withdraw up to LP amount';
    return null;
  };

  const flagExplanations =
    TransactionType === 'Payment'
      ? getPaymentFlagExplanation(Flags)
      : getFlagExplanation(Flags, TransactionType);

  const mainExchange = exchanges.find((e) => e.maker === Account);
  let displayExchange = mainExchange || conversionExchange;

  if (
    !displayExchange &&
    TransactionType === 'OfferCreate' &&
    initiatorChanges?.changes.length >= 2
  ) {
    const changes = initiatorChanges.changes;
    const paidChange = changes.find((c) => new BigNumber(c.value).isNegative());
    const gotChange = changes.find((c) => new BigNumber(c.value).isPositive());

    if (paidChange && gotChange) {
      const paidValue = new BigNumber(paidChange.value).abs();
      const gotValue = new BigNumber(gotChange.value);

      let gotAmountFromChanges;
      if (gotChange.currency === 'XRP') {
        gotAmountFromChanges = gotValue.plus(dropsToXrp(Fee));
      } else {
        gotAmountFromChanges = gotValue;
      }

      let paidAmountFromChanges;
      if (paidChange.currency === 'XRP') {
        paidAmountFromChanges = paidValue.minus(dropsToXrp(Fee));
      } else {
        paidAmountFromChanges = paidValue;
      }

      displayExchange = {
        paid: {
          value: paidAmountFromChanges.toString(),
          currency: paidChange.currency,
          rawCurrency: paidChange.rawCurrency,
          issuer: paidChange.issuer
        },
        got: {
          value: gotAmountFromChanges.toString(),
          currency: gotChange.currency,
          rawCurrency: gotChange.rawCurrency,
          issuer: gotChange.issuer
        }
      };
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const isSuccess = txResult === 'tesSUCCESS';

  let failureReason = {};
  if (!isSuccess) {
    if (txResult === 'tecPATH_DRY') {
      failureReason = {
        title: 'Path dry',
        description:
          'The transaction failed because the provided paths did not have enough liquidity to send anything at all. This could mean that the source and destination accounts are not linked by trust lines.'
      };
    } else if (txResult === 'tecUNFUNDED_PAYMENT') {
      failureReason = {
        title: 'Unfunded payment',
        description:
          'The transaction failed because the sending account is trying to send more XRP than it holds, not counting the reserve.'
      };
    } else {
      failureReason = {
        title: 'Transaction Failed',
        description: `The transaction failed with result code: ${txResult}`
      };
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: '24px',
        background: 'transparent',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" sx={{ wordBreak: 'break-all' }}>
          {hash}
        </Typography>
        <Tooltip title={copied ? 'Copied!' : 'Copy Hash'}>
          <IconButton onClick={copyToClipboard} size="small" sx={{ ml: 1 }}>
            <FileCopyOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        The transaction was{' '}
        <Typography component="span" color={isSuccess ? 'success.main' : 'error.main'}>
          {isSuccess ? 'successful' : 'FAILED'}
        </Typography>{' '}
        and {isSuccess ? 'validated' : 'included'} in ledger{' '}
        <Link href={`/ledgers/${ledger_index}`} passHref>
          <Typography component="a" color="primary.main">
            #{ledger_index}
          </Typography>
        </Link>{' '}
        (index: {transactionIndex}).
      </Typography>

      <Grid container>
        <DetailRow label="Type">
          <Typography variant="body1">
            {TransactionType === 'OfferCreate'
              ? `OfferCreate - ${Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
              : TransactionType === 'NFTokenCreateOffer'
                ? `NFTokenCreateOffer - ${Flags & 1 ? 'Sell' : 'Buy'} Offer`
                : TransactionType === 'OfferCancel' && cancelledOffer
                  ? `OfferCancel - ${cancelledOffer.Flags & 0x00080000 ? 'Sell' : 'Buy'} Order`
                  : isConversion
                    ? 'Conversion Payment'
                    : TransactionType}
          </Typography>
        </DetailRow>
        <DetailRow label={isSuccess ? 'Validated' : 'Rejected'}>
          <Typography variant="body1">
            {formatDistanceToNow(new Date(rippleTimeToISO8601(date)))} ago (
            {new Date(rippleTimeToISO8601(date)).toLocaleString()})
          </Typography>
        </DetailRow>
        {TransactionType === 'Payment' && (
          <>
            {isConversion && Account === Destination ? (
              <DetailRow label="Address">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountAvatar account={Account} />
                  <Link href={`/profile/${Account}`} passHref>
                    <Typography
                      component="a"
                      variant="body1"
                      sx={{
                        color: theme.palette.primary.main,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {Account}
                    </Typography>
                  </Link>
                </Box>
              </DetailRow>
            ) : (
              <>
                <DetailRow label="Source">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountAvatar account={Account} />
                    <Link href={`/profile/${Account}`} passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {Account}
                      </Typography>
                    </Link>
                  </Box>
                </DetailRow>
                <DetailRow label="Destination">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountAvatar account={Destination} />
                    <Link href={`/profile/${Destination}`} passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {Destination}
                      </Typography>
                    </Link>
                  </Box>
                </DetailRow>
              </>
            )}

            {!isConversion ? (
              <DetailRow label={deliveredAmount ? 'Delivered Amount' : 'Amount'}>
                <AmountDisplay amount={deliveredAmount || Amount} />
              </DetailRow>
            ) : (
              !displayExchange &&
              isSuccess && (
                <DetailRow label="Amount">
                  <AmountDisplay amount={deliveredAmount || Amount} />
                </DetailRow>
              )
            )}
            {SendMax && (
              <DetailRow label="Max amount">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    It was instructed to spend up to
                  </Typography>
                  <AmountDisplay amount={SendMax} />
                </Box>
              </DetailRow>
            )}
          </>
        )}
        {TransactionType === 'OfferCreate' && (
          <>
            <DetailRow label="Offer Maker">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            <DetailRow label="Offer Sequence">
              <Typography variant="body1">#{Sequence}</Typography>
            </DetailRow>
            <DetailRow label="Taker Gets">
              <AmountDisplay amount={TakerGets} />
            </DetailRow>
            <DetailRow label="Taker Pays">
              <AmountDisplay amount={TakerPays} />
            </DetailRow>

            {OfferSequence > 0 && (
              <DetailRow label="Offer to Cancel">
                <Typography variant="body1">#{OfferSequence}</Typography>
              </DetailRow>
            )}

            <DetailRow label={Flags & 0x00080000 ? 'Sell Order' : 'Buy Order'}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>
                  {Flags & 0x00080000
                    ? 'The priority is to fully Sell'
                    : 'The priority is to Buy only'}
                </Typography>
                <AmountDisplay
                  amount={Flags & 0x00080000 ? TakerGets : TakerPays}
                  variant="body2"
                />
                <Typography variant="body2" component="span" sx={{ ml: 0.5, mr: 0.5 }}>
                  {Flags & 0x00080000
                    ? ', even if doing so results in receiving more than'
                    : ', not need to spend'}
                </Typography>
                <AmountDisplay
                  amount={Flags & 0x00080000 ? TakerPays : TakerGets}
                  variant="body2"
                />
                {!(Flags & 0x00080000) && (
                  <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                    fully.
                  </Typography>
                )}
              </Box>
            </DetailRow>
          </>
        )}

        {TransactionType === 'OfferCancel' && cancelledOffer && (
          <>
            <DetailRow label="Offer Maker">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            <DetailRow label="Taker Gets">
              <AmountDisplay amount={cancelledOffer.TakerGets} />
            </DetailRow>
            <DetailRow label="Taker Pays">
              <AmountDisplay amount={cancelledOffer.TakerPays} />
            </DetailRow>
            <DetailRow label="Offer Sequence">
              <Typography variant="body1">#{OfferSequence}</Typography>
            </DetailRow>
            <DetailRow label="Offer Status">
              <Typography variant="body1">Cancelled</Typography>
            </DetailRow>
          </>
        )}

        {TransactionType === 'TrustSet' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            {LimitAmount && (
              <>
                <DetailRow label="Trust to the issuer">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountAvatar account={LimitAmount.issuer} />
                    <Link href={`/profile/${LimitAmount.issuer}`} passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {LimitAmount.issuer}
                      </Typography>
                    </Link>
                  </Box>
                </DetailRow>
                <DetailRow label="Limit">
                  <AmountDisplay amount={LimitAmount} />
                </DetailRow>
              </>
            )}
            {trustSetState && (
              <>
                <DetailRow label="Rippling">
                  <Typography variant="body1">
                    {trustSetState.rippling ? 'Enabled' : 'Disabled'}
                  </Typography>
                </DetailRow>
                <DetailRow label="Frozen">
                  <Typography variant="body1">{trustSetState.frozen ? 'Yes' : 'No'}</Typography>
                </DetailRow>
                <DetailRow label="Authorized">
                  <Typography variant="body1">{trustSetState.authorized ? 'Yes' : 'No'}</Typography>
                </DetailRow>
              </>
            )}
          </>
        )}

        {TransactionType === 'AMMDeposit' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            {(Amount || Amount2) && (
              <DetailRow label="Amount Deposited">
                {Amount && <AmountDisplay amount={Amount} />}
                {Amount2 && <AmountDisplay amount={Amount2} />}
              </DetailRow>
            )}
          </>
        )}

        {TransactionType === 'NFTokenCancelOffer' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            {NFTokenOffers && NFTokenOffers.length > 0 && (
              <DetailRow label={NFTokenOffers.length > 1 ? 'Offers' : 'Offer'}>
                {NFTokenOffers.map((offer) => (
                  <Typography key={offer} variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {offer}
                  </Typography>
                ))}
              </DetailRow>
            )}
          </>
        )}

        {TransactionType === 'NFTokenAcceptOffer' && acceptedOfferDetails && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            {NFTokenSellOffer && (
              <DetailRow label="Sell Offer">
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {NFTokenSellOffer}
                </Typography>
              </DetailRow>
            )}
            {NFTokenBuyOffer && (
              <DetailRow label="Buy Offer">
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {NFTokenBuyOffer}
                </Typography>
              </DetailRow>
            )}
            <DetailRow label="Transfer from">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={acceptedOfferDetails.seller} />
                <Link href={`/profile/${acceptedOfferDetails.seller}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {acceptedOfferDetails.seller}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            <DetailRow label="Transfer to">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={acceptedOfferDetails.buyer} />
                <Link href={`/profile/${acceptedOfferDetails.buyer}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {acceptedOfferDetails.buyer}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            <DetailRow label="NFT Data">
              {nftInfoLoading ? (
                <Typography>Loading NFT data...</Typography>
              ) : acceptedNftInfo ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    {acceptedNftInfo.meta?.image && (
                      <Box
                        component="img"
                        src={ipfsToGateway(acceptedNftInfo.meta.image)}
                        alt={acceptedNftInfo.meta?.name || 'NFT Image'}
                        sx={{
                          width: '100%',
                          maxWidth: '220px',
                          borderRadius: 2
                        }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Link href={`/nft/${acceptedNftInfo.NFTokenID}`} passHref>
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            wordBreak: 'break-all'
                          }}
                        >
                          {acceptedNftInfo.NFTokenID}
                        </Typography>
                      </Link>
                    </DetailRow>
                    <DetailRow label="Issuer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={acceptedNftInfo.issuer} />
                        <Link href={`/profile/${acceptedNftInfo.issuer}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {acceptedNftInfo.issuer}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                    {typeof acceptedNftInfo.royalty !== 'undefined' && (
                      <DetailRow label="Transfer Fee" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                        <Typography variant="body1">{acceptedNftInfo.royalty / 1000}%</Typography>
                      </DetailRow>
                    )}
                    <DetailRow label="Flag" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">
                        {getNFTokenMintFlagExplanation(acceptedNftInfo.flag)}
                      </Typography>
                    </DetailRow>
                    <DetailRow label="NFT Taxon" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">{acceptedNftInfo.taxon}</Typography>
                    </DetailRow>
                    {(() => {
                      const decodedUri =
                        acceptedNftInfo.meta?.image ||
                        (acceptedNftInfo.URI
                          ? CryptoJS.enc.Hex.parse(acceptedNftInfo.URI).toString(CryptoJS.enc.Utf8)
                          : null);
                      if (!decodedUri) return null;
                      return (
                        <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                          <Link
                            href={decodedUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            passHref
                          >
                            <Typography
                              component="a"
                              variant="body1"
                              sx={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                                wordBreak: 'break-all'
                              }}
                            >
                              {decodedUri}
                            </Typography>
                          </Link>
                        </DetailRow>
                      );
                    })()}
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={1}>
                  <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                    <Link href={`/nft/${acceptedOfferDetails.nftokenID}`} passHref>
                      <Typography
                        component="a"
                        variant="body1"
                        sx={{
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          wordBreak: 'break-all'
                        }}
                      >
                        {acceptedOfferDetails.nftokenID}
                      </Typography>
                    </Link>
                  </DetailRow>
                  {(() => {
                    const decodedUri = acceptedOfferDetails.uri
                      ? CryptoJS.enc.Hex.parse(acceptedOfferDetails.uri).toString(CryptoJS.enc.Utf8)
                      : null;
                    if (!decodedUri) return null;
                    return (
                      <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                        <Link href={decodedUri} target="_blank" rel="noopener noreferrer" passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                              wordBreak: 'break-all'
                            }}
                          >
                            {decodedUri}
                          </Typography>
                        </Link>
                      </DetailRow>
                    );
                  })()}
                </Grid>
              )}
            </DetailRow>
          </>
        )}

        {TransactionType === 'NFTokenCreateOffer' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>

            {offerNftInfoLoading ? (
              <DetailRow label="NFT">
                <Typography>Loading NFT data...</Typography>
              </DetailRow>
            ) : offerNftInfo ? (
              <DetailRow label="NFT Data">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    {offerNftInfo.meta?.image && (
                      <Box
                        component="img"
                        src={ipfsToGateway(offerNftInfo.meta.image)}
                        alt={offerNftInfo.meta?.name || 'NFT Image'}
                        sx={{
                          width: '100%',
                          maxWidth: '220px',
                          borderRadius: 2
                        }}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Link href={`/nft/${offerNftInfo.NFTokenID}`} passHref>
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            wordBreak: 'break-all'
                          }}
                        >
                          {offerNftInfo.NFTokenID}
                        </Typography>
                      </Link>
                    </DetailRow>
                    <DetailRow label="Issuer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={offerNftInfo.issuer} />
                        <Link href={`/profile/${offerNftInfo.issuer}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {offerNftInfo.issuer}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                  </Grid>
                </Grid>
              </DetailRow>
            ) : (
              <DetailRow label="NFT">
                <Link href={`/nft/${NFTokenID}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {NFTokenID}
                  </Typography>
                </Link>
              </DetailRow>
            )}

            <DetailRow label="NFT Offer Details">
              <Paper sx={{ p: 2, width: '100%' }}>
                <Grid container spacing={1}>
                  {meta.offer_id && (
                    <DetailRow label="Offer" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {meta.offer_id}
                      </Typography>
                    </DetailRow>
                  )}
                  <DetailRow label="Amount" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                    <AmountDisplay amount={Amount} />
                  </DetailRow>
                  {Destination && (
                    <DetailRow label="Destination" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountAvatar account={Destination} />
                        <Link href={`/profile/${Destination}`} passHref>
                          <Typography
                            component="a"
                            variant="body1"
                            sx={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {Destination}
                          </Typography>
                        </Link>
                      </Box>
                    </DetailRow>
                  )}
                </Grid>
              </Paper>
            </DetailRow>
          </>
        )}

        {TransactionType === 'NFTokenMint' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>

            <DetailRow label="NFT Data">
              <Paper sx={{ p: 2, width: '100%' }}>
                <Grid container spacing={1}>
                  {meta.nftoken_id && (
                    <DetailRow label="NFT" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Link href={`/nft/${meta.nftoken_id}`} passHref>
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            wordBreak: 'break-all'
                          }}
                        >
                          {meta.nftoken_id}
                        </Typography>
                      </Link>
                    </DetailRow>
                  )}
                  {typeof TransferFee !== 'undefined' && (
                    <DetailRow label="Transfer Fee" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">{TransferFee / 1000}%</Typography>
                    </DetailRow>
                  )}
                  {Flags > 0 && (
                    <DetailRow label="Flag" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">
                        {getNFTokenMintFlagExplanation(Flags)}
                      </Typography>
                    </DetailRow>
                  )}
                  {typeof NFTokenTaxon !== 'undefined' && (
                    <DetailRow label="NFT Taxon" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">{NFTokenTaxon}</Typography>
                    </DetailRow>
                  )}
                  {URI && (
                    <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Link
                        href={CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                        target="_blank"
                        rel="noopener noreferrer"
                        passHref
                      >
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            wordBreak: 'break-all'
                          }}
                        >
                          {CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                        </Typography>
                      </Link>
                    </DetailRow>
                  )}
                </Grid>
              </Paper>
            </DetailRow>
          </>
        )}

        {TransactionType === 'OracleSet' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>

            <DetailRow label="Oracle Data">
              <Paper sx={{ p: 2, width: '100%' }}>
                <Grid container spacing={1}>
                  {typeof OracleDocumentID !== 'undefined' && (
                    <DetailRow label="Document ID" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">{OracleDocumentID}</Typography>
                    </DetailRow>
                  )}
                  {Provider && (
                    <DetailRow label="Provider" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">
                        {CryptoJS.enc.Hex.parse(Provider).toString(CryptoJS.enc.Utf8)}
                      </Typography>
                    </DetailRow>
                  )}
                  {typeof LastUpdateTime !== 'undefined' && (
                    <DetailRow label="Last Update Time" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Typography variant="body1">
                        {formatDistanceToNow(new Date(LastUpdateTime * 1000))} ago (
                        {new Date(LastUpdateTime * 1000).toLocaleString()})
                      </Typography>
                    </DetailRow>
                  )}
                  {URI && (
                    <DetailRow label="URI" sx={{ mb: 1, pb: 1, borderBottom: 'none' }}>
                      <Link
                        href={CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                        target="_blank"
                        rel="noopener noreferrer"
                        passHref
                      >
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                            wordBreak: 'break-all'
                          }}
                        >
                          {CryptoJS.enc.Hex.parse(URI).toString(CryptoJS.enc.Utf8)}
                        </Typography>
                      </Link>
                    </DetailRow>
                  )}
                </Grid>
              </Paper>
            </DetailRow>

            {PriceDataSeries && PriceDataSeries.length > 0 && (
              <DetailRow label="Price Data Series">
                <Box>
                  {PriceDataSeries.map((series, index) => {
                    const { AssetPrice, BaseAsset, QuoteAsset, Scale } = series.PriceData;
                    if (!AssetPrice) return null;
                    const price = new BigNumber(parseInt(AssetPrice, 16)).dividedBy(
                      new BigNumber(10).pow(Scale)
                    );
                    const base = BaseAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(BaseAsset);
                    const quote = QuoteAsset === 'XRP' ? 'XRP' : normalizeCurrencyCode(QuoteAsset);
                    return (
                      <Typography key={index} variant="body2">
                        1 {base} = {price.toFormat()} {quote}
                      </Typography>
                    );
                  })}
                </Box>
              </DetailRow>
            )}
          </>
        )}

        {TransactionType === 'AMMWithdraw' && (
          <>
            <DetailRow label="Initiated by">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountAvatar account={Account} />
                <Link href={`/profile/${Account}`} passHref>
                  <Typography
                    component="a"
                    variant="body1"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {Account}
                  </Typography>
                </Link>
              </Box>
            </DetailRow>
            {LPTokenIn && (
              <DetailRow label="LP Tokens Withdrawn">
                <AmountDisplay amount={LPTokenIn} />
              </DetailRow>
            )}
            {Flags > 0 && getAMMWithdrawFlagExplanation(Flags) && (
              <DetailRow label="Withdrawal Mode">
                <Typography variant="body1">{getAMMWithdrawFlagExplanation(Flags)}</Typography>
              </DetailRow>
            )}
          </>
        )}

        {displayExchange && isSuccess && (
          <>
            <DetailRow label="Exchanged">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" color="error.main">
                  -{new BigNumber(displayExchange.paid.value).toFormat()}
                </Typography>
                {displayExchange.paid.rawCurrency ? (
                  <TokenDisplay
                    slug={`${displayExchange.paid.issuer}-${displayExchange.paid.rawCurrency}`}
                    currency={displayExchange.paid.currency}
                    rawCurrency={displayExchange.paid.rawCurrency}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                    <Avatar
                      src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                      sx={{ width: 20, height: 20, mr: 0.5 }}
                    />
                    <Typography variant="body1" component="span">
                      {displayExchange.paid.currency}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" color="success.main">
                  +{new BigNumber(displayExchange.got.value).toFormat()}
                </Typography>
                {displayExchange.got.rawCurrency ? (
                  <TokenDisplay
                    slug={`${displayExchange.got.issuer}-${displayExchange.got.rawCurrency}`}
                    currency={displayExchange.got.currency}
                    rawCurrency={displayExchange.got.rawCurrency}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                    <Avatar
                      src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                      sx={{ width: 20, height: 20, mr: 0.5 }}
                    />
                    <Typography variant="body1" component="span">
                      {displayExchange.got.currency}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DetailRow>
            <DetailRow label="Rate">
              <Typography variant="body2">
                1 {displayExchange.got.currency} ={' '}
                {new BigNumber(displayExchange.paid.value)
                  .div(displayExchange.got.value)
                  .toFormat()}{' '}
                {displayExchange.paid.currency}
              </Typography>
              <Typography variant="body2">
                1 {displayExchange.paid.currency} ={' '}
                {new BigNumber(displayExchange.got.value)
                  .div(displayExchange.paid.value)
                  .toFormat()}{' '}
                {displayExchange.got.currency}
              </Typography>
            </DetailRow>
          </>
        )}

        {flagExplanations.length > 0 && TransactionType === 'Payment' ? (
          flagExplanations.map((flag, i) => (
            <DetailRow key={i} label={flag.title}>
              <Typography variant="body2">{flag.description}</Typography>
            </DetailRow>
          ))
        ) : flagExplanations.length > 0 ? (
          <DetailRow label={TransactionType + ' Flags'}>
            {flagExplanations.map((text, i) => (
              <Typography key={i} variant="body2">
                {text}
              </Typography>
            ))}
          </DetailRow>
        ) : null}

        <DetailRow label="Ledger Fee">
          <AmountDisplay amount={Fee} />
        </DetailRow>

        {clientInfo && (
          <DetailRow label="Client">
            <Link href={clientInfo.url} target="_blank" rel="noopener noreferrer" passHref>
              <Typography
                component="a"
                variant="body1"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {clientInfo.name}
              </Typography>
            </Link>
          </DetailRow>
        )}

        {!isSuccess && failureReason.title && (
          <>
            <DetailRow label="Failure">
              <Typography variant="body1">{failureReason.title}</Typography>
            </DetailRow>
            <DetailRow label="Description">
              <Typography variant="body2">{failureReason.description}</Typography>
            </DetailRow>
          </>
        )}

        {Memos && Memos.length > 0 && (
          <DetailRow label="Memo">
            {Memos.map((memo, i) => {
              const memoType =
                memo.Memo.MemoType &&
                CryptoJS.enc.Hex.parse(memo.Memo.MemoType).toString(CryptoJS.enc.Utf8);
              const memoData =
                memo.Memo.MemoData &&
                CryptoJS.enc.Hex.parse(memo.Memo.MemoData).toString(CryptoJS.enc.Utf8);
              return (
                <Typography key={i} variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {[memoType, memoData].filter(Boolean).join(' ')}
                </Typography>
              );
            })}
          </DetailRow>
        )}

        {balanceChanges.length > 0 && isSuccess && (
          <DetailRow label="Affected Accounts" sx={{ borderBottom: 'none', pb: 0 }}>
            <Typography variant="body1">
              There are {balanceChanges.length} accounts that were affected by this transaction.
            </Typography>
            {balanceChanges.map(({ account, changes }, index) => (
              <Grid container key={account} sx={{ mt: 2, alignItems: 'center' }}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountAvatar account={account} />
                    <Box>
                      <Link href={`/profile/${account}`} passHref>
                        <Typography
                          component="a"
                          variant="body1"
                          sx={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          {account === Account ? 'Initiator' : `Account ${index + 1}`}
                        </Typography>
                      </Link>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', wordBreak: 'break-all' }}
                      >
                        {account}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  {changes.map((change, i) => {
                    const isPositive = new BigNumber(change.value).isPositive();
                    const sign = isPositive ? '+' : '';
                    const color = isPositive ? 'success.main' : 'error.main';

                    if (change.currency === 'XRP') {
                      return (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color={color}>
                            {sign}
                            {new BigNumber(change.value).toFormat()}{' '}
                          </Typography>
                          <Avatar
                            src="https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8"
                            sx={{ width: 20, height: 20, ml: 0.5, mr: 0.5 }}
                          />
                          <Typography variant="body2">{change.currency}</Typography>
                        </Box>
                      );
                    }

                    const slug = `${change.issuer}-${change.rawCurrency}`;
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color={color} component="span">
                          {sign}
                          {new BigNumber(change.value).toFormat()}{' '}
                        </Typography>
                        <TokenDisplay
                          slug={slug}
                          currency={change.currency}
                          rawCurrency={change.rawCurrency}
                          variant="body2"
                        />
                      </Box>
                    );
                  })}
                </Grid>
              </Grid>
            ))}
          </DetailRow>
        )}

        <DetailRow label="Transaction Link" sx={{ borderBottom: 'none', pb: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link href={`/tx/${hash}`} passHref>
              <Typography
                component="a"
                variant="body1"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                  wordBreak: 'break-all'
                }}
              >
                {txUrl}
              </Typography>
            </Link>
            <Tooltip title={urlCopied ? 'Copied!' : 'Copy Link'}>
              <IconButton onClick={copyUrlToClipboard} size="small" sx={{ ml: 1 }}>
                <FileCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DetailRow>
      </Grid>

      <Accordion
        expanded={moreVisible}
        onChange={() => setMoreVisible(!moreVisible)}
        sx={{
          background: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          mt: 2
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Show more</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Additional Data" />
              <Tab label="Raw Data" />
              <Tab label="Tx Metadata" />
            </Tabs>
          </Box>
          <TabPanel value={selectedTab} index={0}>
            <DetailRow label="Flags value">
              <Typography variant="body1">{Flags}</Typography>
            </DetailRow>
            <DetailRow label="Sequence">
              <Typography variant="body1">#{Sequence}</Typography>
            </DetailRow>
            {TransactionType === 'OfferCreate' && (
              <DetailRow label="Compact Tx ID">
                <Typography variant="body1">{ctid}</Typography>
              </DetailRow>
            )}
            <DetailRow label="Last ledger" sx={{ borderBottom: 'none' }}>
              <Typography variant="body1">
                #{LastLedgerSequence} ({LastLedgerSequence - ledger_index} ledgers)
              </Typography>
            </DetailRow>
            {SourceTag && (
              <DetailRow label="Source Tag">
                <Typography variant="body1">{SourceTag}</Typography>
              </DetailRow>
            )}
          </TabPanel>
          <TabPanel value={selectedTab} index={1}>
            <Paper sx={{ p: 2, background: alpha(theme.palette.common.black, 0.2) }}>
              <JsonViewer data={rawData} />
            </Paper>
          </TabPanel>
          <TabPanel value={selectedTab} index={2}>
            <Paper sx={{ p: 2, background: alpha(theme.palette.common.black, 0.2) }}>
              <JsonViewer data={meta} />
            </Paper>
          </TabPanel>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const TxPage = ({ txData, error }) => {
  const router = useRouter();
  const theme = useTheme();

  const dispatch = useDispatch();

  const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
  useWebSocket(WSS_FEED_URL, {
    onMessage: (event) => {
      try {
        const json = JSON.parse(event.data);
        dispatch(update_metrics(json));
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    },
    shouldReconnect: () => true
  });

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <Header />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Transaction Details
          </Typography>
        </Box>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TransactionDetails txData={txData} theme={theme} />
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export async function getServerSideProps(context) {
  const { hash } = context.params;

  if (!/^[0-9A-F]{64}$/i.test(hash)) {
    return {
      props: {
        txData: null,
        error: 'Invalid transaction hash format.'
      }
    };
  }

  try {
    const response = await axios.post('https://xrplcluster.com/', {
      method: 'tx',
      params: [
        {
          transaction: hash,
          binary: false
        }
      ]
    });

    if (response.data.result.error === 'txnNotFound') {
      return {
        notFound: true
      };
    }

    if (response.data.result.error) {
      return {
        props: {
          txData: null,
          error: response.data.result.error_message || 'Transaction not found'
        }
      };
    }

    const { meta, ...rest } = response.data.result;
    // if (meta) {
    //   const deliveredAmount = meta.delivered_amount;
    //   if (typeof deliveredAmount === 'object' && deliveredAmount.value) {
    //     meta.delivered_amount.value = new BigNumber(deliveredAmount.value).toFormat();
    //   }
    // }

    return {
      props: {
        txData: { ...rest, meta },
        error: null
      }
    };
  } catch (error) {
    console.error(error);
    let errorMessage = 'Failed to fetch transaction data.';
    if (
      error.response &&
      error.response.data &&
      error.response.data.result &&
      error.response.data.result.error_message
    ) {
      errorMessage = error.response.data.result.error_message;
    }
    return {
      props: {
        txData: null,
        error: errorMessage
      }
    };
  }
}

export default TxPage;
