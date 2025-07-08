import axios from 'axios';
import Decimal from 'decimal.js';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Material
import {
    useTheme,
    Typography,
    Button,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Box,
    styled,
    alpha,
    useMediaQuery,
    Skeleton
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";

// Context
import { useContext } from 'react'
import { AppContext } from 'src/AppContext'

// Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// Styled Components
const BalanceContainer = styled(Box)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.3),
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  padding: theme.spacing(1.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1)
  }
}));

const BalanceCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(1),
  borderRadius: '6px',
  background: alpha(theme.palette.background.paper, 0.4),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.2s ease',
  flex: 1,
  '&:hover': {
    background: alpha(theme.palette.background.paper, 0.6),
    transform: 'translateY(-1px)'
  }
}));

const CurrencyLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.7rem',
  fontWeight: 600,
  marginBottom: theme.spacing(0.25),
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
}));

const BalanceValue = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 700,
  fontFamily: 'monospace',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem'
  }
}));

export default function AccountBalance({pair, accountPairBalance, setAccountPairBalance}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const BASE_URL = process.env.API_URL;
    const { accountProfile, sync, darkMode } = useContext(AppContext);
    const curr1 = useMemo(() => pair.curr1, [pair]);
    const curr2 = useMemo(() => pair.curr2, [pair]);
    const [loading, setLoading] = useState(false);

    const getAccountInfo = useCallback(() => {
        if (!accountProfile?.account || !pair) {
            setAccountPairBalance(null);
            return;
        }

        setLoading(true);
        const account = accountProfile.account;
        axios.get(`${BASE_URL}/account/info/${account}?curr1=${curr1.currency}&issuer1=${curr1.issuer}&curr2=${curr2.currency}&issuer2=${curr2.issuer}`)
            .then(res => {
                if (res.status === 200) {
                    setAccountPairBalance(res.data.pair);
                }
            }).catch(err => {
                console.error("Error on getting account pair balance info.", err);
            }).finally(() => {
                setLoading(false);
            });
    }, [accountProfile, pair, curr1, curr2, BASE_URL, setAccountPairBalance]);

    useEffect(() => {
        getAccountInfo();
    }, [getAccountInfo, sync]);

    if (loading) {
        return (
            <BalanceContainer>
                <Stack direction="row" spacing={1}>
                    <Skeleton variant="rounded" width="50%" height={60} />
                    <Skeleton variant="rounded" width="50%" height={60} />
                </Stack>
            </BalanceContainer>
        );
    }

    if (!accountPairBalance) {
        return null;
    }

    return (
        <BalanceContainer>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccountBalanceWalletIcon 
                    sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        color: theme.palette.primary.main 
                    }} 
                />
                <Typography 
                    variant="caption" 
                    sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        color: theme.palette.text.secondary
                    }}
                >
                    Wallet Balance
                </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
                <BalanceCard>
                    <CurrencyLabel sx={{ color: '#B72136' }}>
                        {curr1.name}
                    </CurrencyLabel>
                    <BalanceValue>
                        {new Decimal(accountPairBalance.curr1.value).toFixed(isMobile ? 6 : 8, Decimal.ROUND_DOWN)}
                    </BalanceValue>
                </BalanceCard>
                
                <BalanceCard>
                    <CurrencyLabel sx={{ color: darkMode ? '#007B55' : '#5569ff' }}>
                        {curr2.name}
                    </CurrencyLabel>
                    <BalanceValue>
                        {new Decimal(accountPairBalance.curr2.value).toFixed(isMobile ? 4 : 6, Decimal.ROUND_DOWN)}
                    </BalanceValue>
                </BalanceCard>
            </Stack>
        </BalanceContainer>
    );
}
