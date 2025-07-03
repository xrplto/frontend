import { useRouter } from 'next/router';
import axios from 'axios';
import { useState } from 'react';
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
            Market Cap: ${new BigNumber(token.marketcap).toFormat(2)}
          </Typography>
        )}
        {token.vol24h > 0 && (
          <Typography variant="body2">
            24h Volume: ${new BigNumber(token.vol24h).toFormat(2)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const TokenLinkWithTooltip = ({ slug, currency, md5 }) => {
  const theme = useTheme();
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const link = (
    <Link href={`/token/${slug}`} passHref>
      <Typography
        component="a"
        variant="body1"
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          ml: 0.5
        }}
      >
        {currency}
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

const TokenDisplay = ({ slug, currency }) => {
  const stringToHash = slug.replace('-', '_');
  const md5 = CryptoJS.MD5(stringToHash).toString();
  const imageUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar src={imageUrl} sx={{ width: 20, height: 20, mr: 0.5 }} />
      <TokenLinkWithTooltip slug={slug} currency={currency} md5={md5} />
    </Box>
  );
};

const AmountDisplay = ({ amount }) => {
  const theme = useTheme();
  if (typeof amount === 'string') {
    return <Typography variant="body1">{dropsToXrp(amount)} XRP</Typography>;
  }
  if (typeof amount === 'object') {
    const currency = normalizeCurrencyCode(amount.currency);
    const slug = amount.issuer ? `${amount.issuer}-${amount.currency}` : null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1" component="span">
          {amount.value}{' '}
        </Typography>
        {slug ? (
          <TokenDisplay slug={slug} currency={currency} />
        ) : (
          <Typography
            variant="body1"
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
    ctid
  } = txData;

  const { meta: metaToExclude, ...rawData } = txData;

  const txUrl = `https://xrpl.to/tx/${hash}`;

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(txUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const txResult = meta?.TransactionResult;
  const transactionIndex = meta?.TransactionIndex;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          if (!balanceChanges[lowAccount]) balanceChanges[lowAccount] = [];
          balanceChanges[lowAccount].push({
            currency: normCurr,
            value: change.toString(),
            issuer: highAccount
          });

          if (!balanceChanges[highAccount]) balanceChanges[highAccount] = [];
          balanceChanges[highAccount].push({
            currency: normCurr,
            value: change.negated().toString(),
            issuer: lowAccount
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

  const { balanceChanges, exchanges } = getBalanceChanges();

  const initiatorChanges = balanceChanges.find((bc) => bc.account === Account);

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
  const flagExplanations = getFlagExplanation(Flags, TransactionType);

  const mainExchange = exchanges.find((e) => e.maker === Account);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

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
        <Typography component="span" color="success.main">
          successful
        </Typography>{' '}
        and validated in ledger{' '}
        <Link href={`/ledgers/${ledger_index}`} passHref>
          <Typography component="a" color="primary.main">
            #{ledger_index}
          </Typography>
        </Link>{' '}
        (index: {transactionIndex}).
      </Typography>

      <Grid container>
        <DetailRow label="Type">
          <Typography variant="body1">{TransactionType}</Typography>
        </DetailRow>
        <DetailRow label="Validated">
          <Typography variant="body1">
            {formatDistanceToNow(new Date(rippleTimeToISO8601(date)))} ago (
            {new Date(rippleTimeToISO8601(date)).toLocaleString()})
          </Typography>
        </DetailRow>
        <DetailRow label="Offer Maker">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={`https://s1.xrpl.to/account/${Account}`}
              sx={{ width: 32, height: 32, mr: 1 }}
            />
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

        {mainExchange && (
          <>
            <DetailRow label="Exchanged">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" color="error.main">
                  -{mainExchange.paid.value}
                </Typography>
                {mainExchange.paid.rawCurrency ? (
                  <TokenDisplay
                    slug={`${mainExchange.paid.issuer}-${mainExchange.paid.rawCurrency}`}
                    currency={mainExchange.paid.currency}
                  />
                ) : (
                  <Typography variant="body1" component="span" sx={{ ml: 0.5 }}>
                    {mainExchange.paid.currency}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body1" color="success.main">
                  +{mainExchange.got.value}
                </Typography>
                {mainExchange.got.rawCurrency ? (
                  <TokenDisplay
                    slug={`${mainExchange.got.issuer}-${mainExchange.got.rawCurrency}`}
                    currency={mainExchange.got.currency}
                  />
                ) : (
                  <Typography variant="body1" component="span" sx={{ ml: 0.5 }}>
                    {mainExchange.got.currency}
                  </Typography>
                )}
              </Box>
            </DetailRow>
            <DetailRow label="Rate">
              <Typography variant="body2">
                1 {mainExchange.got.currency} ={' '}
                {new BigNumber(mainExchange.paid.value).div(mainExchange.got.value).toFormat()}{' '}
                {mainExchange.paid.currency}
              </Typography>
              <Typography variant="body2">
                1 {mainExchange.paid.currency} ={' '}
                {new BigNumber(mainExchange.got.value).div(mainExchange.paid.value).toFormat()}{' '}
                {mainExchange.got.currency}
              </Typography>
            </DetailRow>
          </>
        )}

        {flagExplanations.length > 0 && (
          <DetailRow label={TransactionType + ' Flags'}>
            {flagExplanations.map((text, i) => (
              <Typography key={i} variant="body2">
                {text}
              </Typography>
            ))}
          </DetailRow>
        )}

        <DetailRow label="Ledger Fee">
          <Typography variant="body1">{dropsToXrp(Fee)} XRP</Typography>
        </DetailRow>

        {balanceChanges.length > 0 && (
          <DetailRow label="Affected Accounts" sx={{ borderBottom: 'none', pb: 0 }}>
            <Typography variant="body1">
              There are {balanceChanges.length} accounts that were affected by this transaction.
            </Typography>
            {balanceChanges.map(({ account, changes }, index) => (
              <Grid container key={account} sx={{ mt: 2, alignItems: 'center' }}>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={`https://s1.xrpl.to/account/${account}`}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
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
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  {changes.map((change, i) => (
                    <Typography
                      key={i}
                      variant="body2"
                      color={
                        new BigNumber(change.value).isPositive() ? 'success.main' : 'error.main'
                      }
                    >
                      {new BigNumber(change.value).isPositive() ? '+' : ''}
                      {change.value} {change.currency}
                    </Typography>
                  ))}
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
            <DetailRow label="Compact Tx ID">
              <Typography variant="body1">{ctid}</Typography>
            </DetailRow>
            <DetailRow label="Last ledger" sx={{ borderBottom: 'none' }}>
              <Typography variant="body1">
                #{LastLedgerSequence} ({LastLedgerSequence - ledger_index} ledgers)
              </Typography>
            </DetailRow>
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

    return {
      props: {
        txData: response.data.result,
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
