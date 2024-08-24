import { useContext } from "react";
import { styled, Box, CardMedia, Typography, Card, CardContent } from '@mui/material';
import { AppContext } from "src/AppContext";

const CardWrapper = styled(Card)(
    ({ theme }) => `
        border-radius: 8px;
        padding: 0px;
        cursor: pointer;
        overflow: hidden;
        height: 60px;
        width: 100%;
  `
);

export default function ChatCollectionCard({ collectionData, onSelect }) {
    const { accountProfile } = useContext(AppContext);

    const collection = collectionData.collection;
    if (!collection) return null;

    const imgUrl = `https://s1.xrpnft.com/collection/${collection.logoImage}`;
    const name = collection.name || 'No Name';

    const handleClick = () => {
        if (onSelect) {
            onSelect(collectionData);
        }
    };

    return (
        <CardWrapper onClick={handleClick}>
            <Box display="flex" height="100%">
                <CardMedia
                    component="img"
                    image={imgUrl}
                    alt={name}
                    sx={{
                        width: '40px',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
                <CardContent sx={{ padding: '2px', flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                        variant="caption"
                        sx={{
                            fontSize: '0.5rem',
                            lineHeight: 1.1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.4rem', color: 'text.secondary' }}>
                        {collectionData.nftCount} item(s)
                    </Typography>
                </CardContent>
            </Box>
        </CardWrapper>
    );
}