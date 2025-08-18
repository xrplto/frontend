import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Pagination,
  Chip,
  Link,
  Stack,
  styled,
  useTheme,
  alpha
} from '@mui/material';
import { getTokenImageUrl, decodeCurrency } from 'src/utils/constants';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '12px',
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 2px',
    fontWeight: '500',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 'bold',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  
  const value = parseFloat(num);
  
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  } else if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  } else if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K';
  } else if (value < 1) {
    return value.toFixed(4);
  }
  
  return value.toFixed(2);
};

const RichList = ({ token, amm }) => {
  const [richList, setRichList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHolders, setTotalHolders] = useState(0);
  const [totalTrustlines, setTotalTrustlines] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const theme = useTheme();
  const limit = 20;
  
  // Use AMM from prop or from token object
  const ammAccount = amm || token?.AMM;

  useEffect(() => {
    const fetchRichList = async () => {
      if (!token || !token.md5) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.xrpl.to/api/richlist/${token.md5}?start=${(page - 1) * limit}&limit=${limit}`
        );
        const data = await response.json();
        
        if (data.result === 'success') {
          setRichList(data.richList || []);
          
          // data.length is the total number of actual holders (balance > 0)
          // This is different from trustlines which includes accounts with 0 balance
          const actualHolders = data.length || data.richList?.length || 0;
          setTotalHolders(actualHolders);
          
          // Get trustlines from token object if available
          // Check both trustlines and holders fields as they might be used interchangeably
          const trustlineCount = token?.trustlines || token?.holders || 0;
          setTotalTrustlines(trustlineCount);
          
          // Calculate total supply from token or sum of holdings
          const supply = token.supply || token.total_supply || 
            (data.richList && data.richList.length > 0 && data.richList[0].holding 
              ? (parseFloat(data.richList[0].balance) / (parseFloat(data.richList[0].holding) / 100)) 
              : 0);
          setTotalSupply(supply);
          setTotalPages(Math.ceil((actualHolders || 100) / limit));
        }
      } catch (error) {
        console.error('Error fetching rich list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRichList();
  }, [token?.md5, page]); // Only refetch when token ID or page changes

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (!richList || richList.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: '12px',
          border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Holder Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rich list data will appear here when available
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Rank
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Address
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  Balance
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  % of Supply
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  24h Balance
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {richList.map((holder, index) => {
              const rank = holder.id || (page - 1) * limit + index + 1;
              const percentOfSupply = holder.holding || (totalSupply > 0 
                ? ((parseFloat(holder.balance) / parseFloat(totalSupply)) * 100).toFixed(2)
                : '0');
              
              return (
                <TableRow 
                  key={holder.account || index}
                  sx={{
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <TableCell>
                    <Chip 
                      label={`#${rank}`}
                      size="small"
                      color={rank <= 3 ? 'primary' : 'default'}
                      variant={rank <= 3 ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/profile/${holder.account}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: '500',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <Typography variant="body2" component="span">
                        {holder.account 
                          ? `${holder.account.slice(0, 6)}...${holder.account.slice(-6)}`
                          : 'Unknown'}
                      </Typography>
                    </Link>
                    {holder.freeze && (
                      <Chip 
                        label="Frozen"
                        size="small"
                        sx={{ ml: 1 }}
                        variant="outlined"
                        color="error"
                      />
                    )}
                    {ammAccount && holder.account === ammAccount && (
                      <Chip 
                        label="AMM"
                        size="small"
                        sx={{ ml: 1 }}
                        variant="filled"
                        color="primary"
                      />
                    )}
                    {token.issuer && holder.account === token.issuer && (
                      <Chip 
                        label={token.creator && holder.account === token.creator ? "Issuer/Creator" : "Issuer"}
                        size="small"
                        sx={{ ml: 1 }}
                        variant="filled"
                        color="secondary"
                      />
                    )}
                    {token.creator && holder.account === token.creator && holder.account !== token.issuer && (
                      <Chip 
                        label="Creator"
                        size="small"
                        sx={{ ml: 1 }}
                        variant="filled"
                        color="info"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                      <img
                        src={getTokenImageUrl(token.issuer, token.currency)}
                        alt={decodeCurrency(token.currency)}
                        style={{ width: 16, height: 16, borderRadius: '50%' }}
                      />
                      <Typography variant="body2" fontWeight="600">
                        {formatNumber(holder.balance)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: parseFloat(percentOfSupply) > 10 
                          ? theme.palette.warning.main 
                          : theme.palette.text.primary 
                      }}
                    >
                      {percentOfSupply}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {holder.balance24h ? formatNumber(holder.balance24h) : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
          <StyledPagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}
    </Stack>
  );
};

export default RichList;