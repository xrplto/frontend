import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Grid, Typography, Stack, Button, Paper } from '@mui/material';
import { AppContext } from 'src/AppContext';
import axios from 'axios';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/KeyboardBackspace';
import ChatNFTCard from './ChatNFTCard';
import ChatCollectionCard from './ChatCollectionCard';

const BASE_URL = 'https://api.xrpnft.com/api';

const NFTs = ({ account, collection, type = 'collected', limit, onSelect, smallSize = false }) => {
  const scrollRef = useRef(null);
  const { darkMode } = useContext(AppContext);

  const [nfts, setNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  useEffect(() => {
    if (account) {
      getNFTs();
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [account, collection, type, selectedCollection]);

  const getNFTs = async () => {
    const body = {
      account,
      filter: 0,
      limit,
      page: 0,
      search: '',
      subFilter: 'pricexrpasc',
      type,
      collection: selectedCollection
    };

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/account/collectedCreated`, body);
      console.log('Received NFTs:', res.data.nfts); // Log the received NFT data
      setNFTs(res.data.nfts);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = (collectionData) => {
    setSelectedCollection(collectionData.collection.id);
  };

  const handleBack = () => {
    setSelectedCollection(null);
  };

  return (
    <Paper
      elevation={3}
      ref={scrollRef}
      sx={{
        padding: '6px',
        pt: 0.75,
        height: '300px',
        width: '290px',
        overflow: 'auto',
        borderRadius: '8px',
        backgroundColor: (theme) => theme.palette.background.paper,
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: '4px',
          backgroundColor: (theme) => theme.palette.primary.main
        }
      }}
    >
      {selectedCollection && (
        <Box display="flex" justifyContent="start" mb={0.25}>
          <Button
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBackIcon fontSize="small" sx={{ fontSize: '0.9rem', ml: -0.5 }} />}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              py: 0,
              px: 1,
              minWidth: '60px',
              height: '20px'
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
              Back
            </Typography>
          </Button>
        </Box>
      )}
      {loading ? (
        <Stack alignItems="center" justifyContent="center" height="100%">
          <PulseLoader color={(theme) => theme.palette.primary.main} size={6} />
        </Stack>
      ) : nfts.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" height="100%">
          <ErrorOutlineIcon sx={{ mb: 0.5, color: 'text.secondary', fontSize: '1.25rem' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            No NFTs found
          </Typography>
        </Stack>
      ) : (
        <Grid container spacing={0.5}>
          {nfts.map((nft, index) => (
            <Grid item key={index} xs={3}>
              {selectedCollection ? (
                <ChatNFTCard nft={nft} onSelect={onSelect} />
              ) : (
                <ChatCollectionCard collectionData={nft} onSelect={handleCollectionSelect} />
              )}
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

function ChatNFTPicker({ onSelect }) {
  const { accountProfile } = useContext(AppContext);

  return (
    <NFTs
      account={accountProfile?.account}
      type="collected"
      limit={24}
      onSelect={onSelect}
      smallSize={true}
    />
  );
}

export default ChatNFTPicker;
