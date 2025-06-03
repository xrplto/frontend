import { Box, Button, Grid, IconButton, Stack, Typography, useTheme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/KeyboardBackspace';
import axios from 'axios';
import { useContext, useEffect, useRef, useState } from 'react';
import NFTCard from './NFTCard';
import CollectionCard from './CollectionCard';
import { PulseLoader } from 'react-spinners';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { alpha } from '@mui/material/styles';

const NFTs = ({ account, collection, type = 'collected', limit, onSelect, smallSize = false }) => {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const router = useRouter();
  const scrollRef = useRef(null);
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);

  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      getNFTs();
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [account, collection, type]);

  const getNFTs = async () => {
    const body = {
      account,
      filter: 0,
      limit,
      page: 0,
      search: '',
      subFilter: 'pricexrpasc',
      type,
      collection
    };

    setLoading(true);
    await axios
      .post(`${BASE_URL}/account/collectedCreated`, body)
      .then((res) => {
        const newNfts = res.data.nfts;
        setNFTs(newNfts);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleBack = () => {
    router.push(`/profile/${account}`);
  };

  return (
    <Box
      sx={{
        padding: smallSize ? '8px' : '16px',
        pt: 0,
        height: smallSize ? '280px' : '520px',
        overflow: 'auto',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.02
        )} 0%, ${alpha(theme.palette.background.paper, 0.01)} 100%)`,
        borderRadius: smallSize ? '12px' : '16px',
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.divider, 0.05),
          borderRadius: '10px'
        },
        '&::-webkit-scrollbar-thumb': {
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.3
          )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          borderRadius: '10px',
          border: `2px solid ${alpha(theme.palette.background.paper, 0.1)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.5
            )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`
          }
        }
      }}
    >
      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            height: '100%',
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 0%, transparent 70%)`,
            borderRadius: '12px'
          }}
        >
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.8
              )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <PulseLoader color={theme.palette.primary.main} size={12} speedMultiplier={0.8} />
          </Box>
        </Stack>
      ) : (
        nfts &&
        nfts.length === 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              py: 6,
              px: 3,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.6
              )} 0%, ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at center, ${alpha(
                  theme.palette.info.main,
                  0.03
                )} 0%, transparent 70%)`,
                borderRadius: '16px'
              }
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.1
                )} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: '1.5rem',
                  color: theme.palette.info.main,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                color="text.primary"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: '1.1rem'
                }}
              >
                No NFTs Found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  opacity: 0.8
                }}
              >
                This collection appears to be empty
              </Typography>
            </Box>
          </Stack>
        )
      )}
      {collection && (
        <Box
          display="flex"
          justifyContent="start"
          mb={2}
          ref={scrollRef}
          sx={{
            p: 1,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.6
            )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Button
            size="medium"
            onClick={handleBack}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 1,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.1
              )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              color: theme.palette.primary.main,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.15
                )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
              }
            }}
          >
            <ArrowBackIcon
              sx={{
                fontSize: '1.2rem',
                mr: 1,
                transition: 'transform 0.2s ease',
                '.MuiButton-root:hover &': {
                  transform: 'translateX(-2px)'
                }
              }}
            />
            <Typography
              variant="body1"
              sx={{
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            >
              Go back
            </Typography>
          </Button>
        </Box>
      )}
      <Grid container spacing={smallSize ? 2 : 3} sx={{ pt: 1 }}>
        {nfts.map((nft, index) => (
          <Grid
            item
            key={index}
            xs={smallSize ? 6 : 12}
            sm={smallSize ? 4 : 6}
            md={smallSize ? 3 : 4}
            lg={1.714}
          >
            {collection ? (
              <NFTCard nft={nft} smallSize={smallSize} onSelect={onSelect} />
            ) : (
              <CollectionCard
                collectionData={nft}
                type={type}
                account={account}
                smallSize={smallSize}
                onSelect={onSelect}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default NFTs;
