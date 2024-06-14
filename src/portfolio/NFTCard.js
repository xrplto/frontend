import { Card, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";

const NFTCard = ({ nft }) => {

    const [metadata, setMetadata] = useState({});
    const [imgUrl, setImgUrl] = useState('');

    useEffect(() => {
        if (nft) {
            console.log(nft.NFTokenID)
            getMetadata();
        }
    }, [nft]);

    const getMetadata = async() => {
        try {
            await axios.get(`https://marketplace-api.onxrp.com/api/metadata/${nft.NFTokenID}.json`).then((res) => {
                setMetadata(res.data);
                const { image } = res.data;
                if (image.indexOf("//") > -1) {
                    const splited = image.split("//");
                    setImgUrl(splited[1]);
                }
                else {
                    setImgUrl(image);
                }
            })
        } catch(err) {

        }
    }

    return (
        <Card>
            <CardContent>
                <img src={`https://ipfs.io/ipfs/${imgUrl}`} style={{ width: "100%"}}/>
                <Typography sx={{ mt: 1 }}>{metadata.name}</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: "12px" }}>Price</Typography>
                    <Typography sx={{ fontSize: "12px" }}>No Offer</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontSize: "12px" }}>Top Bid</Typography>
                    <Typography sx={{ fontSize: "12px" }}>No Offer</Typography>
                </Stack>
            </CardContent>
        </Card>
    )

}

export default NFTCard;