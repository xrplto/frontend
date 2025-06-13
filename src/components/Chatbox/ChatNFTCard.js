import React from 'react';
import { Card, CardMedia, CardContent, Typography, CardActionArea, Box } from '@mui/material';

const XRPNFT_IMAGE_BASE_URL = 'https://s2.xrpnft.com/d1/';

const ChatNFTCard = ({ nft, onSelect }) => {
  // Determine the image URL (moved outside handleSelect to be accessible by JSX)
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

  const handleSelect = () => {
    if (onSelect) {
      const nftName = nft.name || nft.meta?.name || 'Unnamed NFT';
      const nftLink = `[NFT: ${nftName} (${nft.NFTokenID})]`;

      // Pass both the link string and the full NFT data including image
      onSelect({
        link: nftLink,
        name: nftName,
        tokenId: nft.NFTokenID,
        imageUrl: imageUrl
      });
    }
  };

  // Extract number from NFT name
  const nftName = nft.name || nft.meta?.name || 'Unnamed NFT';
  const numberMatch = nftName.match(/#(\d+)/);
  const displayText = numberMatch ? `#${numberMatch[1]}` : nftName;

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
          fontSize: '0.7rem',
          mt: 0.5,
          lineHeight: 1.2,
          textAlign: 'center',
          width: '70%',
          margin: '0.5rem auto 0',
          display: 'block',
          fontWeight: 500,
          color: 'text.secondary'
        }}
      >
        {displayText}
      </Typography>
    </Box>
  );
};

export default ChatNFTCard;
