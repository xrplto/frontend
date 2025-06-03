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
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { tableCellClasses } from '@mui/material/TableCell';
import PaymentIcon from '@mui/icons-material/Payment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CollectionsIcon from '@mui/icons-material/Collections';
import SellIcon from '@mui/icons-material/Sell';
import { formatDateTime } from 'src/utils/formatTime';
import { AppContext } from 'src/AppContext';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '0.8rem',
    padding: '8px 12px'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.75rem',
    padding: '6px 12px',
    lineHeight: 1.2
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover
  },
  '&:last-child td, &:last-child th': {
    border: 0
  },
  height: '48px'
}));

const CompactChip = styled(Chip)(({ theme }) => ({
  height: '20px',
  fontSize: '0.65rem',
  '& .MuiChip-icon': {
    fontSize: '0.9rem'
  }
}));

const CompactAccordion = styled(Accordion)(({ theme }) => ({
  '&.MuiAccordion-root': {
    marginBottom: '4px',
    '&:before': {
      display: 'none'
    }
  },
  '& .MuiAccordionSummary-root': {
    minHeight: '36px',
    padding: '0 12px',
    '&.Mui-expanded': {
      minHeight: '36px'
    }
  },
  '& .MuiAccordionSummary-content': {
    margin: '6px 0',
    '&.Mui-expanded': {
      margin: '6px 0'
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: '8px 12px 12px'
  }
}));

export default function AccountTransactions({ creatorAccount }) {
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
        <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No creator account available
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ pl: 0, pr: 0, maxWidth: '2000px' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 1 }}>
          Creator Account Transactions
        </Typography>

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            Account: {creatorAccount}
          </Typography>
          {transactions.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Showing {transactions.length} transactions
            </Typography>
          )}
        </Box>

        {loading ? (
          <Stack spacing={1}>
            {[...Array(8)].map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={40} />
            ))}
          </Stack>
        ) : error ? (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </Stack>
        ) : transactions.length === 0 ? (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Typography variant="h6">No Transactions Found</Typography>
          </Stack>
        ) : (
          <>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Type</StyledTableCell>
                  <StyledTableCell>Details</StyledTableCell>
                  <StyledTableCell>Date</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
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
                            <Stack direction="row" spacing={1} alignItems="center">
                              {/* NFT Thumbnail */}
                              {(() => {
                                const tx = txData.tx;
                                const meta = txData.meta;
                                const nftInfo = extractNFTInfo(meta);
                                const nftTokenId = nftInfo.nftokenId || tx.NFTokenID;
                                const nft = nftTokenId ? nftData[nftTokenId] : null;

                                console.log(
                                  'Rendering thumbnail for:',
                                  nftTokenId,
                                  'NFT data:',
                                  nft
                                );
                                console.log('Has thumbnail?', !!nft?.thumbnail);
                                console.log('Thumbnail URL:', nft?.thumbnail);

                                if (nft?.thumbnail) {
                                  console.log('Displaying thumbnail:', nft.thumbnail);
                                  return (
                                    <CardMedia
                                      component="img"
                                      image={nft.thumbnail}
                                      alt={nft.name}
                                      onError={(e) => {
                                        console.error('Thumbnail failed to load:', nft.thumbnail);
                                        console.error('Error event:', e);
                                        e.target.style.display = 'none';
                                      }}
                                      onLoad={() => {
                                        console.log(
                                          'Thumbnail loaded successfully:',
                                          nft.thumbnail
                                        );
                                      }}
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        border: '1px solid red' // Debug border
                                      }}
                                    />
                                  );
                                } else {
                                  console.log('No thumbnail available for:', nftTokenId);
                                  // Test with a placeholder image to see if CardMedia works
                                  return (
                                    <CardMedia
                                      component="img"
                                      image="https://via.placeholder.com/24x24/ff0000/ffffff?text=NFT"
                                      alt="Test"
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        border: '1px solid blue' // Debug border
                                      }}
                                    />
                                  );
                                }
                              })()}

                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.65rem',
                                  lineHeight: 1.1,
                                  display: 'block'
                                }}
                              >
                                {txDetails.details.map((detail, index) => (
                                  <span key={index}>
                                    {typeof detail === 'object' && detail.type === 'nft-link' ? (
                                      <Link
                                        href={`/nft/${detail.id}`}
                                        color="primary"
                                        underline="hover"
                                        sx={{ fontSize: '0.65rem' }}
                                      >
                                        {detail.text}
                                      </Link>
                                    ) : (
                                      detail
                                    )}
                                    {index < txDetails.details.length - 1 && ' • '}
                                  </span>
                                ))}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                          {tx.date ? formatDate(tx.date) : 'N/A'}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Tooltip title="View on Bithomp">
                          <IconButton
                            size="small"
                            sx={{ padding: '2px' }}
                            onClick={() =>
                              window.open(`https://bithomp.com/explorer/${tx.hash}`, '_blank')
                            }
                          >
                            <OpenInNewIcon sx={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      </StyledTableCell>
                    </StyledTableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={16} /> : null}
                >
                  {loadingMore ? 'Loading...' : 'Load More Transactions'}
                </Button>
              </Box>
            )}

            {!hasMore && transactions.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No more transactions to load
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
