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
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  const [navigationHistory, setNavigationHistory] = useState([]); // Track navigation history
  const [currentAccount, setCurrentAccount] = useState(account); // Track current account being viewed
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSummaryItem, setSelectedSummaryItem] = useState(null);

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

  // Helper function to decode hex currency codes
  const decodeCurrency = (currency) => {
    if (!currency || currency === '0000000000000000000000000000000000000000') {
      return 'XRP';
    }

    // If it's already 3 characters, return as is
    if (currency.length === 3) {
      return currency;
    }

    // Try to decode hex currency code (40 character hex strings)
    if (currency.length === 40) {
      try {
        // Convert hex to readable string
        const hexString = currency.toUpperCase();
        let decoded = '';

        // Process hex pairs to ASCII characters
        for (let i = 0; i < Math.min(hexString.length, 20); i += 2) {
          // Limit to first 10 characters
          const hexPair = hexString.substr(i, 2);
          const charCode = parseInt(hexPair, 16);

          // Only add printable ASCII characters (32-126) and stop at null terminator
          if (charCode >= 32 && charCode <= 126) {
            decoded += String.fromCharCode(charCode);
          } else if (charCode === 0) {
            break; // Stop at null terminator
          }
        }

        // Clean up and validate the decoded string
        decoded = decoded.trim();

        // Return decoded string if valid, otherwise show truncated hex
        if (decoded.length > 0 && decoded.length <= 20) {
          return decoded;
        } else {
          return currency.substring(0, 8) + '...';
        }
      } catch (e) {
        console.warn('Error decoding currency:', currency, e);
        return currency.substring(0, 8) + '...';
      }
    }

    // For other length strings, return truncated version
    return currency.length > 8 ? currency.substring(0, 8) + '...' : currency;
  };

  // Helper function to format large token amounts properly
  const formatTokenAmount = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount) || amount === 0) return '0';

    // Handle extremely large numbers that appear in scientific notation
    // Convert scientific notation to a more readable format
    if (amount >= 1e21) {
      // For astronomically large numbers (likely calculation errors), show as "MAX"
      return 'MAX';
    } else if (amount >= 1e18) {
      return `${(amount / 1e18).toFixed(2)}E`; // Quintillion (E for Exa)
    } else if (amount >= 1e15) {
      return `${(amount / 1e15).toFixed(2)}P`; // Quadrillion (P for Peta)
    } else if (amount >= 1e12) {
      return `${(amount / 1e12).toFixed(2)}T`; // Trillion
    } else if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(2)}B`; // Billion
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(2)}M`; // Million
    } else if (amount >= 1e3) {
      return `${(amount / 1e3).toFixed(2)}K`; // Thousand
    } else if (amount >= 1) {
      return amount.toFixed(2);
    } else if (amount >= 0.01) {
      return amount.toFixed(4);
    } else if (amount > 0) {
      return amount.toFixed(8);
    } else {
      return '0';
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
      uniqueAllMessages: new Set(), // Track all unique messages
      // Add activity detection
      activities: new Set(),
      mainActivity: 'Unknown',
      activityScore: {
        spamming: 0,
        trading: 0,
        tokenBuying: 0,
        tokenSelling: 0,
        regularPayments: 0,
        ammInteractions: 0,
        dexOperations: 0
      },
      // Add token-specific tracking
      tokensBought: new Map(), // currency -> amount
      tokensSold: new Map(), // currency -> amount
      topTokens: [], // most traded tokens
      tradingDirection: 'neutral', // 'buying', 'selling', 'neutral'
      // Add XRP amounts specifically for token trading
      xrpSpentOnTokens: 0, // XRP spent buying tokens
      xrpReceivedFromTokens: 0, // XRP received from selling tokens
      // Add per-token XRP tracking
      xrpSpentPerToken: new Map(), // currency -> XRP amount spent
      xrpReceivedPerToken: new Map() // currency -> XRP amount received
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

          // Determine direction and activity patterns
          if (tx.Account === accountAddress && tx.Destination === targetAccount) {
            activity.outgoingValue += amount;

            // Activity detection for outgoing payments
            if (amount <= spamThresholds.small) {
              activity.activityScore.spamming += 10;
              if (amount <= spamThresholds.dust) activity.activityScore.spamming += 20;
            } else if (amount >= 1) {
              activity.activityScore.regularPayments += 5;
            }
          } else if (tx.Account === targetAccount && tx.Destination === accountAddress) {
            activity.incomingValue += amount;

            // Activity detection for incoming payments - DON'T penalize for receiving spam
            if (amount <= spamThresholds.small) {
              // Receiving spam doesn't make you a spammer - no spamming score added
              // We could track this separately as "spam victim" if needed
            } else if (amount >= 1) {
              activity.activityScore.regularPayments += 3;
            }
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

              // Analyze memo content for activities
              const memoText = decodedMemo.data.toLowerCase();
              if (memoText.includes('buy') || memoText.includes('purchase')) {
                activity.activityScore.tokenBuying += 5;
              }
              if (memoText.includes('sell') || memoText.includes('sold')) {
                activity.activityScore.tokenSelling += 5;
              }
              if (memoText.includes('trade') || memoText.includes('swap')) {
                activity.activityScore.trading += 5;
              }
            }
          }

          // Spam analysis - only for OUTGOING payments from the analyzed account
          if (amount <= spamThresholds.small && tx.Account === accountAddress) {
            // Only count as spam if this account is SENDING the micro payment
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

            // Collect spam memos for analysis - only for outgoing spam
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
          } else if (tx.Account === accountAddress) {
            // For non-spam outgoing memos, update the spam score in allMemos
            if (decodedMemo && activity.allMemos.length > 0) {
              activity.allMemos[activity.allMemos.length - 1].spamScore = memoSpamScore;
            }
          }

          // Pattern detection
          if (!tx.DestinationTag && !tx.Memos) {
            activity.spamScore += 5;
          }
        } else if (tx.TransactionType === 'Payment' && typeof tx.Amount === 'object') {
          // Token payments - indicates token trading
          const currency = tx.Amount.currency;
          const amount = parseFloat(tx.Amount.value);
          activity.currencies.set(currency, (activity.currencies.get(currency) || 0) + amount);

          // Activity detection for token payments
          activity.activityScore.trading += 8;

          // FIXED LOGIC: Handle self-payments (AMM transactions) by checking XRP balance changes
          if (tx.Account === tx.Destination && tx.Account === targetAccount) {
            // This is a self-payment AMM transaction - determine buy/sell from XRP balance change
            if (meta && meta.AffectedNodes) {
              let xrpChange = 0;

              // Find XRP balance change
              for (const node of meta.AffectedNodes) {
                const modifiedNode = node.ModifiedNode;
                if (
                  modifiedNode &&
                  modifiedNode.LedgerEntryType === 'AccountRoot' &&
                  modifiedNode.FinalFields?.Account === targetAccount
                ) {
                  const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                  const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                  xrpChange = (finalBalance - prevBalance) / 1000000;
                  break;
                }
              }

              if (xrpChange < 0) {
                // Spent XRP = buying tokens
                activity.activityScore.tokenBuying += 10;
                activity.tokensBought.set(
                  currency,
                  (activity.tokensBought.get(currency) || 0) + amount
                );

                const xrpSpent = Math.abs(xrpChange);
                activity.xrpSpentOnTokens += xrpSpent;
                activity.xrpSpentPerToken.set(
                  currency,
                  (activity.xrpSpentPerToken.get(currency) || 0) + xrpSpent
                );
              } else if (xrpChange > 0) {
                // Received XRP = selling tokens
                activity.activityScore.tokenSelling += 10;
                activity.tokensSold.set(
                  currency,
                  (activity.tokensSold.get(currency) || 0) + amount
                );

                activity.xrpReceivedFromTokens += xrpChange;
                activity.xrpReceivedPerToken.set(
                  currency,
                  (activity.xrpReceivedPerToken.get(currency) || 0) + xrpChange
                );
              }
            }
          }
          // Handle regular token payments (not self-payments)
          else if (tx.Account === targetAccount) {
            // Target account is sending tokens = selling
            activity.activityScore.tokenSelling += 10;
            activity.tokensSold.set(currency, (activity.tokensSold.get(currency) || 0) + amount);
          } else {
            // Target account is receiving tokens = buying
            activity.activityScore.tokenBuying += 10;
            activity.tokensBought.set(
              currency,
              (activity.tokensBought.get(currency) || 0) + amount
            );
          }

          // Track XRP amounts for token trades by analyzing metadata
          if (meta && meta.AffectedNodes) {
            for (const node of meta.AffectedNodes) {
              const modifiedNode = node.ModifiedNode;
              if (
                modifiedNode &&
                modifiedNode.LedgerEntryType === 'AccountRoot' &&
                modifiedNode.FinalFields?.Account === targetAccount
              ) {
                const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                const xrpChange = (finalBalance - prevBalance) / 1000000; // Convert to XRP

                if (tx.Account === targetAccount && xrpChange > 0) {
                  // Target sent tokens and received XRP = selling tokens
                  activity.xrpReceivedFromTokens += xrpChange;
                  activity.xrpReceivedPerToken.set(
                    currency,
                    (activity.xrpReceivedPerToken.get(currency) || 0) + xrpChange
                  );
                } else if (tx.Destination === targetAccount && xrpChange < 0) {
                  // Target received tokens and spent XRP = buying tokens
                  activity.xrpSpentOnTokens += Math.abs(xrpChange);
                  activity.xrpSpentPerToken.set(
                    currency,
                    (activity.xrpSpentPerToken.get(currency) || 0) + Math.abs(xrpChange)
                  );
                }
                break;
              }
            }
          }
        } else if (tx.TransactionType === 'OfferCreate') {
          // DEX operations - analyze what's being traded
          activity.activityScore.dexOperations += 15;
          activity.activityScore.trading += 10;

          // Extract currencies from offer
          let getCurrency = 'XRP';
          let payCurrency = 'XRP';

          if (typeof tx.TakerGets === 'object') {
            getCurrency = tx.TakerGets.currency;
          }
          if (typeof tx.TakerPays === 'object') {
            payCurrency = tx.TakerPays.currency;
          }

          // Track what the account wants to get vs pay
          if (tx.Account === targetAccount) {
            // This account created the offer
            if (getCurrency !== 'XRP') {
              // Wants to get tokens = buying
              activity.activityScore.tokenBuying += 5;
              const amount = typeof tx.TakerGets === 'object' ? parseFloat(tx.TakerGets.value) : 0;
              activity.tokensBought.set(
                getCurrency,
                (activity.tokensBought.get(getCurrency) || 0) + amount
              );

              // Track XRP amount for buying tokens
              if (typeof tx.TakerPays === 'string') {
                const xrpAmount = parseInt(tx.TakerPays) / 1000000; // Convert drops to XRP
                activity.xrpSpentOnTokens += xrpAmount;
                activity.xrpSpentPerToken.set(
                  getCurrency,
                  (activity.xrpSpentPerToken.get(getCurrency) || 0) + xrpAmount
                );
              }
            }
            if (payCurrency !== 'XRP') {
              // Paying with tokens = selling
              activity.activityScore.tokenSelling += 5;
              const amount = typeof tx.TakerPays === 'object' ? parseFloat(tx.TakerPays.value) : 0;
              activity.tokensSold.set(
                payCurrency,
                (activity.tokensSold.get(payCurrency) || 0) + amount
              );

              // Track XRP amount for selling tokens
              if (typeof tx.TakerGets === 'string') {
                const xrpAmount = parseInt(tx.TakerGets) / 1000000; // Convert drops to XRP
                activity.xrpReceivedFromTokens += xrpAmount;
                activity.xrpReceivedPerToken.set(
                  payCurrency,
                  (activity.xrpReceivedPerToken.get(payCurrency) || 0) + xrpAmount
                );
              }
            }
          }
        } else if (tx.TransactionType === 'OfferCancel') {
          activity.activityScore.dexOperations += 5;
        } else if (tx.TransactionType === 'TrustSet') {
          // Setting up for token trading
          activity.activityScore.tokenBuying += 3;
        } else if (tx.TransactionType === 'AMMDeposit') {
          // AMM Deposit operations
          activity.activityScore.ammInteractions += 15;
          activity.activityScore.trading += 8;

          // Analyze balance changes from metadata for AMM deposits
          if (meta && meta.AffectedNodes) {
            let xrpChange = 0;
            let tokenChanges = [];

            for (const node of meta.AffectedNodes) {
              const modifiedNode = node.ModifiedNode;

              // XRP balance change
              if (
                modifiedNode &&
                modifiedNode.LedgerEntryType === 'AccountRoot' &&
                modifiedNode.FinalFields?.Account === targetAccount
              ) {
                const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                xrpChange = (prevBalance - finalBalance) / 1000000; // Amount deposited (positive)
              }

              // Token balance changes
              if (modifiedNode && modifiedNode.LedgerEntryType === 'RippleState') {
                const balance = modifiedNode.FinalFields?.Balance;
                const prevBalance = modifiedNode.PreviousFields?.Balance;

                if (
                  balance &&
                  prevBalance &&
                  typeof balance === 'object' &&
                  typeof prevBalance === 'object'
                ) {
                  const change = parseFloat(prevBalance.value) - parseFloat(balance.value); // Amount deposited (positive)
                  if (Math.abs(change) > 0.01) {
                    const currency = decodeCurrency(balance.currency);
                    tokenChanges.push({ currency, amount: change });
                  }
                }
              }
            }

            // Track XRP deposited into AMM
            if (xrpChange > 0) {
              activity.xrpSpentOnTokens += xrpChange;
            }

            // Track tokens deposited into AMM
            tokenChanges.forEach((tc) => {
              if (tc.amount > 0) {
                activity.tokensSold.set(
                  tc.currency,
                  (activity.tokensSold.get(tc.currency) || 0) + tc.amount
                );
                activity.activityScore.tokenSelling += 5;
              }
            });
          }
        } else if (tx.TransactionType === 'AMMWithdraw') {
          // AMM Withdraw operations
          activity.activityScore.ammInteractions += 15;
          activity.activityScore.trading += 8;

          // Analyze balance changes from metadata for AMM withdrawals
          if (meta && meta.AffectedNodes) {
            let xrpChange = 0;
            let tokenChanges = [];

            for (const node of meta.AffectedNodes) {
              const modifiedNode = node.ModifiedNode;

              // XRP balance change
              if (
                modifiedNode &&
                modifiedNode.LedgerEntryType === 'AccountRoot' &&
                modifiedNode.FinalFields?.Account === targetAccount
              ) {
                const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                xrpChange = (finalBalance - prevBalance) / 1000000; // Amount withdrawn (positive)
              }

              // Token balance changes
              if (modifiedNode && modifiedNode.LedgerEntryType === 'RippleState') {
                const balance = modifiedNode.FinalFields?.Balance;
                const prevBalance = modifiedNode.PreviousFields?.Balance;

                if (
                  balance &&
                  prevBalance &&
                  typeof balance === 'object' &&
                  typeof prevBalance === 'object'
                ) {
                  const change = parseFloat(balance.value) - parseFloat(prevBalance.value); // Amount withdrawn (positive)
                  if (Math.abs(change) > 0.01) {
                    const currency = decodeCurrency(balance.currency);
                    tokenChanges.push({ currency, amount: change });
                  }
                }
              }
            }

            // Track XRP withdrawn from AMM
            if (xrpChange > 0) {
              activity.xrpReceivedFromTokens += xrpChange;
            }

            // Track tokens withdrawn from AMM
            tokenChanges.forEach((tc) => {
              if (tc.amount > 0) {
                activity.tokensBought.set(
                  tc.currency,
                  (activity.tokensBought.get(tc.currency) || 0) + tc.amount
                );
                activity.activityScore.tokenBuying += 5;
              }
            });
          }
        } else {
          // Handle other transaction types
          activity.transactionTypes.set(
            tx.TransactionType,
            (activity.transactionTypes.get(tx.TransactionType) || 0) + 1
          );
        }
      }
    });

    // Calculate derived metrics
    if (activity.totalTransactions > 0) {
      activity.avgTransactionSize = activity.totalValue / activity.totalTransactions;
      activity.isSpammer =
        activity.spamScore > 100 || activity.spamTransactions / activity.totalTransactions > 0.5;
    }

    // Determine main activity based on scores
    const scores = activity.activityScore;
    let maxScore = 0;
    let mainActivity = 'Regular User';

    // Calculate top traded tokens based on XRP amounts spent/received (not token quantities)
    const tokenXrpAmounts = new Map();

    // Add XRP spent on buying tokens
    activity.xrpSpentPerToken.forEach((xrpAmount, currency) => {
      const decodedCurrency = decodeCurrency(currency);
      tokenXrpAmounts.set(decodedCurrency, (tokenXrpAmounts.get(decodedCurrency) || 0) + xrpAmount);
    });

    // Add XRP received from selling tokens
    activity.xrpReceivedPerToken.forEach((xrpAmount, currency) => {
      const decodedCurrency = decodeCurrency(currency);
      tokenXrpAmounts.set(decodedCurrency, (tokenXrpAmounts.get(decodedCurrency) || 0) + xrpAmount);
    });

    // Sort tokens by XRP trading volume (not token quantities)
    activity.topTokens = [...tokenXrpAmounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([currency, xrpAmount]) => currency);

    // Determine trading direction based on XRP amounts (not token quantities)
    const totalXrpSpentOnTokens = activity.xrpSpentOnTokens;
    const totalXrpReceivedFromTokens = activity.xrpReceivedFromTokens;

    if (totalXrpSpentOnTokens > totalXrpReceivedFromTokens * 1.5) {
      activity.tradingDirection = 'buying';
    } else if (totalXrpReceivedFromTokens > totalXrpSpentOnTokens * 1.5) {
      activity.tradingDirection = 'selling';
    } else {
      activity.tradingDirection = 'neutral';
    }

    // Create detailed activity labels with decoded currency names
    const topToken = activity.topTokens[0] || '';
    const tokenInfo = topToken ? ` (${topToken})` : '';
    const directionInfo =
      activity.tradingDirection !== 'neutral'
        ? ` (${activity.tradingDirection === 'buying' ? 'Buying' : 'Selling'}${tokenInfo})`
        : tokenInfo;

    if (scores.spamming > maxScore) {
      maxScore = scores.spamming;
      mainActivity = scores.spamming > 50 ? '🚨 Active Spammer' : '⚠️ Potential Spammer';
    }
    if (scores.trading > maxScore) {
      maxScore = scores.trading;
      mainActivity = `📈 Token Trader${directionInfo}`;
    }
    if (scores.dexOperations > maxScore) {
      maxScore = scores.dexOperations;
      mainActivity = `🏪 DEX Trader${directionInfo}`;
    }
    if (scores.tokenBuying > maxScore && scores.tokenBuying > scores.tokenSelling * 1.5) {
      maxScore = scores.tokenBuying;
      mainActivity = `💰 Token Buyer${tokenInfo}`;
    }
    if (scores.tokenSelling > maxScore && scores.tokenSelling > scores.tokenBuying * 1.5) {
      maxScore = scores.tokenSelling;
      mainActivity = `💸 Token Seller${tokenInfo}`;
    }
    if (scores.regularPayments > maxScore && maxScore < 20) {
      mainActivity = '👤 Regular User';
    }

    // Check if this account receives a lot of spam (spam victim)
    const incomingSpamTransactions = transactions.filter((txData) => {
      const tx = txData.tx;
      const meta = txData.meta;
      return (
        meta &&
        meta.TransactionResult === 'tesSUCCESS' &&
        tx.TransactionType === 'Payment' &&
        typeof tx.Amount === 'string' &&
        tx.Destination === accountAddress &&
        tx.Account !== accountAddress &&
        parseInt(tx.Amount) / 1000000 <= spamThresholds.small
      );
    }).length;

    // Add spam victim indicator if they receive significant spam but aren't spammers themselves
    if (incomingSpamTransactions > 10 && activity.spamScore < 20) {
      mainActivity += ' (🛡️ Spam Target)';
    }

    // Set activities based on scores
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

    // Debug logging
    console.log('🎯 Target Account Activity Analysis:', {
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
      // Initialize current account when modal opens
      if (!currentAccount) {
        setCurrentAccount(account);
      }
    }
  }, [open, account, currentAccount]);

  // Separate useEffect to fetch data when currentAccount changes
  useEffect(() => {
    if (open && currentAccount) {
      fetchAccountTransactions();
    }
  }, [open, currentAccount]);

  const fetchAccountTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch XRPL account transactions using the account_tx method
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

      // Log raw API response before any processing
      console.log('🔥 RAW account_tx API Response:', {
        account: currentAccount,
        response: response.data,
        fullResponse: response
      });

      if (response.data && response.data.result && response.data.result.transactions) {
        const transactions = response.data.result.transactions;

        // Log transaction count and first few transactions
        console.log('📊 Transactions Summary:', {
          account: currentAccount,
          totalTransactions: transactions.length,
          firstTransaction: transactions[0],
          lastTransaction: transactions[transactions.length - 1],
          allTransactions: transactions
        });

        const processedData = processTransactionsForSankey(transactions, currentAccount);
        setChartData(processedData);

        // Get account info for display
        setAccountInfo({
          address: currentAccount,
          totalTransactions: transactions.length,
          mainActivity: processedData.mainActivity
        });
      } else {
        console.warn('❌ No transaction data found:', response.data);
        setError('No transaction data found for this account');
      }
    } catch (err) {
      console.error('💥 Error fetching account transactions:', err);
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

    // Analyze the target account itself
    const targetAccountActivity = analyzeAccountActivity(
      targetAccount,
      transactions,
      targetAccount
    );

    // Debug logging
    console.log('🎯 Target Account Activity Analysis:', {
      account: targetAccount,
      mainActivity: targetAccountActivity.mainActivity,
      activityScore: targetAccountActivity.activityScore,
      activities: Array.from(targetAccountActivity.activities),
      totalTransactions: targetAccountActivity.totalTransactions
    });

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

    // Store account details for hover functionality and include target account
    accountDetailsMap.set(targetAccount, targetAccountActivity);
    setAccountDetails(accountDetailsMap);

    // Process transactions with index tracking for debugging
    transactions.forEach((txData, txIndex) => {
      const tx = txData.tx;
      const meta = txData.meta;
      const txNumber = txIndex + 1; // 1-based transaction number for user display

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
            amount = parseInt(tx.Amount) / 1000000;
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
                ledgerIndex: tx.ledger_index || txData.ledger_index,
                txNumber: txNumber // Add transaction number for debugging
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
              // Check if this is a cross-currency exchange (regardless of success/failure)
              const isCrossCurrencyExchange =
                tx.SendMax &&
                ((typeof tx.SendMax === 'object' && typeof tx.Amount === 'string') ||
                  (typeof tx.SendMax === 'string' && typeof tx.Amount === 'object') ||
                  (typeof tx.SendMax === 'object' &&
                    typeof tx.Amount === 'object' &&
                    tx.SendMax.currency !== tx.Amount.currency));

              if (isCrossCurrencyExchange) {
                // This is a cross-currency exchange (token <-> XRP or token <-> token)
                let exchangeCurrency = 'UNKNOWN';
                let isTokenToXrp = false;
                let exchangeAmount = 1;

                if (typeof tx.SendMax === 'object' && typeof tx.Amount === 'string') {
                  // Sending tokens to get XRP
                  exchangeCurrency = decodeCurrency(tx.SendMax.currency);
                  isTokenToXrp = true;
                  exchangeAmount = parseInt(tx.Amount) / 1000000; // Use actual XRP amount received
                } else if (typeof tx.SendMax === 'string' && typeof tx.Amount === 'object') {
                  // Sending XRP to get tokens
                  exchangeCurrency = decodeCurrency(tx.Amount.currency);
                  isTokenToXrp = false;
                  exchangeAmount = parseFloat(tx.Amount.value); // Use token amount
                } else if (typeof tx.SendMax === 'object' && typeof tx.Amount === 'object') {
                  // Token to token exchange
                  exchangeCurrency = `${decodeCurrency(tx.SendMax.currency)}→${decodeCurrency(
                    tx.Amount.currency
                  )}`;
                  isTokenToXrp = false;
                  exchangeAmount = parseFloat(tx.Amount.value);
                }

                // Check if transaction was successful
                if (meta && meta.TransactionResult === 'tesSUCCESS') {
                  destinationAccount = `EXCHANGE_${exchangeCurrency}`;
                  amount = exchangeAmount;
                  currency = isTokenToXrp ? 'XRP' : exchangeCurrency;
                } else {
                  // Failed exchange
                  destinationAccount = `FAILED_EXCHANGE_${exchangeCurrency}`;
                  amount = exchangeAmount;
                  currency = isTokenToXrp ? 'XRP' : exchangeCurrency;
                }
              } else {
                // Not a cross-currency exchange, check for token exchange via metadata
                const metaExchange = extractExchangeFromMeta(meta, targetAccount);

                if (
                  metaExchange &&
                  (metaExchange.tokensReceived.length > 0 || metaExchange.tokensSent.length > 0)
                ) {
                  // This is an AMM transaction - analyze XRP vs token changes
                  let xrpAmount = 0;
                  let tokenCurrency = '';
                  let isTokenBuy = false;

                  // For AMM transactions, we want to show XRP amount, not token amount
                  if (meta && meta.AffectedNodes) {
                    // Find XRP balance change
                    for (const node of meta.AffectedNodes) {
                      const modifiedNode = node.ModifiedNode;
                      if (
                        modifiedNode &&
                        modifiedNode.LedgerEntryType === 'AccountRoot' &&
                        modifiedNode.FinalFields?.Account === targetAccount
                      ) {
                        const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                        const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                        const xrpChange = (finalBalance - prevBalance) / 1000000; // Convert to XRP
                        xrpAmount = Math.abs(xrpChange); // Always show positive amount
                        isTokenBuy = xrpChange < 0; // If XRP decreased, user bought tokens
                        break;
                      }
                    }

                    // Get token currency from the first token change
                    if (metaExchange.tokensReceived.length > 0) {
                      tokenCurrency = metaExchange.tokensReceived[0].currency;
                    } else if (metaExchange.tokensSent.length > 0) {
                      tokenCurrency = metaExchange.tokensSent[0].currency;
                    }
                  }

                  if (xrpAmount > 0 && tokenCurrency) {
                    destinationAccount = `AMM_${tokenCurrency}`;
                    amount = xrpAmount; // Use XRP amount instead of token amount
                    currency = 'XRP'; // Always show as XRP for AMM transactions
                  }
                } else {
                  // Regular self-transfer (no token exchange detected)
                  destinationAccount = 'SELF_TRANSFER';
                  currency = 'SELF';
                }
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
        } else if (tx.TransactionType === 'AMMDeposit') {
          // AMM Deposit operations
          sourceAccount = tx.Account;

          // Extract asset information from the transaction
          let assetCurrency = 'TOKEN';
          if (tx.Asset && tx.Asset.currency) {
            assetCurrency = decodeCurrency(tx.Asset.currency);
          } else if (tx.Amount && typeof tx.Amount === 'object') {
            assetCurrency = decodeCurrency(tx.Amount.currency);
          }

          destinationAccount = `AMM_${assetCurrency}_POOL`;

          // Analyze actual amounts from metadata
          if (meta && meta.AffectedNodes) {
            let xrpChange = 0;
            for (const node of meta.AffectedNodes) {
              const modifiedNode = node.ModifiedNode;
              if (
                modifiedNode &&
                modifiedNode.LedgerEntryType === 'AccountRoot' &&
                modifiedNode.FinalFields?.Account === sourceAccount
              ) {
                const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                xrpChange = (prevBalance - finalBalance) / 1000000; // Amount deposited (positive)
              }
            }
            amount = Math.max(xrpChange, 1); // Use XRP amount or minimum 1
          } else {
            amount = 1;
          }

          currency = 'AMM_DEPOSIT';
        } else if (tx.TransactionType === 'AMMWithdraw') {
          // AMM Withdraw operations
          sourceAccount = `AMM_${(() => {
            let assetCurrency = 'TOKEN';
            if (tx.Asset && tx.Asset.currency) {
              assetCurrency = decodeCurrency(tx.Asset.currency);
            } else if (tx.Amount && typeof tx.Amount === 'object') {
              assetCurrency = decodeCurrency(tx.Amount.currency);
            }
            return assetCurrency;
          })()}_POOL`;
          destinationAccount = tx.Account;

          // Analyze actual amounts from metadata
          if (meta && meta.AffectedNodes) {
            let xrpChange = 0;
            for (const node of meta.AffectedNodes) {
              const modifiedNode = node.ModifiedNode;
              if (
                modifiedNode &&
                modifiedNode.LedgerEntryType === 'AccountRoot' &&
                modifiedNode.FinalFields?.Account === destinationAccount
              ) {
                const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                xrpChange = (finalBalance - prevBalance) / 1000000; // Amount withdrawn (positive)
                break;
              }
            }
            amount = Math.max(Math.abs(xrpChange), 1); // Use XRP amount or minimum 1
          } else {
            amount = 1;
          }

          currency = 'AMM_WITHDRAW';
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

          // Detect AMM operation direction for proper labeling
          let ammDirection = null;
          let ammToken = null;

          // Check if this involves an AMM transaction
          if (destinationAccount.startsWith('AMM_')) {
            // Extract token name from AMM destination
            ammToken = destinationAccount.replace('AMM_', '');

            // For AMM transactions, determine direction from metadata analysis
            if (sourceAccount === targetAccount && meta && meta.AffectedNodes) {
              // Analyze XRP balance change to determine buy/sell
              for (const node of meta.AffectedNodes) {
                const modifiedNode = node.ModifiedNode;
                if (
                  modifiedNode &&
                  modifiedNode.LedgerEntryType === 'AccountRoot' &&
                  modifiedNode.FinalFields?.Account === targetAccount
                ) {
                  const prevBalance = parseInt(modifiedNode.PreviousFields?.Balance || 0);
                  const finalBalance = parseInt(modifiedNode.FinalFields?.Balance || 0);
                  const xrpChange = (finalBalance - prevBalance) / 1000000;

                  if (xrpChange < 0) {
                    // XRP decreased → User spent XRP to buy tokens
                    ammDirection = 'BUY';
                  } else if (xrpChange > 0) {
                    // XRP increased → User received XRP from selling tokens
                    ammDirection = 'SELL';
                  }
                  break;
                }
              }
            }
          } else if (sourceAccount.startsWith('AMM_')) {
            // AMM is sending to user (inflow case) - this shouldn't happen with our new logic
            // but keeping for completeness
            ammToken = sourceAccount.replace('AMM_', '');
            if (destinationAccount === targetAccount) {
              if (currency === 'XRP') {
                ammDirection = 'SELL'; // User received XRP → sold tokens
              } else {
                ammDirection = 'BUY'; // User received tokens → bought tokens
              }
            }
          }

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
              // Add transaction numbers to existing link
              existingLink.txNumbers.push(txNumber);
              existingLink.txHashes.push(tx.hash);
              // Update AMM direction if available
              if (ammDirection && !existingLink.ammDirection) {
                existingLink.ammDirection = ammDirection;
                existingLink.ammToken = ammToken;
              }
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
                txNumbers: [txNumber], // Add transaction numbers array
                txHashes: [tx.hash], // Add transaction hashes for reference
                isSpam: spamAnalysis && spamAnalysis.spamScore >= 40,
                spamScore: spamAnalysis?.spamScore || 0,
                spamCount: spamAnalysis && spamAnalysis.spamScore >= 40 ? 1 : 0,
                // Add AMM direction information
                ammDirection: ammDirection,
                ammToken: ammToken
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
              // Add transaction numbers to existing link
              existingLink.txNumbers.push(txNumber);
              existingLink.txHashes.push(tx.hash);
              // Update AMM direction if available
              if (ammDirection && !existingLink.ammDirection) {
                existingLink.ammDirection = ammDirection;
                existingLink.ammToken = ammToken;
              }
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
                txNumbers: [txNumber], // Add transaction numbers array
                txHashes: [tx.hash], // Add transaction hashes for reference
                isSpam: spamAnalysis && spamAnalysis.spamScore >= 40,
                spamScore: spamAnalysis?.spamScore || 0,
                spamCount: spamAnalysis && spamAnalysis.spamScore >= 40 ? 1 : 0,
                // Add AMM direction information
                ammDirection: ammDirection,
                ammToken: ammToken
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
                : node.startsWith('AMM_') && node.endsWith('_POOL')
                  ? 'amm_pool'
                  : node.startsWith('AMM_')
                    ? 'amm'
                    : node.startsWith('EXCHANGE_')
                      ? 'exchange'
                      : node.startsWith('FAILED_EXCHANGE_')
                        ? 'failed_exchange'
                        : node === 'FAILED_SELF_TRANSFER'
                          ? 'failed_self'
                          : node === 'SELF_TRANSFER'
                            ? 'self'
                            : node.endsWith('_OPS')
                              ? 'operations'
                              : 'account',
      value: accountStats.get(node)?.transactions || 0,
      displayName:
        node === inflowHub
          ? `TO ${targetAccount.substring(0, 8)}...`
          : node === outflowHub
            ? `FROM ${targetAccount.substring(0, 8)}...`
            : node.startsWith('DEX_')
              ? `${node.replace('DEX_', '')}`
              : node.startsWith('TRUST_')
                ? `${node.replace('TRUST_', '')}`
                : node.startsWith('AMM_') && node.endsWith('_POOL')
                  ? `${node.replace('AMM_', '').replace('_POOL', '')} Pool`
                  : node.startsWith('AMM_')
                    ? `${node.replace('AMM_', '')} Pool`
                    : node.startsWith('EXCHANGE_')
                      ? `${node.replace('EXCHANGE_', '')} Exchange`
                      : node.startsWith('FAILED_EXCHANGE_')
                        ? `${node.replace('FAILED_EXCHANGE_', '')} (Failed)`
                        : node === 'SELF_TRANSFER'
                          ? 'Self Transfer'
                          : node.endsWith('_OPS')
                            ? `${node.replace('_OPS', '')}`
                            : node.length > 25
                              ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}`
                              : node
    }));

    return {
      nodes: nodeArray,
      links: links.filter((link) => link.value > 0),
      stats: Object.fromEntries(accountStats),
      targetAccount,
      mainActivity: targetAccountActivity.mainActivity,
      summary: {
        totalInflow: links
          .filter((l) => l.target === inflowHub && l.currency === 'XRP')
          .reduce((sum, l) => sum + l.value, 0),
        totalOutflow: links
          .filter((l) => l.source === outflowHub && l.currency === 'XRP')
          .reduce((sum, l) => sum + l.value, 0),
        totalTransactions: links.reduce((sum, l) => sum + l.count, 0)
      }
    };
  };

  // Function to navigate to a new account
  const navigateToAccount = (newAccount) => {
    if (newAccount && newAccount !== currentAccount) {
      // Add current account to history
      setNavigationHistory((prev) => [...prev, currentAccount]);
      // Set new account as current
      setCurrentAccount(newAccount);
      // Clear existing data
      setChartData(null);
      setAccountInfo(null);
      setSpamStats(null);
      setAccountDetails(new Map());
      // Fetch new account data - this will trigger the useEffect
    }
  };

  // Function to go back to previous account
  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousAccount = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory((prev) => prev.slice(0, -1));
      setCurrentAccount(previousAccount);
      // Clear existing data
      setChartData(null);
      setAccountInfo(null);
      setSpamStats(null);
      setAccountDetails(new Map());
      // Fetch previous account data - this will trigger the useEffect
    }
  };

  const getChartOption = useMemo(() => {
    if (!chartData) return {};

    const { nodes, links } = chartData;

    // Define text color for labels based on theme - VERY BRIGHT
    const labelTextColor = darkMode ? '#FFFFFF' : '#000000';

    // Filter links based on spam filter
    const filteredLinks = showSpamOnly
      ? links.filter((link) => link.isSpam) // Show only spam links when toggle is ON
      : links.filter((link) => !link.isSpam); // Show only non-spam links when toggle is OFF

    // Filter nodes to only show those that have connections in filteredLinks
    const connectedNodeNames = new Set();
    filteredLinks.forEach((link) => {
      connectedNodeNames.add(link.source);
      connectedNodeNames.add(link.target);
    });

    const filteredNodes = nodes.filter((node) => connectedNodeNames.has(node.name));

    return {
      backgroundColor: 'transparent',
      animation: false,
      title: {
        text: 'Transaction Flow Analysis',
        left: 'center',
        top: 10, // Increased from 60 to 90 to provide more space for text labels
        textStyle: {
          color: theme.palette.text.primary,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: darkMode ? '#555' : '#ddd',
        borderWidth: 1,
        textStyle: {
          color: darkMode ? '#fff' : '#333',
          fontSize: 11
        },
        formatter: function (params) {
          if (params.dataType === 'node') {
            return `<strong>${params.data.displayName || params.data.name}</strong><br/>
                    Transactions: ${params.data.value || 0}`;
          } else if (params.dataType === 'edge') {
            return `<strong>${params.data.source} → ${params.data.target}</strong><br/>
                    Amount: ${params.data.value.toFixed(2)} ${params.data.currency}<br/>
                    Count: ${params.data.count} transactions`;
          }
          return '';
        }
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          top: 60,
          bottom: 15,
          left: 30,
          right: 40,
          nodeWidth: 20,
          nodeGap: 8,
          nodeAlign: 'justify',
          layoutIterations: 0,
          emphasis: {
            focus: 'adjacency',
            blurScope: 'coordinateSystem',
            scale: 1.02,
            itemStyle: {
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.6)',
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            lineStyle: {
              width: 65,
              shadowBlur: 15,
              shadowColor: 'rgba(0, 0, 0, 0.4)'
            }
          },
          blur: {
            itemStyle: {
              opacity: 0.15
            },
            lineStyle: {
              opacity: 0.08
            },
            label: {
              opacity: 0.15
            }
          },
          animation: false,
          animationDuration: 0,
          animationEasing: 'linear',
          triggerLineEvent: true,
          hoverAnimation: false,
          lineStyle: {
            width: 55
          },
          selectMode: false,
          selectedMode: false,
          triggerEvent: true,
          data: filteredNodes.map((node) => ({
            ...node,
            itemStyle: {
              color: (() => {
                switch (node.category) {
                  case 'inflow':
                    return '#FFD700'; // Gold for target account inflow
                  case 'outflow':
                    return '#FF8C00'; // Dark orange for target account outflow
                  case 'dex':
                    return '#2196F3'; // Blue for DEX operations
                  case 'trust':
                    return '#4CAF50'; // Green for trust operations (authorization/permissions)
                  case 'amm_pool':
                    return '#E91E63'; // Pink for AMM pools (liquidity pools)
                  case 'amm':
                    return '#9C27B0'; // Purple for AMM operations
                  case 'exchange':
                    return '#00BCD4'; // Cyan for successful exchanges
                  case 'self':
                    return '#757575'; // Grey for self transfers
                  case 'failed_exchange':
                    return '#F44336'; // Red for failed exchanges
                  case 'failed_self':
                    return '#FF5722'; // Orange-red for failed self transfers
                  case 'operations':
                    return '#FF9800'; // Orange for general operations
                  default:
                    // Check if this is the target account node
                    if (node.name === currentAccount) {
                      return '#FFD700'; // Gold for target account
                    }

                    // Check if this is a spam account
                    const accountDetail = accountDetails.get(node.name);
                    if (accountDetail && accountDetail.isSpammer) {
                      return '#F44336'; // Red for spam accounts
                    }

                    return '#673AB7'; // Deep purple for regular accounts
                }
              })(),
              borderColor: (() => {
                // Special border for target account related nodes
                if (
                  node.category === 'inflow' ||
                  node.category === 'outflow' ||
                  node.name === currentAccount
                ) {
                  return '#FF8C00'; // Dark orange border
                }
                return darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
              })(),
              borderWidth: (() => {
                // Thicker border for target account related nodes
                if (
                  node.category === 'inflow' ||
                  node.category === 'outflow' ||
                  node.name === currentAccount
                ) {
                  return 3;
                }
                return 1;
              })()
            }
          })),
          links: filteredLinks.map((link) => ({
            ...link,
            lineStyle: {
              color: link.isSpam ? '#F44336' : link.currency === 'XRP' ? '#2196F3' : '#9C27B0',
              opacity: 0.7,
              curveness: 0.3,
              width: 35,
              type: 'solid'
            },
            emphasis: {
              lineStyle: {
                width: 45,
                opacity: 0.9
              }
            }
          })),
          label: {
            show: true,
            position: function (params) {
              // Position labels differently based on node type and connection
              if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                return 'insideRight'; // Keep hub labels inside
              } else {
                // Check if this is an outgoing node (connected to outflow hub)
                // For outgoing nodes, position labels to the left
                // For incoming nodes, position labels to the right
                const isOutgoingNode = filteredLinks.some(
                  (link) => link.source === outflowHub && link.target === params.data.name
                );

                if (isOutgoingNode) {
                  return 'left'; // Position outgoing node labels to the left
                } else {
                  return 'right'; // Position incoming node labels to the right
                }
              }
            },
            distance: function (params) {
              // Different distances based on node type and position
              if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                return 5; // Keep hub labels close to node
              } else {
                // Check if this is an outgoing node
                const isOutgoingNode = filteredLinks.some(
                  (link) => link.source === outflowHub && link.target === params.data.name
                );

                if (isOutgoingNode) {
                  return 8; // Shorter distance for outgoing nodes (labels to the left)
                } else {
                  return 10; // Normal distance for incoming nodes (labels to the right)
                }
              }
            },
            // Set color directly based on theme
            color: darkMode ? '#FFFFFF' : '#000000',
            fontSize: 12,
            fontWeight: 'bold',
            formatter: function (params) {
              try {
                if (!params || !params.data) return '';

                const displayName = params.data.displayName || params.data.name;

                // Clean minimalist labels without emojis
                if (params.data.category === 'inflow' || params.data.category === 'outflow') {
                  // Special styling for target account hubs
                  const hubAccount = params.data.name
                    .replace('_INFLOW', '')
                    .replace('_OUTFLOW', '');
                  if (hubAccount === currentAccount) {
                    return `{targetAccount|${displayName}}`;
                  }
                  return displayName; // Just show the display name for hub nodes
                } else {
                  // Check if this is the target account node
                  if (params.data.name === currentAccount) {
                    return `{targetAccount|${displayName}}`;
                  }

                  // Remove emoji prefixes and just show clean text
                  let cleanLabel = displayName;

                  // Clean up specific prefixes
                  if (params.data.category === 'dex') {
                    cleanLabel = displayName; // Already clean from displayName processing
                  } else if (params.data.category === 'trust') {
                    cleanLabel = displayName; // Already clean from displayName processing
                  } else if (params.data.category === 'amm_pool') {
                    cleanLabel = displayName; // Already clean from displayName processing
                  } else if (params.data.category === 'amm') {
                    cleanLabel = displayName; // Already clean from displayName processing
                  } else if (params.data.category === 'self') {
                    cleanLabel = 'Self Transfer';
                  } else if (params.data.category === 'failed_exchange') {
                    cleanLabel = 'Failed Exchange';
                  } else if (params.data.category === 'failed_self') {
                    cleanLabel = 'Failed Self Transfer';
                  } else if (params.data.category === 'operations') {
                    cleanLabel = displayName; // Already clean from displayName processing
                  } else {
                    // For account nodes, show clean address
                    cleanLabel = displayName;
                  }

                  return `{normalLabel|${cleanLabel}}`;
                }
              } catch (error) {
                return '';
              }
            },
            rich: {
              icon: {
                fontSize: 14,
                padding: [0, 4, 0, 0]
              },
              normalLabel: {
                color: darkMode ? '#FFFFFF' : '#000000', // White in dark mode, black in light mode
                fontWeight: 'bold',
                fontSize: 12
              },
              hubLabel: {
                color: darkMode ? '#FFFFFF' : '#000000', // White in dark mode, black in light mode
                fontWeight: 'bold',
                fontSize: 12
              },
              targetAccount: {
                color: '#1a1a1a', // Dark text
                fontWeight: 'bold',
                fontSize: 12,
                backgroundColor: '#FFD700', // Gold background
                borderRadius: 6,
                padding: [3, 8],
                borderColor: '#FF8C00',
                borderWidth: 2,
                shadowColor: 'rgba(255, 215, 0, 0.5)',
                shadowBlur: 8
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
            text: 'OUTGOING',
            fill: '#FF8C00', // Dark orange for outgoing to match target account
            fontSize: 12,
            fontWeight: 'bold',
            shadowColor: 'rgba(255, 140, 0, 0.3)',
            shadowBlur: 4
          }
        },
        {
          type: 'text',
          right: 30,
          top: 70,
          style: {
            text: 'INCOMING',
            fill: '#FFD700', // Gold color for incoming to match target account
            fontSize: 12,
            fontWeight: 'bold',
            shadowColor: 'rgba(255, 215, 0, 0.3)',
            shadowBlur: 4
          }
        }
      ]
    };
  }, [chartData, showSpamOnly, spamStats, theme, currentAccount, darkMode, accountDetails]);

  const handleClose = () => {
    setChartData(null);
    setError(null);
    setAccountDetails(new Map());
    setSpamStats(null);
    setNavigationHistory([]); // Reset navigation history
    setCurrentAccount(account); // Reset to original account
    onClose();
  };

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
            p: 1.5,
            borderBottom: `2px solid ${darkMode ? '#333333' : theme.palette.divider}`,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
            bgcolor: darkMode ? '#000000' : 'transparent'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              {/* Title Row with Account Info and Activity */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                {/* Back button */}
                {navigationHistory.length > 0 && (
                  <IconButton
                    onClick={goBack}
                    size="small"
                    sx={{
                      bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      border: darkMode ? '1px solid rgba(255,255,255,0.12)' : 'none',
                      '&:hover': {
                        bgcolor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                )}

                <Typography
                  id="sankey-modal-title"
                  variant="subtitle1"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: '1.1rem'
                  }}
                >
                  🌊 Sankey Flow Analysis
                </Typography>

                {/* Navigation breadcrumb */}
                {navigationHistory.length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontStyle: 'italic',
                      fontSize: '0.7rem'
                    }}
                  >
                    (Level {navigationHistory.length + 1})
                  </Typography>
                )}

                {/* Account Info - Moved to same row */}
                {accountInfo && (
                  <>
                    <Chip
                      label={`👤 ${accountInfo.address.substring(
                        0,
                        8
                      )}...${accountInfo.address.substring(accountInfo.address.length - 6)}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        height: '24px',
                        ml: 1,
                        // Unique styling for target account
                        bgcolor: '#FFD700', // Gold background
                        color: '#1a1a1a', // Dark text for contrast
                        borderColor: '#FFA500', // Orange border
                        border: '2px solid #FFA500',
                        '&:hover': {
                          bgcolor: '#FFA500',
                          borderColor: '#FF8C00',
                          transform: 'scale(1.05)'
                        },
                        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
                      }}
                    />
                    <Chip
                      label={`📊 ${accountInfo.totalTransactions} Txns`}
                      size="small"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                    {/* Display main activity */}
                    {accountInfo.mainActivity && (
                      <Chip
                        label={`🎯 ${accountInfo.mainActivity}`}
                        size="small"
                        sx={{
                          bgcolor: accountInfo.mainActivity.includes('Spammer')
                            ? '#ff4444'
                            : accountInfo.mainActivity.includes('Trader')
                              ? '#2196f3'
                              : accountInfo.mainActivity.includes('Buyer')
                                ? '#4caf50'
                                : accountInfo.mainActivity.includes('Seller')
                                  ? '#ff9800'
                                  : '#9c27b0',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: '24px'
                        }}
                      />
                    )}
                  </>
                )}
              </Stack>

              {/* Token Trading Summary - Horizontal Layout */}
              {accountDetails.has(currentAccount) &&
                (() => {
                  const details = accountDetails.get(currentAccount);
                  const hasTokenActivity =
                    details.tokensBought.size > 0 || details.tokensSold.size > 0;

                  if (hasTokenActivity) {
                    return (
                      <Box
                        sx={{
                          mb: 0.8,
                          p: 1.5,
                          background: darkMode
                            ? `linear-gradient(135deg, 
                                rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(5, 7),
                                  16
                                )}, 0.15) 0%, 
                                rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(5, 7),
                                  16
                                )}, 0.08) 100%)`
                            : `linear-gradient(135deg, 
                                rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(5, 7),
                                  16
                                )}, 0.12) 0%, 
                                rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(5, 7),
                                  16
                                )}, 0.05) 100%)`,
                          borderRadius: 3,
                          border: `1px solid ${
                            darkMode
                              ? `rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.25)`
                              : `rgba(${parseInt(
                                  theme.palette.primary.main.slice(1, 3),
                                  16
                                )}, ${parseInt(
                                  theme.palette.primary.main.slice(3, 5),
                                  16
                                )}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.20)`
                          }`,
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          boxShadow: darkMode
                            ? `0 8px 32px rgba(${parseInt(
                                theme.palette.primary.main.slice(1, 3),
                                16
                              )}, ${parseInt(
                                theme.palette.primary.main.slice(3, 5),
                                16
                              )}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.15), 
                               0 2px 8px rgba(0, 0, 0, 0.3), 
                               inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                            : `0 4px 16px rgba(${parseInt(
                                theme.palette.primary.main.slice(1, 3),
                                16
                              )}, ${parseInt(
                                theme.palette.primary.main.slice(3, 5),
                                16
                              )}, ${parseInt(theme.palette.primary.main.slice(5, 7), 16)}, 0.1), 
                               0 1px 4px rgba(0, 0, 0, 0.1), 
                               inset 0 1px 0 rgba(255, 255, 255, 0.6)`,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '1px',
                            background: `linear-gradient(90deg, 
                              transparent 0%, 
                              rgba(255, 255, 255, ${darkMode ? '0.3' : '0.5'}) 50%, 
                              transparent 100%)`,
                            zIndex: 1
                          }
                        }}
                      >
                        {/* Header with Direction in same row */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.6 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.info.main,
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          >
                            📈 Token Trading Summary
                          </Typography>

                          {/* Trading Direction - Moved to header row */}
                          {details.tradingDirection !== 'neutral' && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontSize: '0.65rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.4
                              }}
                            >
                              🎯
                              <span
                                style={{
                                  color:
                                    details.tradingDirection === 'buying'
                                      ? theme.palette.success.main
                                      : theme.palette.error.main,
                                  fontWeight: 600,
                                  textTransform: 'uppercase'
                                }}
                              >
                                {details.tradingDirection === 'buying'
                                  ? '📈 NET BUYING'
                                  : '📉 NET SELLING'}
                              </span>
                              {details.topTokens.length > 0 && (
                                <span style={{ fontStyle: 'italic' }}>
                                  ({details.topTokens[0]})
                                </span>
                              )}
                            </Typography>
                          )}
                        </Stack>

                        {/* Two-Column Layout for Bought/Sold */}
                        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                          {/* Tokens Bought Column */}
                          {details.tokensBought.size > 0 && (
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.success.main,
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.8,
                                  fontSize: '0.65rem',
                                  mt: 0.5
                                }}
                              >
                                💰 TOKENS BOUGHT (~{details.xrpSpentOnTokens.toFixed(2)} XRP)
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ flexWrap: 'wrap', gap: 0.8 }}
                              >
                                {[...details.tokensBought.entries()].map(([currency, amount]) => {
                                  const decodedCurrency = decodeCurrency(currency);
                                  const xrpSpent = details.xrpSpentPerToken.get(currency) || 0;
                                  return (
                                    <Chip
                                      key={`bought-${currency}`}
                                      label={`${decodedCurrency}: ${formatTokenAmount(
                                        amount
                                      )} (${formatTokenAmount(xrpSpent)})`}
                                      size="small"
                                      sx={{
                                        bgcolor: theme.palette.success.main,
                                        color: 'white',
                                        fontSize: '0.55rem',
                                        fontWeight: 600,
                                        height: '18px',
                                        mb: 0.3,
                                        '& .MuiChip-label': {
                                          px: 0.5,
                                          py: 0.2
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            </Box>
                          )}

                          {/* Tokens Sold Column */}
                          {details.tokensSold.size > 0 && (
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: theme.palette.error.main,
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.8,
                                  fontSize: '0.65rem',
                                  mt: 0.5
                                }}
                              >
                                💸 TOKENS SOLD (~{details.xrpReceivedFromTokens.toFixed(2)} XRP)
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ flexWrap: 'wrap', gap: 0.8 }}
                              >
                                {[...details.tokensSold.entries()]
                                  .slice(0, 6)
                                  .map(([currency, amount]) => {
                                    const decodedCurrency = decodeCurrency(currency);
                                    const xrpReceived =
                                      details.xrpReceivedPerToken.get(currency) || 0;
                                    return (
                                      <Chip
                                        key={`sold-${currency}`}
                                        label={`${decodedCurrency}: ${formatTokenAmount(
                                          amount
                                        )} (${formatTokenAmount(xrpReceived)})`}
                                        size="small"
                                        sx={{
                                          bgcolor: theme.palette.error.main,
                                          color: 'white',
                                          fontSize: '0.55rem',
                                          fontWeight: 600,
                                          height: '18px',
                                          mb: 0.3,
                                          '& .MuiChip-label': {
                                            px: 0.5,
                                            py: 0.2
                                          }
                                        }}
                                      />
                                    );
                                  })}
                                {details.tokensSold.size > 6 && (
                                  <Chip
                                    label={`+${details.tokensSold.size - 6} more`}
                                    size="small"
                                    sx={{
                                      bgcolor: theme.palette.error.light,
                                      color: 'white',
                                      fontSize: '0.55rem',
                                      height: '18px',
                                      mb: 0.3
                                    }}
                                  />
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    );
                  }
                  return null;
                })()}

              {/* Bottom Row: Legend, Spam, and Summary in one row */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ flexWrap: 'wrap', gap: 1, minHeight: '32px' }}
              >
                {/* Legend - Compact Single Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '0.65rem', mr: 0.8, fontWeight: 500 }}
                  >
                    Flow Types:
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ display: 'inline-flex' }}>
                    {[
                      { label: '👤 You', color: '#FFD700' }, // Gold for target account
                      { label: '💰 In', color: '#00E676' }, // Vibrant green for incoming
                      { label: '💸 Out', color: '#FF5722' }, // Vibrant deep orange for outgoing
                      { label: '🏪 DEX', color: '#00E676' }, // Vibrant green for DEX operations
                      { label: '🌊 Pool', color: '#FF6D00' }, // Vibrant orange for AMM pools
                      { label: '🔄 AMM', color: '#FF6D00' }, // Vibrant orange for AMM operations
                      { label: '🔐 Trust', color: '#E91E63' }, // Vibrant pink for trust operations
                      { label: '💎 XRP', color: '#2196F3' }, // Vibrant blue for XRP
                      { label: '🪙 Token', color: '#9C27B0' }, // Vibrant purple for tokens
                      { label: '⚠️ Spam', color: '#FF1744' } // Vibrant red for spam
                    ].map((item, index) => (
                      <Chip
                        key={index}
                        label={item.label}
                        size="small"
                        sx={{
                          bgcolor: item.color,
                          color: 'white',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          height: '22px',
                          minWidth: '50px',
                          borderRadius: '11px',
                          '& .MuiChip-label': {
                            px: 0.6,
                            py: 0,
                            lineHeight: 1.2
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Spam Detection - Inline */}
                {spamStats && spamStats.totalMicroPayments > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.2,
                      py: 0.4,
                      height: '32px',
                      bgcolor: darkMode ? 'rgba(255,68,68,0.12)' : 'rgba(255,68,68,0.08)',
                      borderRadius: '16px',
                      border: '1px solid #ff4444'
                    }}
                  >
                    <WarningIcon sx={{ color: '#ff4444', fontSize: '0.9rem' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#ff4444',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ⚠️ {spamStats.totalSpamTransactions} OUTGOING SPAM DETECTED -{' '}
                      {spamStats.totalSpamTransactions}/{spamStats.totalMicroPayments} (
                      {spamStats.spamPercentage}%)
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showSpamOnly}
                          onChange={(e) => setShowSpamOnly(e.target.checked)}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff4444' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#ff4444'
                            }
                          }}
                        />
                      }
                      label="Show Spam"
                      sx={{
                        m: 0,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.6rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Summary Toggle */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.2,
                    py: 0.4,
                    height: '32px',
                    bgcolor: darkMode ? 'rgba(33,150,243,0.12)' : 'rgba(33,150,243,0.08)',
                    borderRadius: '16px',
                    border: '1px solid #2196f3'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#2196f3',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📊 SUMMARY
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showSummary}
                        onChange={(e) => setShowSummary(e.target.checked)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#4caf50' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#4caf50'
                          }
                        }}
                      />
                    }
                    label="Show Summary"
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.6rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }
                    }}
                  />
                </Box>

                {/* Summary - Inline */}
                {chartData && chartData.summary && (
                  <Stack
                    direction="row"
                    spacing={0.8}
                    sx={{ ml: 'auto', height: '32px', alignItems: 'center' }}
                  >
                    {chartData.summary.totalInflow > 0 && (
                      <Chip
                        label={`📈 ${chartData.summary.totalInflow.toFixed(1)}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.success.main,
                          color: theme.palette.success.main,
                          bgcolor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          height: '22px',
                          minWidth: '60px',
                          borderRadius: '11px',
                          '& .MuiChip-label': {
                            px: 0.6,
                            py: 0,
                            lineHeight: 1.2
                          }
                        }}
                      />
                    )}
                    {chartData.summary.totalOutflow > 0 && (
                      <Chip
                        label={`📉 ${chartData.summary.totalOutflow.toFixed(1)}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.error.main,
                          color: theme.palette.error.main,
                          bgcolor: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          height: '22px',
                          minWidth: '60px',
                          borderRadius: '11px',
                          '& .MuiChip-label': {
                            px: 0.6,
                            py: 0,
                            lineHeight: 1.2
                          }
                        }}
                      />
                    )}
                    <Chip
                      label={`🔄 ${chartData.summary.totalTransactions}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        height: '22px',
                        minWidth: '50px',
                        borderRadius: '11px',
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        '& .MuiChip-label': {
                          px: 0.6,
                          py: 0,
                          lineHeight: 1.2
                        }
                      }}
                    />
                  </Stack>
                )}
              </Stack>
            </Box>

            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                ml: 1,
                bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                border: darkMode ? '1px solid rgba(255,255,255,0.12)' : 'none',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
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
              {/* Chart Container */}
              <Box sx={{ flex: 1, height: '100%', position: 'relative' }}>
                {chartData.links.length > 0 ? (
                  <>
                    <ReactECharts
                      option={getChartOption}
                      notMerge={false}
                      lazyUpdate={true}
                      style={{ height: '100%', width: '100%' }}
                      opts={{
                        renderer: 'canvas',
                        devicePixelRatio: window.devicePixelRatio || 2
                      }}
                      onEvents={{
                        click: (params) => {
                          // Handle summary item selection
                          if (showSummary) {
                            setSelectedSummaryItem({
                              type: params.dataType,
                              data: params.data,
                              params: params
                            });
                          }

                          // Handle click on account nodes to navigate to that account's Sankey
                          if (
                            params.dataType === 'node' &&
                            (params.data.category === 'account' ||
                              params.data.category === 'inflow' ||
                              params.data.category === 'outflow')
                          ) {
                            const clickedAccount = params.data.name;

                            // Extract account from hub names
                            let accountToNavigate = clickedAccount;
                            if (
                              clickedAccount.includes('_INFLOW') ||
                              clickedAccount.includes('_OUTFLOW')
                            ) {
                              accountToNavigate = clickedAccount
                                .replace('_INFLOW', '')
                                .replace('_OUTFLOW', '');
                            }

                            if (
                              accountToNavigate &&
                              accountToNavigate.length >= 25 &&
                              accountToNavigate.length <= 34 &&
                              accountToNavigate.startsWith('r') &&
                              accountToNavigate !== currentAccount &&
                              !showSummary
                            ) {
                              navigateToAccount(accountToNavigate);
                            }
                          }
                        }
                      }}
                    />
                  </>
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

              {/* Summary Panel */}
              {showSummary && accountDetails.has(currentAccount) && (
                <Box
                  sx={{
                    width: 350,
                    height: '100%',
                    borderLeft: `1px solid ${darkMode ? '#333333' : theme.palette.divider}`,
                    bgcolor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(10px)',
                    overflow: 'auto',
                    p: 1.5
                  }}
                >
                  {(() => {
                    const details = accountDetails.get(currentAccount);
                    return (
                      <Stack spacing={1.2}>
                        {/* Header */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                            fontSize: '1rem',
                            mb: 0.5
                          }}
                        >
                          📊 Account Summary
                        </Typography>

                        {/* Basic Info - More Compact */}
                        <Paper
                          sx={{
                            p: 1,
                            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}
                          >
                            Basic Information
                          </Typography>
                          <Stack spacing={0.2}>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              <strong>Account:</strong> {currentAccount.substring(0, 10)}...
                              {currentAccount.substring(currentAccount.length - 6)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                              <strong>Activity:</strong> {details.mainActivity}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                <strong>Txns:</strong> {details.totalTransactions}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                <strong>Volume:</strong> {details.totalValue.toFixed(1)} XRP
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>

                        {/* Trading Summary - More Compact */}
                        {(details.tokensBought.size > 0 || details.tokensSold.size > 0) && (
                          <Paper
                            sx={{
                              p: 1,
                              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              Trading Activity
                            </Typography>
                            <Stack spacing={0.2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  <strong>Direction:</strong>{' '}
                                  {details.tradingDirection.toUpperCase()}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  <strong>Tokens:</strong>{' '}
                                  {details.topTokens.slice(0, 2).join(', ') || 'None'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.65rem', color: theme.palette.success.main }}
                                >
                                  <strong>Spent:</strong> {details.xrpSpentOnTokens.toFixed(1)} XRP
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.65rem', color: theme.palette.error.main }}
                                >
                                  <strong>Received:</strong>{' '}
                                  {details.xrpReceivedFromTokens.toFixed(1)} XRP
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        )}

                        {/* Activity Scores - Horizontal Layout */}
                        <Paper
                          sx={{
                            p: 1,
                            bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}
                          >
                            Activity Breakdown
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Object.entries(details.activityScore)
                              .filter(([_, score]) => score > 0)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 6) // Limit to top 6 activities
                              .map(([activity, score]) => (
                                <Chip
                                  key={activity}
                                  label={`${activity
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^\w/, (c) => c.toUpperCase())}: ${score}`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.6rem',
                                    height: '20px',
                                    bgcolor: theme.palette.primary.main,
                                    color: 'white',
                                    '& .MuiChip-label': { px: 0.5 }
                                  }}
                                />
                              ))}
                          </Box>
                        </Paper>

                        {/* Spam Information - Inline Layout */}
                        {details.spamScore > 0 && (
                          <Paper
                            sx={{
                              p: 1,
                              bgcolor: darkMode ? 'rgba(255,68,68,0.1)' : 'rgba(255,68,68,0.05)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: '#ff4444',
                                fontSize: '0.7rem',
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              ⚠️ Spam Analysis
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              <Chip
                                label={`Score: ${details.spamScore}`}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '18px',
                                  bgcolor: '#ff4444',
                                  color: 'white'
                                }}
                              />
                              <Chip
                                label={`Spam: ${details.spamTransactions}`}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '18px',
                                  bgcolor: '#ff4444',
                                  color: 'white'
                                }}
                              />
                              <Chip
                                label={`Dust: ${details.dustTransactions}`}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '18px',
                                  bgcolor: '#ff4444',
                                  color: 'white'
                                }}
                              />
                              <Chip
                                label={details.isSpammer ? 'Spammer' : 'Clean'}
                                size="small"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '18px',
                                  bgcolor: details.isSpammer ? '#d32f2f' : '#4caf50',
                                  color: 'white'
                                }}
                              />
                            </Box>
                          </Paper>
                        )}

                        {/* Recent Memos - Compact List */}
                        {details.allMemos && details.allMemos.length > 0 && (
                          <Paper
                            sx={{
                              p: 1,
                              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              Recent Memos ({details.allMemos.length})
                            </Typography>
                            <Stack spacing={0.3}>
                              {details.allMemos.slice(0, 5).map((memo, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    p: 0.5,
                                    bgcolor: memo.isSpam
                                      ? 'rgba(255,68,68,0.1)'
                                      : 'rgba(128,128,128,0.1)',
                                    borderRadius: 0.5,
                                    border: memo.isSpam ? '1px solid #ff4444' : 'none'
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: '0.6rem',
                                      wordBreak: 'break-word',
                                      display: 'block',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    {memo.memo.data ? memo.memo.data.substring(0, 80) : 'No data'}
                                    {memo.memo.data && memo.memo.data.length > 80 && '...'}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.55rem'
                                    }}
                                  >
                                    {memo.amount.toFixed(4)} XRP {memo.isSpam && '(SPAM)'}
                                  </Typography>
                                </Box>
                              ))}
                              {details.allMemos.length > 5 && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    fontStyle: 'italic',
                                    fontSize: '0.6rem',
                                    textAlign: 'center',
                                    py: 0.5
                                  }}
                                >
                                  ... and {details.allMemos.length - 5} more memos
                                </Typography>
                              )}
                            </Stack>
                          </Paper>
                        )}

                        {/* Selected Item Details - Compact */}
                        {selectedSummaryItem && (
                          <Paper
                            sx={{
                              p: 1,
                              bgcolor: darkMode ? 'rgba(33,150,243,0.1)' : 'rgba(33,150,243,0.05)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.primary.main,
                                fontSize: '0.7rem',
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              🔍 Selected Item
                            </Typography>
                            <Stack spacing={0.2}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  <strong>Type:</strong> {selectedSummaryItem.type}
                                </Typography>
                                {selectedSummaryItem.data?.value && (
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                    <strong>Value:</strong> {selectedSummaryItem.data.value}
                                  </Typography>
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{ fontSize: '0.65rem', wordBreak: 'break-word' }}
                              >
                                <strong>Name:</strong>{' '}
                                {selectedSummaryItem.data?.displayName ||
                                  selectedSummaryItem.data?.name ||
                                  'Unknown'}
                              </Typography>
                              {(selectedSummaryItem.data?.currency ||
                                selectedSummaryItem.data?.count) && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  {selectedSummaryItem.data?.currency && (
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                      <strong>Currency:</strong> {selectedSummaryItem.data.currency}
                                    </Typography>
                                  )}
                                  {selectedSummaryItem.data?.count && (
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                      <strong>Txns:</strong> {selectedSummaryItem.data.count}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Stack>
                          </Paper>
                        )}
                      </Stack>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default SankeyModal;
