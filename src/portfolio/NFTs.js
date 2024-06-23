import { Box, Button, Grid, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/KeyboardBackspace';
import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import NFTCard from "./NFTCard";
import CollectionCard from "./CollectionCard";
import { PulseLoader } from "react-spinners";
import { AppContext } from "src/AppContext";
import { useRouter } from "next/router";

const NFTs = ({ account, collection, type = "collected", limit }) => {

    const BASE_URL = 'https://api.xrpnft.com/api';
    const router = useRouter();
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


    }, [account, collection, type])

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
        await axios.post(`${BASE_URL}/account/collectedCreated`, body).then((res) => {
            const newNfts = res.data.nfts;
            setNFTs(newNfts);
            setLoading(false);
        }).catch(err => {
            setLoading(false);
        });

    }

    const handleBack = () => {
        router.push(`/profile/${account}`);
    };

    return (
        <Box
            sx={{
                padding: "10px",
                pt: 0,
                height: "500px",
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
            {
                loading && (
                    <Stack alignItems="center">
                        <PulseLoader color={darkMode ? '#007B55' : '#5569ff'} size={10} />
                    </Stack>
                )
            }
            {collection && (
                <Box display="flex" justifyContent="start" mb={1} ref={scrollRef}>
                    <Button size="small" onClick={handleBack}>
                        <ArrowBackIcon fontSize="large" />
                        <Typography variant="s3" fontSize="medium">Go back</Typography>
                    </Button>
                </Box>
            )}
            <Grid container spacing={3}>
                {
                    nfts.map((nft, index) => (
                        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                            {collection ? (
                                <NFTCard nft={nft} />
                            ) : (
                                <CollectionCard collectionData={nft} type={type} account={account} />
                            )}
                        </Grid>
                    ))
                }
            </Grid>
        </Box>
    )
}

export default NFTs;
