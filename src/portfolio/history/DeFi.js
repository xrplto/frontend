import {
  useTheme,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Box,
  alpha,
  TablePagination,
  useMediaQuery,
  IconButton,
  Select,
  MenuItem
} from '@mui/material';
import { Client } from 'xrpl';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import HistoryRow from './HistoryRow';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

const rippleServerUrl = process.env.NEXT_PUBLIC_RIPPLED_LIVE_DATA_ONLY_URL;
const client = new Client(rippleServerUrl);

const DeFiHistory = ({ account }) => {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const [activityHistory, setActivityHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    accountHistory();
  }, [account]);

  const accountHistory = async () => {
    if (account === undefined) return;
    setLoading(true);
    try {
      await client.connect();
      const transaction = {
        command: 'account_tx',
        account: account,
        ledger_index_min: -1,
        ledger_index_max: -1,
        binary: false,
        // limit: 5,
        forward: false
      };
      const response = await client.request(transaction);
      console.log('Full API Response:', JSON.stringify(response, null, 2));
      console.log('All Transactions:', JSON.stringify(response.result.transactions, null, 2));
      const totalTransactions = response.result.transactions;
      const filteredTransactions = totalTransactions.filter((item) => {
        const transactionType = item.tx.TransactionType;
        const account = item.tx.Account;
        const destination = item.tx.Destination;
        const deliveredAmount = item.meta.delivered_amount;
        return (
          (transactionType === 'Payment' &&
            account === destination &&
            deliveredAmount !== undefined) ||
          transactionType === 'AMMDeposit' ||
          transactionType === 'AMMWithdraw' ||
          transactionType === 'TrustSet' ||
          transactionType === 'OfferCreate' ||
          transactionType === 'OfferCancel'
        );
      });
      const updatedArray = filteredTransactions.map((item) => {
        // Check SourceTag in tx object
        const sourceTag = item.tx.SourceTag;
        console.log('Processing transaction:', {
          type: item.tx.TransactionType,
          hash: item.tx.hash,
          sourceTag: sourceTag,
          fullTx: item.tx
        });

        // Determine source label based on SourceTag
        let sourceLabel;
        if (sourceTag === 74920348) {
          sourceLabel = 'FirstLedger';
        } else if (sourceTag === 10011010) {
          sourceLabel = 'Magnetic X';
        } else if (sourceTag === 20221212) {
          sourceLabel = 'XPMarket';
        } else if (sourceTag === 110100111) {
          sourceLabel = 'Sologenic';
        } else {
          sourceLabel = 'XRP Ledger';
        }

        // Add tooltip information
        const tooltipInfo =
          sourceLabel === 'XRP Ledger'
            ? 'Direct interaction with the XRPL through API calls or SDK integration. These transactions are typically executed programmatically rather than through a third-party interface.'
            : '';

        // For OfferCreate, include TakerGets and TakerPays
        const amount =
          item.tx.TransactionType === 'OfferCreate' ? item.tx.TakerPays : item.tx.Amount;
        const sendMax =
          item.tx.TransactionType === 'OfferCreate' ? item.tx.TakerGets : item.tx.SendMax;

        // Determine if OfferCreate is buy or sell
        let offerType = null;
        if (item.tx.TransactionType === 'OfferCreate') {
          const takerGets = item.tx.TakerGets; // What the offer creator gives
          const takerPays = item.tx.TakerPays; // What the offer creator wants to receive

          // Check if TakerGets is XRP (string) or token (object)
          const givingXRP = typeof takerGets === 'string';
          // Check if TakerPays is XRP (string) or token (object)
          const receivingXRP = typeof takerPays === 'string';

          if (givingXRP && !receivingXRP) {
            // Giving XRP, receiving token = Buy offer
            offerType = 'buy';
          } else if (!givingXRP && receivingXRP) {
            // Giving token, receiving XRP = Sell offer
            offerType = 'sell';
          } else {
            // Token to token or XRP to XRP (edge cases)
            offerType = 'trade';
          }
        }

        return {
          Account: item.tx.Account,
          Destination: item.tx.Destination,
          TransactionType: item.tx.TransactionType,
          Amount: amount,
          Amount2: item.tx.Amount2,
          Asset: item.tx.Asset,
          Asset2: item.tx.Asset2,
          TransactionResult: item.meta.TransactionResult,
          DeliveredAmount: item.meta.delivered_amount,
          SendMax: sendMax,
          hash: item.tx.hash,
          date: item.tx.date,
          source: sourceLabel,
          sourceTooltip: tooltipInfo,
          LimitAmount: item.tx.LimitAmount,
          OfferSequence: item.tx.OfferSequence, // For OfferCancel
          offerType: offerType // Add offer type for OfferCreate transactions
        };
      });

      for (let i = 0; i < updatedArray.length; i++) {
        const eachTransaction = updatedArray[i];
        console.log('Processed Transaction:', eachTransaction);
        if (typeof eachTransaction.Destination === 'undefined') {
          eachTransaction.Destination = 'XRPL';
        }
      }
      const filteredData = updatedArray.filter((item) => {
        return item.Account === account || item.Destination === account;
      });
      setActivityHistory(filteredData);
    } catch (error) {
      console.log('The error is occurred in my transaction history', error);
    }
    setLoading(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedHistory = activityHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box
      sx={{
        background: darkMode
          ? `linear-gradient(${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
              theme.palette.primary.main,
              0.02
            )})`
          : `linear-gradient(${alpha(theme.palette.primary.main, 0.02)}, ${alpha(
              theme.palette.primary.main,
              0.01
            )})`,
        borderRadius: 2,
        p: isSmallScreen ? 0.5 : 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {loading ? (
        <Stack alignItems="center" sx={{ py: 1 }}>
          <PulseLoader color={theme.palette.primary.main} size={10} margin={3} />
        </Stack>
      ) : (
        activityHistory &&
        activityHistory.length === 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{
              py: 1,
              opacity: 0.8,
              background: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 1
            }}
          >
            <ErrorOutlineIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="primary.main">
              No History
            </Typography>
          </Stack>
        )
      )}
      {activityHistory.length > 0 && (
        <>
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 0.75,
                px: isSmallScreen ? 0.5 : 1,
                fontSize: '0.875rem',
                lineHeight: 1.2
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    '&:first-of-type': {
                      borderTopLeftRadius: 8
                    },
                    '&:last-child': {
                      borderTopRightRadius: 8
                    }
                  }}
                >
                  Type
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    display: isSmallScreen ? 'none' : 'table-cell'
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  Amount
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  Source
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    width: '48px'
                  }}
                >
                  View
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedHistory.map((item, index) => (
                <HistoryRow key={index} {...item} isSmallScreen={isSmallScreen} />
              ))}
            </TableBody>
          </Table>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              px: 2,
              minHeight: '52px',
              gap: 4,
              background: alpha(theme.palette.primary.main, 0.02)
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                minHeight: '40px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                boxShadow: theme.shadows[1]
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500
                }}
              >
                {`${page + 1} / ${Math.ceil(activityHistory.length / rowsPerPage)} pages`}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  pl: 1
                }}
              >
                <IconButton
                  onClick={() => handleChangePage(null, page - 1)}
                  disabled={page === 0}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      borderColor: theme.palette.primary.main
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.primary.main, 0.3),
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                      background: 'none'
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px'
                    }
                  }}
                >
                  <KeyboardArrowLeft />
                </IconButton>
                <IconButton
                  onClick={() => handleChangePage(null, page + 1)}
                  disabled={page >= Math.ceil(activityHistory.length / rowsPerPage) - 1}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      borderColor: theme.palette.primary.main
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.primary.main, 0.3),
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                      background: 'none'
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px'
                    }
                  }}
                >
                  <KeyboardArrowRight />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                minHeight: '40px',
                boxShadow: theme.shadows[1],
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                size="small"
                sx={{
                  height: '32px',
                  width: '44px',
                  minWidth: '44px',
                  color: theme.palette.primary.main,
                  '.MuiSelect-select': {
                    py: 0,
                    px: 0,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px',
                    marginRight: '-8px',
                    paddingLeft: '4px'
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    borderWidth: '1px',
                    borderRadius: '6px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.4)
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    borderWidth: '1px'
                  },
                  background: alpha(theme.palette.primary.main, 0.05),
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      borderRadius: '6px',
                      boxShadow: theme.shadows[2],
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '.MuiMenuItem-root': {
                        color: theme.palette.primary.main,
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        letterSpacing: '0.5px',
                        py: 1,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.1)
                        },
                        '&.Mui-selected': {
                          background: alpha(theme.palette.primary.main, 0.08),
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.12)
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {[10, 25, 50].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  whiteSpace: 'nowrap',
                  pr: 0.5
                }}
              >
                items / page
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeFiHistory;
