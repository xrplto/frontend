import React from 'react';
import { Box, Typography } from '@mui/material';

const ChatCollectionCard = ({ collectionData, onSelect }) => {
  const collection = collectionData.collection;
  const imgUrl = `https://s1.xrpnft.com/collection/${collection.logoImage}`;

  return (
    <Box
      onClick={() => onSelect(collectionData)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          opacity: 0.8
        }
      }}
    >
      <Box
        component="img"
        src={imgUrl}
        alt={collection.name}
        sx={{
          width: '70%', // Match NFT card size
          height: 'auto',
          borderRadius: '8px',
          aspectRatio: '1/1', // Force square shape
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
        {collection.name}
      </Typography>
    </Box>
  );
};

export default ChatCollectionCard;
