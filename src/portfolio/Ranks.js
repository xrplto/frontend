import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from 'src/AppContext';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WaterIcon from '@mui/icons-material/Water';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedIcon from '@mui/icons-material/Verified';
import axios from 'axios';
import { PulseLoader } from 'react-spinners';
import { useRouter } from 'next/router';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ranks = {
  riddler: {
    id: 'riddler',
    name: 'Riddler',
    price: 5,
    description: 'Entry-level rank for XRP puzzle solvers',
    icon: PsychologyIcon,
    color: '#FFD700'
  },
  rippler: {
    id: 'rippler',
    name: 'Rippler',
    price: 0.0001,
    description: 'Intermediate rank for XRP enthusiasts',
    icon: WaterIcon,
    color: '#4CAF50'
  },
  validator: {
    id: 'validator',
    name: 'Validator',
    price: 0.0001,
    description: 'Advanced rank with enhanced features',
    icon: VerifiedUserIcon,
    color: '#2196F3'
  },
  escrow: {
    id: 'escrow',
    name: 'Escrow Master',
    price: 0.0001,
    description: 'Elite rank with exclusive XRP-themed perks',
    icon: LockIcon,
    color: '#9C27B0'
  },
  ledger: {
    id: 'ledger',
    name: 'Ledger Guardian',
    price: 0.0001,
    description: 'Legendary rank for true XRP aficionados',
    icon: SecurityIcon,
    color: '#F44336'
  },
  verified: {
    id: 'verified',
    name: 'Verified',
    price: 0.0001,
    description: 'Exclusive verified status with premium benefits',
    icon: VerifiedIcon,
    color: '#1DA1F2'
  }
};

const chatURL = 'http://37.27.134.126:5000'; //http://37.27.134.126:5000

const Ranks = ({ profileAccount }) => {
  const theme = useTheme();
  const { accountProfile, darkMode, openSnackbar } = useContext(AppContext);
  const [purchased, setPurchased] = useState([]);
  const [activeRank, setActiveRank] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getPurchasedRanks() {
      setLoading(true);
      const accountToUse = profileAccount || router.query.slug;

      if (!accountToUse) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${chatURL}/api/get-purchased-ranks`, {
          account: accountToUse
        });

        const result = res.data;
        const activePurchases = result.chatFeatures.filter((feature) => feature.status === true);
        setPurchased(activePurchases);
        setActiveRank(result.activeRank);
      } catch (error) {
        console.error('Error fetching purchased ranks:', error);
        openSnackbar('Failed to fetch ranks', 'error');
      } finally {
        setLoading(false);
      }
    }

    getPurchasedRanks();
  }, [profileAccount, router.query.slug]);

  const updateActiveRank = async (rank) => {
    if (!accountProfile?.account) {
      openSnackbar('Please login to change active rank', 'error');
      return;
    }

    if (profileAccount !== accountProfile?.account) {
      openSnackbar('You can only change the active rank on your own profile', 'error');
      return;
    }

    try {
      await axios.post(`${chatURL}/api/set-active-rank`, {
        account: accountProfile.account,
        rank
      });
      setActiveRank(rank);
      openSnackbar(`Selected ${ranks[rank].name} as active rank successfully!`, 'success');
    } catch (err) {
      console.error('Error updating active rank:', err);
      openSnackbar('Failed to update active rank', 'error');
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        minHeight: '280px',
        background:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: theme.shadows[1]
      }}
    >
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
          <PulseLoader color={theme.palette.primary.main} size={12} />
          <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            Loading ranks...
          </Typography>
        </Stack>
      ) : (
        <>
          {purchased.length ? (
            <Grid container spacing={1.5}>
              {purchased.map((purchase) => {
                if (ranks[purchase.feature]) {
                  const item = ranks[purchase.feature];
                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      key={item.name}
                      onClick={() => updateActiveRank(item.id)}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.3s ease',
                          background:
                            theme.palette.mode === 'dark'
                              ? alpha(theme.palette.background.paper, 0.6)
                              : theme.palette.background.paper,
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8]
                          },
                          ...(item.id === activeRank && {
                            border: `2px solid ${item.color}`,
                            boxShadow: `0 0 16px ${alpha(item.color, 0.4)}`
                          }),
                          borderRadius: 3,
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: alpha(item.color, 0.12),
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: item.color,
                              width: 42,
                              height: 42,
                              boxShadow: theme.shadows[3]
                            }}
                          >
                            <item.icon sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 700, color: item.color, fontSize: '1.1rem' }}
                          >
                            {item.name}
                            {item.id === 'verified' && (
                              <VerifiedIcon sx={{ ml: 1, verticalAlign: 'middle', fontSize: 18 }} />
                            )}
                          </Typography>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, fontSize: '0.9rem', lineHeight: 1.4 }}
                          >
                            {item.description}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                              fontSize: '1rem'
                            }}
                          >
                            Price: 0.0001 XRP
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                }
                return null;
              })}
            </Grid>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{
                py: 4,
                opacity: 0.8
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: '2rem', color: theme.palette.text.secondary }} />
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
                No Active Ranks
              </Typography>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
};

export default Ranks;
