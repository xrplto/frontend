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
          transactionType === 'AMMWithdraw'
        );
      });
      const updatedArray = filteredTransactions.map((item) => ({
        Account: item.tx.Account,
        Destination: item.tx.Destination,
        TransactionType: item.tx.TransactionType,
        Amount: item.tx.Amount,
        Amount2: item.tx.Amount2,
        Asset: item.tx.Asset,
        Asset2: item.tx.Asset2,
        TransactionResult: item.meta.TransactionResult,
        DeliveredAmount: item.meta.delivered_amount,
        SendMax: item.tx.SendMax,
        hash: item.tx.hash,
        date: item.tx.date
      }));

      for (let i = 0; i < updatedArray.length; i++) {
        const eachTransaction = updatedArray[i];
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
              gap: 8,
              background: alpha(theme.palette.primary.main, 0.02)
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.05)}`
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500
                }}
              >
                {`${page * rowsPerPage + 1}-${Math.min(
                  (page + 1) * rowsPerPage,
                  activityHistory.length
                )} of ${activityHistory.length}`}
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
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                    background: alpha(theme.palette.primary.main, 0.05),
                    boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.35)}`
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.primary.main, 0.3),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      background: 'none',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiSvgIcon-root': {
                      fontSize: '24px'
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
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                    background: alpha(theme.palette.primary.main, 0.05),
                    boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.15),
                      borderColor: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.35)}`
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.primary.main, 0.3),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      background: 'none',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiSvgIcon-root': {
                      fontSize: '24px'
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
                borderRadius: '6px',
                px: 2,
                py: 0.5,
                height: '36px',
                boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                items / page:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                size="small"
                sx={{
                  height: '28px',
                  minWidth: '64px',
                  color: theme.palette.primary.main,
                  '.MuiSelect-select': {
                    py: 0.5,
                    px: 1,
                    fontWeight: 500
                  },
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.6),
                    borderWidth: '2px',
                    borderRadius: '4px'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: '2px'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '6px',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                      border: `3px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                      '.MuiMenuItem-root': {
                        color: theme.palette.primary.main,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.08)
                        },
                        '&.Mui-selected': {
                          background: alpha(theme.palette.primary.main, 0.12),
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.16)
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
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DeFiHistory;
