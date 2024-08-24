import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Grid, Typography, Stack } from '@mui/material';
import { AppContext } from 'src/AppContext';
import axios from 'axios';
import { PulseLoader } from 'react-spinners';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChatNFTCard from './ChatNFTCard';
import ChatCollectionCard from './ChatCollectionCard';

const BASE_URL = 'https://api.xrpnft.com/api';

const NFTs = ({ account, collection, type = "collected", limit, onSelect, smallSize = false }) => {
    const scrollRef = useRef(null);
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
            search: "",
            subFilter: "pricexrpasc",
            type,
            collection
        };

        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/account/collectedCreated`, body);
            setNFTs(res.data.nfts);
        } catch (err) {
            console.error("Error fetching NFTs:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            ref={scrollRef}
            sx={{
                padding: "5px",
                pt: 0,
                height: "240px",
                width: "240px",
                overflow: "auto",
                "&::-webkit-scrollbar": {
                    width: "6px !important"
                },
                "&::-webkit-scrollbar-thumb": {
                    borderRadius: "10px",
                    boxShadow: "inset 0 0 6px rgba(0,0,0,.7)",
                },
            }}
        >
            {loading ? (
                <Stack alignItems="center" justifyContent="center" height="100%">
                    <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
                </Stack>
            ) : nfts.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" height="100%">
                    <ErrorOutlineIcon fontSize="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No NFTs found</Typography>
                </Stack>
            ) : (
                <Grid container spacing={1}>
                    {nfts.map((nft, index) => (
                        <Grid item key={index} xs={3}>
                            {collection ? (
                                <ChatNFTCard 
                                    nft={nft}
                                    onSelect={onSelect}
                                />
                            ) : (
                                <ChatCollectionCard 
                                    collectionData={nft} 
                                    onSelect={onSelect}
                                />
                            )}
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
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