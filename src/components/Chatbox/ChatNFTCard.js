import { useContext } from 'react';
import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material';
import { AppContext } from 'src/AppContext';
import { getNftCoverUrl } from "src/utils/parse/utils";

const ChatNFTCard = ({ nft, onSelect }) => {
    const { darkMode } = useContext(AppContext);

    const imgUrl = getNftCoverUrl(nft, 'small');
    const name = nft.meta?.name || nft.meta?.Name || 'No Name';
    const nftId = nft.NFTokenID || nft.nftokenID || nft.id || 'Unknown';
    const nftLink = `[NFT: ${name} (${nftId})]`;

    return (
        <Card 
            onClick={() => onSelect(nftLink)}
            sx={{ 
                cursor: 'pointer', 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                    bgcolor: darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                }
            }}
        >
            <CardMedia
                component="img"
                image={imgUrl}
                alt={name}
                sx={{
                    height: 40,
                    objectFit: 'cover'
                }}
            />
            <CardContent sx={{ p: 0.5, flexGrow: 1 }}>
                <Typography variant="caption" component="div" noWrap>
                    {name} ({nftId})
                </Typography>
            </CardContent>
        </Card>
    );
};

export default ChatNFTCard;