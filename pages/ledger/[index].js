import { useRouter } from 'next/router';
import axios from 'axios';
import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import Topbar from 'src/components/Topbar';
import { rippleTimeToISO8601 } from 'src/utils/parse/utils';
import { getHashIcon } from 'src/utils/extra';

const AccountAvatar = ({ account }) => {
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/account/${account}`);

  const handleImageError = () => {
    setImgSrc(getHashIcon(account));
  };

  return <Avatar src={imgSrc} onError={handleImageError} sx={{ width: 32, height: 32, mr: 1 }} />;
};

const LedgerDetails = ({ ledgerData, error }) => {
  const theme = useTheme();

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const { ledger } = ledgerData;
  const { ledger_index, close_time, transactions } = ledger;

  const ledgerIndex = parseInt(ledger_index, 10);
  const closeTimeISO = rippleTimeToISO8601(close_time);
  const closeTimeLocale = new Date(closeTimeISO).toLocaleString();

  const shortenAddress = (address) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const shortenHash = (hash) => {
    if (!hash) return '';
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 5)}...${hash.slice(-5)}`;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => a.metaData.TransactionIndex - b.metaData.TransactionIndex
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: '24px',
        background: 'transparent',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant="h5" gutterBottom>
        Ledger transactions #{ledger_index}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {closeTimeLocale}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
        <IconButton onClick={() => (window.location.href = `/ledgers/${ledgerIndex - 1}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mx: 2 }}>
          #{ledgerIndex}
        </Typography>
        <IconButton onClick={() => (window.location.href = `/ledgers/${ledgerIndex + 1}`)}>
          <ArrowForwardIcon />
        </IconButton>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Index</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hash</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTransactions.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell>{tx.metaData.TransactionIndex}</TableCell>
                <TableCell>{tx.TransactionType}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountAvatar account={tx.Account} />
                    <Typography
                      variant="body2"
                      onClick={() => (window.location.href = `/profile/${tx.Account}`)}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {shortenAddress(tx.Account)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={
                      tx.metaData.TransactionResult === 'tesSUCCESS' ? 'success.main' : 'error.main'
                    }
                  >
                    {tx.metaData.TransactionResult}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    onClick={() => (window.location.href = `/tx/${tx.hash}`)}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {shortenHash(tx.hash)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ pt: 3, mt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="body2" color="text.secondary">
          Ledger Unix close time: {close_time}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ledger UTC close time: {closeTimeISO}
        </Typography>
      </Box>
    </Paper>
  );
};

const LedgerPage = ({ ledgerData, error }) => {
  const router = useRouter();

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
            Ledger Details
          </Typography>
        </Box>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <LedgerDetails ledgerData={ledgerData} />
        )}
      </Container>
      <Footer />
    </Box>
  );
};

export async function getServerSideProps(context) {
  const { index } = context.params;

  if (!/^\d+$/.test(index)) {
    return {
      props: {
        ledgerData: null,
        error: 'Invalid ledger index format.'
      }
    };
  }

  try {
    const response = await axios.post('https://xrplcluster.com/', {
      method: 'ledger',
      params: [
        {
          ledger_index: parseInt(index, 10),
          transactions: true,
          expand: true
        }
      ]
    });

    if (response.data.result.error) {
      return {
        props: {
          ledgerData: null,
          error: response.data.result.error_message || 'Ledger not found'
        }
      };
    }

    return {
      props: {
        ledgerData: response.data.result,
        error: null
      }
    };
  } catch (error) {
    console.error(error);
    let errorMessage = 'Failed to fetch ledger data.';
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
        ledgerData: null,
        error: errorMessage
      }
    };
  }
}

export default LedgerPage;
