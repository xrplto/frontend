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
        padding: '12px',
        pt: 1.5,
        height: '320px',
        width: '300px',
        overflow: 'auto',
        borderRadius: '10px',
        backgroundColor: (theme) => theme.palette.background.paper,
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: '6px',
          backgroundColor: (theme) => theme.palette.primary.main
        }
      }}
    >
      {selectedCollection && (
        <Box display="flex" justifyContent="start" mb={1}>
          <Button
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBackIcon fontSize="small" />}
            variant="outlined"
            sx={{
              borderRadius: '16px',
              py: 0.5,
              minWidth: '80px'
            }}
          >
            <Typography variant="caption">Back</Typography>
          </Button>
        </Box>
      )}
      {loading ? (
        <Stack alignItems="center" justifyContent="center" height="100%">
          <PulseLoader color={(theme) => theme.palette.primary.main} size={8} />
        </Stack>
      ) : nfts.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" height="100%">
          <ErrorOutlineIcon sx={{ mb: 1, color: 'text.secondary', fontSize: '1.5rem' }} />
          <Typography variant="caption" color="text.secondary">
            No NFTs found
          </Typography>
        </Stack>
      ) : (
        <Grid container spacing={1}>
          {nfts.map((nft, index) => (
            <Grid item key={index} xs={6}>
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
