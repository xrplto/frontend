import { Box, Grid } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import NFTCard from "./NFTCard";
import CollectionCard from "./CollectionCard";

const NFTs = ({ account, collection = false }) => {

    const BASE_URL = 'https://api.xrpnft.com/api';
    const [nfts, setNFTs] = useState([]);
    const type = "collected";

    useEffect(() => {

        if (account) {
            getNFTs();
        }

    }, [account])

    const getNFTs = async () => {

        const body = {
            account: account,
            filter: 0,
            limit: "32",
            page: 0,
            search: "",
            subFilter: "pricexrpasc",
            type: "collected",
        };

        await axios.post(`${BASE_URL}/account/collectedCreated`, body).then((res) => {
            const newNfts = res.data.nfts;
            setNFTs(newNfts);
        });

    }

    return (
        <Box
            sx={{
                padding: "10px",
                height: "500px",
                overflow: "auto",
                mt: 2,
                "&::-webkit-scrollbar": {
                    width: "6px !important"
                },
                "&::-webkit-scrollbar-thumb": {
                    borderRadius: "10px",
                    boxShadow: "inset 0 0 6px rgba(0,0,0,.7)",
                }
            }}
        >
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
