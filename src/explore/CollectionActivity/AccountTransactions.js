import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Chip,
  Skeleton,
  Link,
  IconButton,
  Tooltip,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CardMedia,
  Button,
  CircularProgress,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import { alpha } from '@mui/material/styles';
import PaymentIcon from '@mui/icons-material/Payment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CollectionsIcon from '@mui/icons-material/Collections';
import SellIcon from '@mui/icons-material/Sell';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { formatDateTime } from 'src/utils/formatTime';
import { AppContext } from 'src/AppContext';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '16px 20px',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.8rem',
    padding: '12px 20px',
    lineHeight: 1.4,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
    transition: 'all 0.2s ease'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.3)
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    '& .MuiTableCell-root': {
      borderColor: alpha(theme.palette.primary.main, 0.1)
    }
  },
  '&:last-child td, &:last-child th': {
    border: 0
  }
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: '28px',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: '14px',
  transition: 'all 0.2s ease',
  '& .MuiChip-icon': {
    fontSize: '1rem'
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`
  }
}));

const CompactAccordion = styled(Accordion)(({ theme }) => ({
  '&.MuiAccordion-root': {
    marginBottom: '8px',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
      theme.palette.background.paper,
      0.4
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`,
    '&:before': {
      display: 'none'
    },
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`
    }
  },
  '& .MuiAccordionSummary-root': {
    minHeight: '48px',
    padding: '0 20px',
    borderRadius: '12px',
    '&.Mui-expanded': {
      minHeight: '48px'
    }
  },
  '& .MuiAccordionSummary-content': {
    margin: '12px 0',
    '&.Mui-expanded': {
      margin: '12px 0'
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: '16px 20px 20px',
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
  }
}));

export default function AccountTransactions({ creatorAccount }) {
  const theme = useTheme();
  const { openSnackbar } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nftData, setNftData] = useState({}); // Store NFT data by NFTokenID
  const [marker, setMarker] = useState(null); // For pagination
  const [hasMore, setHasMore] = useState(true); // Track if more transactions are available

  const fetchNFTData = async (nftokenId) => {
    if (nftData[nftokenId]) return nftData[nftokenId]; // Return cached data

    try {
      console.log('Fetching NFT data for:', nftokenId);
      const response = await axios.get(`https://api.xrpnft.com/api/nft/${nftokenId}`);
      console.log('NFT API response:', response.data);

      if (response.data && response.data.res === 'success' && response.data.nft) {
        const nft = response.data.nft;
        const thumbnailUrl = nft.files?.[0]?.dfile
          ? `https://s2.xrpnft.com/d1/thumbnail_small-${nft.files[0].dfile.replace(
              '.png',
              '.webp'
            )}`
          : null;

        console.log('Thumbnail URL:', thumbnailUrl);

        const nftInfo = {
          name: nft.meta?.name || 'Unknown NFT',
          thumbnail: thumbnailUrl,
          collection: nft.collection || 'Unknown Collection'
        };

        console.log('Setting NFT data:', nftInfo);
        setNftData((prev) => ({ ...prev, [nftokenId]: nftInfo }));
        return nftInfo;
      }
    } catch (err) {
      console.error('Error fetching NFT data:', err);
    }

    // Set empty data to prevent repeated requests
    setNftData((prev) => ({ ...prev, [nftokenId]: null }));
    return null;
  };

  const fetchAccountTransactions = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
      setTransactions([]);
      setMarker(null);
      setHasMore(true);
    }

    try {
      const requestParams = {
        account: creatorAccount,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        limit: 200, // Increased to 200 as requested
        forward: false
      };

      // Add marker for pagination if loading more
      if (isLoadMore && marker) {
        requestParams.marker = marker;
      }

      const response = await axios.post('https://xrplcluster.com/', {
        method: 'account_tx',
        params: [requestParams]
      });

      if (response.data && response.data.result && response.data.result.transactions) {
        const newTransactions = response.data.result.transactions;

        if (isLoadMore) {
          setTransactions((prev) => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }

        // Update pagination marker
        if (response.data.result.marker) {
          setMarker(response.data.result.marker);
          setHasMore(true);
        } else {
          setMarker(null);
          setHasMore(false);
        }

        // Fetch NFT data for transactions with NFTokenIDs
        const nftTransactions = newTransactions.filter((txData) => {
          const tx = txData.tx;
          const meta = txData.meta;
          return (
            tx.NFTokenID ||
            meta.nftoken_id ||
            (meta.AffectedNodes &&
              meta.AffectedNodes.some(
                (node) =>
                  node.DeletedNode?.LedgerEntryType === 'NFTokenOffer' ||
                  node.CreatedNode?.LedgerEntryType === 'NFTokenOffer'
              ))
          );
        });

        // Fetch NFT data for each NFT transaction
        const nftPromises = nftTransactions.map(async (txData) => {
          const tx = txData.tx;
          const meta = txData.meta;
          const nftInfo = extractNFTInfo(meta);

          if (nftInfo.nftokenId) {
            return await fetchNFTData(nftInfo.nftokenId);
          } else if (tx.NFTokenID) {
            return await fetchNFTData(tx.NFTokenID);
          }
          return null;
        });

        // Wait for all NFT data to be fetched
        await Promise.allSettled(nftPromises);
      } else {
        if (!isLoadMore) {
          setError('No transactions found');
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching account transactions:', err);
      if (!isLoadMore) {
        setError('Failed to fetch transactions');
        openSnackbar('Failed to fetch account transactions', 'error');
      } else {
        openSnackbar('Failed to load more transactions', 'error');
      }
      setHasMore(false);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!creatorAccount) return;
    fetchAccountTransactions();
  }, [creatorAccount]);

  // Debug useEffect to monitor nftData changes
  useEffect(() => {
    console.log('NFT Data updated:', nftData);
  }, [nftData]);

  const getTransactionIcon = (transactionType) => {
    switch (transactionType) {
      case 'Payment':
        return <PaymentIcon />;
      case 'OfferCreate':
      case 'OfferCancel':
        return <LocalOfferIcon />;
      case 'TrustSet':
        return <AccountBalanceIcon />;
      case 'AMMDeposit':
      case 'AMMWithdraw':
        return <SwapHorizIcon />;
      case 'NFTokenAcceptOffer':
        return <SellIcon />;
      case 'NFTokenCreateOffer':
        return <LocalOfferIcon />;
      case 'NFTokenMint':
        return <CollectionsIcon />;
      default:
        return <HelpOutlineIcon />;
    }
  };

  const getTransactionColor = (transactionType) => {
    switch (transactionType) {
      case 'Payment':
        return 'success';
      case 'OfferCreate':
        return 'primary';
      case 'OfferCancel':
        return 'warning';
      case 'TrustSet':
        return 'info';
      case 'AMMDeposit':
      case 'AMMWithdraw':
        return 'secondary';
      case 'NFTokenAcceptOffer':
        return 'success';
      case 'NFTokenCreateOffer':
        return 'primary';
      case 'NFTokenMint':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount) => {
    if (typeof amount === 'string') {
      // XRP amount in drops
      return `${(parseInt(amount) / 1000000).toFixed(2)} XRP`;
    } else if (typeof amount === 'object' && amount.value) {
      // Token amount
      return `${parseFloat(amount.value).toFixed(2)} ${amount.currency}`;
    }
    return 'N/A';
  };

  const formatDate = (rippleTime) => {
    // Convert Ripple timestamp to Unix timestamp
    const unixTime = (rippleTime + 946684800) * 1000;
    const date = new Date(unixTime);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  };

  const extractNFTInfo = (meta) => {
    const nftInfo = {
      nftokenId: null,
      amount: null,
      buyer: null,
      seller: null,
      from: null,
      to: null,
      offers: []
    };

    // Check for NFToken ID in meta
    if (meta.nftoken_id) {
      nftInfo.nftokenId = meta.nftoken_id;
    }

    // Parse AffectedNodes for NFT-related information
    if (meta.AffectedNodes) {
      // First, collect all deleted offers
      const deletedOffers = [];

      meta.AffectedNodes.forEach((node) => {
        if (node.DeletedNode?.LedgerEntryType === 'NFTokenOffer') {
          const offer = node.DeletedNode.FinalFields;
          deletedOffers.push({
            type: 'deleted',
            amount: offer.Amount,
            destination: offer.Destination,
            owner: offer.Owner,
            nftokenId: offer.NFTokenID
          });
        }
      });

      // Find the specific offer that matches the NFToken being transferred
      let matchingOffer = null;
      if (nftInfo.nftokenId) {
        matchingOffer = deletedOffers.find((offer) => offer.nftokenId === nftInfo.nftokenId);
      } else if (deletedOffers.length === 1) {
        // If there's only one offer, use it
        matchingOffer = deletedOffers[0];
        nftInfo.nftokenId = matchingOffer.nftokenId;
      }

      // Set the from/to based on the matching offer
      if (matchingOffer) {
        nftInfo.amount = matchingOffer.amount;
        nftInfo.seller = matchingOffer.owner;
        nftInfo.from = matchingOffer.owner;
        nftInfo.buyer = matchingOffer.destination;
        nftInfo.to = matchingOffer.destination;
      }

      // Override buyer/to with actual NFT recipient from DirectoryNode
      meta.AffectedNodes.forEach((node) => {
        if (node.ModifiedNode?.LedgerEntryType === 'DirectoryNode') {
          const owner = node.ModifiedNode.FinalFields?.Owner;
          // Skip marketplace addresses - find the actual recipient
          if (owner && owner !== matchingOffer?.destination) {
            // Check if this owner corresponds to where the NFT was added
            const nftAddedToThisOwner = meta.AffectedNodes.some((otherNode) => {
              if (otherNode.ModifiedNode?.LedgerEntryType === 'NFTokenPage') {
                const prevTokens = otherNode.ModifiedNode.PreviousFields?.NFTokens || [];
                const finalTokens = otherNode.ModifiedNode.FinalFields?.NFTokens || [];

                const wasInPrevious = prevTokens.some(
                  (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
                );
                const isInFinal = finalTokens.some(
                  (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
                );

                return !wasInPrevious && isInFinal; // NFT was added to this page
              }
              return false;
            });

            if (nftAddedToThisOwner) {
              nftInfo.to = owner;
              nftInfo.buyer = owner;
            }
          }
        }
      });

      // Store all offers for detailed view
      nftInfo.offers = deletedOffers;

      // Continue with other node processing
      meta.AffectedNodes.forEach((node) => {
        if (node.CreatedNode?.LedgerEntryType === 'NFTokenOffer') {
          const offer = node.CreatedNode.NewFields;
          nftInfo.offers.push({
            type: 'created',
            amount: offer.Amount,
            destination: offer.Destination,
            owner: offer.Owner,
            nftokenId: offer.NFTokenID
          });
        }

        // Check for NFTokenPage changes to identify NFT transfers
        if (node.ModifiedNode?.LedgerEntryType === 'NFTokenPage') {
          // NFT ownership changes happen here
          const prevFields = node.ModifiedNode.PreviousFields;
          const finalFields = node.ModifiedNode.FinalFields;

          // Look for NFToken ownership changes in the page
          if (prevFields?.NFTokens && finalFields?.NFTokens && nftInfo.nftokenId) {
            // Check if this NFT was removed from this page
            const wasInPrevious = prevFields.NFTokens.some(
              (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
            );
            const isInFinal = finalFields.NFTokens.some(
              (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
            );

            // If NFT was added to this page, extract owner from LedgerIndex
            if (!wasInPrevious && isInFinal) {
              const ledgerIndex = node.ModifiedNode.LedgerIndex;
              // NFTokenPage LedgerIndex format: first 32 chars are the account hash
              // For account r9cxaBARPSxd2zYNNMz5yrBxcbN9Fakz9s, the page starts with 5E8D8D21CB7410F4866069136CBC23A4B877AD94
              if (ledgerIndex.startsWith('5E8D8D21CB7410F4866069136CBC23A4B877AD94')) {
                nftInfo.to = 'r9cxaBARPSxd2zYNNMz5yrBxcbN9Fakz9s';
                nftInfo.buyer = 'r9cxaBARPSxd2zYNNMz5yrBxcbN9Fakz9s';
              }
            }
          }
        }

        // Check DirectoryNode changes to identify page owners
        if (node.ModifiedNode?.LedgerEntryType === 'DirectoryNode') {
          const owner = node.ModifiedNode.FinalFields?.Owner;
          if (owner && nftInfo.nftokenId) {
            // Check if this directory is related to our NFT
            const nftokenIdInDirectory = node.ModifiedNode.FinalFields?.NFTokenID;
            if (nftokenIdInDirectory === nftInfo.nftokenId) {
              // This directory node is for our specific NFT
              if (!nftInfo.to) {
                nftInfo.to = owner;
                nftInfo.buyer = owner;
              }
            } else if (owner && !nftInfo.to) {
              // This might be the buyer's directory - check if NFT was added to their page
              // Look for corresponding NFTokenPage changes
              const buyerPageFound = meta.AffectedNodes.some((otherNode) => {
                if (otherNode.ModifiedNode?.LedgerEntryType === 'NFTokenPage') {
                  const prevTokens = otherNode.ModifiedNode.PreviousFields?.NFTokens || [];
                  const finalTokens = otherNode.ModifiedNode.FinalFields?.NFTokens || [];

                  const wasInPrevious = prevTokens.some(
                    (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
                  );
                  const isInFinal = finalTokens.some(
                    (token) => token.NFToken.NFTokenID === nftInfo.nftokenId
                  );

                  return !wasInPrevious && isInFinal; // NFT was added to this page
                }
                return false;
              });

              if (buyerPageFound) {
                nftInfo.to = owner;
                nftInfo.buyer = owner;
              }
            }
          }
        }

        // Check for AccountRoot changes to identify balance changes (secondary method)
        if (node.ModifiedNode?.LedgerEntryType === 'AccountRoot' && !nftInfo.from && !nftInfo.to) {
          const account = node.ModifiedNode.FinalFields.Account;
          const prevBalance = parseInt(node.ModifiedNode.PreviousFields?.Balance || '0');
          const finalBalance = parseInt(node.ModifiedNode.FinalFields.Balance);

          if (prevBalance && finalBalance) {
            const balanceChange = finalBalance - prevBalance;
            if (balanceChange > 0 && !nftInfo.buyer) {
              nftInfo.buyer = account;
              if (!nftInfo.to) nftInfo.to = account;
            } else if (balanceChange < 0 && !nftInfo.seller) {
              nftInfo.seller = account;
              if (!nftInfo.from) nftInfo.from = account;
            }
          }
        }
      });
    }

    return nftInfo;
  };

  const getMarketplaceName = (address) => {
    const marketplaces = {
      rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC: 'xrp.cafe'
    };
    return marketplaces[address] || null;
  };

  const getTransactionDetails = (tx, meta) => {
    const nftInfo = extractNFTInfo(meta);

    switch (tx.TransactionType) {
      case 'NFTokenAcceptOffer':
        // For NFTokenAcceptOffer:
        // - The seller is from the deleted offer's Owner
        // - The buyer is tx.Account (the one who accepted the offer)
        const seller = nftInfo.seller || nftInfo.from;
        const buyer = nftInfo.buyer || nftInfo.to || tx.Account; // Use the corrected buyer info

        // Check if the original offer destination was a marketplace
        const originalDestination = nftInfo.offers?.find(
          (offer) => offer.type === 'deleted'
        )?.destination;
        const marketplace = getMarketplaceName(originalDestination);

        // Get NFT name from cached data
        const nftTokenId = nftInfo.nftokenId || tx.NFTokenID;
        const nft = nftTokenId ? nftData[nftTokenId] : null;
        const nftName = nft?.name;

        return {
          description: 'NFT Sale',
          details: [
            nftName && `${nftName}`,
            nftInfo.nftokenId && {
              type: 'nft-link',
              id: nftInfo.nftokenId,
              text: `ID: ${nftInfo.nftokenId.slice(0, 12)}...`
            },
            nftInfo.amount && `${formatAmount(nftInfo.amount)}`,
            seller && buyer && `${seller.slice(0, 6)}... → ${buyer.slice(0, 6)}...`,
            marketplace && `via ${marketplace}`
          ].filter(Boolean)
        };

      case 'NFTokenCreateOffer':
        return {
          description: 'NFT Offer',
          details: [
            tx.NFTokenID && `ID: ${tx.NFTokenID.slice(0, 12)}...`,
            tx.Amount && `${formatAmount(tx.Amount)}`,
            tx.Destination && `→ ${tx.Destination.slice(0, 6)}...`
          ].filter(Boolean)
        };

      case 'NFTokenMint':
        return {
          description: 'NFT Mint',
          details: [
            tx.NFTokenTaxon && `Taxon: ${tx.NFTokenTaxon}`,
            tx.Account && `by ${tx.Account.slice(0, 6)}...`
          ].filter(Boolean)
        };

      case 'Payment':
        return {
          description: 'Payment',
          details: [
            tx.Amount && `${formatAmount(tx.Amount)}`,
            tx.Account &&
              tx.Destination &&
              `${tx.Account.slice(0, 6)}... → ${tx.Destination.slice(0, 6)}...`
          ].filter(Boolean)
        };

      default:
        return {
          description: tx.TransactionType,
          details: []
        };
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && marker) {
      fetchAccountTransactions(true);
    }
  };

  if (!creatorAccount) {
    return (
      <Container maxWidth={false} sx={{ pl: 0, pr: 0, maxWidth: '2000px' }}>
        <Card
          sx={{
            p: 4,
            mb: 3,
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}`,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
            No creator account available
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ pl: 0, pr: 0, maxWidth: '2000px' }}>
      <Card
        sx={{
          mb: 3,
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.95
          )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.06)}, 0 2px 8px ${alpha(
            theme.palette.primary.main,
            0.04
          )}`,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
            opacity: 0.8
          }
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header Section */}
          <Box
            sx={{
              px: 4,
              py: 3,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.8
              )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                }}
              >
                <TrendingUpIcon
                  sx={{
                    color: theme.palette.primary.main,
                    fontSize: '1.5rem',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(
                      theme.palette.primary.main,
                      0.8
                    )} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                  variant="h5"
                >
                  Collection Activity
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: 500, mt: 0.5 }}
                >
                  Real-time transaction monitoring and NFT activity tracking
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Content Section */}
          <Box sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ p: 4 }}>
                <Stack spacing={2}>
                  {[...Array(8)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: alpha(theme.palette.background.paper, 0.4),
                        border: `1px solid ${alpha(theme.palette.divider, 0.06)}`
                      }}
                    >
                      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : error ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.error.main,
                    0.04
                  )} 0%, ${alpha(theme.palette.error.main, 0.01)} 100%)`
                }}
              >
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
                  {error}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please try refreshing the page or check back later
                </Typography>
              </Box>
            ) : transactions.length === 0 ? (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.info.main,
                    0.04
                  )} 0%, ${alpha(theme.palette.info.main, 0.01)} 100%)`
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No Transactions Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This collection hasn't had any recent activity
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ overflow: 'hidden' }}>
                  <Table stickyHeader size="medium">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Type</StyledTableCell>
                        <StyledTableCell>Details</StyledTableCell>
                        <StyledTableCell>Date</StyledTableCell>
                        <StyledTableCell align="center">Actions</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((txData, idx) => {
                        const tx = txData.tx;
                        const meta = txData.meta;
                        const txDetails = getTransactionDetails(tx, meta);

                        return (
                          <StyledTableRow key={tx.hash || idx}>
                            <StyledTableCell>
                              <CompactChip
                                icon={getTransactionIcon(tx.TransactionType)}
                                label={tx.TransactionType}
                                color={getTransactionColor(tx.TransactionType)}
                                variant="outlined"
                                size="small"
                              />
                            </StyledTableCell>
                            <StyledTableCell>
                              <Box>
                                {txDetails.details.length > 0 && (
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    {/* NFT Thumbnail */}
                                    {(() => {
                                      const tx = txData.tx;
                                      const meta = txData.meta;
                                      const nftInfo = extractNFTInfo(meta);
                                      const nftTokenId = nftInfo.nftokenId || tx.NFTokenID;
                                      const nft = nftTokenId ? nftData[nftTokenId] : null;

                                      if (nft?.thumbnail) {
                                        return (
                                          <Box
                                            sx={{
                                              position: 'relative',
                                              borderRadius: '8px',
                                              overflow: 'hidden',
                                              boxShadow: `0 4px 12px ${alpha(
                                                theme.palette.common.black,
                                                0.15
                                              )}`,
                                              border: `2px solid ${alpha(
                                                theme.palette.primary.main,
                                                0.2
                                              )}`,
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                transform: 'scale(1.1)',
                                                boxShadow: `0 6px 20px ${alpha(
                                                  theme.palette.common.black,
                                                  0.25
                                                )}`
                                              }
                                            }}
                                          >
                                            <CardMedia
                                              component="img"
                                              image={nft.thumbnail}
                                              alt={nft.name}
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                              }}
                                              sx={{
                                                width: 32,
                                                height: 32,
                                                objectFit: 'cover'
                                              }}
                                            />
                                          </Box>
                                        );
                                      }
                                      return null;
                                    })()}

                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.primary"
                                        sx={{
                                          fontSize: '0.85rem',
                                          lineHeight: 1.4,
                                          fontWeight: 500,
                                          display: 'block'
                                        }}
                                      >
                                        {txDetails.details.map((detail, index) => (
                                          <span key={index}>
                                            {typeof detail === 'object' &&
                                            detail.type === 'nft-link' ? (
                                              <Link
                                                href={`/nft/${detail.id}`}
                                                color="primary"
                                                underline="hover"
                                                sx={{
                                                  fontSize: '0.85rem',
                                                  fontWeight: 600,
                                                  transition: 'all 0.2s ease',
                                                  '&:hover': {
                                                    color: theme.palette.primary.dark
                                                  }
                                                }}
                                              >
                                                {detail.text}
                                              </Link>
                                            ) : (
                                              <span
                                                style={{
                                                  color:
                                                    typeof detail === 'string' &&
                                                    detail.includes('XRP')
                                                      ? theme.palette.success.main
                                                      : 'inherit'
                                                }}
                                              >
                                                {detail}
                                              </span>
                                            )}
                                            {index < txDetails.details.length - 1 && (
                                              <span
                                                style={{
                                                  margin: '0 8px',
                                                  color: alpha(theme.palette.text.secondary, 0.6)
                                                }}
                                              >
                                                •
                                              </span>
                                            )}
                                          </span>
                                        ))}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                )}
                              </Box>
                            </StyledTableCell>
                            <StyledTableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '0.8rem',
                                  color: theme.palette.text.secondary,
                                  fontWeight: 500
                                }}
                              >
                                {tx.date ? formatDate(tx.date) : 'N/A'}
                              </Typography>
                            </StyledTableCell>
                            <StyledTableCell align="center">
                              <Tooltip title="View on Bithomp" placement="top">
                                <IconButton
                                  size="small"
                                  sx={{
                                    padding: '8px',
                                    borderRadius: '10px',
                                    color: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                                      transform: 'scale(1.05)',
                                      boxShadow: `0 4px 12px ${alpha(
                                        theme.palette.primary.main,
                                        0.25
                                      )}`
                                    }
                                  }}
                                  onClick={() =>
                                    window.open(`https://bithomp.com/explorer/${tx.hash}`, '_blank')
                                  }
                                >
                                  <OpenInNewIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </StyledTableCell>
                          </StyledTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>

                {/* Load More Button */}
                {hasMore && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 4,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.6
                      )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      startIcon={loadingMore ? <CircularProgress size={16} /> : null}
                      sx={{
                        borderRadius: '16px',
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textTransform: 'none',
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        color: theme.palette.primary.main,
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.primary.main,
                          0.05
                        )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
                        },
                        '&:disabled': {
                          opacity: 0.6,
                          transform: 'none'
                        }
                      }}
                    >
                      {loadingMore ? 'Loading...' : 'Load More Transactions'}
                    </Button>
                  </Box>
                )}

                {!hasMore && transactions.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 3,
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      background: alpha(theme.palette.background.paper, 0.3)
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}
                    >
                      🎉 You've reached the end! No more transactions to load
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
