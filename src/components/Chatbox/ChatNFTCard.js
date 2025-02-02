import React from 'react';
import { Card, CardMedia, CardContent, Typography, CardActionArea, Box } from '@mui/material';

const XRPNFT_IMAGE_BASE_URL = 'https://s2.xrpnft.com/d1/';

const ChatNFTCard = ({ nft, onSelect }) => {
  const handleSelect = () => {
    if (onSelect) {
      const nftName = nft.name || nft.meta?.name || 'Unnamed NFT';
      const nftLink = `[NFT: ${nftName} (${nft.NFTokenID})]`;
      onSelect(nftLink);
    }
  };

  // Determine the image URL
  let imageUrl = null;
  if (nft.files && nft.files.length > 0) {
    const file = nft.files[0];
    if (file.thumbnail && file.thumbnail.small) {
      imageUrl = XRPNFT_IMAGE_BASE_URL + file.thumbnail.small;
    } else if (file.convertedFile) {
      imageUrl = XRPNFT_IMAGE_BASE_URL + file.convertedFile;
    } else if (file.dfile) {
      imageUrl = XRPNFT_IMAGE_BASE_URL + file.dfile;
    }
  }

  return (
    <Box
      onClick={handleSelect}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8
        }
      }}
    >
      <Box
        component="img"
        src={imageUrl}
        alt={nft.name}
        sx={{
          width: '70%',
          height: 'auto',
          borderRadius: '8px',
          aspectRatio: '1/1',
          objectFit: 'cover',
          display: 'block',
          margin: '0 auto'
        }}
      />
      <Typography
        variant="caption"
        sx={{
          display: '-webkit-box',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          fontSize: '0.7rem',
          mt: 0.5,
          lineHeight: 1.2,
          textAlign: 'center',
          width: '70%',
          margin: '0 auto'
        }}
      >
        {nft.name}
      </Typography>
    </Box>
  );
};

export default ChatNFTCard;
