import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
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
  const [hoveredAccount, setHoveredAccount] = useState(null);
  const [accountDetails, setAccountDetails] = useState(new Map());

  // Micro payment thresholds (in XRP)
  const spamThresholds = {
    dust: 0.000001, // 1 drop - absolute minimum
    micro: 0.001, // 1000 drops - very small
    small: 0.01, // 10,000 drops - small but potentially legitimate
    normal: 1.0 // 1 XRP - normal transaction
  };

  // Analyze if a payment looks like spam based on patterns
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

    // Check for repeated amounts from same sender
    const senderKey = `${payment.from}-${payment.amount}`;
    const repeatCount = spamPatterns.get(senderKey) || 0;
    spamPatterns.set(senderKey, repeatCount + 1);

    if (repeatCount > 2) {
      indicators.isRepeatedAmount = true;
      indicators.spamScore += 30;
    }

    // Spam scoring
    if (indicators.isDust) indicators.spamScore += 50;
    if (indicators.isMicro) indicators.spamScore += 30;
    if (indicators.isSmall) indicators.spamScore += 10;
    if (!indicators.hasDestinationTag && !indicators.hasMemo) indicators.spamScore += 20;
    if (indicators.isRepeatedAmount) indicators.spamScore += 30;

    return indicators;
  };

  // Categorize payment amount for spam detection
  const categorizeSpamAmount = (amount) => {
    if (amount <= spamThresholds.dust) return 'DUST';
    if (amount <= spamThresholds.micro) return 'MICRO';
    if (amount <= spamThresholds.small) return 'SMALL';
    if (amount <= spamThresholds.normal) return 'NORMAL';
    return 'LARGE';
  };

  // Helper function to decode memo fields
  const decodeMemo = (memos) => {
    if (!memos || !Array.isArray(memos) || memos.length === 0) return null;

    try {
      const memo = memos[0]?.Memo;
      if (!memo) return null;

      let decodedMemo = {};

      // Decode MemoData (the actual message)
      if (memo.MemoData) {
        try {
          const hexData = memo.MemoData;
          const decoded = Buffer.from(hexData, 'hex').toString('utf8');
          decodedMemo.data = decoded;
        } catch (e) {
          decodedMemo.data = memo.MemoData; // Keep hex if decoding fails
        }
      }

      // Decode MemoType (the message type)
      if (memo.MemoType) {
        try {
          const hexType = memo.MemoType;
          const decoded = Buffer.from(hexType, 'hex').toString('utf8');
          decodedMemo.type = decoded;
        } catch (e) {
          decodedMemo.type = memo.MemoType; // Keep hex if decoding fails
        }
      }

      // Decode MemoFormat (the format specification)
      if (memo.MemoFormat) {
        try {
          const hexFormat = memo.MemoFormat;
          const decoded = Buffer.from(hexFormat, 'hex').toString('utf8');
          decodedMemo.format = decoded;
        } catch (e) {
          decodedMemo.format = memo.MemoFormat; // Keep hex if decoding fails
        }
      }

      return Object.keys(decodedMemo).length > 0 ? decodedMemo : null;
    } catch (error) {
      console.error('Error decoding memo:', error);
      return null;
    }
  };

  // Helper function to analyze account activity
  const analyzeAccountActivity = (accountAddress, transactions, targetAccount) => {
    const activity = {
      address: accountAddress,
      totalTransactions: 0,
      totalValue: 0,
      incomingValue: 0,
      outgoingValue: 0,
      transactionTypes: new Map(),
      currencies: new Map(),
      spamTransactions: 0,
      dustTransactions: 0,
      avgTransactionSize: 0,
      firstTransaction: null,
      lastTransaction: null,
      isSpammer: false,
      spamScore: 0,
      patterns: [],
      spamMemos: [], // Add spam memos collection
      uniqueSpamMessages: new Set(), // Track unique spam messages
      allMemos: [], // Add collection for all memos (not just spam)
      uniqueAllMessages: new Set() // Track all unique messages
    };

    const accountTransactions = transactions.filter((txData) => {
      const tx = txData.tx;
      return (
        (tx.Account === accountAddress || tx.Destination === accountAddress) &&
        (tx.Account === targetAccount || tx.Destination === targetAccount)
      );
    });

    accountTransactions.forEach((txData) => {
      const tx = txData.tx;
      const meta = txData.meta;

      if (meta && meta.TransactionResult === 'tesSUCCESS') {
        activity.totalTransactions++;

        // Track transaction types
        const txType = tx.TransactionType;
        activity.transactionTypes.set(txType, (activity.transactionTypes.get(txType) || 0) + 1);

        // Analyze timestamps
        if (tx.date) {
          const txDate = new Date((tx.date + 946684800) * 1000); // XRPL epoch to Unix epoch
          if (!activity.firstTransaction || txDate < activity.firstTransaction) {
            activity.firstTransaction = txDate;
          }
          if (!activity.lastTransaction || txDate > activity.lastTransaction) {
            activity.lastTransaction = txDate;
          }
        }

        // Analyze payments for value and spam detection
        if (tx.TransactionType === 'Payment' && typeof tx.Amount === 'string') {
          const amount = parseInt(tx.Amount) / 1000000;
          activity.totalValue += amount;

          // Track currency
          activity.currencies.set('XRP', (activity.currencies.get('XRP') || 0) + amount);

          // Determine direction
          if (tx.Account === accountAddress && tx.Destination === targetAccount) {
            activity.outgoingValue += amount;
          } else if (tx.Account === targetAccount && tx.Destination === accountAddress) {
            activity.incomingValue += amount;
          }

          // Decode and analyze memos for ALL transactions
          const decodedMemo = decodeMemo(tx.Memos);
          let memoSpamScore = 0;

          // Collect ALL memos (not just spam ones)
          if (decodedMemo) {
            const memoEntry = {
              amount: amount,
              memo: decodedMemo,
              hash: tx.hash,
              date: tx.date ? new Date((tx.date + 946684800) * 1000) : null,
              isSpam: amount <= spamThresholds.small,
              spamScore: 0
            };

            activity.allMemos.push(memoEntry);

            // Track unique messages
            if (decodedMemo.data) {
              activity.uniqueAllMessages.add(decodedMemo.data);
            }
          }

          // Spam analysis
          if (amount <= spamThresholds.small) {
            if (amount <= spamThresholds.dust) {
              activity.dustTransactions++;
              activity.spamScore += 50;
              memoSpamScore += 50;
            } else if (amount <= spamThresholds.micro) {
              activity.spamScore += 30;
              memoSpamScore += 30;
            } else {
              activity.spamScore += 10;
              memoSpamScore += 10;
            }
            activity.spamTransactions++;

            // Collect spam memos for analysis
            if (decodedMemo) {
              const spamMemoEntry = {
                amount: amount,
                memo: decodedMemo,
                hash: tx.hash,
                date: tx.date ? new Date((tx.date + 946684800) * 1000) : null,
                spamScore: memoSpamScore
              };
              activity.spamMemos.push(spamMemoEntry);

              // Track unique spam messages
              if (decodedMemo.data) {
                activity.uniqueSpamMessages.add(decodedMemo.data);
              }
            }
          } else {
            // For non-spam memos, update the spam score in allMemos
            if (decodedMemo && activity.allMemos.length > 0) {
              activity.allMemos[activity.allMemos.length - 1].spamScore = memoSpamScore;
            }
          }

          // Pattern detection
          if (!tx.DestinationTag && !tx.Memos) {
            activity.spamScore += 5;
          }
        } else if (tx.TransactionType === 'Payment' && typeof tx.Amount === 'object') {
          // Token payments
          const currency = tx.Amount.currency;
          const amount = parseFloat(tx.Amount.value);
          activity.currencies.set(currency, (activity.currencies.get(currency) || 0) + amount);
        }
      }
    });

    // Calculate derived metrics
    if (activity.totalTransactions > 0) {
      activity.avgTransactionSize = activity.totalValue / activity.totalTransactions;
      activity.isSpammer =
        activity.spamScore > 100 || activity.spamTransactions / activity.totalTransactions > 0.5;
    }

    // Identify patterns
    if (activity.dustTransactions > 5) {
      activity.patterns.push('Dust Attack Pattern');
    }
    if (activity.spamTransactions / activity.totalTransactions > 0.8) {
      activity.patterns.push('High Spam Ratio');
    }
    if (activity.totalTransactions > 20 && activity.avgTransactionSize < 0.001) {
      activity.patterns.push('Micro Payment Spammer');
    }

    // Memo-based spam patterns
    if (activity.spamMemos.length > 0) {
      activity.patterns.push('Memo Spam Detected');

      // Check for repeated messages
      if (activity.uniqueSpamMessages.size < activity.spamMemos.length / 2) {
        activity.patterns.push('Repeated Spam Messages');
      }

      // Check for promotional/scam keywords
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

    return activity;
  };

  useEffect(() => {
    if (open && account) {
      fetchAccountTransactions();
    }
  }, [open, account]);

  // Clean up hovered account when modal closes
  useEffect(() => {
    if (!open) {
      setHoveredAccount(null);
    }
  }, [open]);

  const fetchAccountTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch XRPL account transactions using the account_tx method
      const response = await axios.post('https://xrplcluster.com/', {
        method: 'account_tx',
        params: [
          {
            account: account,
            ledger_index_min: -1,
            ledger_index_max: -1,
            binary: false,
            limit: 200,
            forward: false
          }
        ]
      });

      if (response.data && response.data.result && response.data.result.transactions) {
        const transactions = response.data.result.transactions;
        const processedData = processTransactionsForSankey(transactions, account);
        setChartData(processedData);

        // Get account info for display
        setAccountInfo({
          address: account,
          totalTransactions: transactions.length
        });
      } else {
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

    // Create separate nodes for inflows and outflows to avoid cycles
    const inflowHub = `${targetAccount}_INFLOW`;
    const outflowHub = `${targetAccount}_OUTFLOW`;

    nodes.add(inflowHub);
    nodes.add(outflowHub);
    accountStats.set(inflowHub, { in: 0, out: 0, transactions: 0 });
    accountStats.set(outflowHub, { in: 0, out: 0, transactions: 0 });

    // Helper function to decode hex currency codes
    const decodeCurrency = (currency) => {
      if (!currency || currency === '0000000000000000000000000000000000000000') {
        return 'XRP';
      }

      // If it's already 3 characters, return as is
      if (currency.length === 3) {
        return currency;
      }

      // Try to decode hex currency code
      if (currency.length === 40) {
        try {
          const decoded = Buffer.from(currency, 'hex').toString('ascii').replace(/\0/g, '');
          return decoded || currency.substring(0, 8) + '...';
        } catch (e) {
          return currency.substring(0, 8) + '...';
        }
      }

      return currency;
    };

    // Helper function to extract actual exchange amounts from metadata
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

      // Look for balance changes that indicate actual value transfer
      for (const node of meta.AffectedNodes) {
        const modifiedNode = node.ModifiedNode;
        if (modifiedNode && modifiedNode.LedgerEntryType === 'AccountRoot') {
          const account = modifiedNode.FinalFields?.Account;
          const prevBalance = modifiedNode.PreviousFields?.Balance;
          const finalBalance = modifiedNode.FinalFields?.Balance;

          if (account && prevBalance && finalBalance) {
            const balanceChange = parseInt(finalBalance) - parseInt(prevBalance);

            // Significant balance change (more than just fees)
            if (Math.abs(balanceChange) > 100) {
              // More than 100 drops
              const amount = Math.abs(balanceChange) / 1000000; // Convert to XRP

              if (balanceChange > 0) {
                // Account received XRP
                exchangeData.destinationAccount = account;
                exchangeData.amount = amount;
              } else {
                // Account sent XRP
                exchangeData.sourceAccount = account;
                exchangeData.amount = amount;
              }
            }
          }
        }

        // Look for trust line balance changes (token transfers)
        if (modifiedNode && modifiedNode.LedgerEntryType === 'RippleState') {
          const balance = modifiedNode.FinalFields?.Balance;
          const prevBalance = modifiedNode.PreviousFields?.Balance;

          if (
            balance &&
            prevBalance &&
            typeof balance === 'object' &&
            typeof prevBalance === 'object'
          ) {
            const change = parseFloat(balance.value) - parseFloat(prevBalance.value);
            if (Math.abs(change) > 0.01) {
              // Significant token change
              const currency = decodeCurrency(balance.currency);

              if (change > 0) {
                exchangeData.tokensReceived.push({ currency, amount: change });
              } else {
                exchangeData.tokensSent.push({ currency, amount: Math.abs(change) });
              }
            }
          }
        }
      }

      return exchangeData;
    };

    // Collect all unique accounts for detailed analysis
    const uniqueAccounts = new Set();
    transactions.forEach((txData) => {
      const tx = txData.tx;
      if (tx.Account && tx.Account !== targetAccount) uniqueAccounts.add(tx.Account);
      if (tx.Destination && tx.Destination !== targetAccount) uniqueAccounts.add(tx.Destination);
    });

    // Analyze each account's activity
    uniqueAccounts.forEach((accountAddress) => {
      const details = analyzeAccountActivity(accountAddress, transactions, targetAccount);
      accountDetailsMap.set(accountAddress, details);
    });

    // Store account details for hover functionality
    setAccountDetails(accountDetailsMap);

    transactions.forEach((txData) => {
      const tx = txData.tx;
      const meta = txData.meta;

      if (meta && meta.TransactionResult === 'tesSUCCESS') {
        let sourceAccount = null;
        let destinationAccount = null;
        let amount = 0;
        let currency = 'XRP';
        let spamAnalysis = null;

        // Process different transaction types with enhanced logic
        if (tx.TransactionType === 'Payment') {
          sourceAccount = tx.Account;
          destinationAccount = tx.Destination;

          // Handle amount - can be XRP (string) or token (object)
          if (typeof tx.Amount === 'string') {
            amount = parseInt(tx.Amount) / 1000000; // Convert drops to XRP
            currency = 'XRP';

            // Detect micro payments for spam analysis
            if (amount <= spamThresholds.small && sourceAccount !== destinationAccount) {
              const payment = {
                hash: tx.hash,
                from: sourceAccount,
                to: destinationAccount,
                amount: amount,
                amountDrops: parseInt(tx.Amount),
                destinationTag: tx.DestinationTag,
                memo: tx.Memos,
                fee: parseInt(tx.Fee) / 1000000,
                timestamp: tx.date,
                ledgerIndex: tx.ledger_index || txData.ledger_index
              };

              spamAnalysis = analyzeSpamPatterns(payment, senderStats, spamPatterns);
              microPayments.push({
                ...payment,
                spamAnalysis,
                category: categorizeSpamAmount(amount)
              });
            }
          } else if (typeof tx.Amount === 'object') {
            amount = parseFloat(tx.Amount.value);
            currency = decodeCurrency(tx.Amount.currency);
          }

          // Handle self-payments (same account sender and receiver)
          if (sourceAccount === destinationAccount) {
            // Check if this is an AMM transaction (self-payment with token exchange)
            if (sourceAccount === targetAccount) {
              const metaExchange = extractExchangeFromMeta(meta, targetAccount);

              if (
                metaExchange &&
                (metaExchange.tokensReceived.length > 0 || metaExchange.tokensSent.length > 0)
              ) {
                // This is an AMM transaction - token purchase/sale
                if (metaExchange.tokensReceived.length > 0) {
                  // Receiving tokens - treat as purchase from AMM
                  const token = metaExchange.tokensReceived[0]; // Use first token
                  destinationAccount = `AMM_${token.currency}`;
                  amount = token.amount;
                  currency = token.currency;
                } else if (metaExchange.tokensSent.length > 0) {
                  // Sending tokens - treat as sale to AMM
                  const token = metaExchange.tokensSent[0]; // Use first token
                  destinationAccount = `AMM_${token.currency}`;
                  amount = token.amount;
                  currency = token.currency;
                }
              } else {
                // Regular self-transfer (no token exchange detected)
                destinationAccount = 'SELF_TRANSFER';
                currency = 'SELF';
              }
            }
          }
        } else if (tx.TransactionType === 'OfferCreate') {
          sourceAccount = tx.Account;

          // Extract meaningful exchange data from the offer
          let baseCurrency = 'XRP';
          let quoteCurrency = 'USD';
          let offerAmount = 1;

          if (typeof tx.TakerGets === 'object') {
            baseCurrency = decodeCurrency(tx.TakerGets.currency);
          }
          if (typeof tx.TakerPays === 'object') {
            quoteCurrency = decodeCurrency(tx.TakerPays.currency);
            offerAmount = parseFloat(tx.TakerPays.value) / 1000; // Normalize large amounts
          } else {
            offerAmount = parseInt(tx.TakerPays) / 1000000000; // Large XRP amounts normalized
          }

          destinationAccount = `DEX_${baseCurrency}/${quoteCurrency}`;
          amount = Math.min(offerAmount, 10000); // Cap large amounts for visualization
          currency = `${baseCurrency}→${quoteCurrency}`;
        } else if (tx.TransactionType === 'OfferCancel') {
          sourceAccount = tx.Account;
          destinationAccount = 'DEX_CANCEL';
          amount = 1;
          currency = 'CANCEL';
        } else if (tx.TransactionType === 'TrustSet') {
          sourceAccount = tx.Account;
          const limitCurrency = tx.LimitAmount ? decodeCurrency(tx.LimitAmount.currency) : 'TOKEN';
          destinationAccount = `TRUST_${limitCurrency}`;
          amount = 1;
          currency = 'TRUST';
        } else {
          // Handle other transaction types
          sourceAccount = tx.Account;
          destinationAccount = `${tx.TransactionType}_OPS`;
          amount = 1;
          currency = tx.TransactionType;

          // Try to extract actual exchange data from metadata
          const metaExchange = extractExchangeFromMeta(meta, targetAccount);
          if (metaExchange && metaExchange.amount > 0) {
            amount = metaExchange.amount;
            currency = metaExchange.currency;
            if (metaExchange.sourceAccount) sourceAccount = metaExchange.sourceAccount;
            if (metaExchange.destinationAccount)
              destinationAccount = metaExchange.destinationAccount;
          }
        }

        if (sourceAccount && destinationAccount && amount >= 0) {
          // Accept all amounts including 0
          // Restructure to avoid cycles using hub-and-spoke model
          if (sourceAccount === targetAccount) {
            // Target account is sending - flow from outflow hub to destination
            nodes.add(destinationAccount);
            if (!accountStats.has(destinationAccount)) {
              accountStats.set(destinationAccount, { in: 0, out: 0, transactions: 0 });
            }

            // Create unique link identifier to separate by currency
            const linkId = `${outflowHub}->${destinationAccount}-${currency}`;
            const existingLink = links.find(
              (link) =>
                link.source === outflowHub &&
                link.target === destinationAccount &&
                link.currency === currency
            );

            if (existingLink) {
              existingLink.value += amount;
              existingLink.count += 1;
              // Update spam information if this is a spam transaction
              if (spamAnalysis && spamAnalysis.spamScore >= 40) {
                existingLink.isSpam = true;
                existingLink.spamScore = Math.max(
                  existingLink.spamScore || 0,
                  spamAnalysis.spamScore
                );
                existingLink.spamCount = (existingLink.spamCount || 0) + 1;
              }
            } else {
              const newLink = {
                source: outflowHub,
                target: destinationAccount,
                value: amount,
                count: 1,
                currency: currency,
                txType: tx.TransactionType,
                isSpam: spamAnalysis && spamAnalysis.spamScore >= 40,
                spamScore: spamAnalysis?.spamScore || 0,
                spamCount: spamAnalysis && spamAnalysis.spamScore >= 40 ? 1 : 0
              };
              links.push(newLink);
            }

            accountStats.get(outflowHub).out += amount;
            accountStats.get(destinationAccount).in += amount;
            accountStats.get(outflowHub).transactions += 1;
            accountStats.get(destinationAccount).transactions += 1;
          } else if (destinationAccount === targetAccount) {
            // Target account is receiving - flow from source to inflow hub
            nodes.add(sourceAccount);
            if (!accountStats.has(sourceAccount)) {
              accountStats.set(sourceAccount, { in: 0, out: 0, transactions: 0 });
            }

            // Create unique link identifier to separate by currency
            const linkId = `${sourceAccount}->${inflowHub}-${currency}`;
            const existingLink = links.find(
              (link) =>
                link.source === sourceAccount &&
                link.target === inflowHub &&
                link.currency === currency
            );

            if (existingLink) {
              existingLink.value += amount;
              existingLink.count += 1;
              // Update spam information if this is a spam transaction
              if (spamAnalysis && spamAnalysis.spamScore >= 40) {
                existingLink.isSpam = true;
                existingLink.spamScore = Math.max(
                  existingLink.spamScore || 0,
                  spamAnalysis.spamScore
                );
                existingLink.spamCount = (existingLink.spamCount || 0) + 1;
              }
            } else {
              const newLink = {
                source: sourceAccount,
                target: inflowHub,
                value: amount,
                count: 1,
                currency: currency,
                txType: tx.TransactionType,
                isSpam: spamAnalysis && spamAnalysis.spamScore >= 40,
                spamScore: spamAnalysis?.spamScore || 0,
                spamCount: spamAnalysis && spamAnalysis.spamScore >= 40 ? 1 : 0
              };
              links.push(newLink);
            }

            accountStats.get(sourceAccount).out += amount;
            accountStats.get(inflowHub).in += amount;
            accountStats.get(sourceAccount).transactions += 1;
            accountStats.get(inflowHub).transactions += 1;
          } else {
            // Transaction not involving target account directly
            return;
          }
        }
      }
    });

    // Calculate spam statistics
    const totalSpamTransactions = microPayments.filter(
      (p) => p.spamAnalysis.spamScore >= 40
    ).length;
    const highSpamCount = microPayments.filter((p) => p.spamAnalysis.spamScore >= 70).length;
    const mediumSpamCount = microPayments.filter(
      (p) => p.spamAnalysis.spamScore >= 40 && p.spamAnalysis.spamScore < 70
    ).length;

    const spamStatsData = {
      totalMicroPayments: microPayments.length,
      totalSpamTransactions,
      highSpamCount,
      mediumSpamCount,
      spamPercentage:
        microPayments.length > 0
          ? ((totalSpamTransactions / microPayments.length) * 100).toFixed(1)
          : 0,
      topSpamSenders: [...spamPatterns.entries()]
        .filter(([key, count]) => count > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pattern, count]) => {
          const [sender, amount] = pattern.split('-');
          return { sender: sender.substring(0, 12) + '...', amount: parseFloat(amount), count };
        })
    };

    setSpamStats(spamStatsData);

    // Convert nodes to array with enhanced categorization
    const nodeArray = Array.from(nodes).map((node) => ({
      name: node,
      category:
        node === inflowHub
          ? 'inflow'
          : node === outflowHub
          ? 'outflow'
          : node.startsWith('DEX_')
          ? 'dex'
          : node.startsWith('TRUST_')
          ? 'trust'
          : node.startsWith('AMM_')
          ? 'amm'
          : node === 'SELF_TRANSFER'
          ? 'self'
          : node.endsWith('_OPS')
          ? 'operations'
          : 'account',
      value: accountStats.get(node)?.transactions || 0,
      displayName:
        node === inflowHub
          ? `💰 TO ${targetAccount.substring(0, 8)}...`
          : node === outflowHub
          ? `💸 FROM ${targetAccount.substring(0, 8)}...`
          : node.startsWith('DEX_')
          ? `🏪 ${node.replace('DEX_', '')}`
          : node.startsWith('TRUST_')
          ? `🤝 ${node.replace('TRUST_', '')}`
          : node.startsWith('AMM_')
          ? `🔄 ${node.replace('AMM_', '')} Pool`
          : node === 'SELF_TRANSFER'
          ? '🔄 Self Transfer'
          : node.endsWith('_OPS')
          ? `⚙️ ${node.replace('_OPS', '')}`
          : node.length > 25
          ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}`
          : node
    }));

    return {
      nodes: nodeArray,
      links: links.filter((link) => link.value > 0),
      stats: Object.fromEntries(accountStats),
      targetAccount,
      summary: {
        totalInflow: links
          .filter((l) => l.target === inflowHub)
          .reduce((sum, l) => sum + l.value, 0),
        totalOutflow: links
          .filter((l) => l.source === outflowHub)
          .reduce((sum, l) => sum + l.value, 0),
        totalTransactions: links.reduce((sum, l) => sum + l.count, 0)
      }
    };
  };

  const getChartOption = useMemo(() => {
    if (!chartData) return {};

    const { nodes, links } = chartData;

    // Filter links based on spam filter
    const filteredLinks = showSpamOnly ? links.filter((link) => link.isSpam) : links;

    return {
      backgroundColor: 'transparent',
      animation: false,
      title: {
        text: 'Transaction Flow Analysis',
        left: 'center',
        top: 10,
        textStyle: {
          color: theme.palette.text.primary,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: darkMode ? '#444444' : theme.palette.divider,
        borderWidth: 1,
        borderRadius: 8,
        padding: [12, 16],
        textStyle: {
          color: theme.palette.text.primary,
          fontSize: 13
        },
        formatter: function (params) {
          if (params.dataType === 'node') {
            const categoryLabel =
              {
                inflow: '💰 Inflow Hub',
                outflow: '💸 Outflow Hub',
                dex: '🏪 DEX Operations',
                trust: '🤝 Trust Lines',
                amm: '🔄 AMM Pool',
                self: '🔄 Self Transfer',
                operations: '⚙️ System Operations',
                account: '👤 Account'
              }[params.data.category] || 'Unknown';

            return `<div style="font-weight: bold; margin-bottom: 8px; color: ${
              theme.palette.primary.main
            };">
                      ${params.data.displayName || params.data.name}
                    </div>
                    <div style="margin-bottom: 4px;">Type: ${categoryLabel}</div>
                    <div>Transactions: <strong>${params.data.value}</strong></div>`;
          } else if (params.dataType === 'edge') {
            const sourceName =
              nodes.find((n) => n.name === params.data.source)?.displayName || params.data.source;
            const targetName =
              nodes.find((n) => n.name === params.data.target)?.displayName || params.data.target;

            let spamInfo = '';
            if (params.data.isSpam) {
              const spamLevel = params.data.spamScore >= 70 ? '🔴 HIGH' : '🟡 MEDIUM';
              spamInfo = `<div style="margin-bottom: 4px; color: #ff4444; font-weight: bold;">
                            ⚠️ SPAM DETECTED: ${spamLevel} (Score: ${params.data.spamScore})
                          </div>
                          <div style="margin-bottom: 4px;">Spam Transactions: <strong style="color: #ff4444;">${params.data.spamCount}</strong></div>`;
            }

            return `<div style="font-weight: bold; margin-bottom: 8px; color: ${
              theme.palette.primary.main
            };">
                      ${sourceName} → ${targetName}
                    </div>
                    ${spamInfo}
                    <div style="margin-bottom: 4px;">Total Value: <strong>${params.data.value.toFixed(
                      8
                    )}</strong></div>
                    <div style="margin-bottom: 4px;">Transactions: <strong>${
                      params.data.count
                    }</strong></div>
                    <div style="margin-bottom: 4px;">Currency: <strong>${
                      params.data.currency
                    }</strong></div>
                    ${
                      params.data.txType
                        ? `<div>Transaction Type: <strong>${params.data.txType}</strong></div>`
                        : ''
                    }`;
          }
        },
        extraCssText: `
          box-shadow: 0 8px 32px ${darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.15)'};
          backdrop-filter: blur(10px);
        `
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          top: 60,
          bottom: 20,
          left: 20,
          right: 20,
          nodeWidth: 25,
          nodeGap: 12,
          nodeAlign: 'justify',
          layoutIterations: 0,
          emphasis: {
            focus: 'adjacency',
            blurScope: 'coordinateSystem'
          },
          blur: {
            itemStyle: {
              opacity: 0.3
            },
            lineStyle: {
              opacity: 0.2
            },
            label: {
              opacity: 0.3
            }
          },
          animation: false,
          animationDuration: 0,
          animationEasing: 'linear',
          data: nodes.map((node) => ({
            ...node,
            itemStyle: {
              color: (() => {
                switch (node.category) {
                  case 'inflow':
                    return theme.palette.success.main;
                  case 'outflow':
                    return theme.palette.error.main;
                  case 'dex':
                    return theme.palette.info.main;
                  case 'trust':
                    return theme.palette.secondary.main;
                  case 'amm':
                    return theme.palette.purple?.[500] || '#9c27b0';
                  case 'self':
                    return theme.palette.grey[600];
                  case 'operations':
                    return theme.palette.warning.main;
                  default:
                    return theme.palette.primary.main;
                }
              })(),
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1
            }
          })),
          links: filteredLinks.map((link) => ({
            ...link,
            lineStyle: {
              color: link.isSpam ? '#ff4444' : 'source', // Red for spam, source color for normal
              opacity: link.isSpam ? 0.8 : 0.6,
              curveness: 0.5,
              width: link.isSpam ? 3 : undefined, // Thicker lines for spam
              type: link.isSpam ? 'dashed' : 'solid', // Dashed lines for spam
              shadowColor: link.isSpam ? '#ff4444' : undefined,
              shadowBlur: link.isSpam ? 10 : undefined
            }
          })),
          label: {
            show: true,
            position: 'right',
            distance: 8,
            color: theme.palette.text.primary,
            fontSize: 11,
            fontWeight: 'bold',
            formatter: function (params) {
              const displayName = params.data.displayName || params.data.name;

              // Add icons based on category
              const icon =
                {
                  inflow: '💰 ',
                  outflow: '💸 ',
                  dex: '🏪 ',
                  trust: '🤝 ',
                  amm: '🔄 ',
                  self: '🔄 ',
                  operations: '⚙️ ',
                  account: '👤 '
                }[params.data.category] || '';

              return icon + displayName;
            },
            rich: {
              icon: {
                fontSize: 14,
                padding: [0, 4, 0, 0]
              }
            }
          }
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 30,
          top: 70,
          style: {
            text: 'INCOMING',
            fill: theme.palette.success.main,
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        {
          type: 'text',
          right: 30,
          top: 70,
          style: {
            text: 'OUTGOING',
            fill: theme.palette.error.main,
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        // Add spam indicator if spam exists
        ...(spamStats && spamStats.totalSpamTransactions > 0
          ? [
              {
                type: 'text',
                left: 'center',
                top: 40,
                style: {
                  text: `⚠️ ${spamStats.totalSpamTransactions} SPAM TRANSACTIONS DETECTED`,
                  fill: '#ff4444',
                  fontSize: 11,
                  fontWeight: 'bold'
                }
              }
            ]
          : [])
      ]
    };
  }, [chartData, showSpamOnly, spamStats, theme]);

  const handleClose = () => {
    setChartData(null);
    setError(null);
    setHoveredAccount(null);
    setAccountDetails(new Map());
    setSpamStats(null);
    onClose();
  };

  // Memoize account details to prevent unnecessary re-renders
  const accountDetailsSidebar = useMemo(() => {
    if (!hoveredAccount || !accountDetails.has(hoveredAccount)) return null;

    const details = accountDetails.get(hoveredAccount);
    const spamLevel = details.isSpammer
      ? '🔴 HIGH RISK'
      : details.spamScore > 50
      ? '🟡 MEDIUM RISK'
      : '🟢 LOW RISK';

    return (
      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          left: 220,
          top: 20,
          bottom: 20,
          width: 420,
          zIndex: 1000,
          bgcolor: darkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkMode ? '#333' : theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={() => {
          // Keep the sidebar open when hovering over it
        }}
        onMouseLeave={() => {
          // Close the sidebar when leaving it
          setHoveredAccount(null);
        }}
      >
        {/* Header */}
        <Box
          sx={{ p: 1.5, borderBottom: `1px solid ${darkMode ? '#333' : theme.palette.divider}` }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            👤 Account Analysis
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              p: 0.5,
              borderRadius: 1,
              wordBreak: 'break-all',
              display: 'block'
            }}
          >
            {details.address}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={spamLevel}
              size="small"
              sx={{
                bgcolor: details.isSpammer
                  ? '#ff4444'
                  : details.spamScore > 50
                  ? '#ffaa00'
                  : '#4caf50',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', p: 1.5 }}>
          {/* Combined Transaction & Flow Summary */}
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, mb: 0.5, color: theme.palette.primary.main, display: 'block' }}
          >
            📊 Transaction & Flow Summary
          </Typography>
          <Box sx={{ mb: 1.5, fontSize: '0.75rem' }}>
            <Stack spacing={0.3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Transactions:</span>
                <strong>{details.totalTransactions}</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Value:</span>
                <strong>{details.totalValue.toFixed(8)} XRP</strong>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📈 Received:</span>
                <strong style={{ color: theme.palette.success.main }}>
                  {details.incomingValue.toFixed(8)} XRP
                </strong>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>📉 Sent:</span>
                <strong style={{ color: theme.palette.error.main }}>
                  {details.outgoingValue.toFixed(8)} XRP
                </strong>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Avg Size:</span>
                <strong>{details.avgTransactionSize.toFixed(8)} XRP</strong>
              </Box>
            </Stack>
          </Box>

          {/* Transaction Types - Condensed */}
          {details.transactionTypes.size > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: theme.palette.primary.main,
                  display: 'block'
                }}
              >
                🔄 Types:{' '}
                {[...details.transactionTypes.entries()]
                  .map(([type, count]) => `${type}(${count})`)
                  .join(', ')}
              </Typography>
            </>
          )}

          {/* Spam Analysis - Condensed */}
          {details.spamTransactions > 0 && (
            <Box
              sx={{
                mb: 1.5,
                p: 1,
                bgcolor: 'rgba(255,68,68,0.1)',
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#ff4444', display: 'block', mb: 0.5 }}
              >
                ⚠️ Spam Analysis
              </Typography>
              <Stack spacing={0.2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    Score: <strong style={{ color: '#ff4444' }}>{details.spamScore}</strong>
                  </span>
                  <span>
                    Spam: <strong style={{ color: '#ff4444' }}>{details.spamTransactions}</strong>
                  </span>
                  <span>
                    Dust: <strong style={{ color: '#ff4444' }}>{details.dustTransactions}</strong>
                  </span>
                </Box>
                <Box>
                  <span>
                    Ratio:{' '}
                    <strong style={{ color: '#ff4444' }}>
                      {((details.spamTransactions / details.totalTransactions) * 100).toFixed(1)}%
                    </strong>
                  </span>
                </Box>
              </Stack>
            </Box>
          )}

          {/* All Memos Section - Show all memos with decoding */}
          {details.allMemos && details.allMemos.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  display: 'block',
                  mb: 0.5
                }}
              >
                📨 All Memos ({details.allMemos.length} total, {details.uniqueAllMessages.size}{' '}
                unique)
              </Typography>
              <Box sx={{ maxHeight: '150px', overflow: 'auto' }}>
                {details.allMemos.slice(0, 8).map((memoEntry, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 0.5,
                      mb: 0.5,
                      bgcolor: memoEntry.isSpam
                        ? 'rgba(255,68,68,0.1)'
                        : darkMode
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${
                        memoEntry.isSpam ? 'rgba(255,68,68,0.3)' : 'rgba(128,128,128,0.3)'
                      }`,
                      borderRadius: 0.5,
                      fontSize: '0.65rem'
                    }}
                  >
                    {/* Show memo amount and type */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: memoEntry.isSpam ? '#ff4444' : theme.palette.primary.main,
                        display: 'block',
                        mb: 0.3
                      }}
                    >
                      💸 {memoEntry.amount.toFixed(8)} XRP
                      {memoEntry.isSpam && ` • Spam Score: ${memoEntry.spamScore}`}
                      {!memoEntry.isSpam && ' • Legitimate'}
                    </Typography>

                    {/* Show memo type if available */}
                    {memoEntry.memo.type && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mb: 0.2,
                          fontSize: '0.6rem'
                        }}
                      >
                        Type: {memoEntry.memo.type}
                      </Typography>
                    )}

                    {/* Show memo format if available */}
                    {memoEntry.memo.format && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mb: 0.2,
                          fontSize: '0.6rem'
                        }}
                      >
                        Format: {memoEntry.memo.format}
                      </Typography>
                    )}

                    {/* Show memo data */}
                    {memoEntry.memo.data && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: theme.palette.text.primary,
                          wordBreak: 'break-word',
                          display: 'block',
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          p: 0.3,
                          borderRadius: 0.3,
                          fontSize: '0.65rem'
                        }}
                      >
                        "{memoEntry.memo.data}"
                      </Typography>
                    )}

                    {/* Show transaction date and hash */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.2 }}>
                      {memoEntry.date && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.6rem'
                          }}
                        >
                          📅 {memoEntry.date.toLocaleDateString()}
                        </Typography>
                      )}
                      {memoEntry.hash && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.6rem',
                            fontFamily: 'monospace'
                          }}
                        >
                          #{memoEntry.hash.substring(0, 8)}...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
                {details.allMemos.length > 8 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontStyle: 'italic',
                      fontSize: '0.65rem'
                    }}
                  >
                    +{details.allMemos.length - 8} more memo transactions
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Spam Messages - More Compact */}
          {details.spamMemos && details.spamMemos.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, color: '#ff4444', display: 'block', mb: 0.5 }}
              >
                📨 Spam Messages ({details.uniqueSpamMessages.size} unique)
              </Typography>
              <Box sx={{ maxHeight: '120px', overflow: 'auto' }}>
                {details.spamMemos.slice(0, 5).map((memoEntry, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 0.5,
                      mb: 0.5,
                      bgcolor: 'rgba(255,68,68,0.1)',
                      border: '1px solid rgba(255,68,68,0.3)',
                      borderRadius: 0.5,
                      fontSize: '0.65rem'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: '#ff4444',
                        display: 'block',
                        mb: 0.3
                      }}
                    >
                      💸 {memoEntry.amount.toFixed(8)} XRP • Score: {memoEntry.spamScore}
                    </Typography>

                    {memoEntry.memo.type && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mb: 0.2,
                          fontSize: '0.6rem'
                        }}
                      >
                        Type: {memoEntry.memo.type}
                      </Typography>
                    )}

                    {memoEntry.memo.format && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mb: 0.2,
                          fontSize: '0.6rem'
                        }}
                      >
                        Format: {memoEntry.memo.format}
                      </Typography>
                    )}

                    {memoEntry.memo.data && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: theme.palette.text.primary,
                          wordBreak: 'break-word',
                          display: 'block',
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          p: 0.3,
                          borderRadius: 0.3,
                          fontSize: '0.65rem'
                        }}
                      >
                        "{memoEntry.memo.data}"
                      </Typography>
                    )}

                    {memoEntry.date && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          display: 'block',
                          mt: 0.2,
                          fontSize: '0.6rem'
                        }}
                      >
                        📅 {memoEntry.date.toLocaleDateString()}{' '}
                        {memoEntry.date.toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                ))}
                {details.spamMemos.length > 5 && (
                  <Typography
                    variant="caption"
                    sx={{ color: '#ff4444', fontStyle: 'italic', fontSize: '0.65rem' }}
                  >
                    +{details.spamMemos.length - 5} more memo transactions
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Patterns - Inline Chips */}
          {details.patterns.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: theme.palette.warning.main,
                  display: 'block'
                }}
              >
                🔍 Patterns
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {details.patterns.map((pattern, index) => (
                  <Chip
                    key={index}
                    label={pattern}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,152,0,0.2)',
                      color: theme.palette.warning.main,
                      fontSize: '0.6rem',
                      height: '20px'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Timeline - Compact */}
          {details.firstTransaction && details.lastTransaction && (
            <Box sx={{ mb: 1.5, fontSize: '0.75rem' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: theme.palette.primary.main,
                  display: 'block'
                }}
              >
                ⏰ Activity Period
              </Typography>
              <Box>
                <Box sx={{ mb: 0.3 }}>
                  <span style={{ color: theme.palette.text.secondary }}>First: </span>
                  <strong>{details.firstTransaction.toLocaleDateString()}</strong>
                </Box>
                <Box>
                  <span style={{ color: theme.palette.text.secondary }}>Last: </span>
                  <strong>{details.lastTransaction.toLocaleDateString()}</strong>
                </Box>
              </Box>
            </Box>
          )}

          {/* Currencies - Inline */}
          {details.currencies.size > 0 && (
            <Box sx={{ fontSize: '0.75rem' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  color: theme.palette.primary.main,
                  display: 'block'
                }}
              >
                💰 Currencies:{' '}
                {[...details.currencies.entries()]
                  .map(
                    ([currency, amount]) =>
                      `${currency}(${typeof amount === 'number' ? amount.toFixed(2) : amount})`
                  )
                  .join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }, [hoveredAccount, accountDetails, darkMode, theme]);

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="sankey-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: 1400,
          height: '90vh',
          bgcolor: darkMode ? '#000000' : 'background.paper',
          boxShadow: `0 24px 48px ${darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.2)'}`,
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${darkMode ? '#333333' : theme.palette.divider}`
        }}
      >
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderBottom: `2px solid ${darkMode ? '#333333' : theme.palette.divider}`,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
            bgcolor: darkMode ? '#000000' : 'transparent'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography
                id="sankey-modal-title"
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  mb: 1.5
                }}
              >
                🌊 Sankey Flow Analysis
              </Typography>

              {accountInfo && (
                <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`👤 ${accountInfo.address.substring(
                      0,
                      12
                    )}...${accountInfo.address.substring(accountInfo.address.length - 8)}`}
                    size="medium"
                    variant="outlined"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    label={`📊 ${accountInfo.totalTransactions} Transactions`}
                    size="medium"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              )}

              {/* Enhanced Legend */}
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                <Chip
                  label="💰 Inflows"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.success.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.success.main}40`
                  }}
                />
                <Chip
                  label="💸 Outflows"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.error.main}40`
                  }}
                />
                <Chip
                  label="🏪 DEX"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.info.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.info.main}40`
                  }}
                />
                <Chip
                  label="🤝 Trust"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.secondary.main}40`
                  }}
                />
                <Chip
                  label="🔄 AMM"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.purple?.[500] || '#9c27b0',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.purple?.[500] || '#9c27b0'}40`
                  }}
                />
                <Chip
                  label="🔄 Self"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.grey[600],
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.grey[600]}40`
                  }}
                />
                <Chip
                  label="⚙️ Operations"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.warning.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.warning.main}40`
                  }}
                />
                <Chip
                  label="👤 Accounts"
                  size="small"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${theme.palette.primary.main}40`
                  }}
                />
                {/* Spam Legend */}
                <Chip
                  label="⚠️ Spam"
                  size="small"
                  sx={{
                    bgcolor: '#ff4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px #ff444440'
                  }}
                />
              </Stack>

              {/* Spam Statistics and Controls */}
              {spamStats && spamStats.totalMicroPayments > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: darkMode ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.05)',
                    borderRadius: 2,
                    border: '1px solid #ff4444'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                    <WarningIcon sx={{ color: '#ff4444' }} />
                    <Typography variant="h6" sx={{ color: '#ff4444', fontWeight: 600 }}>
                      Micro Payment Spam Detection
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showSpamOnly}
                          onChange={(e) => setShowSpamOnly(e.target.checked)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#ff4444'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#ff4444'
                            }
                          }}
                        />
                      }
                      label="Show Spam Only"
                      sx={{ ml: 'auto', '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
                    />
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                    <Chip
                      label={`🔍 ${spamStats.totalMicroPayments} Micro Payments`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#ff4444', color: '#ff4444', fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`🔴 ${spamStats.highSpamCount} High Spam`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#ff4444', color: '#ff4444', fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`🟡 ${spamStats.mediumSpamCount} Medium Spam`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#ffaa00', color: '#ffaa00', fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={`📊 ${spamStats.spamPercentage}% Spam Rate`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#ff4444', color: '#ff4444', fontSize: '0.7rem' }}
                    />
                  </Stack>

                  {spamStats.topSpamSenders.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: '#ff4444', fontWeight: 600, display: 'block', mb: 0.5 }}
                      >
                        Top Spam Senders:
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {spamStats.topSpamSenders.map((sender, index) => (
                          <Tooltip
                            key={index}
                            title={`Sent ${sender.amount.toFixed(6)} XRP ${sender.count} times`}
                            arrow
                          >
                            <Chip
                              label={`${sender.sender} (${sender.count}x)`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,68,68,0.2)',
                                color: '#ff4444',
                                fontSize: '0.65rem',
                                fontFamily: 'monospace'
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {/* Summary Section */}
              {chartData && chartData.summary && (
                <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                  {chartData.summary.totalInflow > 0 && (
                    <Chip
                      label={`📈 Inflow: ${chartData.summary.totalInflow.toFixed(2)}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: theme.palette.success.main,
                        color: theme.palette.success.main,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                  {chartData.summary.totalOutflow > 0 && (
                    <Chip
                      label={`📉 Outflow: ${chartData.summary.totalOutflow.toFixed(2)}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: theme.palette.error.main,
                        color: theme.palette.error.main,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                  <Chip
                    label={`🔄 Total: ${chartData.summary.totalTransactions} txns`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Stack>
              )}
            </Box>

            <IconButton
              onClick={handleClose}
              size="large"
              sx={{
                ml: 2,
                bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.12)' : 'none',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Paper>

        {/* Content */}
        <Box sx={{ flex: 1, p: 0, overflow: 'hidden', position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
                bgcolor: darkMode ? '#000000' : 'transparent'
              }}
            >
              <CircularProgress size={48} thickness={3} />
              <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                Loading transaction data...
              </Typography>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 4 }}>
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.95rem'
                  }
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Transaction Fetch Error
                </Typography>
                {error}
              </Alert>
            </Box>
          )}

          {chartData && !loading && !error && (
            <Box
              sx={{
                height: '100%',
                width: '100%',
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
                bgcolor: darkMode ? '#000000' : 'transparent',
                position: 'relative',
                display: 'flex'
              }}
            >
              {/* Account Details Sidebar */}
              {accountDetailsSidebar}

              {/* Chart Container */}
              <Box
                sx={{ flex: 1, height: '100%' }}
                onMouseLeave={() => {
                  // Clear hovered account when leaving the chart area
                  setHoveredAccount(null);
                }}
              >
                {chartData.links.length > 0 ? (
                  <ReactECharts
                    option={getChartOption}
                    notMerge={true}
                    style={{ height: '100%', width: '100%' }}
                    opts={{
                      renderer: 'canvas',
                      devicePixelRatio: window.devicePixelRatio || 2
                    }}
                    onEvents={{
                      mouseover: (params) => {
                        if (params.dataType === 'node' && params.data.category === 'account') {
                          const accountName = params.data.name;
                          if (accountDetails.has(accountName)) {
                            setHoveredAccount(accountName);
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      textAlign: 'center',
                      p: 4
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '4rem',
                        mb: 2,
                        opacity: 0.5
                      }}
                    >
                      📊
                    </Box>
                    <Typography
                      variant="h5"
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      No Transaction Flows Found
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ maxWidth: 500, lineHeight: 1.6 }}
                    >
                      This account doesn't have sufficient transaction data involving payments,
                      trades, or operations to generate a meaningful flow diagram. Try selecting a
                      more active trader.
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Chip
                        label="💡 Tip: Look for accounts with higher transaction volumes"
                        variant="outlined"
                        sx={{
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                          fontSize: '0.8rem'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SankeyModal;
