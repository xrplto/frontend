import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import styled from '@emotion/styled';
import { X, RefreshCw, Circle, ExternalLink, Wallet } from 'lucide-react';
import { Client } from 'xrpl';
import { fNumber } from 'src/utils/formatters';
import { formatDistanceToNow } from 'date-fns';
import { parseAmount } from 'src/utils/parseUtils';
import Decimal from 'decimal.js-light';
import { normalizeCurrencyCode } from 'src/utils/parseUtils';

const XRPL_WEBSOCKET_URL = 'wss://s1.ripple.com';

// Helper function
const alpha = (color, opacity) => color.replace(')', `, ${opacity})`);

// Custom styled components
const Box = styled.div``;
const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction || 'column'};
  gap: ${props => props.spacing ? `${props.spacing * 8}px` : '0'};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
`;

const Typography = styled.div`
  font-size: ${props =>
    props.variant === 'h6' ? '1.25rem' :
    props.variant === 'body2' ? '0.875rem' :
    props.variant === 'caption' ? '0.75rem' : '1rem'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props =>
    props.color === 'text.secondary' ? (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)') :
    props.color === 'text.primary' ? (props.isDark ? '#FFFFFF' : '#212B36') :
    props.isDark ? '#FFFFFF' : '#212B36'};
  line-height: ${props => props.lineHeight || 'inherit'};
  white-space: ${props => props.whiteSpace || 'normal'};
  overflow: ${props => props.overflow || 'visible'};
  text-overflow: ${props => props.textOverflow || 'clip'};
  display: ${props => props.display || 'block'};
  margin-top: ${props => props.mt ? `${props.mt * 8}px` : '0'};
`;

const CircularProgress = styled.div`
  width: ${props => props.size || 40}px;
  height: ${props => props.size || 40}px;
  border: ${props => props.thickness || 4}px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-top-color: #147DFE;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Chip = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: ${props => props.size === 'small' ? '14px' : '26px'};
  padding: ${props => props.size === 'small' ? '0 4px' : '0 10px'};
  font-size: ${props => props.size === 'small' ? '10px' : '12px'};
  font-weight: ${props => props.fontWeight || 400};
  border-radius: 6px;
  background: ${props =>
    props.color === 'warning' ? '#FF9800' :
    props.color === 'primary' ? '#147DFE' :
    props.background || '#147DFE'};
  color: ${props => props.textColor || 'white'};
`;

const Alert = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: ${props =>
    props.severity === 'error' ? 'rgba(244, 67, 54, 0.1)' :
    props.severity === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
    'rgba(33, 150, 243, 0.1)'};
  color: ${props =>
    props.severity === 'error' ? '#f44336' :
    props.severity === 'warning' ? '#ff9800' :
    '#2196f3'};
  font-size: 14px;
`;

const IconButton = styled.button`
  padding: ${props => props.size === 'small' ? '4px' : '8px'};
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${props => props.isDark ? '#FFFFFF' : '#212B36'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: ${props =>
      props.hoverColor ? alpha(props.hoverColor, 0.1) :
      props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Badge = styled.div`
  position: relative;
  display: inline-flex;
  &::after {
    content: '${props => props.badgeContent || ''}';
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
    color: white;
    background: #147DFE;
    border-radius: 8px;
  }
`;

const Drawer = styled.div`
  position: fixed;
  top: 56px;
  left: 0;
  width: ${props => props.width || '256px'};
  height: calc(100vh - 56px);
  background: ${props => props.isDark ? '#000000' : '#ffffff'};
  border-right: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  overflow: hidden;
  z-index: 1200;
  transform: translateX(${props => props.open ? '0' : '-100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;

  @media (max-width: 1279px) {
    width: 240px;
  }

  @media (max-width: 959px) {
    width: 236px;
  }
`;

const Tooltip = ({ title, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          marginBottom: '4px'
        }}>
          {title}
        </div>
      )}
    </div>
  );
};

const Fade = ({ in: inProp, timeout, children }) => {
  return (
    <div style={{
      opacity: inProp ? 1 : 0,
      transition: `opacity ${timeout || 300}ms ease`
    }}>
      {children}
    </div>
  );
};

const getFailureDescription = (code) => {
  const failureCodes = {
    tecPATH_PARTIAL: 'Insufficient liquidity in the provided paths',
    tecUNFUNDED_PAYMENT: 'Insufficient balance to fund payment',
    tecNO_DST: 'Destination account does not exist',
    tecNO_DST_INSUF_XRP: 'Destination account needs more XRP for reserve',
    tecDST_TAG_NEEDED: 'Destination requires a tag',
    tecPATH_DRY: 'Path had no liquidity',
    tecINSUF_RESERVE_LINE: 'Insufficient reserve to create trust line',
    tecFAILED_PROCESSING: 'Failed to process transaction',
    tecDIR_FULL: 'Account directory is full',
    tecINSUFF_FEE: 'Insufficient XRP to pay fee',
    tecNO_LINE: 'No trust line exists',
    tecEXPIRED: 'Offer expired',
    tecOVERSIZE: 'Transaction too large'
  };
  return failureCodes[code] || `Transaction failed with code: ${code}`;
};

const TransactionRow = memo(({ transaction, isNew, creatorAddress, onSelectTransaction, isDark }) => {
  const { tx, meta, validated, ledger_index } = transaction;

  const txType = tx.TransactionType;
  const isIncoming = tx.Destination === creatorAddress;

  // Check if this is a currency conversion (self-payment with different currencies)
  const isCurrencyConversion =
    txType === 'Payment' &&
    tx.Account === tx.Destination &&
    (tx.SendMax || (tx.Paths && tx.Paths.length > 0));

  // Check if this is a token-to-XRP conversion
  const isTokenToXrpConversion =
    isCurrencyConversion &&
    (() => {
      const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
      const sentAmount = tx.SendMax || tx.Amount;

      if (!deliveredAmount || !sentAmount) return false;

      // Check if received XRP and sent token
      const isReceivedXRP = typeof deliveredAmount === 'string'; // XRP amounts are strings
      const isSentToken =
        typeof sentAmount === 'object' && sentAmount.currency && sentAmount.currency !== 'XRP';

      return isReceivedXRP && isSentToken;
    })();

  // Check if this is an XRP-to-token conversion (creator buying)
  const isXrpToTokenConversion =
    isCurrencyConversion &&
    (() => {
      const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
      const sentAmount = tx.SendMax || tx.Amount;

      if (!deliveredAmount || !sentAmount) return false;

      // Check if sent XRP and received token
      const isSentXRP = typeof sentAmount === 'string'; // XRP amounts are strings
      const isReceivedToken =
        typeof deliveredAmount === 'object' &&
        deliveredAmount.currency &&
        deliveredAmount.currency !== 'XRP';

      return isSentXRP && isReceivedToken;
    })();

  const formatTxAmount = useMemo(() => {
    try {
      // Payment transactions
      if (txType === 'Payment') {
        // Currency conversion - show both sides
        if (isCurrencyConversion) {
          // Check if transaction failed
          if (meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS') {
            // For failed transactions, show what was attempted
            const attemptedAmount = tx.Amount;
            const attemptedSend = tx.SendMax;

            if (!attemptedAmount || !attemptedSend) return 'Failed';

            const attempted = parseAmount(attemptedAmount);
            const send = parseAmount(attemptedSend);

            if (!attempted || !send || typeof attempted !== 'object' || typeof send !== 'object')
              return 'Failed';

            let sendValue = send.value;
            if (typeof sendValue === 'string' && sendValue.includes('e')) {
              sendValue = new Decimal(sendValue).toString();
            }
            const sendCurrency =
              send.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(send.currency);

            let attemptedValue = attempted.value;
            if (typeof attemptedValue === 'string' && attemptedValue.includes('e')) {
              attemptedValue = new Decimal(attemptedValue).toString();
            }
            const attemptedCurrency =
              attempted.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(attempted.currency);

            return `${fNumber(sendValue)} ${sendCurrency} > ${fNumber(attemptedValue)} ${attemptedCurrency}`;
          }

          // For successful transactions
          const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
          const sentAmount = tx.SendMax || tx.Amount;

          if (!deliveredAmount || !sentAmount) return 'N/A';

          const delivered = parseAmount(deliveredAmount);
          const sent = parseAmount(sentAmount);

          if (!delivered || !sent || typeof delivered !== 'object' || typeof sent !== 'object')
            return 'N/A';

          // Format sent amount
          let sentValue = sent.value;
          if (typeof sentValue === 'string' && sentValue.includes('e')) {
            sentValue = new Decimal(sentValue).toString();
          }
          const sentCurrency =
            sent.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(sent.currency);

          // Format received amount
          let deliveredValue = delivered.value;
          if (typeof deliveredValue === 'string' && deliveredValue.includes('e')) {
            deliveredValue = new Decimal(deliveredValue).toString();
          }
          const deliveredCurrency =
            delivered.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(delivered.currency);

          return `${fNumber(sentValue)} ${sentCurrency} for ${fNumber(deliveredValue)} ${deliveredCurrency}`;
        }

        // Regular payment
        const deliveredAmount = meta?.delivered_amount || meta?.DeliveredAmount;
        const amountToFormat = deliveredAmount || tx.Amount;

        if (!amountToFormat) return 'N/A';

        const amount = parseAmount(amountToFormat);
        if (!amount || typeof amount !== 'object') return 'N/A';

        if (amount.currency === 'XRP') {
          return `${fNumber(amount.value)} XRP`;
        }

        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }

        const readableCurrency = normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${readableCurrency}`;
      }

      // Offer transactions
      if (txType === 'OfferCreate' && tx.TakerGets && tx.TakerPays) {
        const takerGets = parseAmount(tx.TakerGets);
        const takerPays = parseAmount(tx.TakerPays);

        if (
          !takerGets ||
          !takerPays ||
          typeof takerGets !== 'object' ||
          typeof takerPays !== 'object'
        ) {
          return 'N/A';
        }

        let getsValue = takerGets.value;
        let paysValue = takerPays.value;
        if (typeof getsValue === 'string' && getsValue.includes('e')) {
          getsValue = new Decimal(getsValue).toString();
        }
        if (typeof paysValue === 'string' && paysValue.includes('e')) {
          paysValue = new Decimal(paysValue).toString();
        }

        const getsCurrency =
          takerGets.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerGets.currency);
        const paysCurrency =
          takerPays.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(takerPays.currency);

        const isSellOrder = tx.Flags & 0x00080000;
        return `${isSellOrder ? 'Sell' : 'Buy'} ${fNumber(getsValue)} ${getsCurrency} for ${fNumber(paysValue)} ${paysCurrency}`;
      }

      // Trust line transactions
      if (txType === 'TrustSet' && tx.LimitAmount) {
        const limit = parseAmount(tx.LimitAmount);
        if (!limit || typeof limit !== 'object') return 'N/A';

        let value = limit.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }

        const limitCurrency = normalizeCurrencyCode(limit.currency);
        const isRemoval = new Decimal(value).isZero();
        return isRemoval ? `Remove ${limitCurrency}` : `${fNumber(value)} ${limitCurrency}`;
      }

      // NFT transactions
      if (txType === 'NFTokenMint') {
        return `Mint NFT${tx.NFTokenTaxon ? ` (Taxon: ${tx.NFTokenTaxon})` : ''}`;
      }

      if (txType === 'NFTokenCreateOffer' && tx.Amount) {
        const amount = parseAmount(tx.Amount);
        if (!amount || typeof amount !== 'object') return 'NFT Offer';

        const isBuyOffer = !(tx.Flags & 1);
        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${isBuyOffer ? 'Buy' : 'Sell'} NFT for ${fNumber(amount.value)} ${currency}`;
      }

      if (txType === 'NFTokenAcceptOffer') {
        return 'Accept NFT Offer';
      }

      if (txType === 'NFTokenCancelOffer') {
        return 'Cancel NFT Offer';
      }

      // AMM transactions
      if (txType === 'AMMDeposit') {
        if (tx.Amount) {
          const amount = parseAmount(tx.Amount);
          if (amount && typeof amount === 'object') {
            const currency =
              amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
            return `Deposit ${fNumber(amount.value)} ${currency}`;
          }
        }
        return 'AMM Deposit';
      }

      if (txType === 'AMMWithdraw') {
        return 'AMM Withdraw';
      }

      // Offer cancel
      if (txType === 'OfferCancel') {
        return `Cancel Offer #${tx.OfferSequence || 'N/A'}`;
      }

      // Check transactions
      if (txType === 'CheckCash' && tx.Amount) {
        const amount = parseAmount(tx.Amount);
        if (!amount || typeof amount !== 'object') return 'Claim Check';

        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }

        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${currency}`;
      }

      if (txType === 'CheckCreate' && tx.SendMax) {
        const amount = parseAmount(tx.SendMax);
        if (!amount || typeof amount !== 'object') return 'Create Check';

        let value = amount.value;
        if (typeof value === 'string' && value.includes('e')) {
          value = new Decimal(value).toString();
        }

        const currency = amount.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(amount.currency);
        return `${fNumber(value)} ${currency}`;
      }

      if (txType === 'CheckCancel') {
        return 'Cancel Check';
      }

      return 'N/A';
    } catch (error) {
      console.error('Error formatting transaction amount:', error);
      return 'N/A';
    }
  }, [tx, meta]);

  const formatTime = useMemo(() => {
    if (tx.date) {
      const date = new Date((tx.date + 946684800) * 1000);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
      return `${Math.floor(diffDays / 30)}mo`;
    }
    return 'Pending';
  }, [tx.date]);

  const getTxColor = useMemo(() => {
    if (!validated) return '#FF9800';

    // Check if transaction failed
    if (meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS') {
      return '#f44336';
    }

    if (isCurrencyConversion) {
      return '#2196F3';
    }

    switch (txType) {
      case 'Payment':
        return isIncoming ? '#4caf50' : '#f44336';
      case 'OfferCreate':
        return '#2196F3';
      case 'OfferCancel':
        return '#FF9800';
      case 'TrustSet':
        return '#147DFE';
      case 'NFTokenMint':
      case 'NFTokenCreateOffer':
      case 'NFTokenAcceptOffer':
      case 'NFTokenCancelOffer':
      case 'NFTokenBurn':
        return '#9c27b0';
      case 'AMMDeposit':
      case 'AMMWithdraw':
        return '#2196F3';
      case 'OracleSet':
        return '#147DFE';
      case 'CheckCash':
      case 'CheckCreate':
      case 'CheckCancel':
        return '#4caf50';
      default:
        return isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    }
  }, [validated, meta, isCurrencyConversion, txType, isIncoming, isDark]);

  return (
    <Fade in timeout={300}>
      <Box
        onClick={() => onSelectTransaction && onSelectTransaction(tx.hash)}
        style={{
          padding: '8px',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          background: isTokenToXrpConversion
            ? 'rgba(255, 99, 71, 0.04)'
            : isXrpToTokenConversion
              ? 'rgba(65, 105, 225, 0.04)'
              : isNew
                ? 'rgba(20, 125, 254, 0.08)'
                : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${
            meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS'
              ? 'rgba(244, 67, 54, 0.3)'
              : isDark ? (isNew ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)') : (isNew ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)')
          }`,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isTokenToXrpConversion
            ? 'rgba(255, 99, 71, 0.08)'
            : isXrpToTokenConversion
              ? 'rgba(65, 105, 225, 0.08)'
              : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
          e.currentTarget.style.borderColor = alpha(getTxColor, 0.2);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isTokenToXrpConversion
            ? 'rgba(255, 99, 71, 0.04)'
            : isXrpToTokenConversion
              ? 'rgba(65, 105, 225, 0.04)'
              : isNew
                ? 'rgba(20, 125, 254, 0.08)'
                : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
          e.currentTarget.style.borderColor = meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS'
            ? 'rgba(244, 67, 54, 0.3)'
            : isDark ? (isNew ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)') : (isNew ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)');
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isTokenToXrpConversion
                ? 'rgba(255, 99, 71, 0.08)'
                : isXrpToTokenConversion
                  ? 'rgba(65, 105, 225, 0.08)'
                  : alpha(getTxColor, 0.08),
              border: `1px solid ${isTokenToXrpConversion ? 'rgba(255, 99, 71, 0.2)' : isXrpToTokenConversion ? 'rgba(65, 105, 225, 0.2)' : alpha(getTxColor, 0.15)}`,
              position: 'relative',
              zIndex: 1
            }}
          >
            <Wallet
              size={16}
              color={isTokenToXrpConversion
                ? '#ff6347'
                : isXrpToTokenConversion
                  ? '#4169e1'
                  : getTxColor}
            />
          </Box>

          <Box style={{ minWidth: '50px', maxWidth: '70px', flexShrink: 0 }}>
            <Stack direction="column" spacing={0}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography
                  variant="body2"
                  isDark={isDark}
                  style={{
                    fontWeight: 400,
                    fontSize: '12px',
                    color:
                      meta?.TransactionResult && meta.TransactionResult !== 'tesSUCCESS'
                        ? '#f44336'
                        : 'inherit',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {useMemo(
                    () =>
                      isTokenToXrpConversion
                        ? 'Sell'
                        : isXrpToTokenConversion
                          ? 'Buy'
                          : isCurrencyConversion
                            ? 'Swap'
                            : txType === 'Payment'
                              ? isIncoming
                                ? 'Received'
                                : 'Sent'
                              : txType === 'OfferCreate'
                                ? 'Offer'
                                : txType === 'TrustSet'
                                  ? 'Trust'
                                  : txType === 'NFTokenMint'
                                    ? 'NFT Mint'
                                    : txType === 'NFTokenCreateOffer'
                                      ? 'NFT Offer'
                                      : txType === 'NFTokenAcceptOffer'
                                        ? 'NFT Accept'
                                        : txType === 'NFTokenCancelOffer'
                                          ? 'NFT Cancel'
                                          : txType === 'AMMDeposit'
                                            ? 'AMM +'
                                            : txType === 'AMMWithdraw'
                                              ? 'AMM -'
                                              : txType,
                    [
                      isTokenToXrpConversion,
                      isXrpToTokenConversion,
                      isCurrencyConversion,
                      txType,
                      isIncoming
                    ]
                  )}
                </Typography>
                {isNew && (
                  <Chip
                    label="NEW"
                    size="small"
                    background="#147DFE"
                    textColor="white"
                    fontWeight={400}
                  >
                    NEW
                  </Chip>
                )}
                {!validated && (
                  <Chip
                    label="PENDING"
                    size="small"
                    color="warning"
                  >
                    PENDING
                  </Chip>
                )}
              </Stack>

              <Typography
                variant="caption"
                isDark={isDark}
                style={{
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                  fontSize: '11px',
                  lineHeight: 1,
                  display: 'block',
                  marginTop: '2px'
                }}
              >
                {formatTime}
              </Typography>
            </Stack>
          </Box>

          <Box style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
            <Typography
              variant="body2"
              isDark={isDark}
              style={{
                fontWeight: 400,
                color: getTxColor,
                fontSize: '12px',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {txType === 'Payment' && !isIncoming && !isCurrencyConversion && '-'}
              {formatTxAmount}
            </Typography>
            {txType === 'Payment' &&
              tx.SendMax &&
              tx.SendMax !== tx.Amount &&
              !isCurrencyConversion && (
                <Typography
                  variant="caption"
                  isDark={isDark}
                  style={{
                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    fontSize: '11px',
                    display: 'block'
                  }}
                >
                  Max:{' '}
                  {(() => {
                    const sendMax = parseAmount(tx.SendMax);
                    if (!sendMax || typeof sendMax !== 'object') return 'N/A';
                    const currency =
                      sendMax.currency === 'XRP' ? 'XRP' : normalizeCurrencyCode(sendMax.currency);
                    return `${fNumber(sendMax.value)} ${currency}`;
                  })()}
                </Typography>
              )}
          </Box>
        </Stack>
      </Box>
    </Fade>
  );
});

const CreatorTransactionsDialog = memo(
  ({ open, onClose, creatorAddress, tokenName, onLatestTransaction, onSelectTransaction, isDark = false }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [newTxCount, setNewTxCount] = useState(0);

    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    // Fetch historical transactions
    const fetchTransactionHistory = useCallback(async () => {
      if (!creatorAddress) {
        console.log('[CreatorTx] No creator address provided');
        return;
      }

      console.log('[CreatorTx] Fetching transactions for:', creatorAddress);
      setLoading(true);
      setError(null);

      try {
        const client = new Client(XRPL_WEBSOCKET_URL, {
          connectionTimeout: 10000
        });
        await client.connect();
        console.log('[CreatorTx] Connected to XRPL');

        const accountTxResponse = await client.request({
          command: 'account_tx',
          account: creatorAddress,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 30,
          forward: false
        });

        await client.disconnect();
        console.log('[CreatorTx] Response received:', accountTxResponse?.result?.transactions?.length || 0, 'transactions');

        if (accountTxResponse?.result?.transactions && Array.isArray(accountTxResponse.result.transactions)) {
          console.log('[CreatorTx] Raw transactions:', accountTxResponse.result.transactions.length);
          console.log('[CreatorTx] First transaction structure:', JSON.stringify(accountTxResponse.result.transactions[0], null, 2));

          // Normalize transaction structure (XRPL returns tx_json, not tx)
          const validTransactions = accountTxResponse.result.transactions
            .map((txData) => {
              // Convert tx_json to tx for consistency
              if (txData.tx_json && !txData.tx) {
                return { ...txData, tx: txData.tx_json };
              }
              return txData;
            })
            .filter((txData) => {
              const isValid = txData && txData.tx && txData.tx.TransactionType;
              if (!isValid) {
                console.log('[CreatorTx] Filtered out malformed transaction');
              }
              return isValid;
            });

          console.log('[CreatorTx] Valid transactions after filter:', validTransactions.length);
          setTransactions(validTransactions.slice(0, 15));

          // Pass latest transaction to parent
          if (validTransactions.length > 0 && onLatestTransaction) {
            console.log('[CreatorTx] Passing latest transaction to parent');
            onLatestTransaction(validTransactions[0]);
          } else {
            console.log('[CreatorTx] No valid transactions to pass to parent');
          }
        } else {
          console.log('[CreatorTx] No transactions in response');
        }
      } catch (err) {
        console.error('[CreatorTx] Error fetching transaction history:', err);
        setError(err.message || 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }, [creatorAddress, onLatestTransaction]); // Removed 'open' dependency

    // Subscribe to real-time transactions
    const subscribeToTransactions = useCallback(async () => {
      if (!creatorAddress || clientRef.current) return; // Removed open check

      try {
        const client = new Client(XRPL_WEBSOCKET_URL, {
          connectionTimeout: 10000
        });

        clientRef.current = client;

        client.on('error', (error) => {
          console.error('WebSocket error:', error);
          setError('WebSocket connection error');
          handleReconnect();
        });

        client.on('disconnected', () => {
          setIsSubscribed(false);
          handleReconnect();
        });

        await client.connect();

        // Subscribe to account transactions
        const subscribeResponse = await client.request({
          command: 'subscribe',
          accounts: [creatorAddress]
        });

        if (subscribeResponse.result.status === 'success') {
          setIsSubscribed(true);
          reconnectAttemptsRef.current = 0;

          // Listen for transaction stream
          client.on('transaction', (tx) => {
            if (
              tx.transaction &&
              (tx.transaction.Account === creatorAddress ||
                tx.transaction.Destination === creatorAddress)
            ) {
              // Filter out XRP payments less than 1 XRP
              const transaction = tx.transaction;
              if (
                transaction.TransactionType === 'Payment' &&
                typeof transaction.Amount === 'string'
              ) {
                const xrpAmount = parseInt(transaction.Amount) / 1000000; // Convert drops to XRP
                if (xrpAmount < 1) {
                  return; // Skip small XRP payments
                }
              }

              // Add new transaction to the beginning of the list
              setTransactions((prev) => {
                const newTx = {
                  tx: tx.transaction,
                  meta: tx.meta,
                  validated: tx.validated,
                  ledger_index: tx.ledger_index
                };

                setNewTxCount((prevCount) => prevCount + 1);

                // Keep only the most recent transactions up to limit
                const updatedTxs = [newTx, ...prev].slice(0, 15);

                // Pass latest transaction to parent
                if (onLatestTransaction) {
                  onLatestTransaction(newTx);
                }

                return updatedTxs;
              });
            }
          });
        }
      } catch (err) {
        console.error('Error subscribing to transactions:', err);
        setError('Failed to subscribe to real-time updates');
        handleReconnect();
      }
    }, [creatorAddress]); // Removed 'open' dependency

    // Handle reconnection logic
    const handleReconnect = useCallback(() => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectAttemptsRef.current += 1;
      const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (clientRef.current) {
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }
        subscribeToTransactions();
      }, backoffTime);
    }, [subscribeToTransactions]);

    // Unsubscribe from transactions
    const unsubscribe = useCallback(async () => {
      if (!clientRef.current || !clientRef.current.isConnected()) return;

      try {
        await clientRef.current.request({
          command: 'unsubscribe',
          accounts: [creatorAddress]
        });
      } catch (err) {
        console.error('Error unsubscribing:', err);
      } finally {
        if (clientRef.current) {
          await clientRef.current.disconnect();
          clientRef.current.removeAllListeners();
          clientRef.current = null;
        }
        setIsSubscribed(false);
      }
    }, [creatorAddress]);

    // Initialize when component mounts (not just when dialog opens)
    useEffect(() => {
      if (creatorAddress) {
        console.log('[CreatorTx] Component mounted, creator:', creatorAddress);
        fetchTransactionHistory();
        subscribeToTransactions();

        // Auto-refresh every 10 seconds (reduced frequency for performance)
        const refreshInterval = setInterval(() => {
          fetchTransactionHistory();
        }, 10000);

        return () => {
          console.log('[CreatorTx] Component unmounting');
          clearInterval(refreshInterval);
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          unsubscribe();
        };
      } else {
        console.log('[CreatorTx] No creator address on mount');
      }
    }, [creatorAddress, fetchTransactionHistory, subscribeToTransactions, unsubscribe]); // Removed 'open' dependency

    // Reset new transaction count after delay
    useEffect(() => {
      if (open && newTxCount > 0) {
        const timer = setTimeout(() => {
          setNewTxCount(0);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [open, newTxCount]);

    // Manual refresh
    const refresh = () => {
      fetchTransactionHistory();
    };

    // Always fetch transactions to populate latestCreatorTx in parent
    return (
      <Drawer open={open} isDark={isDark}>
        <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            style={{
              padding: '12px',
              paddingBottom: '8px',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              flexShrink: 0
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="h6" isDark={isDark} style={{ fontWeight: 400, fontSize: '16px' }}>
                  Creator Activity
                </Typography>
                {isSubscribed && (
                  <Tooltip title="Live monitoring active">
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#4caf50',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      <style>{`
                        @keyframes pulse {
                          0%, 100% { opacity: 1; }
                          50% { opacity: 0.3; }
                        }
                      `}</style>
                    </div>
                  </Tooltip>
                )}
                {newTxCount > 0 && (
                  <Badge badgeContent={newTxCount}>
                    <div />
                  </Badge>
                )}
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Refresh">
                  <span>
                    <IconButton
                      size="small"
                      onClick={refresh}
                      disabled={loading}
                      isDark={isDark}
                      hoverColor="#147DFE"
                    >
                      <RefreshCw size={18} />
                    </IconButton>
                  </span>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={onClose}
                  isDark={isDark}
                  hoverColor="#f44336"
                >
                  <X size={18} />
                </IconButton>
              </Stack>
            </Stack>

            <Typography
              variant="caption"
              isDark={isDark}
              style={{
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                fontSize: '11px',
                display: 'block',
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {creatorAddress && creatorAddress.length >= 8
                ? `${creatorAddress.slice(0, 8)}...${creatorAddress.slice(-4)}`
                : 'Loading...'}
            </Typography>
          </Box>

          <Box style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
            {loading && transactions.length === 0 ? (
              <Box style={{ paddingTop: '32px', paddingBottom: '32px', textAlign: 'center' }}>
                <CircularProgress size={32} isDark={isDark} />
                <Typography
                  variant="body2"
                  isDark={isDark}
                  style={{ marginTop: '16px', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                >
                  Loading transactions...
                </Typography>
              </Box>
            ) : error ? (
              <Alert
                severity="error"
              >
                {error}
              </Alert>
            ) : transactions.length === 0 ? (
              <Box
                style={{
                  paddingTop: '32px',
                  paddingBottom: '32px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                }}
              >
                <Typography
                  variant="body2"
                  isDark={isDark}
                  style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                >
                  No transactions found
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0.75}>
                {transactions.slice(0, 15).map((tx, index) => (
                  <TransactionRow
                    key={tx.tx?.hash || index}
                    transaction={tx}
                    isNew={index < newTxCount}
                    creatorAddress={creatorAddress}
                    onSelectTransaction={onSelectTransaction}
                    isDark={isDark}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>
    );
  }
);

CreatorTransactionsDialog.displayName = 'CreatorTransactionsDialog';
TransactionRow.displayName = 'TransactionRow';

export default CreatorTransactionsDialog;
