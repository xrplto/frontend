import React from 'react';
import { Card, CardMedia, CardContent, Typography, CardActionArea } from '@mui/material';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

function ChatNFTCard({ nft, onSelect }) {
  const handleSelect = () => {
    if (onSelect) {
      const nftName = nft.name || nft.meta?.name || 'Unnamed NFT';
      const nftLink = `[NFT: ${nftName} (${nft.NFTokenID})]`;
      onSelect(nftLink);
    }
  };

  // Determine the image URL
  let imageUrl = null;
  if (nft.ufile && nft.ufile.image) {
    if (nft.isIPFS && !nft.ufile.image.startsWith('http')) {
      // If it's an IPFS path, construct the URL
      imageUrl = IPFS_GATEWAY + nft.ufile.image;
    } else {
      // If it's a full URL, use it as is
      imageUrl = nft.ufile.image;
    }
  } else if (nft.ufileIPFSPath && nft.ufileIPFSPath.image) {
    if (!nft.ufileIPFSPath.image.startsWith('http')) {
      imageUrl = IPFS_GATEWAY + nft.ufileIPFSPath.image;
    } else {
      imageUrl = nft.ufileIPFSPath.image;
    }
  } else if (nft.meta && nft.meta.image) {
    imageUrl = nft.meta.image;
  }

  return (
    <Card onClick={handleSelect} sx={{ cursor: 'pointer' }}>
      <CardActionArea>
        {imageUrl && (
          <CardMedia
            component="img"
            height="140"
            image={imageUrl}
            alt={nft.name || nft.meta?.name || 'Unnamed NFT'}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {nft.name || nft.meta?.name || 'Unnamed NFT'}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default ChatNFTCard;
