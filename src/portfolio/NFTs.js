import { Box, Grid } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import NFTCard from "./NFTCard";

const NFTs = ({ account }) => {

    const BASE_URL = 'https://api.xrpl.to/api';
    const [nfts, setNFTs] = useState([]);

    useEffect(() => {

        if (account) {
            getNFTs();
        }

    }, [account])

    const getNFTs = async() => {

        await axios.get(`${BASE_URL}/xrpnft/filter-by-account/${account}`).then((res) => {

            const { account_nfts } = res.data.nfts.result;
            setNFTs(account_nfts);

        });

    }

    return (
        <Box sx={{ padding: "10px", height: "500px", overflow: "auto" }}>
            <Grid container spacing={3}>
                {
                    nfts.map((nft, index) => (
                        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                            <NFTCard nft={nft}/>
                        </Grid>
                    ))
                }
            </Grid>
        </Box>
    )
}

export default NFTs;
