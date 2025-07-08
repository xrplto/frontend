import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import ReactECharts from 'echarts-for-react';
import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
  Chip,
  Stack,
  useTheme,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AppContext } from 'src/AppContext';

const SankeyModal = ({ open, onClose, account }) => {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [showSpamOnly, setShowSpamOnly] = useState(false);
  const [spamStats, setSpamStats] = useState(null);
  const [accountDetails, setAccountDetails] = useState(new Map());
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(account);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSummaryItem, setSelectedSummaryItem] = useState(null);

  // Spam detection thresholds
  const spamThresholds = {
    dust: 0.000001,
    micro: 0.001,
    small: 0.01,
    normal: 1.0
  };

  // Analyze spam patterns
  const analyzeSpamPatterns = (payment, senderStats, spamPatterns) => {
    const indicators = {
      isDust: payment.amount <= spamThresholds.dust,
      isMicro: payment.amount <= spamThresholds.micro,
      isSmall: payment.amount <= spamThresholds.small,
      hasDestinationTag: payment.destinationTag !== undefined,
      hasMemo: payment.memo !== undefined,
      isRepeatedAmount: false,
      spamScore: 0
    };

    const senderKey = `${payment.from}-${payment.amount}`;
    const repeatCount = spamPatterns.get(senderKey) || 0;
    spamPatterns.set(senderKey, repeatCount + 1);

    if (repeatCount > 2) {
      indicators.isRepeatedAmount = true;
      indicators.spamScore += 30;
    }

    if (indicators.isDust) indicators.spamScore += 50;
    if (indicators.isMicro) indicators.spamScore += 30;
    if (indicators.isSmall) indicators.spamScore += 10;
    if (!indicators.hasDestinationTag && !indicators.hasMemo) indicators.spamScore += 20;
    if (indicators.isRepeatedAmount) indicators.spamScore += 30;

    return indicators;
  };

  const categorizeSpamAmount = (amount) => {
    if (amount <= spamThresholds.dust) return 'DUST';
    if (amount <= spamThresholds.micro) return 'MICRO';
    if (amount <= spamThresholds.small) return 'SMALL';
    if (amount <= spamThresholds.normal) return 'NORMAL';
    return 'LARGE';
  };

  const decodeMemo = (memos) => {
    if (!memos || !Array.isArray(memos) || memos.length === 0) return null;

    try {
      const memo = memos[0]?.Memo;
      if (!memo) return null;

      let decodedMemo = {};

      if (memo.MemoData) {
        try {
          const decodedData = Buffer.from(memo.MemoData, 'hex').toString('utf8');
          decodedMemo.data = decodedData;
        } catch (e) {
          decodedMemo.data = memo.MemoData;
        }
      }

      if (memo.MemoType) {
        try {
          const decodedType = Buffer.from(memo.MemoType, 'hex').toString('utf8');
          decodedMemo.type = decodedType;
        } catch (e) {
          decodedMemo.type = memo.MemoType;
        }
      }

      if (memo.MemoFormat) {
        try {
          const decodedFormat = Buffer.from(memo.MemoFormat, 'hex').toString('utf8');
          decodedMemo.format = decodedFormat;
        } catch (e) {
          decodedMemo.format = memo.MemoFormat;
        }
      }

      return decodedMemo;
    } catch (error) {
      console.error('Error decoding memo:', error);
      return null;
    }
  };

  const isSpamMemo = (memo) => {
    if (!memo || !memo.data) return false;

    const spamIndicators = [
      'http://',
      'https://',
      '.com',
      '.io',
      'www.',
      'click here',
      'visit',
      'free',
      'bonus',
      'win',
      'claim',
      'airdrop',
      'giveaway',
      'earn',
      'profit',
      '🎁',
      '💰',
      '🤑',
      '🎯',
      '🔥',
      '⚡',
      '💸'
    ];

    const dataLower = memo.data.toLowerCase();
    return spamIndicators.some((indicator) => dataLower.includes(indicator.toLowerCase()));
  };

  const analyzeAccountActivity = (accountAddress, transactions) => {
    const activity = {
      mainActivity: 'Unknown',
      activities: new Set(),
      activityScore: 0,
      totalTransactions: 0,
      tradingVolume: 0,
      tokensBought: new Map(),
      tokensSold: new Map(),
      paymentsSent: 0,
      paymentsReceived: 0,
      dexOperations: 0,
      ammInteractions: 0,
      trustlineChanges: 0,
      spamTransactions: 0,
      dustTransactions: 0,
      patterns: [],
      avgTransactionSize: 0,
      totalXrpVolume: 0,
      spamMemos: [],
      uniqueSpamMessages: new Set(),
      tradingDirection: 'neutral',
      topTokens: []
    };

    // More sophisticated activity analysis
    const scores = {
      trading: 0,
      spamming: 0,
      normalUser: 0,
      dexOperations: 0,
      ammInteractions: 0,
      regularPayments: 0,
      tokenBuying: 0,
      tokenSelling: 0,
      spamTarget: 0
    };

    transactions.forEach((tx) => {
      const txData = tx.tx || tx;
      activity.totalTransactions++;

      if (txData.TransactionType === 'Payment') {
        const amount = parseFloat(txData.Amount) / 1000000;
        activity.totalXrpVolume += amount;

        if (txData.Account === accountAddress) {
          activity.paymentsSent++;
          scores.regularPayments += 2;

          if (amount <= spamThresholds.dust) {
            activity.dustTransactions++;
            scores.spamming += 5;
          } else if (amount <= spamThresholds.micro) {
            scores.spamming += 3;
          } else if (amount >= 100) {
            scores.normalUser += 5;
          }
        } else if (txData.Destination === accountAddress) {
          activity.paymentsReceived++;

          if (amount <= spamThresholds.micro) {
            activity.spamTransactions++;
            scores.spamTarget += 3;
          }
        }

        const memo = decodeMemo(txData.Memos);
        if (memo && isSpamMemo(memo)) {
          activity.spamMemos.push(memo);
          activity.uniqueSpamMessages.add(memo.data);
          scores.spamming += 10;
        }
      } else if (txData.TransactionType === 'OfferCreate') {
        activity.dexOperations++;
        scores.trading += 5;
        scores.dexOperations += 5;

        const takerGets = txData.TakerGets;
        const takerPays = txData.TakerPays;

        if (typeof takerGets === 'object' && takerGets.currency) {
          const currency = takerGets.currency;
          const currentAmount = activity.tokensBought.get(currency) || 0;
          activity.tokensBought.set(currency, currentAmount + 1);
          scores.tokenBuying += 3;
        }

        if (typeof takerPays === 'object' && takerPays.currency) {
          const currency = takerPays.currency;
          const currentAmount = activity.tokensSold.get(currency) || 0;
          activity.tokensSold.set(currency, currentAmount + 1);
          scores.tokenSelling += 3;
        }
      } else if (txData.TransactionType === 'AMMDeposit' || txData.TransactionType === 'AMMWithdraw') {
        activity.ammInteractions++;
        scores.ammInteractions += 8;
        scores.trading += 3;
      } else if (txData.TransactionType === 'TrustSet') {
        activity.trustlineChanges++;
        scores.normalUser += 2;
      }
    });

    if (activity.totalTransactions > 0) {
      activity.avgTransactionSize = activity.totalXrpVolume / activity.totalTransactions;
    }

    const buyCount = activity.tokensBought.size;
    const sellCount = activity.tokensSold.size;
    if (buyCount > sellCount * 1.5) {
      activity.tradingDirection = 'buyer';
    } else if (sellCount > buyCount * 1.5) {
      activity.tradingDirection = 'seller';
    }

    const sortedBought = Array.from(activity.tokensBought.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const sortedSold = Array.from(activity.tokensSold.entries()).sort((a, b) => b[1] - a[1]);
    activity.topTokens = [...sortedBought.slice(0, 3), ...sortedSold.slice(0, 3)].map(
      ([token]) => token
    );

    const maxScore = Math.max(...Object.values(scores));
    let mainActivity = 'Normal User';

    if (scores.spamming === maxScore && scores.spamming > 20) {
      mainActivity = 'Spammer';
    } else if (scores.trading === maxScore && scores.trading > 15) {
      if (activity.tradingDirection === 'buyer') {
        mainActivity = 'Token Buyer';
      } else if (activity.tradingDirection === 'seller') {
        mainActivity = 'Token Seller';
      } else {
        mainActivity = 'Active Trader';
      }
    } else if (scores.dexOperations === maxScore && scores.dexOperations > 10) {
      mainActivity = 'DEX Trader';
    } else if (scores.ammInteractions === maxScore && scores.ammInteractions > 5) {
      mainActivity = 'AMM Provider';
    } else if (scores.regularPayments === maxScore && scores.regularPayments > 10) {
      mainActivity = 'Payment Processor';
    } else if (scores.spamTarget > 10) {
      mainActivity = 'Normal User (Spam Target)';
    }

    if (scores.spamTarget > 20 && !mainActivity.includes('Spam')) {
      mainActivity += ' (Spam Target)';
    }

    if (scores.spamming > 20) activity.activities.add('Spamming');
    if (scores.trading > 15) activity.activities.add('Trading');
    if (scores.tokenBuying > 10) activity.activities.add('Buying Tokens');
    if (scores.tokenSelling > 10) activity.activities.add('Selling Tokens');
    if (scores.dexOperations > 10) activity.activities.add('DEX Operations');
    if (scores.regularPayments > 10) activity.activities.add('Regular Payments');
    if (scores.ammInteractions > 5) activity.activities.add('AMM Interactions');

    if (activity.activities.size === 0) {
      activity.activities.add('Basic Activity');
    }

    activity.mainActivity = mainActivity;

    if (activity.dustTransactions > 5) {
      activity.patterns.push('Dust Attack Pattern');
    }
    if (activity.spamTransactions / activity.totalTransactions > 0.8) {
      activity.patterns.push('High Spam Ratio');
    }
    if (activity.totalTransactions > 20 && activity.avgTransactionSize < 0.001) {
      activity.patterns.push('Micro Payment Spammer');
    }

    if (activity.spamMemos.length > 0) {
      activity.patterns.push('Memo Spam Detected');

      if (activity.uniqueSpamMessages.size < activity.spamMemos.length / 2) {
        activity.patterns.push('Repeated Spam Messages');
      }

      const spamKeywords = [
        'free',
        'win',
        'claim',
        'bonus',
        'airdrop',
        'giveaway',
        'click',
        'visit',
        'promo',
        'earn',
        'profit'
      ];
      const hasSpamKeywords = [...activity.uniqueSpamMessages].some((message) =>
        spamKeywords.some((keyword) => message.toLowerCase().includes(keyword))
      );
      if (hasSpamKeywords) {
        activity.patterns.push('Promotional Spam Content');
      }
    }

    console.log('Target Account Activity Analysis:', {
      account: accountAddress,
      mainActivity: activity.mainActivity,
      activityScore: activity.activityScore,
      activities: Array.from(activity.activities),
      totalTransactions: activity.totalTransactions,
      tokensBought: Object.fromEntries(activity.tokensBought),
      tokensSold: Object.fromEntries(activity.tokensSold),
      topTokens: activity.topTokens,
      tradingDirection: activity.tradingDirection
    });

    return activity;
  };

  useEffect(() => {
    if (open && account) {
      if (!currentAccount) {
        setCurrentAccount(account);
      }
    }
  }, [open, account, currentAccount]);

  useEffect(() => {
    if (open && currentAccount) {
      fetchAccountTransactions();
    }
  }, [open, currentAccount]);

  const fetchAccountTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://xrplcluster.com/', {
        method: 'account_tx',
        params: [
          {
            account: currentAccount,
            ledger_index_min: -1,
            ledger_index_max: -1,
            binary: false,
            limit: 200,
            forward: false
          }
        ]
      });

      console.log('RAW account_tx API Response:', {
        account: currentAccount,
        response: response.data,
        fullResponse: response
      });

      if (response.data && response.data.result && response.data.result.transactions) {
        const transactions = response.data.result.transactions;

        console.log('Transactions Summary:', {
          account: currentAccount,
          totalTransactions: transactions.length,
          firstTransaction: transactions[0],
          lastTransaction: transactions[transactions.length - 1],
          allTransactions: transactions
        });

        const processedData = processTransactionsForSankey(transactions, currentAccount);
        setChartData(processedData);

        setAccountInfo({
          address: currentAccount,
          totalTransactions: transactions.length,
          mainActivity: processedData.mainActivity
        });
      } else {
        console.warn('No transaction data found:', response.data);
        setError('No transaction data found for this account');
      }
    } catch (err) {
      console.error('Error fetching account transactions:', err);
      setError('Failed to fetch account transactions');
    } finally {
      setLoading(false);
    }
  };

  const processTransactionsForSankey = (transactions, targetAccount) => {
    const nodes = new Set();
    const links = [];
    const accountStats = new Map();
    const spamPatterns = new Map();
    const senderStats = new Map();
    const microPayments = [];
    const accountDetailsMap = new Map();

    const inflowHub = `${targetAccount}_INFLOW`;
    const outflowHub = `${targetAccount}_OUTFLOW`;

    nodes.add(inflowHub);
    nodes.add(outflowHub);
    accountStats.set(inflowHub, { in: 0, out: 0, transactions: 0 });
    accountStats.set(outflowHub, { in: 0, out: 0, transactions: 0 });

    const extractExchangeFromMeta = (meta, targetAccount) => {
      if (!meta || !meta.AffectedNodes) return null;

      let exchangeData = {
        sourceAccount: null,
        destinationAccount: null,
        amount: 0,
        currency: 'XRP',
        tokensReceived: [],
        tokensSent: []
      };

      for (const node of meta.AffectedNodes) {
        const modifiedNode = node.ModifiedNode;
        if (modifiedNode && modifiedNode.LedgerEntryType === 'AccountRoot') {
          const account = modifiedNode.FinalFields?.Account;
          const prevBalance = modifiedNode.PreviousFields?.Balance;
          const finalBalance = modifiedNode.FinalFields?.Balance;

          if (account && prevBalance && finalBalance) {
            const balanceChange = parseInt(finalBalance) - parseInt(prevBalance);

            if (Math.abs(balanceChange) > 100) {
              const amount = Math.abs(balanceChange) / 1000000;

              if (balanceChange > 0) {
                exchangeData.destinationAccount = account;
              } else {
                exchangeData.sourceAccount = account;
              }
              exchangeData.amount = Math.max(exchangeData.amount, amount);
            }
          }
        }

        if (modifiedNode && modifiedNode.LedgerEntryType === 'RippleState') {
          const highAccount = modifiedNode.FinalFields?.HighLimit?.issuer;
          const lowAccount = modifiedNode.FinalFields?.LowLimit?.issuer;
          const currency = modifiedNode.FinalFields?.Balance?.currency;
          const prevBalance = modifiedNode.PreviousFields?.Balance?.value;
          const finalBalance = modifiedNode.FinalFields?.Balance?.value;

          if (prevBalance && finalBalance && currency) {
            const balanceChange = parseFloat(finalBalance) - parseFloat(prevBalance);

            if (Math.abs(balanceChange) > 0.000001) {
              const tokenData = {
                currency,
                amount: Math.abs(balanceChange),
                issuer: highAccount === targetAccount ? lowAccount : highAccount
              };

              if (balanceChange > 0) {
                exchangeData.tokensReceived.push(tokenData);
              } else {
                exchangeData.tokensSent.push(tokenData);
              }
            }
          }
        }
      }

      return exchangeData;
    };

    const extractCurrencyFromAmount = (amount) => {
      if (typeof amount === 'string') {
        return { currency: 'XRP', value: parseFloat(amount) / 1000000 };
      } else if (typeof amount === 'object' && amount.currency) {
        return {
          currency: amount.currency,
          value: parseFloat(amount.value),
          issuer: amount.issuer
        };
      }
      return { currency: 'XRP', value: 0 };
    };

    const getCurrencyDisplayName = (currency, issuer) => {
      if (currency === 'XRP') return 'XRP';
      if (currency.length === 40) {
        try {
          const decoded = Buffer.from(currency, 'hex')
            .toString('utf8')
            .replace(/\0/g, '')
            .trim();
          return decoded || currency.substring(0, 8);
        } catch (e) {
          return currency.substring(0, 8);
        }
      }
      return currency;
    };

    const getNodeCategory = (nodeId, transaction) => {
      if (nodeId.includes('_INFLOW') || nodeId.includes('_OUTFLOW')) {
        return nodeId.includes('_INFLOW') ? 'inflow' : 'outflow';
      } else if (nodeId.startsWith('AMM_')) {
        return 'amm';
      } else if (nodeId.startsWith('AMM_POOL_')) {
        return 'amm_pool';
      } else if (nodeId.startsWith('DEX_')) {
        return 'dex';
      } else if (nodeId.includes('Failed Exchange')) {
        return 'failed_exchange';
      } else if (nodeId.includes('Self Transfer')) {
        return transaction?.meta?.TransactionResult === 'tesSUCCESS' ? 'self' : 'failed_self';
      } else if (nodeId.startsWith('TRUST_')) {
        return 'trust';
      } else if (nodeId.includes('Operations')) {
        return 'operations';
      } else {
        return 'account';
      }
    };

    const getNodeDisplayName = (nodeId, category) => {
      if (nodeId.includes('_INFLOW')) {
        return 'Inflows';
      } else if (nodeId.includes('_OUTFLOW')) {
        return 'Outflows';
      } else if (category === 'dex' && nodeId.startsWith('DEX_')) {
        const parts = nodeId.replace('DEX_', '').split('_');
        if (parts.length >= 2) {
          const currency1 = getCurrencyDisplayName(parts[0]);
          const currency2 = getCurrencyDisplayName(parts[1]);
          return `${currency1}/${currency2}`;
        }
        return nodeId;
      } else if (category === 'trust' && nodeId.startsWith('TRUST_')) {
        const currency = nodeId.replace('TRUST_', '');
        return `${getCurrencyDisplayName(currency)} Trust`;
      } else if (category === 'amm_pool' && nodeId.startsWith('AMM_POOL_')) {
        const poolName = nodeId.replace('AMM_POOL_', '');
        return `AMM ${poolName}`;
      } else if (category === 'amm' && nodeId.startsWith('AMM_')) {
        return nodeId.replace('AMM_', 'AMM ');
      } else if (category === 'self') {
        return 'Self Transfer';
      } else if (category === 'failed_exchange') {
        return 'Failed Exchange';
      } else if (category === 'failed_self') {
        return 'Failed Self Transfer';
      } else if (category === 'operations') {
        return nodeId;
      } else {
        // For regular accounts, show shortened address
        return `${nodeId.substring(0, 6)}...${nodeId.substring(nodeId.length - 4)}`;
      }
    };

    const connectNodes = (from, to, value, transaction, meta = {}) => {
      const linkData = {
        source: from,
        target: to,
        value: value,
        ...meta
      };

      const linkId = `${from}-${to}`;
      const existingLink = links.find((l) => l.source === from && l.target === to);

      if (existingLink) {
        existingLink.value += value;
        if (existingLink.transactions) {
          existingLink.transactions.push(transaction);
        } else {
          existingLink.transactions = [transaction];
        }
      } else {
        linkData.transactions = [transaction];
        links.push(linkData);
      }

      const sourceStats = accountStats.get(from) || { in: 0, out: 0, transactions: 0 };
      sourceStats.out += value;
      sourceStats.transactions += 1;
      accountStats.set(from, sourceStats);

      const targetStats = accountStats.get(to) || { in: 0, out: 0, transactions: 0 };
      targetStats.in += value;
      targetStats.transactions += 1;
      accountStats.set(to, targetStats);
    };

    const createStandardNodes = (from, to, category = 'account') => {
      if (!nodes.has(from)) {
        nodes.add(from);
        accountStats.set(from, { in: 0, out: 0, transactions: 0 });
      }
      if (!nodes.has(to)) {
        nodes.add(to);
        accountStats.set(to, { in: 0, out: 0, transactions: 0 });
      }
    };

    const targetAccountActivity = analyzeAccountActivity(targetAccount, transactions);
    accountDetailsMap.set(targetAccount, targetAccountActivity);

    transactions.forEach((tx, index) => {
      try {
        const txData = tx.tx || tx;
        const meta = tx.meta || txData.meta;
        const transactionType = txData.TransactionType;
        const sourceAccount = txData.Account;
        const txResult = meta?.TransactionResult;

        console.log(`Processing Transaction ${index + 1}:`, {
          type: transactionType,
          source: sourceAccount,
          destination: txData.Destination,
          result: txResult,
          meta: meta
        });

        if (transactionType === 'Payment') {
          const destinationAccount = txData.Destination;
          const amount = extractCurrencyFromAmount(txData.Amount);

          const paymentData = {
            from: sourceAccount,
            to: destinationAccount,
            amount: amount.value,
            currency: amount.currency,
            destinationTag: txData.DestinationTag,
            memo: decodeMemo(txData.Memos)
          };

          const spamIndicators = analyzeSpamPatterns(paymentData, senderStats, spamPatterns);

          if (spamIndicators.spamScore > 50) {
            if (!accountDetailsMap.has(sourceAccount)) {
              accountDetailsMap.set(sourceAccount, {
                isSpammer: true,
                spamScore: spamIndicators.spamScore,
                patterns: ['Spam Payment Pattern']
              });
            }
          }

          if (sourceAccount === targetAccount && destinationAccount === targetAccount) {
            const selfNode = 'Self Transfer';
            createStandardNodes(selfNode, selfNode, 'self');
            connectNodes(outflowHub, selfNode, amount.value, txData, {
              currency: amount.currency,
              spamIndicators,
              isSelfTransfer: true
            });
            connectNodes(selfNode, inflowHub, amount.value, txData, {
              currency: amount.currency,
              spamIndicators,
              isSelfTransfer: true
            });
          } else if (sourceAccount === targetAccount) {
            createStandardNodes(destinationAccount, destinationAccount);
            connectNodes(outflowHub, destinationAccount, amount.value, txData, {
              currency: amount.currency,
              spamIndicators
            });

            if (spamIndicators.isMicro || spamIndicators.isDust) {
              microPayments.push({
                type: 'sent',
                account: destinationAccount,
                amount: amount.value,
                indicators: spamIndicators
              });
            }
          } else if (destinationAccount === targetAccount) {
            createStandardNodes(sourceAccount, sourceAccount);
            connectNodes(sourceAccount, inflowHub, amount.value, txData, {
              currency: amount.currency,
              spamIndicators
            });

            if (spamIndicators.isMicro || spamIndicators.isDust) {
              microPayments.push({
                type: 'received',
                account: sourceAccount,
                amount: amount.value,
                indicators: spamIndicators
              });
            }
          }
        } else if (transactionType === 'OfferCreate' || transactionType === 'OfferCancel') {
          const takerGets = extractCurrencyFromAmount(txData.TakerGets);
          const takerPays = extractCurrencyFromAmount(txData.TakerPays);

          const dexNodeId = `DEX_${takerGets.currency}_${takerPays.currency}`;
          createStandardNodes(dexNodeId, dexNodeId, 'dex');

          if (sourceAccount === targetAccount) {
            const totalValue = Math.max(takerGets.value, takerPays.value);

            if (txResult === 'tesSUCCESS') {
              connectNodes(outflowHub, dexNodeId, totalValue * 0.5, txData, {
                operation: 'dex_trade',
                currencies: [takerGets.currency, takerPays.currency]
              });
              connectNodes(dexNodeId, inflowHub, totalValue * 0.5, txData, {
                operation: 'dex_trade',
                currencies: [takerGets.currency, takerPays.currency]
              });
            } else {
              const failedNode = 'Failed Exchange';
              createStandardNodes(failedNode, failedNode, 'failed_exchange');
              connectNodes(outflowHub, failedNode, totalValue * 0.1, txData, {
                operation: 'failed_dex_trade',
                result: txResult
              });
            }
          }
        } else if (transactionType === 'TrustSet') {
          const limitAmount = txData.LimitAmount;
          const currency = limitAmount?.currency || 'Unknown';
          const issuer = limitAmount?.issuer;

          const trustNodeId = `TRUST_${currency}`;
          createStandardNodes(trustNodeId, trustNodeId, 'trust');

          if (sourceAccount === targetAccount) {
            connectNodes(outflowHub, trustNodeId, 0.001, txData, {
              operation: 'trustline',
              currency: currency,
              issuer: issuer
            });
          }
        } else if (transactionType === 'AMMDeposit' || transactionType === 'AMMWithdraw') {
          const ammPoolId = `AMM_POOL_${txData.Asset?.currency || 'XRP'}_${
            txData.Asset2?.currency || 'XRP'
          }`;
          createStandardNodes(ammPoolId, ammPoolId, 'amm_pool');

          if (sourceAccount === targetAccount) {
            const isDeposit = transactionType === 'AMMDeposit';
            const amount = txData.Amount
              ? extractCurrencyFromAmount(txData.Amount).value
              : 1;

            if (isDeposit) {
              connectNodes(outflowHub, ammPoolId, amount, txData, {
                operation: 'amm_deposit'
              });
            } else {
              connectNodes(ammPoolId, inflowHub, amount, txData, {
                operation: 'amm_withdraw'
              });
            }
          }
        } else {
          const operationsNode = `${transactionType} Operations`;
          createStandardNodes(operationsNode, operationsNode, 'operations');

          if (sourceAccount === targetAccount) {
            connectNodes(outflowHub, operationsNode, 0.01, txData, {
              operation: transactionType.toLowerCase()
            });
          }
        }
      } catch (error) {
        console.error(`Error processing transaction ${index + 1}:`, error);
      }
    });

    // Calculate spam statistics
    const totalInflows = links
      .filter((l) => l.target === inflowHub)
      .reduce((sum, l) => sum + l.value, 0);
    const spamInflows = links
      .filter((l) => l.target === inflowHub && l.spamIndicators?.spamScore > 50)
      .reduce((sum, l) => sum + l.value, 0);

    const spamPercentage = totalInflows > 0 ? (spamInflows / totalInflows) * 100 : 0;

    setSpamStats({
      totalMicroPayments: microPayments.length,
      microPaymentsReceived: microPayments.filter((p) => p.type === 'received').length,
      microPaymentsSent: microPayments.filter((p) => p.type === 'sent').length,
      spamPercentage: spamPercentage,
      topSpammers: microPayments
        .filter((p) => p.type === 'received')
        .reduce((acc, p) => {
          acc[p.account] = (acc[p.account] || 0) + 1;
          return acc;
        }, {})
    });

    setAccountDetails(accountDetailsMap);

    console.log('Final Sankey Data:', {
      nodes: Array.from(nodes),
      links: links,
      accountStats: Object.fromEntries(accountStats),
      spamStats: spamStats
    });

    return {
      nodes: Array.from(nodes),
      links: links,
      accountStats: accountStats,
      mainActivity: targetAccountActivity.mainActivity
    };
  };

  const handleClose = () => {
    setNavigationHistory([]);
    setCurrentAccount(account);
    onClose();
  };

  const navigateToAccount = (newAccount) => {
    if (newAccount && newAccount !== currentAccount && !newAccount.includes('_')) {
      setNavigationHistory([...navigationHistory, currentAccount]);
      setCurrentAccount(newAccount);
    }
  };

  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousAccount = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentAccount(previousAccount);
    }
  };

  const getChartOption = () => {
    if (!chartData) return {};

    const { nodes, links } = chartData;
    const inflowHub = `${currentAccount}_INFLOW`;
    const outflowHub = `${currentAccount}_OUTFLOW`;

    const getNodeSize = (nodeId) => {
      const stats = chartData.accountStats.get(nodeId);
      const totalFlow = (stats?.in || 0) + (stats?.out || 0);
      const isHub = nodeId === inflowHub || nodeId === outflowHub;
      return isHub ? Math.max(30, Math.min(50, totalFlow)) : Math.max(10, Math.min(30, totalFlow));
    };

    const filteredLinks = showSpamOnly
      ? links.filter((link) => {
          const hasSpamIndicators = link.spamIndicators && link.spamIndicators.spamScore > 30;
          const isMicroPayment =
            link.spamIndicators &&
            (link.spamIndicators.isMicro || link.spamIndicators.isDust);
          return hasSpamIndicators || isMicroPayment;
        })
      : links;

    const activeNodes = new Set();
    filteredLinks.forEach((link) => {
      activeNodes.add(link.source);
      activeNodes.add(link.target);
    });

    const sankeyNodes = nodes
      .filter((nodeId) => activeNodes.has(nodeId))
      .map((nodeId) => {
        const category = getNodeCategory(nodeId);
        const displayName = getNodeDisplayName(nodeId, category);

        return {
          name: nodeId,
          displayName: displayName,
          category: category,
          itemStyle: {
            color: getNodeColor(category),
            borderColor: darkMode ? '#333' : '#ddd',
            borderWidth: 1
          },
          symbolSize: getNodeSize(nodeId)
        };
      });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: darkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
        borderColor: darkMode ? '#444' : '#ddd',
        borderWidth: 1,
        textStyle: {
          color: darkMode ? '#fff' : '#333',
          fontSize: 12
        },
        formatter: function (params) {
          if (params.dataType === 'node') {
            const nodeData = params.data;
            const stats = chartData.accountStats.get(nodeData.name);
            const details = accountDetails.get(nodeData.name);

            let content = `<div style="font-weight: bold; margin-bottom: 8px;">${nodeData.displayName}</div>`;

            if (stats) {
              content += `<div>Inflows: ${stats.in.toFixed(2)} XRP</div>`;
              content += `<div>Outflows: ${stats.out.toFixed(2)} XRP</div>`;
              content += `<div>Transactions: ${stats.transactions}</div>`;
            }

            if (details) {
              if (details.mainActivity) {
                content += `<div style="margin-top: 8px; color: ${
                  darkMode ? '#4FC3F7' : '#1976D2'
                };">Activity: ${details.mainActivity}</div>`;
              }
              if (details.isSpammer) {
                content += `<div style="color: #FF5252;">Spam Score: ${details.spamScore}</div>`;
              }
            }

            if (
              nodeData.category === 'account' &&
              !nodeData.name.includes('_') &&
              nodeData.name.length === 34 &&
              nodeData.name !== currentAccount
            ) {
              content += `<div style="margin-top: 8px; font-size: 10px; color: ${
                darkMode ? '#888' : '#666'
              };">Click to analyze this account</div>`;
            }

            return content;
          } else if (params.dataType === 'edge') {
            const link = params.data;
            let content = `<div style="font-weight: bold;">${link.source} → ${link.target}</div>`;
            content += `<div>Amount: ${link.value.toFixed(6)} XRP</div>`;

            if (link.spamIndicators) {
              const indicators = link.spamIndicators;
              content += `<div style="margin-top: 8px;">Spam Score: ${indicators.spamScore}</div>`;

              if (indicators.isDust) {
                content += `<div style="color: #FF5252;">⚠️ Dust Transaction</div>`;
              } else if (indicators.isMicro) {
                content += `<div style="color: #FFA726;">⚠️ Micro Payment</div>`;
              }

              if (indicators.isRepeatedAmount) {
                content += `<div style="color: #FF7043;">🔄 Repeated Amount</div>`;
              }
            }

            if (link.currency && link.currency !== 'XRP') {
              content += `<div>Currency: ${link.currency}</div>`;
            }

            if (link.operation) {
              content += `<div>Operation: ${link.operation}</div>`;
            }

            return content;
          }
        }
      },
      series: [
        {
          type: 'sankey',
          data: sankeyNodes,
          links: filteredLinks.map((link) => ({
            ...link,
            lineStyle: {
              color: 'source',
              opacity: 0.3,
              curveness: 0.5
            },
            emphasis: {
              lineStyle: {
                opacity: 0.8
              }
            }
          })),
          focusNodeAdjacency: 'allEdges',
          nodeAlign: 'justify',
          layoutIterations: 50,
          left: '5%',
          right: '15%',
          top: '10%',
          bottom: '10%',
          nodeGap: 15,
          nodeWidth: 30,
          label: {
            show: true,
            position: function (params) {
              if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                return 'insideRight';
              } else {
                const isOutgoingNode = filteredLinks.some(
                  (link) => link.source === outflowHub && link.target === params.data.name
                );

                if (isOutgoingNode) {
                  return 'left';
                } else {
                  return 'right';
                }
              }
            },
            distance: function (params) {
              if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                return 5;
              } else {
                const isOutgoingNode = filteredLinks.some(
                  (link) => link.source === outflowHub && link.target === params.data.name
                );

                if (isOutgoingNode) {
                  return 8;
                } else {
                  return 10;
                }
              }
            },
            color: darkMode ? '#FFFFFF' : '#000000',
            fontSize: 12,
            fontWeight: 'bold',
            formatter: function (params) {
              try {
                if (!params || !params.data) return '';

                const displayName = params.data.displayName || params.data.name;

                if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                  const hubAccount = params.data.name
                    .replace('_INFLOW', '')
                    .replace('_OUTFLOW', '');
                  if (hubAccount === currentAccount) {
                    return `{targetAccount|${displayName}}`;
                  }
                  return displayName;
                } else {
                  if (params.data.name === currentAccount) {
                    return `{targetAccount|${displayName}}`;
                  }

                  let cleanLabel = displayName;

                  if (params.data.category === 'self') {
                    cleanLabel = 'Self Transfer';
                  } else if (params.data.category === 'failed_exchange') {
                    cleanLabel = 'Failed Exchange';
                  } else if (params.data.category === 'failed_self') {
                    cleanLabel = 'Failed Self Transfer';
                  }

                  return `{normalLabel|${cleanLabel}}`;
                }
              } catch (error) {
                return '';
              }
            },
            rich: {
              normalLabel: {
                color: darkMode ? '#FFFFFF' : '#000000',
                fontSize: 11,
                fontWeight: 'normal'
              },
              targetAccount: {
                color: '#1a1a1a',
                fontSize: 13,
                fontWeight: 'bold',
                backgroundColor: '#FFD700',
                padding: [2, 6, 2, 6],
                borderRadius: 4,
                borderColor: '#FFA500',
                borderWidth: 1
              },
              spammerLabel: {
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 'bold',
                backgroundColor: '#FF5252',
                padding: [1, 4, 1, 4],
                borderRadius: 3
              }
            }
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: darkMode ? '#333' : '#ddd'
          }
        }
      ]
    };
  };

  const getNodeColor = (category) => {
    const colors = {
      inflow: '#4CAF50',
      outflow: '#FF5722',
      account: darkMode ? '#64B5F6' : '#2196F3',
      dex: '#9C27B0',
      trust: '#FF9800',
      amm_pool: '#00BCD4',
      amm: '#00ACC1',
      self: '#607D8B',
      failed_exchange: '#F44336',
      failed_self: '#E91E63',
      operations: '#795548'
    };
    return colors[category] || '#9E9E9E';
  };

  const handleChartClick = (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.name;
      if (
        nodeId &&
        !nodeId.includes('_') &&
        nodeId.length === 34 &&
        nodeId.startsWith('r') &&
        nodeId !== currentAccount
      ) {
        navigateToAccount(nodeId);
      }
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%', md: '85%' },
          maxWidth: 1200,
          height: '85vh',
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1.5} alignItems="center">
              {navigationHistory.length > 0 && (
                <IconButton onClick={goBack} size="small" sx={{ color: 'text.secondary' }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              
              <TimelineIcon sx={{ color: 'primary.main' }} />
              
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Transaction Flow Analysis
              </Typography>

              {navigationHistory.length > 0 && (
                <Chip
                  label={`Depth: ${navigationHistory.length + 1}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={showSpamOnly}
                    onChange={(e) => setShowSpamOnly(e.target.checked)}
                    size="small"
                  />
                }
                label="Spam Filter"
                sx={{ m: 0 }}
              />
              
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Account Summary */}
          {accountInfo && (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
              <AccountBalanceIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              
              <Chip
                label={`${accountInfo.address.slice(0, 8)}...${accountInfo.address.slice(-6)}`}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600
                }}
              />

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Transactions:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {accountInfo.totalTransactions}
                </Typography>
              </Stack>

              {accountInfo.mainActivity && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Activity:
                    </Typography>
                    <Chip
                      label={accountInfo.mainActivity}
                      size="small"
                      color={
                        accountInfo.mainActivity.includes('Spam')
                          ? 'error'
                          : accountInfo.mainActivity.includes('Trader')
                          ? 'info'
                          : 'default'
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </>
              )}
            </Stack>
          )}

          {/* Token Summary */}
          {accountDetails.has(currentAccount) && (() => {
            const details = accountDetails.get(currentAccount);
            const hasTradingActivity = 
              details.tokensBought?.size > 0 || 
              details.tokensSold?.size > 0 || 
              details.tradingVolume > 0;

            if (!hasTradingActivity) return null;

            return (
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <SwapHorizIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  
                  {details.tokensBought?.size > 0 && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Bought:
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="success.main">
                        {details.tokensBought.size} tokens
                      </Typography>
                    </Stack>
                  )}

                  {details.tokensSold?.size > 0 && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Sold:
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="error.main">
                        {details.tokensSold.size} tokens
                      </Typography>
                    </Stack>
                  )}

                  {details.tradingVolume > 0 && (
                    <>
                      <Divider orientation="vertical" flexItem />
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Volume:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {details.tradingVolume.toFixed(2)} XRP
                        </Typography>
                      </Stack>
                    </>
                  )}
                </Stack>

                {details.topTokens?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      Top tokens:
                    </Typography>
                    {details.topTokens.slice(0, 5).map((token, index) => (
                      <Chip
                        key={index}
                        label={getCurrencyDisplayName(token)}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            );
          })()}
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: theme.palette.background.default }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}
            >
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Loading transaction data...
              </Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          {chartData && !loading && !error && (
            <ReactECharts
              option={getChartOption()}
              style={{ height: '100%', width: '100%' }}
              theme={darkMode ? 'dark' : 'light'}
              onEvents={{
                click: handleChartClick
              }}
            />
          )}
        </Box>

        {/* Footer Stats */}
        {spamStats && (
          <Box
            sx={{
              p: 1.5,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'
            }}
          >
            <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
              {spamStats.totalMicroPayments > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Micro-payments:
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {spamStats.totalMicroPayments}
                  </Typography>
                </Stack>
              )}

              {spamStats.spamPercentage > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Spam ratio:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    fontWeight={600}
                    color={spamStats.spamPercentage > 50 ? 'error.main' : 'warning.main'}
                  >
                    {spamStats.spamPercentage.toFixed(1)}%
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default SankeyModal;